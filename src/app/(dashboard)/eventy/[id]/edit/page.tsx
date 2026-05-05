'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Boisko = {
  id: string
  nazwa: string
  adres: string | null
}

const FORMATY = ['1v1', '2v2', '3v3', '4v4', '5v5', 'inne']

export default function EditEventPage() {
  const { id } = useParams()
  const router = useRouter()
  const [boiska, setBoiska] = useState<Boisko[]>([])
  const [tytul, setTytul] = useState('')
  const [boiskoId, setBoiskoId] = useState('')
  const [dataczas, setDataczas] = useState('')
  const [format, setFormat] = useState('5v5')
  const [liczbaKoszy, setLiczbaKoszy] = useState('2')
  const [maxGraczy, setMaxGraczy] = useState('10')
  const [widocznosc, setWidocznosc] = useState('publiczny')
  const [miasto, setMiasto] = useState('')
  const [notatki, setNotatki] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: event }, { data: boiskaData }] = await Promise.all([
        supabase.from('eventy').select('*').eq('id', id).single(),
        supabase.from('boiska').select('id, nazwa, adres').order('nazwa'),
      ])

      if (!event || event.organizator !== user.id) {
        router.push('/eventy')
        return
      }

      if (boiskaData) setBoiska(boiskaData)
      setTytul(event.tytul ?? '')
      setBoiskoId(event.boisko_id ?? '')
      setDataczas(event.data_czas ? event.data_czas.slice(0, 16) : '')
      setFormat(event.format ?? '5v5')
      setLiczbaKoszy(event.liczba_koszy?.toString() ?? '2')
      setMaxGraczy(event.max_graczy?.toString() ?? '10')
      setWidocznosc(event.widocznosc ?? 'publiczny')
      setMiasto(event.miasto ?? '')
      setNotatki(event.notatki ?? '')
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!tytul || !dataczas || !boiskoId) {
      setError('Wypełnij tytuł, datę i wybierz boisko')
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('eventy').update({
      tytul,
      boisko_id: boiskoId,
      data_czas: dataczas,
      format,
      liczba_koszy: parseInt(liczbaKoszy),
      max_graczy: parseInt(maxGraczy),
      widocznosc,
      miasto: miasto || null,
      notatki: notatki || null,
    }).eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push(`/eventy/${id}`)
    }
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edytuj event</h1>
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#888888' }}>
          Anuluj
        </button>
      </div>

      <div>
        <label className="text-xs" style={{ color: '#888888' }}>Tytuł *</label>
        <input value={tytul} onChange={e => setTytul(e.target.value)}
          className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1" />
      </div>

      <div>
        <label className="text-xs" style={{ color: '#888888' }}>Boisko *</label>
        <select value={boiskoId} onChange={e => setBoiskoId(e.target.value)}
          className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1">
          <option value="">— wybierz boisko —</option>
          {boiska.map(b => (
            <option key={b.id} value={b.id}>{b.nazwa}{b.adres ? ` · ${b.adres}` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs" style={{ color: '#888888' }}>Data i godzina *</label>
        <input type="datetime-local" value={dataczas} onChange={e => setDataczas(e.target.value)}
          className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1" />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs" style={{ color: '#888888' }}>Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1">
            {FORMATY.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs" style={{ color: '#888888' }}>Liczba koszy</label>
          <select value={liczbaKoszy} onChange={e => setLiczbaKoszy(e.target.value)}
            className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1">
            <option value="1">1 kosz</option>
            <option value="2">2 kosze</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs" style={{ color: '#888888' }}>Maks. graczy</label>
          <input type="number" value={maxGraczy} onChange={e => setMaxGraczy(e.target.value)}
            min="2" max="20"
            className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1" />
        </div>
        <div className="flex-1">
          <label className="text-xs" style={{ color: '#888888' }}>Widoczność</label>
          <select value={widocznosc} onChange={e => setWidocznosc(e.target.value)}
            className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1">
            <option value="publiczny">Publiczny</option>
            <option value="prywatny">Prywatny</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs" style={{ color: '#888888' }}>Miasto</label>
        <input value={miasto} onChange={e => setMiasto(e.target.value)}
          placeholder="np. Warszawa"
          className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1" />
      </div>

      <div>
        <label className="text-xs" style={{ color: '#888888' }}>Notatki</label>
        <textarea value={notatki} onChange={e => setNotatki(e.target.value)}
          rows={3} placeholder="Dodatkowe informacje..."
          className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1" />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
      </Button>
    </div>
  )
}