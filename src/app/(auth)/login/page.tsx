'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">GetBuckets</h1>
        <p className="text-muted-foreground">Zaloguj się do swojego konta</p>
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
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{' '}
        <Link href="/register" className="underline">
          Zarejestruj się
        </Link>
      </p>
    </div>
  )
}