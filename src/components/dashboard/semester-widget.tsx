import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'

type SemesterWidgetProps = {
  classId: string
  averageBehindTopics: number
}

export async function SemesterWidget({ classId, averageBehindTopics }: SemesterWidgetProps) {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: planRows } = await supabase
    .from('semester_plans')
    .select('id')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestPlanId = planRows?.[0]?.id

  if (!latestPlanId) {
    return (
      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Denne uken</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ingen semesterplan funnet for klassen ennå.</p>
        <Link href="/laerer/semesterplan/ny" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
          Opprett semesterplan
        </Link>
      </section>
    )
  }

  const { data: entries, error } = await supabase
    .from('semester_plan_entries')
    .select('id,date,title,entry_type')
    .eq('semester_plan_id', latestPlanId)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(5)

  if (error) {
    return <p className="text-sm text-destructive">Kunne ikke laste semester-widget: {error.message}</p>
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Denne uken</h2>
        <Link href={`/laerer/semesterplan/${latestPlanId}`} className="text-sm font-medium underline underline-offset-4">
          Rediger semesterplan
        </Link>
      </div>

      {averageBehindTopics > 2 ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
          Varsel: Klassen ligger i snitt {averageBehindTopics.toFixed(1)} tema bak semesterplanen.
        </p>
      ) : null}

      {entries && entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <span className="font-medium">{new Date(entry.date).toLocaleDateString('nb-NO')}</span>
              <span className="text-muted-foreground">{entry.title}</span>
              <span className="rounded-md bg-muted px-2 py-1 text-xs">{entry.entry_type}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen kommende planpunkter funnet.</p>
      )}
    </section>
  )
}
