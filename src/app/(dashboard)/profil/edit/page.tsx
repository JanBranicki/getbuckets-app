'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const POZYCJE = ['PG', 'SG', 'SF', 'PF', 'C']
const REKI = ['prawa', 'lewa', 'oburęczny']

export default function EditProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
  const [wzrost, setWzrost] = useState('')
  const [wiek, setWiek] = useState('')
  const [reka, setReka] = useState('')
  const [liga, setLiga] = useState('')
  const [druzyna, setDruzyna] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUsername(data.username ?? '')
        setFullName(data.full_name ?? '')
        setCity(data.city ?? '')
        setPosition(data.position ?? '')
        setBio(data.bio ?? '')
        setWzrost(data.wzrost?.toString() ?? '')
        setWiek(data.wiek?.toString() ?? '')
        setReka(data.reka ?? '')
        setLiga(data.liga ?? '')
        setDruzyna(data.druzyna ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      username,
      full_name: fullName,
      city,
      position: position || null,
      bio,
      wzrost: wzrost ? parseInt(wzrost) : null,
      wiek: wiek ? parseInt(wiek) : null,
      reka: reka || null,
      liga: liga || null,
      druzyna: druzyna || null,
    }).eq('id', user.id)
    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/profil')
    }
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-6">Edytuj profil</h1>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Imię i nazwisko</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Miasto</label>
          <input value={city} onChange={e => setCity(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Pozycja</label>
            <select value={position} onChange={e => setPosition(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
              <option value="">— wybierz —</option>
              {POZYCJE.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Ręka dominująca</label>
            <select value={reka} onChange={e => setReka(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
              <option value="">— wybierz —</option>
              {REKI.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Wzrost (cm)</label>
            <input type="number" value={wzrost} onChange={e => setWzrost(e.target.value)}
              placeholder="np. 185"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Wiek</label>
            <input type="number" value={wiek} onChange={e => setWiek(e.target.value)}
              placeholder="np. 24"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Drużyna</label>
          <input value={druzyna} onChange={e => setDruzyna(e.target.value)}
            placeholder="np. Warsaw Wolves"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Liga</label>
          <input value={liga} onChange={e => setLiga(e.target.value)}
            placeholder="np. Liga Warszawska"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/profil')}>Anuluj</Button>
        </div>
      </div>
    </div>
  )
}