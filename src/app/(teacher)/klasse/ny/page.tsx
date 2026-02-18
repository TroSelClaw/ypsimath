'use client'

import { useActionState } from 'react'
import { createClass, type ClassActionState } from '@/app/actions/classes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewClassPage() {
  const [state, action, pending] = useActionState<ClassActionState, FormData>(createClass, {})

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Opprett ny klasse</CardTitle>
          <CardDescription>Legg til en klasse for dine elever</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Klassenavn
              </label>
              <Input id="name" name="name" placeholder="f.eks. R1 - 3STA" required />
              {state.fieldErrors?.name?.map((e) => (
                <p key={e} className="text-sm text-destructive">{e}</p>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject_id" className="text-sm font-medium">
                Fag
              </label>
              <select
                id="subject_id"
                name="subject_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="r1">Matematikk R1</option>
                <option value="r2">Matematikk R2</option>
                <option value="1t">Matematikk 1T</option>
                <option value="1p">Matematikk 1P</option>
                <option value="2p">Matematikk 2P</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="school_year" className="text-sm font-medium">
                Skoleår
              </label>
              <Input id="school_year" name="school_year" placeholder="2026-2027" required />
              {state.fieldErrors?.school_year?.map((e) => (
                <p key={e} className="text-sm text-destructive">{e}</p>
              ))}
            </div>

            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? 'Oppretter...' : 'Opprett klasse'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
