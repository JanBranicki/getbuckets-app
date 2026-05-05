'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Event = {
  id: string
  tytul: string
  data_czas: string
  format: string
  liczba_koszy: number
  max_graczy: number
  boisko: { nazwa: string; adres: string | null; lat: number; lng: number } | null
  organizator_profil: { username: string } | null
}

export default function DashboardPage() {
  const [eventy, setEventy] = useState<Event[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [lokalizacja, setLokalizacja] = useState<{ lat: number; lng: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLokalizacja({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLokalizacja(null)
      )
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profil } = await supabase
        .from('profiles')
        .select('username, city')
        .eq('id', user.id)
        .single()
      if (profil) setUsername(profil.username)

      let query = supabase
        .from('eventy')
        .select('*, boisko:boiska(nazwa, adres, lat, lng), organizator_profil:profiles!eventy_organizator_fkey(username)')
        .eq('widocznosc', 'publiczny')
        .eq('status', 'zaplanowany')
        .gte('data_czas', new Date().toISOString())
        .order('data_czas', { ascending: true })
        .limit(10)

      if (profil?.city) {
        query = query.ilike('miasto', `%${profil.city}%`)
      }

      const { data } = await query
      if (data) setEventy(data)
      setLoading(false)
    }
    load()
  }, [])

  function formatData(iso: string) {
    return new Date(iso).toLocaleString('pl-PL', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function openMaps(boisko: { lat: number; lng: number }) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${boisko.lat},${boisko.lng}`, '_blank')
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cześć, {username} 👋</h1>
        <p className="text-sm text-muted-foreground">
          {lokalizacja ? '📍 Lokalizacja aktywna' : '📍 Włącz lokalizację żeby widzieć eventy w pobliżu'}
        </p>
      </div>

      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
        Nadchodzące eventy
      </h2>

      {eventy.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">🏀</p>
          <p className="text-muted-foreground">Brak nadchodzących eventów</p>
          <button
            onClick={() => router.push('/eventy/nowy')}
            className="text-sm text-primary underline">
            Zorganizuj pierwszy event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {eventy.map(e => (
            <div
              key={e.id}
              className="border rounded-md p-4 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => router.push(`/eventy/${e.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold">{e.tytul}</h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatData(e.data_czas)}
                </span>
              </div>
              {e.boisko && (
                <button
                  onClick={ev => { ev.stopPropagation(); openMaps(e.boisko!) }}
                  className="text-sm text-blue-600 underline text-left">
                  📍 {e.boisko.nazwa}
                </button>
              )}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>🏀 {e.format}</span>
                <span>🥅 {e.liczba_koszy === 1 ? '1 kosz' : '2 kosze'}</span>
                <span>👥 {e.max_graczy} maks.</span>
                {e.organizator_profil && <span>by {e.organizator_profil.username}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}