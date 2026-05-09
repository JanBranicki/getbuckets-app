'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

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
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={() => router.back()} style={{ color: '#888888' }} className="text-lg">←</button>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold"
          style={{ background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A' }}>
          {rozmowca?.username[0].toUpperCase()}
        </div>
        <p className="font-semibold text-white">{rozmowca?.username}</p>
      </div>

      {/* Wiadomości */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {wiadomosci.map(w => {
          const moja = w.nadawca === userId
          return (
            <div key={w.id} className={`flex ${moja ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[75%] px-4 py-2.5 text-sm"
                style={{
                  background: moja ? '#E8541A' : '#242424',
                  color: 'white',
                  borderRadius: '20px',
                  borderBottomRightRadius: moja ? '4px' : '20px',
                  borderBottomLeftRadius: moja ? '20px' : '4px',
                }}
              >
                {w.tresc}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 flex gap-3 items-center"
        style={{ borderTop: '1px solid #1a1a1a', background: '#0F0F0F' }}>
        <input
          value={tresc}
          onChange={e => setTresc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleWyslij()}
          placeholder="Napisz wiadomość..."
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
          style={{ background: '#1a1a1a', color: '#F5F5F0' }}
        />
        <button
          onClick={handleWyslij}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#E8541A' }}
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  )
}