'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const POZYCJE = ['PG', 'SG', 'SF', 'PF', 'C']

export default function EditProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [position, setPosition] = useState('')
  const [bio, setBio] = useState('')
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
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edytuj profil</h1>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Imię i nazwisko</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Miasto</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Pozycja</label>
          <select
            value={position}
            onChange={e => setPosition(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          >
            <option value="">— wybierz —</option>
            {POZYCJE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/profil')}>
            Anuluj
          </Button>
        </div>
      </div>
    </div>
  )
}