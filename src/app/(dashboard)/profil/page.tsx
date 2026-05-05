import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/logout-button'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <Link href="/profil/edit"
          className="text-sm px-4 py-2 rounded-2xl border transition-colors"
          style={{ borderColor: '#333333', color: '#888888' }}>
          Edytuj
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-3xl" style={{ background: '#242424' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'rgba(232, 84, 26, 0.15)', color: '#E8541A' }}>
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg text-white">{profile?.username}</p>
            <p className="text-sm" style={{ color: '#aaaaaa' }}>{profile?.full_name}</p>
            {profile?.city && <p className="text-xs mt-0.5" style={{ color: '#888888' }}>📍 {profile.city}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {profile?.position && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Pozycja</p>
              <p className="text-base font-bold" style={{ color: '#E8541A' }}>{profile.position}</p>
            </div>
          )}
          {profile?.wiek && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Wiek</p>
              <p className="text-base font-bold text-white">{profile.wiek} lat</p>
            </div>
          )}
          {profile?.wzrost && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Wzrost</p>
              <p className="text-base font-bold text-white">{profile.wzrost} cm</p>
            </div>
          )}
          {profile?.reka && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Ręka</p>
              <p className="text-base font-bold text-white">{profile.reka}</p>
            </div>
          )}
          {profile?.druzyna && (
            <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Drużyna</p>
              <p className="text-base font-bold text-white">{profile.druzyna}</p>
            </div>
          )}
          {profile?.liga && (
            <div className="p-4 rounded-3xl col-span-2" style={{ background: '#242424' }}>
              <p className="text-xs mb-1" style={{ color: '#888888' }}>Liga</p>
              <p className="text-base font-bold text-white">{profile.liga}</p>
            </div>
          )}
        </div>

        {profile?.bio && (
          <div className="p-4 rounded-3xl" style={{ background: '#242424' }}>
            <p className="text-xs mb-2" style={{ color: '#888888' }}>Bio</p>
            <p className="text-base text-white">{profile.bio}</p>
          </div>
        )}

        <LogoutButton />
      </div>
    </div>
  )
}