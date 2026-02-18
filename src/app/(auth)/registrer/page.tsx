'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, type AuthState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Opprett konto</CardTitle>
        <CardDescription>Registrer deg for å bruke YpsiMath</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="display_name" className="text-sm font-medium">
              Navn
            </label>
            <Input id="display_name" name="display_name" required autoComplete="name" />
            {state.fieldErrors?.display_name?.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>

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
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            {state.fieldErrors?.password?.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Bekreft passord
            </label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
            {state.fieldErrors?.confirmPassword?.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? 'Oppretter...' : 'Opprett konto'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Har du allerede en konto?{' '}
            <Link href="/logg-inn" className="underline hover:text-foreground">
              Logg inn
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
