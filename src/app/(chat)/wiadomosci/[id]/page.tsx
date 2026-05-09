'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Send, ArrowLeft } from 'lucide-react'

type Wiadomosc = {
  id: string
  tresc: string
  nadawca: string
  odbiorca: string
  created_at: string
  przeczytana: boolean
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([])
  const [tresc, setTresc] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [rozmowca, setRozmowca] = useState<{ username: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userIdRef = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      userIdRef.current = user.id

      const { data: profil } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', id)
        .single()
      if (profil) setRozmowca(profil)

      const { data } = await supabase
        .from('wiadomosci')
        .select('*')
        .or(`and(nadawca.eq.${user.id},odbiorca.eq.${id}),and(nadawca.eq.${id},odbiorca.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (data) setWiadomosci(data)

      await supabase
        .from('wiadomosci')
        .update({ przeczytana: true })
        .eq('odbiorca', user.id)
        .eq('nadawca', id as string)

      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('chat-' + id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wiadomosci',
      }, payload => {
        const msg = payload.new as Wiadomosc
        const uid = userIdRef.current
        if (
          (msg.nadawca === uid && msg.odbiorca === id) ||
          (msg.nadawca === id && msg.odbiorca === uid)
        ) {
          setWiadomosci(prev => {
            if (prev.find(w => w.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [wiadomosci])

  async function handleWyslij() {
    if (!tresc.trim() || !userId) return
    const tekst = tresc.trim()
    setTresc('')
    const { data, error } = await supabase.from('wiadomosci').insert({
      nadawca: userId,
      odbiorca: id,
      tresc: tekst,
    }).select().single()
    if (!error && data) {
      setWiadomosci(prev => {
        if (prev.find(w => w.id === data.id)) return prev
        return [...prev, data]
      })
    }
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh',
      background: '#0F0F0F'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px 16px',
        borderBottom: '1px solid #1a1a1a',
        flexShrink: 0
      }}>
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} color="#888888" />
        </button>
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '14px'
        }}>
          {rozmowca?.username[0].toUpperCase()}
        </div>
        <p style={{ fontWeight: '600', color: 'white' }}>{rozmowca?.username}</p>
      </div>

      {/* Wiadomości */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {wiadomosci.map(w => {
          const moja = w.nadawca === userId
          return (
            <div key={w.id} style={{ display: 'flex', justifyContent: moja ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '10px 16px',
                borderRadius: '20px',
                borderBottomRightRadius: moja ? '4px' : '20px',
                borderBottomLeftRadius: moja ? '20px' : '4px',
                background: moja ? '#E8541A' : '#242424',
                color: 'white',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {w.tresc}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        borderTop: '1px solid #1a1a1a',
        background: '#0F0F0F',
        flexShrink: 0
      }}>
        <input
          value={tresc}
          onChange={e => setTresc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleWyslij()}
          placeholder="Napisz wiadomość..."
          style={{ 
            flex: 1, 
            background: '#1a1a1a', 
            color: '#F5F5F0',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 16px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleWyslij}
          style={{ 
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#E8541A', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  )
}