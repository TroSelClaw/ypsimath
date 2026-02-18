'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Logg inn</CardTitle>
        <CardDescription>Logg inn på YpsiMath</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-post
            </label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
            {state.fieldErrors?.email?.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Passord
            </label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
            {state.fieldErrors?.password?.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? 'Logger inn...' : 'Logg inn'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Har du ikke en konto?{' '}
            <Link href="/registrer" className="underline hover:text-foreground">
              Opprett konto
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
