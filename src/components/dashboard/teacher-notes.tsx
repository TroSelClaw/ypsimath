'use client'

import { useState, useTransition } from 'react'
import { saveTeacherNote } from '@/app/actions/teacher-notes'

type TeacherNotesProps = {
  studentId: string
  initialContent: string
}

export function TeacherNotes({ studentId, initialContent }: TeacherNotesProps) {
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    setStatus('saving')
    setError(null)

    startTransition(async () => {
      const result = await saveTeacherNote({ studentId, content })
      if (!result.ok) {
        setStatus('error')
        setError(result.error)
        return
      }

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    })
  }

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Lærernotater</h2>
      <p className="mt-1 text-sm text-muted-foreground">Lagres automatisk når du forlater feltet.</p>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onBlur={save}
        rows={8}
        placeholder="Skriv observasjoner, tiltak, og oppfølging her..."
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {status === 'saving' || isPending ? 'Lagrer…' : null}
        {status === 'saved' ? 'Lagret' : null}
        {status === 'error' ? error ?? 'Kunne ikke lagre' : null}
      </p>
    </section>
  )
}
