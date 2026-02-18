'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSemesterPlanVersion, updateSemesterPlanEntries } from '@/app/actions/semester-plan'
import { Button } from '@/components/ui/button'
import { CalendarView, type PlanEntry } from './calendar-view'
import { PlanChatEditor } from './plan-chat-editor'
import { PlanTable } from './plan-table'

function normalizeEntries(entries: PlanEntry[]) {
  return [...entries]
    .sort((a, b) => (a.date === b.date ? a.sortOrder - b.sortOrder : a.date.localeCompare(b.date)))
    .map((entry, index) => ({ ...entry, sortOrder: index }))
}

export function SemesterPlanEditor({
  planId,
  initialEntries,
}: {
  planId: string
  initialEntries: PlanEntry[]
}) {
  const router = useRouter()
  const [entries, setEntries] = useState(() => normalizeEntries(initialEntries))
  const [view, setView] = useState<'calendar' | 'table'>('calendar')
  const [isSaving, startSaving] = useTransition()
  const [isVersioning, startVersioning] = useTransition()
  const [saveStatus, setSaveStatus] = useState<string>('')
  const autoSaveTimerRef = useRef<number | null>(null)

  const sortedEntries = useMemo(() => normalizeEntries(entries), [entries])

  function scheduleAutoSave(nextEntries: PlanEntry[]) {
    const payload = normalizeEntries(nextEntries)
    setSaveStatus('Lagrer…')

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      startSaving(async () => {
        const result = await updateSemesterPlanEntries(
          planId,
          payload.map((entry) => ({ id: entry.id, date: entry.date, sortOrder: entry.sortOrder })),
        )

        setSaveStatus(result.error ? `Feil: ${result.error}` : 'Lagret automatisk')
      })
    }, 2000)
  }

  function moveEntry(entryId: string, targetDate: string) {
    setEntries((prev) => {
      const next = prev.map((entry) => (entry.id === entryId ? { ...entry, date: targetDate } : entry))
      const normalized = normalizeEntries(next)
      scheduleAutoSave(normalized)
      return normalized
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={view === 'calendar' ? 'default' : 'outline'} onClick={() => setView('calendar')}>
          Kalendervisning
        </Button>
        <Button type="button" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>
          Tabellvisning
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isVersioning}
          onClick={() => {
            startVersioning(async () => {
              const result = await saveSemesterPlanVersion(planId, 'Lagring fra semesterplan-editor')
              setSaveStatus(result.error ? `Feil: ${result.error}` : `Versjon ${result.version} lagret`)
            })
          }}
        >
          {isVersioning ? 'Lagrer versjon…' : 'Lagre versjon'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.refresh()}>
          Oppdater
        </Button>
        <span className="text-xs text-muted-foreground">{isSaving ? 'Lagrer…' : saveStatus}</span>
      </div>

      {view === 'calendar' ? (
        <CalendarView entries={sortedEntries} onMove={moveEntry} />
      ) : (
        <PlanTable entries={sortedEntries} />
      )}

      <PlanChatEditor planId={planId} onApplied={() => router.refresh()} />
    </div>
  )
}
