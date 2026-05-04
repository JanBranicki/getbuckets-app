'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Profil = {
  id: string
  username: string
  full_name: string | null
  city: string | null
  position: string | null
}

type Znajomy = {
  id: string
  nadawca: string
  odbiorca: string
  status: string
  profil: Profil
}

export default function ZnajomiPage() {
  const [znajomi, setZnajomi] = useState<Znajomy[]>([])
  const [zaproszenia, setZaproszenia] = useState<Znajomy[]>([])
  const [szukaj, setSzukaj] = useState('')
  const [wyniki, setWyniki] = useState<Profil[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('znajomi')
        .select('*, profil:profiles!znajomi_nadawca_fkey(id, username, full_name, city, position)')
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

  async function handleSzukaj() {
    if (!szukaj.trim()) return
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, city, position')
      .ilike('username', `%${szukaj}%`)
      .neq('id', userId)
      .limit(10)
    if (data) setWyniki(data)
  }

  async function handleZaproś(odbiorcaId: string) {
    if (!userId) return
    await supabase.from('znajomi').insert({
      nadawca: userId,
      odbiorca: odbiorcaId,
    })
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

      {/* Wyszukiwarka */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={szukaj}
            onChange={e => setSzukaj(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSzukaj()}
            placeholder="Szukaj gracza po username..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={handleSzukaj}>Szukaj</Button>
        </div>
        {wyniki.length > 0 && (
          <div className="border rounded-md divide-y">
            {wyniki.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{p.username}</p>
                  <p className="text-xs text-muted-foreground">{p.city} {p.position && `· ${p.position}`}</p>
                </div>
                <Button size="sm" onClick={() => handleZaproś(p.id)}>Zaproś</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zaproszenia */}
      {zaproszenia.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Zaproszenia</h2>
          <div className="border rounded-md divide-y">
            {zaproszenia.map(z => (
              <div key={z.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm">{z.profil?.username}</p>
                  <p className="text-xs text-muted-foreground">{z.profil?.city}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAkceptuj(z.id)}>✓</Button>
                  <Button size="sm" variant="outline" onClick={() => handleOdrzuc(z.id)}>✗</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista znajomych */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Znajomi ({znajomi.length})
        </h2>
        {znajomi.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak znajomych — zaproś pierwszego gracza!</p>
        ) : (
          <div className="border rounded-md divide-y">
            {znajomi.map(z => (
              <div key={z.id} className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {z.profil?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{z.profil?.username}</p>
                  <p className="text-xs text-muted-foreground">{z.profil?.city} {z.profil?.position && `· ${z.profil.position}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}