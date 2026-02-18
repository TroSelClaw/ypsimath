import { saveStudentGoals } from '@/app/actions/profile'
import { CompetencyGrid } from '@/components/profile/competency-grid'
import { ProfileRecommendations } from '@/components/profile/recommendations'
import { StatsCards } from '@/components/profile/stats-cards'
import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default async function ProfilePage() {
  const profile = await requireRole(['student'])
  const supabase = await createClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [{ data: studentProfile }, activityResult, { data: latestMembership }] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('current_subject, goals, mastered_competency_goals, struggling_competency_goals, total_exercises_completed, total_time_spent_minutes')
      .eq('id', profile.id)
      .single(),
    supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('class_memberships')
      .select('enrolled_at')
      .eq('student_id', profile.id)
      .order('enrolled_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const goals = (studentProfile?.goals as { target_grade?: number; focus_areas?: string } | null) ?? {}
  const masteredGoals = (studentProfile?.mastered_competency_goals as string[] | null) ?? []
  const strugglingGoals = (studentProfile?.struggling_competency_goals as string[] | null) ?? []

  async function saveGoals(formData: FormData) {
    'use server'

    const targetGrade = Number(formData.get('targetGrade'))
    const focusAreas = String(formData.get('focusAreas') ?? '')
    await saveStudentGoals({ targetGrade, focusAreas })
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profil</h1>
        <p className="text-sm text-muted-foreground">Mål, fremdrift og studievaner samlet på ett sted.</p>
      </header>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Elevinfo</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Navn</dt>
            <dd className="font-medium">{profile.display_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fag</dt>
            <dd className="font-medium uppercase">{studentProfile?.current_subject ?? 'r1'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Medlem siden</dt>
            <dd className="font-medium">{formatDate(latestMembership?.enrolled_at)}</dd>
          </div>
        </dl>
      </section>

      <StatsCards
        totalExercises={studentProfile?.total_exercises_completed ?? 0}
        totalTimeMinutes={studentProfile?.total_time_spent_minutes ?? 0}
        currentWeekActivities={activityResult.count ?? 0}
      />

      <CompetencyGrid masteredGoals={masteredGoals} strugglingGoals={strugglingGoals} />

      <ProfileRecommendations />

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Mål</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sett ønsket karakter og hva du vil fokusere på.</p>

        <form action={saveGoals} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="targetGrade" className="text-sm font-medium">
              Målkarakter (1–6)
            </label>
            <input
              id="targetGrade"
              name="targetGrade"
              type="number"
              min={1}
              max={6}
              defaultValue={goals.target_grade ?? 4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="focusAreas" className="text-sm font-medium">
              Fokusområder
            </label>
            <textarea
              id="focusAreas"
              name="focusAreas"
              rows={4}
              defaultValue={goals.focus_areas ?? ''}
              placeholder="Eks: Derivasjonsregler, fortegn, tolking av grafer"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Lagre mål
          </button>
        </form>
      </section>
    </div>
  )
}
