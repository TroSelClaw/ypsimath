'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ImageUploadProps {
  contentElementId: string
  exerciseContent: string
  solution?: string
  hintsUsed: number
  viewedSolution: boolean
}

export function ImageUpload({ contentElementId, exerciseContent, solution, hintsUsed, viewedSolution }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = () => {
    if (!file) {
      setError('Velg et bilde først.')
      return
    }

    setError(null)
    setFeedback(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.set('file', file)
      formData.set(
        'metadata',
        JSON.stringify({
          contentElementId,
          exerciseContent,
          solution,
          hintsUsed,
          viewedSolution,
        }),
      )

      const response = await fetch('/api/exercise/image-check', {
        method: 'POST',
        body: formData,
      })

      const json = (await response.json()) as { ok?: boolean; feedback?: string; error?: string }

      if (!response.ok || !json.ok) {
        setError(json.error ?? 'Kunne ikke analysere bildet.')
        return
      }

      setFeedback(json.feedback ?? 'Ingen feedback mottatt.')
    })
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">📷 Sjekk utregningen min</p>
      <p className="text-xs text-muted-foreground">Last opp bilde av utregningen din (JPEG/PNG/WEBP, maks 10 MB).</p>

      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <Button type="button" onClick={onSubmit} disabled={isPending || !file}>
        {isPending ? 'Analyserer…' : 'Analyser bilde'}
      </Button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {feedback ? <p className="whitespace-pre-wrap text-sm text-foreground">{feedback}</p> : null}
    </div>
  )
}
