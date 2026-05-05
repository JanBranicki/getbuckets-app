'use client'

import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Boisko = {
  id: string
  nazwa: string
  adres: string
  lat: number
  lng: number
  nawierzchnia: string | null
  liczba_koszy: number | null
}

export default function BoiskaPage() {
  const [boiska, setBoiska] = useState<Boisko[]>([])
  const [selected, setSelected] = useState<Boisko | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [nazwa, setNazwa] = useState('')
  const [adres, setAdres] = useState('')
  const [nawierzchnia, setNawierzchnia] = useState('')
  const [liczbaKoszy, setLiczbaKoszy] = useState('2')
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('boiska').select('*')
      if (data) setBoiska(data)
    }
    load()

    // Pobierz lokalizację użytkownika
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  async function handleDodaj() {
    if (!clickedPos || !nazwa) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('boiska').insert({
      nazwa,
      adres,
      lat: clickedPos.lat,
      lng: clickedPos.lng,
      nawierzchnia: nawierzchnia || null,
      liczba_koszy: parseInt(liczbaKoszy),
      dodane_przez: user.id,
    }).select().single()
    if (!error && data) {
      setBoiska(prev => [...prev, data])
      setShowForm(false)
      setNazwa('')
      setAdres('')
      setNawierzchnia('')
      setLiczbaKoszy('2')
      setClickedPos(null)
    }
  }

  const defaultCenter = userPos ?? { lat: 52.2297, lng: 21.0122 }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Boiska 🏀</h1>
          <p className="text-sm text-muted-foreground">
            {showForm && clickedPos
              ? 'Kliknij na mapie żeby wybrać lokalizację'
              : `${boiska.length} boisk w bazie`}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setClickedPos(null) }} variant={showForm ? 'outline' : 'default'}>
          {showForm ? 'Anuluj' : '+ Dodaj boisko'}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Nazwa *</label>
            <input value={nazwa} onChange={e => setNazwa(e.target.value)}
              className="block rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Adres</label>
            <input value={adres} onChange={e => setAdres(e.target.value)}
              className="block rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nawierzchnia</label>
            <select value={nawierzchnia} onChange={e => setNawierzchnia(e.target.value)}
              className="block rounded-md border border-input bg-background px-3 py-1.5 text-sm">
              <option value="">— wybierz —</option>
              {['asfalt', 'beton', 'parkiet', 'tartan', 'inne'].map(n =>
                <option key={n} value={n}>{n}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Liczba koszy</label>
            <input type="number" value={liczbaKoszy} onChange={e => setLiczbaKoszy(e.target.value)}
              className="block w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm" />
          </div>
          <div className="text-sm text-muted-foreground">
            {clickedPos
              ? `📍 ${clickedPos.lat.toFixed(4)}, ${clickedPos.lng.toFixed(4)}`
              : '👆 Kliknij na mapie'}
          </div>
          <Button onClick={handleDodaj} disabled={!clickedPos || !nazwa}>
            Zapisz boisko
          </Button>
        </div>
      )}

      <div className="flex-1">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}>
          <Map
  defaultCenter={defaultCenter}
  defaultZoom={userPos ? 13 : 11}
  mapId="a051cd3bd5fc928553fa5458"
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={true}
            onClick={showForm ? (e) => {
              if (e.detail.latLng) setClickedPos({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng })
            } : undefined}
          >
            {boiska.map(boisko => (
              <AdvancedMarker
                key={boisko.id}
                position={{ lat: boisko.lat, lng: boisko.lng }}
                onClick={() => setSelected(boisko)}
              >
                <div className="text-2xl">🏀</div>
              </AdvancedMarker>
            ))}

            {clickedPos && showForm && (
              <AdvancedMarker position={clickedPos}>
                <div className="text-2xl">📍</div>
              </AdvancedMarker>
            )}

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="p-1 min-w-36">
                  <p className="font-bold text-sm">{selected.nazwa}</p>
                  {selected.adres && <p className="text-xs text-gray-600">{selected.adres}</p>}
                  {selected.nawierzchnia && <p className="text-xs">Nawierzchnia: {selected.nawierzchnia}</p>}
                  {selected.liczba_koszy && <p className="text-xs">Kosze: {selected.liczba_koszy}</p>}
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`, '_blank')}
                    className="text-xs text-blue-600 underline mt-1">
                    Nawiguj →
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  )
}