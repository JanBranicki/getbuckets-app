'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Gracz = {
  id: string
  gracz_id: string
  status: string
  profil: {
    username: string
    full_name: string | null
    city: string | null
    position: string | null
    wzrost: number | null
    reka: string | null
    liga: string | null
    druzyna: string | null
  }
}

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
  organizator: string
  boisko: { id: string; nazwa: string; adres: string | null; lat: number; lng: number } | null
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [gracze, setGracze] = useState<Gracz[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: ev } = await supabase
        .from('eventy')
        .select('*, boisko:boiska(id, nazwa, adres, lat, lng)')
        .eq('id', id)
        .single()

      const { data: gr } = await supabase
        .from('event_gracze')
        .select('*, profil:profiles(username, full_name, city, position, wzrost, reka, liga, druzyna)')
        .eq('event_id', id)

      if (ev) setEvent(ev)
      if (gr) setGracze(gr)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatus(graczId: string, status: 'zaakceptowany' | 'odrzucony') {
    await supabase.from('event_gracze').update({ status }).eq('id', graczId)
    setGracze(prev => prev.map(g => g.id === graczId ? { ...g, status } : g))
  }

  async function handleUsun() {
    if (!confirm('Czy na pewno chcesz usunąć ten event?')) return
    await supabase.from('eventy').delete().eq('id', id)
    router.push('/eventy')
  }

  function openMaps() {
    if (!event?.boisko) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${event.boisko.lat},${event.boisko.lng}`, '_blank')
  }

  function formatData(iso: string) {
    return new Date(iso).toLocaleString('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="p-8">Ładowanie...</div>
  if (!event) return <div className="p-8">Nie znaleziono eventu.</div>

  const jestemOrganizatorem = userId === event.organizator
  const zaakceptowani = gracze.filter(g => g.status === 'zaakceptowany')
  const oczekujacy = gracze.filter(g => g.status === 'oczekuje')

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground">← Wróć</button>
        {jestemOrganizatorem && (
          <button onClick={handleUsun} className="text-sm text-red-500 hover:underline">
            Usuń event
          </button>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{event.tytul}</h1>
        <p className="text-sm text-muted-foreground">📅 {formatData(event.data_czas)}</p>
        {event.boisko && (
          <button onClick={openMaps} className="text-sm text-blue-600 underline text-left">
            📍 {event.boisko.nazwa}{event.boisko.adres ? ` · ${event.boisko.adres}` : ''}
          </button>
        )}
        <div className="flex gap-3 text-xs text-muted-foreground pt-1">
          <span>🏀 {event.format}</span>
          <span>🥅 {event.liczba_koszy === 1 ? '1 kosz' : '2 kosze'}</span>
          <span>👥 {zaakceptowani.length}/{event.max_graczy}</span>
          <span className={event.widocznosc === 'publiczny' ? 'text-green-600' : 'text-gray-500'}>
            {event.widocznosc}
          </span>
        </div>
        {event.notatki && <p className="text-sm text-muted-foreground pt-1">{event.notatki}</p>}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Gracze ({zaakceptowani.length}/{event.max_graczy})
        </h2>
        {zaakceptowani.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak graczy.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {zaakceptowani.map(g => (
              <div key={g.id} className="p-3 space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {g.profil?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {g.profil?.username}
                      {g.gracz_id === event.organizator && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">admin</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[g.profil?.position, g.profil?.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {(g.profil?.wzrost || g.profil?.reka || g.profil?.liga || g.profil?.druzyna) && (
                  <div className="text-xs text-muted-foreground pl-10 flex gap-2 flex-wrap">
                    {g.profil.wzrost && <span>{g.profil.wzrost} cm</span>}
                    {g.profil.reka && <span>{g.profil.reka}</span>}
                    {g.profil.druzyna && <span>🏆 {g.profil.druzyna}</span>}
                    {g.profil.liga && <span>🏅 {g.profil.liga}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {jestemOrganizatorem && oczekujacy.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Oczekujący ({oczekujacy.length})
          </h2>
          <div className="border rounded-md divide-y">
            {oczekujacy.map(g => (
              <div key={g.id} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {g.profil?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{g.profil?.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {[g.profil?.position, g.profil?.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {(g.profil?.wzrost || g.profil?.reka || g.profil?.liga || g.profil?.druzyna) && (
                  <div className="text-xs text-muted-foreground flex gap-2 flex-wrap pl-10">
                    {g.profil.wzrost && <span>{g.profil.wzrost} cm</span>}
                    {g.profil.reka && <span>{g.profil.reka}</span>}
                    {g.profil.druzyna && <span>🏆 {g.profil.druzyna}</span>}
                    {g.profil.liga && <span>🏅 {g.profil.liga}</span>}
                  </div>
                )}
                <div className="flex gap-2 pl-10">
                  <Button size="sm" onClick={() => handleStatus(g.id, 'zaakceptowany')}>
                    ✓ Akceptuj
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(g.id, 'odrzucony')}>
                    ✗ Odrzuć
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}