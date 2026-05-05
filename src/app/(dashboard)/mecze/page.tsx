'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Mecz = {
  id: string
  data: string
  wynik_my: number | null
  wynik_oni: number | null
  notatki: string | null
  boisko: { nazwa: string } | null
}

export default function MeczePage() {
  const [mecze, setMecze] = useState<Mecz[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [wynikMy, setWynikMy] = useState('')
  const [wynikOni, setWynikOni] = useState('')
  const [notatki, setNotatki] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('mecze')
        .select('*, boisko:boiska(nazwa)')
        .eq('dodane_przez', user.id)
        .order('data', { ascending: false })
      if (data) setMecze(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDodaj() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: nowy, error } = await supabase.from('mecze').insert({
      data,
      wynik_my: wynikMy ? parseInt(wynikMy) : null,
      wynik_oni: wynikOni ? parseInt(wynikOni) : null,
      notatki: notatki || null,
      dodane_przez: user.id,
    }).select('*, boisko:boiska(nazwa)').single()
    if (!error && nowy) {
      setMecze(prev => [nowy, ...prev])
      setShowForm(false)
      setWynikMy('')
      setWynikOni('')
      setNotatki('')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8">Ładowanie...</div>

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mecze</h1>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
          {showForm ? 'Anuluj' : '+ Dodaj mecz'}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-md p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Nasze punkty</label>
              <input type="number" value={wynikMy} onChange={e => setWynikMy(e.target.value)}
                placeholder="0"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div className="flex items-end pb-2 text-muted-foreground font-bold">:</div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Ich punkty</label>
              <input type="number" value={wynikOni} onChange={e => setWynikOni(e.target.value)}
                placeholder="0"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Notatki</label>
            <textarea value={notatki} onChange={e => setNotatki(e.target.value)}
              rows={3} placeholder="Jak poszło?"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
          <Button onClick={handleDodaj} disabled={saving} className="w-full">
            {saving ? 'Zapisywanie...' : 'Zapisz mecz'}
          </Button>
        </div>
      )}

      {mecze.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak meczów — dodaj pierwszy!</p>
      ) : (
        <div className="space-y-3">
          {mecze.map(mecz => {
            const wygrana = mecz.wynik_my !== null && mecz.wynik_oni !== null && mecz.wynik_my > mecz.wynik_oni
            const przegrana = mecz.wynik_my !== null && mecz.wynik_oni !== null && mecz.wynik_my < mecz.wynik_oni
            return (
              <div key={mecz.id} className="border rounded-md p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{mecz.data}</span>
                  {mecz.wynik_my !== null && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      wygrana ? 'bg-green-100 text-green-700' :
                      przegrana ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {wygrana ? 'WYGRANA' : przegrana ? 'PRZEGRANA' : 'REMIS'}
                    </span>
                  )}
                </div>
                {mecz.wynik_my !== null && (
                  <div className="text-2xl font-bold text-center py-1">
                    {mecz.wynik_my} : {mecz.wynik_oni}
                  </div>
                )}
                {mecz.boisko && (
                  <p className="text-xs text-muted-foreground">📍 {mecz.boisko.nazwa}</p>
                )}
                {mecz.notatki && (
                  <p className="text-sm text-muted-foreground">{mecz.notatki}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}