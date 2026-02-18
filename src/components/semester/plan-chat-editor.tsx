'use client'

import { useState, useTransition } from 'react'
import { applySemesterPlanChatEdit } from '@/app/actions/semester-plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function PlanChatEditor({
  planId,
  onApplied,
}: {
  planId: string
  onApplied: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [command, setCommand] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">Chat-redigering av plan</h3>
        <p className="text-xs text-muted-foreground">
          Eksempel: Flytt derivasjon til etter integrasjon
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Skriv en redigeringskommando"
        />
        <Button
          type="button"
          disabled={isPending || !command.trim()}
          onClick={() => {
            startTransition(async () => {
              setError(null)
              setMessage(null)
              const result = await applySemesterPlanChatEdit(planId, command)
              if (result.error) {
                setError(result.error)
                return
              }
              setMessage(result.message ?? 'Planen ble oppdatert.')
              setCommand('')
              onApplied()
            })
          }}
        >
          {isPending ? 'Oppdaterer…' : 'Kjør'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </section>
  )
}
