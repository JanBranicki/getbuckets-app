'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Avatar from '@/components/avatar'

type Konwersacja = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  ostatnia_wiadomosc: string
  czas: string
  nieprzeczytane: number
}

export default function WiadomosciPage() {
  const [konwersacje, setKonwersacje] = useState<Konwersacja[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: znajomi } = await supabase
        .from('znajomi')
        .select('nadawca, odbiorca, profil_nadawcy:profiles!znajomi_nadawca_fkey(id, username, full_name, avatar_url), profil_odbiorcy:profiles!znajomi_odbiorca_fkey(id, username, full_name, avatar_url)')
        .or(`nadawca.eq.${user.id},odbiorca.eq.${user.id}`)
        .eq('status', 'zaakceptowany')

      if (!znajomi) { setLoading(false); return }

      const konwersacjeData: Konwersacja[] = await Promise.all(
        znajomi.map(async (z: any) => {
          const drugi = z.nadawca === user.id ? z.profil_odbiorcy : z.profil_nadawcy
          const drugieId = z.nadawca === user.id ? z.odbiorca : z.nadawca

          const { data: ostatnia } = await supabase
            .from('wiadomosci')
            .select('tresc, created_at')
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
            avatar_url: drugi?.avatar_url ?? null,
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
    <div style={{ background: '#0F0F0F', minHeight: '100dvh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} color="#888888" />
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>Wiadomości</h1>
      </div>

      {konwersacje.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px' }}>
          <p style={{ fontSize: '40px' }}>💬</p>
          <p style={{ color: '#888888', marginTop: '8px' }}>Brak konwersacji</p>
        </div>
      ) : (
        <div>
          {konwersacje.map(k => (
            <div
              key={k.id}
              onClick={() => router.push(`/wiadomosci/${k.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}
            >
              <Avatar username={k.username} avatarUrl={k.avatar_url} size={48} radius={16} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>{k.username}</p>
                  <p style={{ color: '#666666', fontSize: '12px' }}>{formatCzas(k.czas)}</p>
                </div>
                <p style={{ color: '#888888', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.ostatnia_wiadomosc}</p>
              </div>
              {k.nieprzeczytane > 0 && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E8541A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
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