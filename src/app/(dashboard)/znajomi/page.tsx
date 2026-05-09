'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import Avatar from '@/components/avatar'

type Profil = {
  id: string
  username: string
  full_name: string | null
  city: string | null
  position: string | null
  avatar_url?: string | null
}

type Znajomy = {
  id: string
  nadawca: string
  odbiorca: string
  status: string
  profil_nadawcy: Profil
  profil_odbiorcy: Profil
}

export default function ZnajomiPage() {
  const [znajomi, setZnajomi] = useState<Znajomy[]>([])
  const [zaproszenia, setZaproszenia] = useState<Znajomy[]>([])
  const [szukaj, setSzukaj] = useState('')
  const [wyniki, setWyniki] = useState<Profil[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('znajomi')
        .select(`
          *,
          profil_nadawcy:profiles!znajomi_nadawca_fkey(id, username, full_name, city, position, avatar_url),
          profil_odbiorcy:profiles!znajomi_odbiorca_fkey(id, username, full_name, city, position, avatar_url)
        `)
        .or(`nadawca.eq.${user.id},odbiorca.eq.${user.id}`)

      if (data) {
        const zaakceptowani = data.filter(z => z.status === 'zaakceptowany')
        const oczekujace = data.filter(z => z.status === 'oczekuje' && z.odbiorca === user.id)
        setZnajomi(zaakceptowani)
        setZaproszenia(oczekujace)
      }
      setLoading(false)
    }
    load()
  }, [])

  function getDrugiProfil(z: Znajomy, currentUserId: string | null): Profil {
    return z.nadawca === currentUserId ? z.profil_odbiorcy : z.profil_nadawcy
  }

  function getDrugiId(z: Znajomy, currentUserId: string | null): string {
    return z.nadawca === currentUserId ? z.odbiorca : z.nadawca
  }

  async function handleSzukaj() {
    if (!szukaj.trim()) return
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, city, position, avatar_url')
      .ilike('username', `%${szukaj}%`)
      .neq('id', userId)
      .limit(10)
    if (data) setWyniki(data)
  }

  async function handleZaprос(odbiorcaId: string) {
    if (!userId) return
    await supabase.from('znajomi').insert({ nadawca: userId, odbiorca: odbiorcaId })
    setWyniki(prev => prev.filter(p => p.id !== odbiorcaId))
  }

  async function handleAkceptuj(znajomyId: string) {
    await supabase.from('znajomi').update({ status: 'zaakceptowany' }).eq('id', znajomyId)
    const zapr = zaproszenia.find(z => z.id === znajomyId)
    if (zapr) {
      setZnajomi(prev => [...prev, { ...zapr, status: 'zaakceptowany' }])
      setZaproszenia(prev => prev.filter(z => z.id !== znajomyId))
    }
  }

  async function handleOdrzuc(znajomyId: string) {
    await supabase.from('znajomi').update({ status: 'odrzucony' }).eq('id', znajomyId)
    setZaproszenia(prev => prev.filter(z => z.id !== znajomyId))
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Znajomi</h1>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={szukaj}
            onChange={e => setSzukaj(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSzukaj()}
            placeholder="Szukaj gracza po username..."
            className="flex-1 rounded-2xl border border-input bg-background px-4 py-2.5 text-sm"
          />
          <Button onClick={handleSzukaj} className="rounded-2xl">Szukaj</Button>
        </div>
        {wyniki.length > 0 && (
          <div className="rounded-3xl overflow-hidden divide-y" style={{ background: '#1a1a1a' }}>
            {wyniki.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => router.push(`/gracz/${p.id}`)}>
                <div className="flex items-center gap-3">
                  <Avatar username={p.username} avatarUrl={p.avatar_url} size={40} radius={12} />
                  <div>
                    <p className="font-semibold text-sm text-white">{p.username}</p>
                    <p className="text-xs" style={{ color: '#888888' }}>{p.city}{p.position && ` · ${p.position}`}</p>
                  </div>
                </div>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleZaprос(p.id) }} className="rounded-2xl">Zaproś</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {zaproszenia.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#666666' }}>Zaproszenia</h2>
          <div className="rounded-3xl overflow-hidden divide-y" style={{ background: '#1a1a1a' }}>
            {zaproszenia.map(z => {
              const profil = getDrugiProfil(z, userId)
              const drugieId = getDrugiId(z, userId)
              return (
                <div key={z.id} className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => router.push(`/gracz/${drugieId}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar username={profil?.username} avatarUrl={profil?.avatar_url} size={40} radius={12} />
                    <div>
                      <p className="font-semibold text-sm text-white">{profil?.username}</p>
                      <p className="text-xs" style={{ color: '#888888' }}>{profil?.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAkceptuj(z.id) }} className="rounded-2xl"
                      style={{ background: '#E8541A' }}>✓</Button>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOdrzuc(z.id) }} className="rounded-2xl">✗</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#666666' }}>
          Znajomi ({znajomi.length})
        </h2>
        {znajomi.length === 0 ? (
          <p className="text-sm" style={{ color: '#888888' }}>Brak znajomych — zaproś pierwszego gracza!</p>
        ) : (
          <div className="rounded-3xl overflow-hidden divide-y" style={{ background: '#1a1a1a' }}>
            {znajomi.map(z => {
              const profil = getDrugiProfil(z, userId)
              const drugieId = getDrugiId(z, userId)
              return (
                <div key={z.id} className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => router.push(`/gracz/${drugieId}`)}>
                  <Avatar username={profil?.username} avatarUrl={profil?.avatar_url} size={40} radius={12} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">{profil?.username}</p>
                    <p className="text-xs" style={{ color: '#888888' }}>{profil?.city}{profil?.position && ` · ${profil.position}`}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/wiadomosci/${drugieId}`) }}
                    className="w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: '#2a2a2a' }}>
                    <MessageCircle size={16} style={{ color: '#888888' }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}