import Link from 'next/link'

import { PlanetMap, type JourneyTopic } from '@/components/journey/planet-map'
import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

type PlanEntryRow = {
  topic: string | null
  date: string
  sort_order: number
}

type TopicExerciseRow = {
  topic: string
  exercises_total: number
  exercises_attempted: number
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

  const { data: membershipRows } = await supabase
    .from('class_memberships')
    .select('class_id')
    .eq('student_id', profile.id)
    .limit(1)

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

  const topicOrder = Array.from(new Set(plannedTopics.map((entry) => entry.topic).filter(Boolean))) as string[]

  const fallbackTopics = ['Algebraiske uttrykk', 'Likninger', 'Funksjoner', 'Derivasjon', 'Vektorer']
  const orderedTopics = topicOrder.length > 0 ? topicOrder : fallbackTopics

  const dateByTopic = new Map(
    plannedTopics
      .filter((entry) => entry.topic)
      .map((entry) => [entry.topic as string, formatDateLabel(entry.date)]),
  )

  const { data: topicExerciseRows } = await supabase
    .from('content_elements')
    .select('topic, id, exercise_attempts!left(id)')
    .eq('status', 'published')
    .eq('content_type', 'exercise')
    .eq('exercise_attempts.user_id', profile.id)

  const progressByTopic = new Map<string, TopicExerciseRow>()
  for (const row of topicExerciseRows ?? []) {
    const topic = (row.topic as string | null) ?? null
    if (!topic) continue

    const existing = progressByTopic.get(topic) ?? {
      topic,
      exercises_total: 0,
      exercises_attempted: 0,
    }

    existing.exercises_total += 1
    const attempts = (row.exercise_attempts as Array<{ id: string }> | null) ?? []
    if (attempts.length > 0) {
      existing.exercises_attempted += 1
    }

    progressByTopic.set(topic, existing)
  }

  const completedTopicSet = new Set(
    orderedTopics.filter((topic) => {
      const data = progressByTopic.get(topic)
      return Boolean(data && data.exercises_total > 0 && data.exercises_attempted >= data.exercises_total)
    }),
  )

  const currentIndex = orderedTopics.findIndex((topic) => !completedTopicSet.has(topic))
  const activeIndex = currentIndex === -1 ? orderedTopics.length - 1 : currentIndex

  const journeyTopics: JourneyTopic[] = orderedTopics.map((topic, index) => ({
    topic,
    href: `/wiki/r1/${toTopicSlug(topic)}`,
    dateLabel: dateByTopic.get(topic) ?? null,
    status: completedTopicSet.has(topic)
      ? 'completed'
      : index === activeIndex
        ? 'current'
        : 'future',
  }))

  const completedCount = completedTopicSet.size
  const totalCount = orderedTopics.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const nextTopic = journeyTopics.find((topic) => topic.status === 'current')

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
