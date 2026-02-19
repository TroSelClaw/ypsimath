'use client'

import { useMemo, useState, useTransition } from 'react'
import { MessageSquare } from 'lucide-react'
import { submitFeedback } from '@/app/actions/feedback'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i)

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const pagePath = useMemo(() => {
    if (typeof window === 'undefined') return '/'
    return `${window.location.pathname}${window.location.search}`
  }, [open])

  const canSubmit = score !== null && !isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="fixed right-4 bottom-24 z-40 shadow-md md:right-6 md:bottom-6"
        >
          <MessageSquare className="size-4" />
          <span className="ml-2">Tilbakemelding</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hvordan funker YpsiMath for deg?</DialogTitle>
          <DialogDescription>
            Hjelp oss forbedre brukeropplevelsen. Gi en rask score (0–10) og gjerne en kort kommentar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hvor sannsynlig er det at du vil anbefale YpsiMath? (0–10)</Label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
              {SCORE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={score === option ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScore(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-comment">Hva fungerer bra / dårlig? (valgfritt)</Label>
            <textarea
              id="feedback-comment"
              className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={1200}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="F.eks. 'Chaten er nyttig, men jeg finner ikke alltid flashcards raskt nok.'"
            />
          </div>

          {serverMessage ? <p className="text-sm text-muted-foreground">{serverMessage}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (score === null) return
              setServerMessage(null)
              startTransition(async () => {
                const result = await submitFeedback({ score, comment, pagePath })
                if (!result.ok) {
                  setServerMessage(result.error)
                  return
                }
                setServerMessage('Takk! Tilbakemeldingen er lagret.')
                setComment('')
                setScore(null)
              })
            }}
          >
            {isPending ? 'Sender...' : 'Send tilbakemelding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
