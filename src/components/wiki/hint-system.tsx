'use client'

import { Button } from '@/components/ui/button'

interface HintSystemProps {
  hints: string[]
  hintsUsed: number
  onRevealHint: (nextHintsUsed: number) => void
}

export function HintSystem({ hints, hintsUsed, onRevealHint }: HintSystemProps) {
  const shownHints = hints.slice(0, hintsUsed)
  const hasMoreHints = hintsUsed < hints.length

  if (hints.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Hint</p>
        {hasMoreHints ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => onRevealHint(hintsUsed + 1)}>
            Vis hint {hintsUsed + 1}/{hints.length}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Alle hints vist</span>
        )}
      </div>
      {shownHints.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          {shownHints.map((hint, idx) => (
            <li key={`${idx}-${hint}`}>{hint}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">Trykk «Vis hint» for å få første hint.</p>
      )}
    </div>
  )
}
