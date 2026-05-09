'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Map, Zap, Users, User, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

const LINKS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/eventy', label: 'Eventy', icon: Zap },
  { href: '/boiska', label: 'Boiska', icon: Map },
  { href: '/wiadomosci', label: 'Czat', icon: MessageCircle },
  { href: '/znajomi', label: 'Znajomi', icon: Users },
  { href: '/profil', label: 'Profil', icon: User },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [nieprzeczytane, setNieprzeczytane] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('wiadomosci')
        .select('id', { count: 'exact' })
        .eq('odbiorca', user.id)
        .eq('przeczytana', false)

      setNieprzeczytane(count ?? 0)
    }
    load()

    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile — dolny pasek */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex justify-around items-center py-2 px-2">
          {LINKS.map(link => {
            const Icon = link.icon
            const active = pathname === link.href
            const isCzat = link.href === '/wiadomosci'
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                style={{ color: active ? '#E8541A' : '#666666' }}
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200"
                  style={{ background: active ? 'rgba(232, 84, 26, 0.15)' : 'transparent' }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {isCzat && nieprzeczytane > 0 && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: '#E8541A', color: 'white' }}>
                      {nieprzeczytane > 9 ? '9+' : nieprzeczytane}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-wide">{link.label}</span>
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
            const isCzat = link.href === '/wiadomosci'
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
                <div className="relative">
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  {isCzat && nieprzeczytane > 0 && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: '#E8541A', color: 'white' }}>
                      {nieprzeczytane > 9 ? '9+' : nieprzeczytane}
                    </div>
                  )}
                </div>
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