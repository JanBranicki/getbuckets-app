import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mój profil</h1>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="font-medium">{profile?.username ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
          <p className="font-medium">{profile?.full_name ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Miasto</p>
          <p className="font-medium">{profile?.city ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pozycja</p>
          <p className="font-medium">{profile?.position ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Bio</p>
          <p className="font-medium">{profile?.bio ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}