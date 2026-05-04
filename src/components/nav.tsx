'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/boiska', label: 'Boiska', icon: '🗺️' },
  { href: '/znajomi', label: 'Znajomi', icon: '👥' },
  { href: '/profil', label: 'Profil', icon: '👤' },
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
      {/* Desktop — boczny panel */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-background p-4">
        <div className="mb-8">
          <span className="text-xl font-bold">GetBuckets 🏀</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>🚪</span> Wyloguj
        </button>
      </aside>

      {/* Mobile — dolny pasek */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around py-2 z-50">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-md text-xs
              ${pathname === link.href ? 'text-primary font-bold' : 'text-muted-foreground'}`}
          >
            <span className="text-xl">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  )
}