import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    <div className="p-4 max-w-lg mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <Link href="/profil/edit"
          className="text-sm px-3 py-1.5 rounded-md border border-input hover:bg-muted transition-colors">
          Edytuj
        </Link>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{profile?.username}</p>
            <p className="text-muted-foreground text-sm">{profile?.full_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {profile?.city && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Miasto</p>
              <p className="font-medium text-sm">{profile.city}</p>
            </div>
          )}
          {profile?.position && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Pozycja</p>
              <p className="font-medium text-sm">{profile.position}</p>
            </div>
          )}
          {profile?.wzrost && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Wzrost</p>
              <p className="font-medium text-sm">{profile.wzrost} cm</p>
            </div>
          )}
          {profile?.reka && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Ręka</p>
              <p className="font-medium text-sm">{profile.reka}</p>
            </div>
          )}
          {profile?.druzyna && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Drużyna</p>
              <p className="font-medium text-sm">{profile.druzyna}</p>
            </div>
          )}
          {profile?.liga && (
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">Liga</p>
              <p className="font-medium text-sm">{profile.liga}</p>
            </div>
          )}
        </div>

        {profile?.bio && (
          <div className="border rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Bio</p>
            <p className="text-sm">{profile.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}