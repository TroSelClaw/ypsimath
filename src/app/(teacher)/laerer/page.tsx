import Link from 'next/link'
import { AlertCards } from '@/components/dashboard/alert-cards'
import { ClassHeatmap } from '@/components/dashboard/class-heatmap'
import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth/get-profile'
import { getTeacherDashboardData } from '@/lib/dashboard/aggregates'
import { createClient } from '@/lib/supabase/server'
import { SemesterWidget } from '@/components/dashboard/semester-widget'

export const revalidate = 300

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  )
}

export default async function TeacherDashboardPage() {
  const profile = await requireRole(['teacher', 'admin'])
  const dashboard = await getTeacherDashboardData(profile.id)
  const supabase = await createClient()

  const { count: flaggedCount } = await supabase
    .from('content_elements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'flagged')

  if (!dashboard.classId) {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lærer-dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingen klasse funnet ennå.</p>
        </header>
        <section className="rounded-2xl border bg-card p-4 md:p-5">
          <p className="text-sm">Opprett første klasse for å se heatmap og elevvarsler.</p>
          <Link href="/klasse/ny" className="mt-3 inline-block font-medium underline underline-offset-4">
            Opprett klasse
          </Link>
        </section>
      </div>
    )
  }

  const averageBehindTopics = dashboard.students.length
    ? dashboard.students.reduce((sum, student) => sum + student.behindByTopics, 0) / dashboard.students.length
    : 0

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lærer-dashboard</h1>
        <p className="text-sm text-muted-foreground">Klasse: {dashboard.className}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Gj.snitt fullføring" value={`${dashboard.summary.averageCompletionPercent}%`} />
        <SummaryCard label="Mest utfordrende mål" value={dashboard.summary.mostStruggledGoal ?? '—'} />
        <SummaryCard label="Mest mestret mål" value={dashboard.summary.mostMasteredGoal ?? '—'} />
      </section>

      <AlertCards struggling={dashboard.alerts.struggling} behindPlan={dashboard.alerts.behindPlan} />

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Innholdsreview</h2>
            <p className="text-sm text-muted-foreground">
              {profile.role === 'admin'
                ? 'Flagget innhold trenger prioritering i admin-kø.'
                : 'Les publisert innhold og flagg elementer som bør sjekkes av admin.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={flaggedCount && flaggedCount > 0 ? 'destructive' : 'secondary'}>
              {flaggedCount ?? 0} flagget
            </Badge>
            <Link
              href={profile.role === 'admin' ? '/admin/innhold/flagget' : '/laerer/innhold'}
              className="text-sm font-medium underline underline-offset-4"
            >
              {profile.role === 'admin' ? 'Åpne flagget kø' : 'Åpne innhold'}
            </Link>
          </div>
        </div>
      </section>

      {dashboard.classId ? (
        <SemesterWidget classId={dashboard.classId} averageBehindTopics={averageBehindTopics} />
      ) : null}

      <ClassHeatmap goals={dashboard.goals} students={dashboard.students} />
    </div>
  )
}
