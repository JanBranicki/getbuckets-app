'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { useRef } from 'react'

const POZYCJE = ['PG', 'SG', 'SF', 'PF', 'C']
const REKI = ['prawa', 'lewa', 'oburęczny']
const KROKI = 4

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [krok, setKrok] = useState(1)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [position, setPosition] = useState('')
  const [wzrost, setWzrost] = useState('')
  const [wiek, setWiek] = useState('')
  const [reka, setReka] = useState('')
  const [druzyna, setDruzyna] = useState('')
  const [liga, setLiga] = useState('')
  const [instagram, setInstagram] = useState('')
  const [snapchat, setSnapchat] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      setAvatarUrl(url)
    }
    setUploading(false)
  }

  async function handleFinish() {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      username,
      full_name: fullName || null,
      city,
      position: position || null,
      wzrost: wzrost ? parseInt(wzrost) : null,
      wiek: wiek ? parseInt(wiek) : null,
      reka: reka || null,
      druzyna: druzyna || null,
      liga: liga || null,
      instagram: instagram || null,
      snapchat: snapchat || null,
      bio: bio || null,
      avatar_url: avatarUrl,
    }).eq('id', user.id)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/dashboard')
    }
  }

  const input = "w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1 outline-none"
  const select = "w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1"

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col" style={{ background: '#0F0F0F' }}>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: KROKI }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < krok ? '#E8541A' : '#2a2a2a' }} />
        ))}
      </div>

      <div className="flex-1">
        {/* Krok 1 — Avatar + Username */}
        {krok === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Cześć! 👋</h2>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>Zacznijmy od podstaw — dodaj zdjęcie i wybierz username.</p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-bold overflow-hidden cursor-pointer"
                  style={{ background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : '🏀'}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: '#E8541A' }}>
                  {uploading ? '...' : <Camera size={16} color="white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Username *</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="np. kobe_poznan" className={input} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Imię i nazwisko</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="np. Jan Kowalski" className={input} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Miasto *</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                placeholder="np. Poznań" className={input} />
            </div>
          </div>
        )}

        {/* Krok 2 — Dane basketballowe */}
        {krok === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Twój styl gry 🏀</h2>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>Powiedz nam jak grasz.</p>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Pozycja *</label>
              <select value={position} onChange={e => setPosition(e.target.value)} className={select}>
                <option value="">— wybierz pozycję —</option>
                {POZYCJE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Ręka dominująca</label>
              <select value={reka} onChange={e => setReka(e.target.value)} className={select}>
                <option value="">— wybierz —</option>
                {REKI.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium" style={{ color: '#888888' }}>Wzrost (cm)</label>
                <input type="number" value={wzrost} onChange={e => setWzrost(e.target.value)}
                  placeholder="185" className={input} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium" style={{ color: '#888888' }}>Wiek</label>
                <input type="number" value={wiek} onChange={e => setWiek(e.target.value)}
                  placeholder="24" className={input} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Drużyna</label>
              <input value={druzyna} onChange={e => setDruzyna(e.target.value)}
                placeholder="np. Warsaw Wolves" className={input} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Liga</label>
              <input value={liga} onChange={e => setLiga(e.target.value)}
                placeholder="np. Liga Warszawska" className={input} />
            </div>
          </div>
        )}

        {/* Krok 3 — Social media */}
        {krok === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Social media 📱</h2>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>Opcjonalnie — inni gracze będą mogli Cię znaleźć.</p>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Instagram</label>
              <input value={instagram} onChange={e => setInstagram(e.target.value)}
                placeholder="@username" className={input} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Snapchat</label>
              <input value={snapchat} onChange={e => setSnapchat(e.target.value)}
                placeholder="@username" className={input} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: '#888888' }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                rows={4} placeholder="Kilka słów o sobie..."
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm mt-1 outline-none resize-none" />
            </div>
          </div>
        )}

        {/* Krok 4 — Podsumowanie */}
        {krok === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Gotowy! 🎉</h2>
              <p className="text-sm mt-1" style={{ color: '#888888' }}>Sprawdź swoje dane przed wejściem do aplikacji.</p>
            </div>

            <div className="p-4 rounded-3xl space-y-3" style={{ background: '#1a1a1a' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold flex-shrink-0"
                  style={{ background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : '🏀'}
                </div>
                <div>
                  <p className="font-bold text-white">{username || '—'}</p>
                  <p className="text-sm" style={{ color: '#888888' }}>{fullName}</p>
                  {city && <p className="text-xs" style={{ color: '#888888' }}>📍 {city}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {position && <span className="px-3 py-1 rounded-xl text-xs font-bold" style={{ background: 'rgba(232,84,26,0.15)', color: '#E8541A' }}>{position}</span>}
                {wzrost && <span className="px-3 py-1 rounded-xl text-xs" style={{ background: '#2a2a2a', color: '#888888' }}>{wzrost} cm</span>}
                {wiek && <span className="px-3 py-1 rounded-xl text-xs" style={{ background: '#2a2a2a', color: '#888888' }}>{wiek} lat</span>}
                {reka && <span className="px-3 py-1 rounded-xl text-xs" style={{ background: '#2a2a2a', color: '#888888' }}>{reka}</span>}
              </div>
              {(instagram || snapchat) && (
                <div className="flex gap-2">
                  {instagram && <span className="text-xs" style={{ color: '#888888' }}>📷 {instagram}</span>}
                  {snapchat && <span className="text-xs" style={{ color: '#888888' }}>👻 {snapchat}</span>}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </div>

      {/* Przyciski nawigacji */}
      <div className="flex gap-3 mt-8">
        {krok > 1 && (
          <button onClick={() => setKrok(k => k - 1)}
            className="px-6 py-3 rounded-2xl text-sm font-medium"
            style={{ background: '#1a1a1a', color: '#888888' }}>
            ← Wróć
          </button>
        )}
        {krok < KROKI ? (
          <button
            onClick={() => {
              if (krok === 1 && !username.trim()) { setError('Username jest wymagany'); return }
              if (krok === 1 && !city.trim()) { setError('Miasto jest wymagane'); return }
              if (krok === 2 && !position) { setError('Wybierz pozycję'); return }
              setError('')
              setKrok(k => k + 1)
            }}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: '#E8541A', color: 'white' }}>
            Dalej →
          </button>
        ) : (
          <button onClick={handleFinish} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: '#E8541A', color: 'white' }}>
            {saving ? 'Zapisywanie...' : 'Wchodzę do aplikacji 🏀'}
          </button>
        )}
      </div>
      {error && krok < KROKI && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}