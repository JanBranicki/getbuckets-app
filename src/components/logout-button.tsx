'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 p-4 rounded-3xl transition-all"
      style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444' }}
    >
      <LogOut size={18} />
      <span className="font-medium text-sm">Wyloguj się</span>
    </button>
  )
}