'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Sprawdź email</h1>
        <p className="text-muted-foreground">
          Wysłaliśmy link potwierdzający na <strong>{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">GetBuckets</h1>
        <p className="text-muted-foreground">Utwórz konto gracza</p>
      </div>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={handleRegister} disabled={loading} className="w-full">
          {loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{' '}
        <Link href="/login" className="underline">
          Zaloguj się
        </Link>
      </p>
    </div>
  )
}