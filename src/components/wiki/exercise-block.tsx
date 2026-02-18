'use client'

import { useMemo, useState, useTransition } from 'react'
import { recordExerciseAttempt } from '@/app/actions/exercises'
import { MathContent } from '@/components/content/math-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { autoCheckExercise } from '@/lib/exercises/auto-check'
import { HintSystem } from './hint-system'
import { ImageUpload } from './image-upload'
import { SelfReport, type SelfReportResult } from './self-report'

type ExerciseFormat = 'freeform' | 'multiple_choice' | 'numeric_input' | 'drag_drop' | 'interactive'

interface ExerciseMetadata {
  hints?: string[]
  answer?: string | number
  tolerance?: number
  choices?: string[]
  solution?: string
}

interface ExerciseBlockProps {
  id: string
  title: string
  content: string
  format: ExerciseFormat
  metadata?: ExerciseMetadata | null
}

export function ExerciseBlock({ id, title, content, format, metadata }: ExerciseBlockProps) {
  const [hintsUsed, setHintsUsed] = useState(0)
  const [viewedSolution, setViewedSolution] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [autoResult, setAutoResult] = useState<boolean | null>(null)
  const [isPending, startTransition] = useTransition()

  const hints = metadata?.hints ?? []
  const choices = metadata?.choices ?? []

  const isAutoCheckFormat = format === 'multiple_choice' || format === 'numeric_input'
  const showSelfReport = viewedSolution

  const feedbackText = useMemo(() => {
    if (autoResult === null) return null
    return autoResult ? 'Riktig! Bra jobba.' : 'Ikke helt riktig ennå. Sjekk hint eller fasit.'
  }, [autoResult])

  const persistAttempt = (payload: {
    checkMethod: 'self_report' | 'auto_check'
    selfReport?: SelfReportResult
    autoResult?: boolean
    answer?: string
  }) => {
    startTransition(async () => {
      await recordExerciseAttempt({
        contentElementId: id,
        checkMethod: payload.checkMethod,
        selfReport: payload.selfReport,
        autoResult: payload.autoResult,
        answer: payload.answer,
        hintsUsed,
        viewedSolution,
      })
    })
  }

  const submitAutoCheck = (answer: string) => {
    const result = autoCheckExercise({
      format,
      answer: metadata?.answer,
      userAnswer: answer,
      tolerance: metadata?.tolerance,
    })

    if (result === null) return

    setAutoResult(result)
    persistAttempt({
      checkMethod: 'auto_check',
      autoResult: result,
      answer,
    })
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Oppgave: {title}</h3>

      <MathContent content={content} />

      {format === 'multiple_choice' && choices.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <Button
              key={choice}
              type="button"
              variant="outline"
              onClick={() => {
                setUserAnswer(choice)
                submitAutoCheck(choice)
              }}
            >
              {choice}
            </Button>
          ))}
        </div>
      ) : null}

      {format === 'numeric_input' ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitAutoCheck(userAnswer)
          }}
        >
          <Input
            value={userAnswer}
            onChange={(event) => setUserAnswer(event.target.value)}
            placeholder="Skriv inn svar"
            inputMode="decimal"
          />
          <Button type="submit">Sjekk svar</Button>
        </form>
      ) : null}

      {!isAutoCheckFormat ? (
        <p className="text-sm text-muted-foreground">
          Denne oppgavetypen sjekkes via fasit + egenvurdering i MVP.
        </p>
      ) : null}

      {feedbackText ? (
        <p className={`text-sm ${autoResult ? 'text-emerald-600' : 'text-amber-600'}`}>{feedbackText}</p>
      ) : null}

      <HintSystem hints={hints} hintsUsed={hintsUsed} onRevealHint={setHintsUsed} />

      <div className="space-y-2 rounded-md border p-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => setViewedSolution((current) => !current)}>
          {viewedSolution ? 'Skjul fasit' : 'Vis fasit'}
        </Button>
        {viewedSolution ? (
          <div className="rounded-md bg-muted/30 p-3 text-sm">
            <MathContent content={metadata?.solution ?? 'Fasit kommer snart.'} />
          </div>
        ) : null}
      </div>

      {showSelfReport ? (
        <SelfReport
          disabled={isPending}
          onSelect={(result) =>
            persistAttempt({
              checkMethod: 'self_report',
              selfReport: result,
              answer: userAnswer || undefined,
              autoResult: autoResult ?? undefined,
            })
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">Vis fasit for å registrere egenvurdering.</p>
      )}

      {showSelfReport ? (
        <ImageUpload
          contentElementId={id}
          exerciseContent={content}
          solution={metadata?.solution}
          hintsUsed={hintsUsed}
          viewedSolution={viewedSolution}
        />
      ) : null}

      {isPending ? <p className="text-xs text-muted-foreground">Lagrer forsøk…</p> : null}
    </section>
  )
}
