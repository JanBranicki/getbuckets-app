'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Map, Zap, Users, User } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/eventy', label: 'Eventy', icon: Zap },
  { href: '/boiska', label: 'Boiska', icon: Map },
  { href: '/znajomi', label: 'Znajomi', icon: Users },
  { href: '/profil', label: 'Profil', icon: User },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile — dolny pasek */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15, 15, 15, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex justify-around items-center py-2 px-2">
          {LINKS.map(link => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                style={{
                  color: active ? '#E8541A' : '#666666',
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200"
                  style={{
                    background: active ? 'rgba(232, 84, 26, 0.15)' : 'transparent',
                  }}
                >
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop — boczny panel */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen border-r p-5"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#141414' }}>
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.svg" alt="GetBuckets" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight">GetBuckets</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {LINKS.map(link => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
                style={{
                  color: active ? '#E8541A' : '#888888',
                  background: active ? 'rgba(232, 84, 26, 0.12)' : 'transparent',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200"
          style={{ color: '#555555' }}
        >
          <User size={18} strokeWidth={1.8} />
          Wyloguj
        </button>
      </aside>
    </>
  )
}