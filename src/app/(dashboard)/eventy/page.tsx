'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Event = {
  id: string
  tytul: string
  data_czas: string
  format: string
  liczba_koszy: number
  max_graczy: number
  widocznosc: string
  status: string
  notatki: string | null
  boisko: { id: string; nazwa: string; adres: string | null; lat: number; lng: number } | null
  organizator: string
  liczba_graczy: number
}

export default function EventyPage() {
  const [eventy, setEventy] = useState<Event[]>([])
  const [mojeEventy, setMojeEventy] = useState<Event[]>([])
  const [tab, setTab] = useState<'odkryj' | 'moje'>('odkryj')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Publiczne nadchodzące eventy
      const { data: publiczne } = await supabase
        .from('eventy')
        .select('*, boisko:boiska(id, nazwa, adres, lat, lng)')
        .eq('widocznosc', 'publiczny')
        .eq('status', 'zaplanowany')
        .gte('data_czas', new Date().toISOString())
        .order('data_czas', { ascending: true })

      // Moje eventy
      const { data: moje } = await supabase
        .from('eventy')
        .select('*, boisko:boiska(id, nazwa, adres, lat, lng)')
        .eq('organizator', user.id)
        .order('data_czas', { ascending: false })

      if (publiczne) setEventy(publiczne)
      if (moje) setMojeEventy(moje)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDolacz(eventId: string) {
    if (!userId) return
    await supabase.from('event_gracze').insert({
      event_id: eventId,
      gracz_id: userId,
      status: 'oczekuje',
    })
    alert('Wysłano prośbę o dołączenie!')
  }

  function openMaps(boisko: { lat: number; lng: number; nazwa: string }) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${boisko.lat},${boisko.lng}`, '_blank')
  }

  function formatData(iso: string) {
    return new Date(iso).toLocaleString('pl-PL', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  const renderEvent = (e: Event, pokazDolacz = false) => (
    <div key={e.id} className="border rounded-md p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold">{e.tytul}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
          e.widocznosc === 'publiczny' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {e.widocznosc}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">📅 {formatData(e.data_czas)}</p>
      {e.boisko && (
        <button onClick={() => openMaps(e.boisko!)}
          className="text-sm text-blue-600 underline text-left">
          📍 {e.boisko.nazwa}
        </button>
      )}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>🏀 {e.format}</span>
        <span>🥅 {e.liczba_koszy === 1 ? '1 kosz' : '2 kosze'}</span>
        <span>👥 {e.max_graczy} graczy maks.</span>
      </div>
      {e.notatki && <p className="text-sm text-muted-foreground">{e.notatki}</p>}
      {pokazDolacz && e.organizator !== userId && (
        <Button size="sm" className="w-full" onClick={() => handleDolacz(e.id)}>
          Chcę dołączyć
        </Button>
      )}
    </div>
  )

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventy</h1>
        <Button onClick={() => router.push('/eventy/nowy')}>+ Nowy</Button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('odkryj')}
          className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
            tab === 'odkryj' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}>
          Odkryj
        </button>
        <button onClick={() => setTab('moje')}
          className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
            tab === 'moje' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}>
          Moje eventy
        </button>
      </div>

      {tab === 'odkryj' && (
        <div className="space-y-3">
          {eventy.length === 0
            ? <p className="text-sm text-muted-foreground">Brak nadchodzących eventów w okolicy.</p>
            : eventy.map(e => renderEvent(e, true))
          }
        </div>
      )}

      {tab === 'moje' && (
        <div className="space-y-3">
          {mojeEventy.length === 0
            ? <p className="text-sm text-muted-foreground">Nie masz jeszcze żadnych eventów.</p>
            : mojeEventy.map(e => renderEvent(e, false))
          }
        </div>
      )}
    </div>
  )
}