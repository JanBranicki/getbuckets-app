'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/avatar'

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
    avatar_url: string | null
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
        .select('*, profil:profiles(username, full_name, city, position, wzrost, reka, liga, druzyna, avatar_url)')
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
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#888888' }}>← Wróć</button>
        {jestemOrganizatorem && (
          <div className="flex gap-3">
            <button onClick={() => router.push(`/eventy/${id}/edit`)} className="text-sm hover:underline" style={{ color: '#888888' }}>Edytuj</button>
            <button onClick={handleUsun} className="text-sm hover:underline" style={{ color: '#EF4444' }}>Usuń</button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{event.tytul}</h1>
        <p className="text-sm" style={{ color: '#888888' }}>📅 {formatData(event.data_czas)}</p>
        {event.boisko && (
          <button onClick={openMaps} className="text-sm text-left" style={{ color: '#E8541A' }}>
            📍 {event.boisko.nazwa}{event.boisko.adres ? ` · ${event.boisko.adres}` : ''}
          </button>
        )}
        <div className="flex gap-3 text-xs pt-1" style={{ color: '#888888' }}>
          <span>🏀 {event.format}</span>
          <span>🥅 {event.liczba_koszy === 1 ? '1 kosz' : '2 kosze'}</span>
          <span>👥 {zaakceptowani.length}/{event.max_graczy}</span>
          <span style={{ color: event.widocznosc === 'publiczny' ? '#22c55e' : '#888888' }}>{event.widocznosc}</span>
        </div>
        {event.notatki && <p className="text-sm pt-1" style={{ color: '#888888' }}>{event.notatki}</p>}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#666666' }}>
          Gracze ({zaakceptowani.length}/{event.max_graczy})
        </h2>
        {zaakceptowani.length === 0 ? (
          <p className="text-sm" style={{ color: '#888888' }}>Brak graczy.</p>
        ) : (
          <div className="rounded-3xl divide-y overflow-hidden" style={{ background: '#1a1a1a' }}>
            {zaakceptowani.map(g => (
              <div key={g.id} className="p-4 space-y-1">
                <div className="flex items-center gap-3">
                  <Avatar username={g.profil?.username} avatarUrl={g.profil?.avatar_url} size={36} radius={10} />
                  <div>
                    <p className="font-semibold text-sm text-white">
                      {g.profil?.username}
                      {g.gracz_id === event.organizator && (
                        <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(232,84,26,0.15)', color: '#E8541A' }}>
                          admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: '#888888' }}>
                      {[g.profil?.position, g.profil?.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {(g.profil?.wzrost || g.profil?.reka || g.profil?.liga || g.profil?.druzyna) && (
                  <div className="text-xs flex gap-3 flex-wrap pl-12" style={{ color: '#666666' }}>
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
          <h2 className="font-semibold text-xs uppercase tracking-widest" style={{ color: '#666666' }}>
            Oczekujący ({oczekujacy.length})
          </h2>
          <div className="rounded-3xl divide-y overflow-hidden" style={{ background: '#1a1a1a' }}>
            {oczekujacy.map(g => (
              <div key={g.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar username={g.profil?.username} avatarUrl={g.profil?.avatar_url} size={36} radius={10} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-white">{g.profil?.username}</p>
                    <p className="text-xs" style={{ color: '#888888' }}>
                      {[g.profil?.position, g.profil?.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {(g.profil?.wzrost || g.profil?.reka || g.profil?.liga || g.profil?.druzyna) && (
                  <div className="text-xs flex gap-3 flex-wrap pl-12" style={{ color: '#666666' }}>
                    {g.profil.wzrost && <span>{g.profil.wzrost} cm</span>}
                    {g.profil.reka && <span>{g.profil.reka}</span>}
                    {g.profil.druzyna && <span>🏆 {g.profil.druzyna}</span>}
                    {g.profil.liga && <span>🏅 {g.profil.liga}</span>}
                  </div>
                )}
                <div className="flex gap-2 pl-12">
                  <Button size="sm" onClick={() => handleStatus(g.id, 'zaakceptowany')}
                    style={{ background: '#E8541A', color: 'white', borderRadius: '12px' }}>
                    Akceptuj
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(g.id, 'odrzucony')}
                    style={{ borderRadius: '12px' }}>
                    Odrzuć
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