'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '@/components/avatar'

export default function GraczPage() {
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [znajomyStatus, setZnajomyStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dodawanie, setDodawanie] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (p) setProfile(p)

      const { data: z } = await supabase
        .from('znajomi')
        .select('status, nadawca')
        .or(`and(nadawca.eq.${user.id},odbiorca.eq.${id}),and(nadawca.eq.${id},odbiorca.eq.${user.id})`)
        .single()
      if (z) setZnajomyStatus(z.status)

      setLoading(false)
    }
    load()
  }, [id])

  async function handleDodaj() {
    if (!userId) return
    setDodawanie(true)
    await supabase.from('znajomi').insert({ nadawca: userId, odbiorca: id })
    setZnajomyStatus('oczekuje')
    setDodawanie(false)
  }

  if (loading) return <div className="p-8">Ładowanie...</div>
  if (!profile) return <div className="p-8">Nie znaleziono gracza.</div>

  const jestemTymGraczem = userId === id
  const jestZnajomym = znajomyStatus === 'zaakceptowany'
  const czekaNaAkceptacje = znajomyStatus === 'oczekuje'

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm" style={{ color: '#888888' }}>← Wróć</button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-3xl" style={{ background: '#242424' }}>
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={64} radius={16} />
          <div className="flex-1">
            <p className="font-bold text-lg text-white">{profile.username}</p>
            <p className="text-sm" style={{ color: '#aaaaaa' }}>{profile.full_name}</p>
            {profile.city && <p className="text-xs mt-0.5" style={{ color: '#888888' }}>📍 {profile.city}</p>}
          </div>
        </div>

        {!jestemTymGraczem && (
          <div className="flex gap-3">
            {jestZnajomym && (
              <button
                onClick={() => router.push('/wiadomosci/' + id)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: '#E8541A', color: 'white' }}>
                💬 Wiadomość
              </button>
            )}
            {!jestZnajomym && !czekaNaAkceptacje && (
              <button
                onClick={handleDodaj}
                disabled={dodawanie}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: '#1a1a1a', color: '#E8541A', border: '1px solid #E8541A' }}>
                {dodawanie ? 'Dodawanie...' : '+ Dodaj do znajomych'}
              </button>
            )}
            {czekaNaAkceptacje && (
              <div className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-center"
                style={{ background: '#1a1a1a', color: '#666666', border: '1px solid #333333' }}>
                ⏳ Zaproszenie wysłane
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {profile.position && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Pozycja</p>
              <p className="text-base font-bold" style={{ color: '#E8541A' }}>{profile.position}</p>
            </div>
          )}
          {profile.wiek && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Wiek</p>
              <p className="text-base font-bold text-white">{profile.wiek} lat</p>
            </div>
          )}
          {profile.wzrost && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Wzrost</p>
              <p className="text-base font-bold text-white">{profile.wzrost} cm</p>
            </div>
          )}
          {profile.reka && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Ręka</p>
              <p className="text-base font-bold text-white">{profile.reka}</p>
            </div>
          )}
          {profile.druzyna && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Drużyna</p>
              <p className="text-base font-bold text-white">{profile.druzyna}</p>
            </div>
          )}
          {profile.liga && (
            <div className="p-4 rounded-3xl col-span-2" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Liga</p>
              <p className="text-base font-bold text-white">{profile.liga}</p>
            </div>
          )}
        </div>

        {profile.bio && (
          <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
            <p className="text-xs mb-2" style={{ color: '#888888' }}>Bio</p>
            <p className="text-base text-white">{profile.bio}</p>
          </div>
        )}

        {(profile.instagram || profile.snapchat) && (
          <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
            <p className="text-xs mb-3" style={{ color: '#888888' }}>Social media</p>
            <div className="flex gap-3 flex-wrap">
              {profile.instagram && (
                <span className="px-3 py-2 rounded-2xl text-sm font-medium"
                  style={{ background: '#2a2a2a', color: '#E8541A' }}>
                  📷 {profile.instagram}
                </span>
              )}
              {profile.snapchat && (
                <span className="px-3 py-2 rounded-2xl text-sm font-medium"
                  style={{ background: '#2a2a2a', color: '#FFFC00' }}>
                  👻 {profile.snapchat}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}