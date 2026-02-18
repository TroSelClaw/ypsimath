'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type PlanEntry = {
  id: string
  date: string
  entryType: 'topic' | 'assessment' | 'holiday'
  topic: string | null
  title: string
  sortOrder: number
}

type CalendarViewProps = {
  entries: PlanEntry[]
  onMove: (entryId: string, targetDate: string) => void
}

function entryStyle(type: PlanEntry['entryType']) {
  if (type === 'assessment') return 'border-amber-300 bg-amber-100/60'
  if (type === 'holiday') return 'border-slate-300 bg-slate-100/70'
  return 'border-emerald-300 bg-emerald-100/60'
}

export function CalendarView({ entries, onMove }: CalendarViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, PlanEntry[]>()
    for (const entry of entries) {
      const bucket = map.get(entry.date) ?? []
      bucket.push(entry)
      map.set(entry.date, bucket)
    }
    for (const value of map.values()) {
      value.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [entries])

  return (
    <div className="space-y-4">
      {grouped.map(([date, dayEntries]) => (
        <section
          key={date}
          className="rounded-lg border p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (!draggedId) return
            onMove(draggedId, date)
            setDraggedId(null)
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{date}</h3>
            <Badge variant="outline">{dayEntries.length} elementer</Badge>
          </div>

          <ul className="space-y-2">
            {dayEntries.map((entry) => (
              <li
                key={entry.id}
                draggable={entry.entryType !== 'holiday'}
                onDragStart={() => setDraggedId(entry.id)}
                onDragEnd={() => setDraggedId(null)}
                className={`rounded-md border px-3 py-2 text-sm ${entryStyle(entry.entryType)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{entry.title}</span>
                  <Badge variant="secondary">{entry.entryType}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {grouped.length === 0 && <p className="text-sm text-muted-foreground">Ingen planlagte økter ennå.</p>}

      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" disabled>
          Dra og slipp mellom datoer for å flytte temaer
        </Button>
      </div>
    </div>
  )
}
