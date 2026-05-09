'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft } from 'lucide-react'
import Avatar from '@/components/avatar'

type Wiadomosc = {
  id: string
  tresc: string
  nadawca: string
  odbiorca: string
  created_at: string
  przeczytana: boolean
}

type Rozmowca = {
  username: string
  avatar_url: string | null
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([])
  const [tresc, setTresc] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [rozmowca, setRozmowca] = useState<Rozmowca | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userIdRef = useRef<string | null>(null)
  const supabase = createClient()

  async function fetchWiadomosci(uid: string) {
    const { data } = await supabase
      .from('wiadomosci')
      .select('*')
      .or(`and(nadawca.eq.${uid},odbiorca.eq.${id}),and(nadawca.eq.${id},odbiorca.eq.${uid})`)
      .order('created_at', { ascending: true })
    if (data) setWiadomosci(data)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      userIdRef.current = user.id

      const { data: profil } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', id)
        .single()
      if (profil) setRozmowca(profil)

      await fetchWiadomosci(user.id)

      await supabase
        .from('wiadomosci')
        .update({ przeczytana: true })
        .eq('odbiorca', user.id)
        .eq('nadawca', id as string)

      setLoading(false)
    }
    load()

    const interval = setInterval(() => {
      if (userIdRef.current) fetchWiadomosci(userIdRef.current)
    }, 3000)

    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wiadomosci])

  async function handleWyslij() {
    if (!tresc.trim() || !userId) return
    const tekst = tresc.trim()
    setTresc('')
    await supabase.from('wiadomosci').insert({
      nadawca: userId,
      odbiorca: id,
      tresc: tekst,
    })
    await fetchWiadomosci(userId)
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0F0F0F' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} color="#888888" />
        </button>
        <Avatar username={rozmowca?.username ?? '?'} avatarUrl={rozmowca?.avatar_url} size={36} radius={10} />
        <p style={{ fontWeight: '600', color: 'white' }}>{rozmowca?.username}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {wiadomosci.map(w => {
          const moja = w.nadawca === userId
          return (
            <div key={w.id} style={{ display: 'flex', justifyContent: moja ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 16px',
                borderRadius: '20px',
                borderBottomRightRadius: moja ? '4px' : '20px',
                borderBottomLeftRadius: moja ? '20px' : '4px',
                background: moja ? '#E8541A' : '#242424',
                color: 'white', fontSize: '14px', lineHeight: '1.4'
              }}>
                {w.tresc}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '12px', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid #1a1a1a', background: '#0F0F0F', flexShrink: 0 }}>
        <input
          value={tresc}
          onChange={e => setTresc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleWyslij()}
          placeholder="Napisz wiadomość..."
          style={{ flex: 1, background: '#1a1a1a', color: '#F5F5F0', border: 'none', borderRadius: '20px', padding: '10px 16px', fontSize: '14px', outline: 'none' }}
        />
        <button onClick={handleWyslij} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E8541A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  )
}