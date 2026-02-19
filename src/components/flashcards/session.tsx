'use client'

import { useMemo, useState, useTransition } from 'react'
import { rateFlashcard } from '@/app/actions/flashcards'
import { FlashcardCard } from '@/components/flashcards/flashcard-card'

export interface SessionCard {
  id: string
  frontHtml: string
  backHtml: string
}

interface FlashcardSessionProps {
  cards: SessionCard[]
}

export function FlashcardSession({ cards }: FlashcardSessionProps) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const current = cards[index]
  const completed = index
  const total = cards.length

  const progressValue = useMemo(() => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }, [completed, total])

  if (!current) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDate = new Intl.DateTimeFormat('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(tomorrow)

    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">Kom tilbake i morgen 👋</h2>
        <p className="mt-2 text-sm text-muted-foreground">Du har fullført alle kort som var forfalt i dag.</p>
        <p className="mt-1 text-sm text-muted-foreground">Neste anbefalte økt: {nextDate}</p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Fremdrift</span>
          <span>
            {completed}/{total}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <FlashcardCard
        frontHtml={current.frontHtml}
        backHtml={current.backHtml}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        disabled={isPending}
        onRate={(quality) => {
          setError(null)
          startTransition(async () => {
            const result = await rateFlashcard({ contentElementId: current.id, quality })
            if (!result.ok) {
              setError(result.error)
              return
            }

            setRevealed(false)
            setIndex((value) => value + 1)
          })
        }}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  )
}
