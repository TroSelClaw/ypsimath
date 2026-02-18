export type SemesterTopicEntry = {
  topic: string
  date: string
}

type StatusKind = 'on_track' | 'ahead' | 'behind'

export type SemesterProgressStatus = {
  kind: StatusKind
  deltaTopics: number
  label: string
}

function clampToDateOnly(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export function buildMasteredTopicSet(params: {
  topicEntries: SemesterTopicEntry[]
  topicGoals: Map<string, string[]>
  masteredGoals: string[]
}) {
  const masteredGoalSet = new Set(params.masteredGoals)
  const masteredTopics = new Set<string>()

  for (const entry of params.topicEntries) {
    const goals = params.topicGoals.get(entry.topic) ?? []
    if (goals.length === 0) continue

    const hasAllGoals = goals.every((goal) => masteredGoalSet.has(goal))
    if (hasAllGoals) masteredTopics.add(entry.topic)
  }

  return masteredTopics
}

export function computeScheduleStatus(params: {
  topicEntries: SemesterTopicEntry[]
  masteredTopics: Set<string>
  today?: Date
}): SemesterProgressStatus {
  if (params.topicEntries.length === 0) {
    return {
      kind: 'on_track',
      deltaTopics: 0,
      label: 'Du er i rute',
    }
  }

  const today = clampToDateOnly(params.today ?? new Date())
  const plannedTopicsUpToToday = new Set(
    params.topicEntries
      .filter((entry) => clampToDateOnly(new Date(`${entry.date}T00:00:00`)) <= today)
      .map((entry) => entry.topic),
  )

  const plannedCount = plannedTopicsUpToToday.size
  const completedCount = Array.from(params.masteredTopics).filter((topic) =>
    params.topicEntries.some((entry) => entry.topic === topic),
  ).length

  const delta = completedCount - plannedCount

  if (delta > 0) {
    return {
      kind: 'ahead',
      deltaTopics: delta,
      label: `Du er ${delta} tema${delta === 1 ? '' : 'er'} foran plan`,
    }
  }

  if (delta < 0) {
    const behind = Math.abs(delta)
    return {
      kind: 'behind',
      deltaTopics: behind,
      label: `Du er ${behind} tema${behind === 1 ? '' : 'er'} bak plan`,
    }
  }

  return {
    kind: 'on_track',
    deltaTopics: 0,
    label: 'Du er i rute',
  }
}
