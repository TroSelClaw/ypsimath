import Link from 'next/link'
import { AlertCards } from '@/components/dashboard/alert-cards'
import { ClassHeatmap } from '@/components/dashboard/class-heatmap'
import { requireRole } from '@/lib/auth/get-profile'
import { getTeacherDashboardData } from '@/lib/dashboard/aggregates'

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

      <ClassHeatmap goals={dashboard.goals} students={dashboard.students} />
    </div>
  )
}
