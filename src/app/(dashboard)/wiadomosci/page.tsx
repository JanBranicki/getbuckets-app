'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Konwersacja = {
  id: string
  username: string
  full_name: string | null
  ostatnia_wiadomosc: string
  czas: string
  nieprzeczytane: number
}

export default function WiadomosciPage() {
  const [konwersacje, setKonwersacje] = useState<Konwersacja[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: znajomi } = await supabase
        .from('znajomi')
        .select('nadawca, odbiorca, profil_nadawcy:profiles!znajomi_nadawca_fkey(id, username, full_name), profil_odbiorcy:profiles!znajomi_odbiorca_fkey(id, username, full_name)')
        .or(`nadawca.eq.${user.id},odbiorca.eq.${user.id}`)
        .eq('status', 'zaakceptowany')

      if (!znajomi) { setLoading(false); return }

      const konwersacjeData: Konwersacja[] = await Promise.all(
        znajomi.map(async (z: any) => {
          const drugi = z.nadawca === user.id ? z.profil_odbiorcy : z.profil_nadawcy
          const drugieId = z.nadawca === user.id ? z.odbiorca : z.nadawca

          const { data: ostatnia } = await supabase
            .from('wiadomosci')
            .select('tresc, created_at, przeczytana, nadawca')
            .or(`and(nadawca.eq.${user.id},odbiorca.eq.${drugieId}),and(nadawca.eq.${drugieId},odbiorca.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count } = await supabase
            .from('wiadomosci')
            .select('id', { count: 'exact' })
            .eq('odbiorca', user.id)
            .eq('nadawca', drugieId)
            .eq('przeczytana', false)

          return {
            id: drugieId,
            username: drugi?.username ?? '?',
            full_name: drugi?.full_name ?? null,
            ostatnia_wiadomosc: ostatnia?.tresc ?? 'Brak wiadomości',
            czas: ostatnia?.created_at ?? '',
            nieprzeczytane: count ?? 0,
          }
        })
      )

      setKonwersacje(konwersacjeData)
      setLoading(false)
    }
    load()
  }, [])

  function formatCzas(iso: string) {
    if (!iso) return ''
    const d = new Date(iso)
    const teraz = new Date()
    const diff = teraz.getTime() - d.getTime()
    if (diff < 60000) return 'teraz'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} godz`
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="p-4 mb-2">
        <h1 className="text-2xl font-bold">Wiadomości</h1>
      </div>

      {konwersacje.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">💬</p>
          <p style={{ color: '#888888' }}>Brak konwersacji</p>
          <p className="text-sm" style={{ color: '#666666' }}>Dodaj znajomych żeby pisać wiadomości</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
          {konwersacje.map(k => (
            <div
              key={k.id}
              className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
              style={{ background: 'transparent' }}
              onClick={() => router.push(`/wiadomosci/${k.id}`)}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A' }}>
                {k.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-white">{k.username}</p>
                  <p className="text-xs flex-shrink-0" style={{ color: '#666666' }}>{formatCzas(k.czas)}</p>
                </div>
                <p className="text-sm truncate mt-0.5" style={{ color: '#888888' }}>
                  {k.ostatnia_wiadomosc}
                </p>
              </div>
              {k.nieprzeczytane > 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: '#E8541A', color: 'white' }}>
                  {k.nieprzeczytane}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}