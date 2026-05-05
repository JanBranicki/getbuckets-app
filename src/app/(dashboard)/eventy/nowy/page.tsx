'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Boisko = {
  id: string
  nazwa: string
  adres: string | null
}

const FORMATY = ['1v1', '2v2', '3v3', '4v4', '5v5', 'inne']

export default function NowyEventPage() {
  const [boiska, setBoiska] = useState<Boisko[]>([])
  const [tytul, setTytul] = useState('')
  const [boiskoId, setBoiskoId] = useState('')
  const [dataczas, setDataczas] = useState('')
  const [format, setFormat] = useState('5v5')
  const [liczbaKoszy, setLiczbaKoszy] = useState('2')
  const [maxGraczy, setMaxGraczy] = useState('10')
  const [widocznosc, setWidocznosc] = useState('publiczny')
  const [notatki, setNotatki] = useState('')
  const [miasto, setMiasto] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('boiska').select('id, nazwa, adres').order('nazwa')
      if (data) setBoiska(data)
    }
    load()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&language=pl`
        )
        const data = await res.json()
        if (data.results?.[0]) {
          const comp = data.results[0].address_components
          const miasto = comp.find((c: any) => c.types.includes('locality'))?.long_name
          if (miasto) setMiasto(miasto)
        }
      })
    }
  }, [])

  async function handleSave() {
    if (!tytul || !dataczas || !boiskoId) {
      setError('Wypełnij tytuł, datę i wybierz boisko')
      return
    }
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('eventy').insert({
      tytul,
      boisko_id: boiskoId,
      data_czas: dataczas,
      format,
      liczba_koszy: parseInt(liczbaKoszy),
      max_graczy: parseInt(maxGraczy),
      widocznosc,
      notatki: notatki || null,
      miasto: miasto || null,
      organizator: user.id,
    }).select().single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    await supabase.from('event_gracze').insert({
      event_id: data.id,
      gracz_id: user.id,
      status: 'zaakceptowany',
    })

    router.push('/eventy')
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <h1 className="text-2xl font-bold">Nowy event 🏀</h1>

      <div>
        <label className="text-xs text-muted-foreground">Tytuł *</label>
        <input value={tytul} onChange={e => setTytul(e.target.value)}
          placeholder="np. Sobotnia gra 5v5"
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Boisko *</label>
        <select value={boiskoId} onChange={e => setBoiskoId(e.target.value)}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
          <option value="">— wybierz boisko —</option>
          {boiska.map(b => (
            <option key={b.id} value={b.id}>{b.nazwa}{b.adres ? ` · ${b.adres}` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Data i godzina *</label>
        <input type="datetime-local" value={dataczas} onChange={e => setDataczas(e.target.value)}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            {FORMATY.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Liczba koszy</label>
          <select value={liczbaKoszy} onChange={e => setLiczbaKoszy(e.target.value)}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            <option value="1">1 kosz</option>
            <option value="2">2 kosze</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Maks. graczy</label>
          <input type="number" value={maxGraczy} onChange={e => setMaxGraczy(e.target.value)}
            min="2" max="20"
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Widoczność</label>
          <select value={widocznosc} onChange={e => setWidocznosc(e.target.value)}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            <option value="publiczny">Publiczny</option>
            <option value="prywatny">Prywatny</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Miasto</label>
        <input value={miasto} onChange={e => setMiasto(e.target.value)}
          placeholder="np. Warszawa"
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Notatki</label>
        <textarea value={notatki} onChange={e => setNotatki(e.target.value)}
          rows={3} placeholder="Dodatkowe informacje..."
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Zapisywanie...' : 'Utwórz event'}
      </Button>
    </div>
  )
}