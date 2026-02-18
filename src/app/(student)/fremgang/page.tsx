import Link from 'next/link'

import { PlanetMap, type JourneyTopic } from '@/components/journey/planet-map'
import { requireRole } from '@/lib/auth/get-profile'
import { buildMasteredTopicSet, computeScheduleStatus, type SemesterTopicEntry } from '@/lib/semester/progress'
import { createClient } from '@/lib/supabase/server'

type PlanEntryRow = {
  topic: string | null
  date: string
  sort_order: number
}

function toTopicSlug(topic: string) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9æøå]+/gi, '-')
    .replace(/(^-|-$)/g, '')
}

function formatDateLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00`)
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(date)
}

export default async function ProgressPage() {
  const profile = await requireRole(['student'])
  const supabase = await createClient()

  const [{ data: membershipRows }, { data: studentProfile }] = await Promise.all([
    supabase.from('class_memberships').select('class_id').eq('student_id', profile.id).limit(1),
    supabase.from('student_profiles').select('mastered_competency_goals').eq('id', profile.id).maybeSingle(),
  ])

  const classId = membershipRows?.[0]?.class_id as string | undefined

  const { data: latestPlan } = classId
    ? await supabase
        .from('semester_plans')
        .select('id')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  let plannedTopics: PlanEntryRow[] = []
  if (latestPlan?.id) {
    const { data: planEntries } = await supabase
      .from('semester_plan_entries')
      .select('topic,date,sort_order')
      .eq('semester_plan_id', latestPlan.id)
      .eq('entry_type', 'topic')
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true })

    plannedTopics = (planEntries ?? []) as PlanEntryRow[]
  }

  const topicEntries = plannedTopics.filter((entry) => entry.topic) as Array<{ topic: string; date: string }>
  const topicOrder = Array.from(new Set(topicEntries.map((entry) => entry.topic)))

  const fallbackTopics = ['Algebraiske uttrykk', 'Likninger', 'Funksjoner', 'Derivasjon', 'Vektorer']
  const orderedTopics = topicOrder.length > 0 ? topicOrder : fallbackTopics

  const { data: topicGoalRows } = await supabase
    .from('content_elements')
    .select('topic, competency_goals')
    .eq('status', 'published')
    .in('topic', orderedTopics)

  const topicGoals = new Map<string, string[]>()
  for (const row of topicGoalRows ?? []) {
    const topic = row.topic as string | null
    if (!topic) continue

    const existing = topicGoals.get(topic) ?? []
    const goals = ((row.competency_goals as string[] | null) ?? []).filter(Boolean)
    topicGoals.set(topic, Array.from(new Set([...existing, ...goals])))
  }

  const masteredGoals = ((studentProfile?.mastered_competency_goals as string[] | null) ?? []).filter(Boolean)

  const semesterTopicEntries: SemesterTopicEntry[] = topicEntries.map((entry) => ({
    topic: entry.topic,
    date: entry.date,
  }))

  const masteredTopics = buildMasteredTopicSet({
    topicEntries: semesterTopicEntries,
    topicGoals,
    masteredGoals,
  })

  const status = computeScheduleStatus({
    topicEntries: semesterTopicEntries,
    masteredTopics,
  })

  const dateByTopic = new Map(topicEntries.map((entry) => [entry.topic, formatDateLabel(entry.date)]))
  const currentIndex = orderedTopics.findIndex((topic) => !masteredTopics.has(topic))
  const activeIndex = currentIndex === -1 ? orderedTopics.length - 1 : currentIndex

  const journeyTopics: JourneyTopic[] = orderedTopics.map((topic, index) => ({
    topic,
    href: `/wiki/r1/${toTopicSlug(topic)}`,
    dateLabel: dateByTopic.get(topic) ?? null,
    status: masteredTopics.has(topic) ? 'completed' : index === activeIndex ? 'current' : 'future',
  }))

  const completedCount = masteredTopics.size
  const totalCount = orderedTopics.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const nextTopic = journeyTopics.find((topic) => topic.status === 'current')

  const statusBadgeClass =
    status.kind === 'ahead'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status.kind === 'behind'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-sky-400/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Fremgang</h1>
        <p className="text-sm text-muted-foreground">
          Planetkartet viser anbefalt rekkefølge. Ferdige tema er markert grønt, og aktivt tema pulserer.
        </p>
      </header>

      <section className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-3 md:p-5">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Ferdigstilt</p>
          <p className="text-2xl font-semibold">
            {completedCount} / {totalCount}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Fremdrift</p>
          <p className="text-2xl font-semibold">{progressPercent}%</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Neste tema</p>
          <p className="text-base font-medium">{nextTopic?.topic ?? 'Alle tema fullført 🎉'}</p>
        </div>
      </section>

      <section className={`rounded-xl border p-4 text-sm font-medium ${statusBadgeClass}`}>{status.label}</section>

      <PlanetMap topics={journeyTopics} />

      {nextTopic ? (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm">
          <p>
            Klar for neste hopp? Gå til{' '}
            <Link className="font-medium underline underline-offset-4" href={nextTopic.href}>
              {nextTopic.topic}
            </Link>
            {nextTopic.dateLabel ? ` (planlagt ${nextTopic.dateLabel})` : ''}.
          </p>
        </div>
      ) : null}
    </div>
  )
}
