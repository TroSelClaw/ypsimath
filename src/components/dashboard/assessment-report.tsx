'use client'

import { useState, useTransition } from 'react'
import { saveAiAssessmentReport } from '@/app/actions/teacher-notes'

type AssessmentReportProps = {
  studentId: string
  initialReport: string
}

export function AssessmentReport({ studentId, initialReport }: AssessmentReportProps) {
  const [report, setReport] = useState(initialReport)
  const [status, setStatus] = useState<string | null>(null)
  const [isGenerating, startGenerating] = useTransition()
  const [isSaving, startSaving] = useTransition()

  const generateReport = () => {
    setStatus(null)
    startGenerating(async () => {
      try {
        const response = await fetch('/api/teacher/assessment-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId }),
        })

        const payload = (await response.json()) as { report?: string; error?: string }
        if (!response.ok || !payload.report) {
          setStatus(payload.error ?? 'Kunne ikke generere rapport nå.')
          return
        }

        setReport(payload.report)
        setStatus('Rapport generert. Rediger ved behov og lagre.')
      } catch {
        setStatus('Uventet feil ved generering.')
      }
    })
  }

  const saveReport = () => {
    setStatus(null)
    startSaving(async () => {
      const result = await saveAiAssessmentReport({ studentId, content: report })
      if (!result.ok) {
        setStatus(result.error)
        return
      }

      setStatus('AI-rapport lagret.')
    })
  }

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">AI-vurderingsrapport</h2>
      <p className="mt-1 text-sm text-muted-foreground">Generer et utkast (200–300 ord), rediger teksten, og lagre den som vurderingsnotat.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generateReport}
          disabled={isGenerating}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isGenerating ? 'Genererer rapport…' : 'Generer vurderingsrapport'}
        </button>

        <button
          type="button"
          onClick={saveReport}
          disabled={!report.trim() || isSaving}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isSaving ? 'Lagrer…' : 'Lagre rapport'}
        </button>
      </div>

      <textarea
        value={report}
        onChange={(event) => setReport(event.target.value)}
        rows={10}
        placeholder="AI-generert rapport vises her..."
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </section>
  )
}
