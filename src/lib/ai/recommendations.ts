import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { createHash } from 'node:crypto'

import { createClient } from '@/lib/supabase/server'

export interface StudyRecommendation {
  id: string
  text: string
  topic: string
  subjectId: string
  href: string
}

interface RecommendationCacheEntry {
  hash: string
  createdAt: number
  recommendations: StudyRecommendation[]
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const recommendationCache = new Map<string, RecommendationCacheEntry>()

interface GoalStat {
  goal: string
  attempts: number
  correct: number
  incorrect: number
}

interface RecommendationContext {
  studentId: string
  subjectId: string
  targetGrade: number | null
  totalExercises: number
  strugglingGoals: string[]
  masteredGoals: string[]
  topGoalStats: GoalStat[]
  suggestedTopics: Array<{ goal: string; topic: string }>
}

interface LlmSuggestion {
  goal: string
  recommendation: string
  topic?: string
}

function buildHash(input: unknown) {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex')
}

function sanitizeTopic(topic: string) {
  return topic.trim()
}

function toHref(subjectId: string, topic: string) {
  return `/wiki/${subjectId}/${encodeURIComponent(topic)}`
}

function buildFallbackRecommendations(context: RecommendationContext): StudyRecommendation[] {
  const selectedGoals = context.topGoalStats.slice(0, 3)

  const fallback = selectedGoals.map((goalStat, index) => {
    const topic =
      context.suggestedTopics.find((item) => item.goal === goalStat.goal)?.topic ??
      `Tema for ${goalStat.goal}`

    const attemptsLabel = `${goalStat.incorrect}/${goalStat.attempts}`

    return {
      id: `${goalStat.goal}-${index}`,
      text: `Øv målrettet på ${goalStat.goal}: du har ${attemptsLabel} feil forsøk. Jobb med ett eksempel, så to like oppgaver uten fasit.`,
      topic,
      subjectId: context.subjectId,
      href: toHref(context.subjectId, topic),
    }
  })

  if (fallback.length >= 2) {
    return fallback.slice(0, 3)
  }

  return [
    ...fallback,
    {
      id: 'planlegg-uke',
      text: 'Sett av to korte økter denne uka (20–30 min) med fokus på de målene som fortsatt er markert som røde.',
      topic: context.suggestedTopics[0]?.topic ?? 'Oversikt',
      subjectId: context.subjectId,
      href: toHref(context.subjectId, context.suggestedTopics[0]?.topic ?? 'Oversikt'),
    },
    {
      id: 'hent-flyt',
      text: 'Avslutt hver økt med en kort egenvurdering: hva sitter, hva sitter ikke, og hva er neste konkrete oppgave?',
      topic: context.suggestedTopics[1]?.topic ?? context.suggestedTopics[0]?.topic ?? 'Oversikt',
      subjectId: context.subjectId,
      href: toHref(
        context.subjectId,
        context.suggestedTopics[1]?.topic ?? context.suggestedTopics[0]?.topic ?? 'Oversikt',
      ),
    },
  ].slice(0, 3)
}

async function loadRecommendationContext(studentId: string): Promise<RecommendationContext | null> {
  const supabase = await createClient()

  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('current_subject, goals, mastered_competency_goals, struggling_competency_goals, total_exercises_completed')
      .eq('id', studentId)
      .single(),
    supabase
      .from('exercise_attempts')
      .select('auto_result, self_report, content_elements!inner(topic, competency_goals)')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(120),
  ])

  if (!profile) {
    return null
  }

  const subjectId = (profile.current_subject ?? 'r1').toLowerCase()

  const goalStatsMap = new Map<string, GoalStat>()

  for (const attempt of attempts ?? []) {
    const joined = attempt.content_elements as { topic?: string; competency_goals?: string[] } | null
    const goals = joined?.competency_goals ?? []

    const isCorrect = attempt.auto_result === true || attempt.self_report === 'correct'
    const isIncorrect = attempt.auto_result === false || attempt.self_report === 'incorrect'

    for (const goal of goals) {
      const prev = goalStatsMap.get(goal) ?? { goal, attempts: 0, correct: 0, incorrect: 0 }
      goalStatsMap.set(goal, {
        goal,
        attempts: prev.attempts + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isIncorrect ? 1 : 0),
      })
    }
  }

  const strugglingFromStats = [...goalStatsMap.values()]
    .filter((goal) => goal.attempts >= 3 && goal.incorrect > goal.correct)
    .map((goal) => goal.goal)

  const strugglingGoals = Array.from(
    new Set<string>([...(profile.struggling_competency_goals ?? []), ...strugglingFromStats]),
  )

  const rankedGoals = [...goalStatsMap.values()]
    .filter((goal) => goal.attempts > 0)
    .sort((a, b) => {
      const aScore = (a.incorrect + 1) / (a.attempts + 1)
      const bScore = (b.incorrect + 1) / (b.attempts + 1)
      return bScore - aScore
    })

  const focusGoals = (strugglingGoals.length ? strugglingGoals : rankedGoals.map((item) => item.goal)).slice(0, 5)

  const topicRowsByGoal = await Promise.all(
    focusGoals.map(async (goal) => {
      const { data } = await supabase
        .from('content_elements')
        .select('topic')
        .eq('subject_id', subjectId)
        .eq('status', 'published')
        .contains('competency_goals', [goal])
        .limit(1)
        .maybeSingle()

      return { goal, topic: sanitizeTopic(data?.topic ?? `Tema ${goal}`) }
    }),
  )

  return {
    studentId,
    subjectId,
    targetGrade: Number(profile.goals?.target_grade ?? null) || null,
    totalExercises: profile.total_exercises_completed ?? 0,
    strugglingGoals,
    masteredGoals: profile.mastered_competency_goals ?? [],
    topGoalStats: rankedGoals.slice(0, 5),
    suggestedTopics: topicRowsByGoal,
  }
}

async function generateWithLlm(context: RecommendationContext): Promise<StudyRecommendation[] | null> {
  const goalStatsText = context.topGoalStats
    .slice(0, 6)
    .map((goal) => `${goal.goal}: ${goal.incorrect}/${goal.attempts} feil`)
    .join('\n')

  const topicMapText = context.suggestedTopics.map((item) => `${item.goal}: ${item.topic}`).join('\n')

  const prompt = `Du lager personlige studieanbefalinger for en matematikkelev i ${context.subjectId.toUpperCase()}.

KONTEKST (aggregerte data, ikke persondata):
- Målkarakter: ${context.targetGrade ?? 'ikke satt'}
- Totale fullførte oppgaver: ${context.totalExercises}
- Mestrer mål: ${context.masteredGoals.join(', ') || 'ingen'}
- Sliter med mål: ${context.strugglingGoals.join(', ') || 'ingen tydelige'}

Feilstatistikk per mål:
${goalStatsText || 'ingen forsøk enda'}

Tema-kobling per mål:
${topicMapText || 'ingen tema tilgjengelig'}

Lag NØYAKTIG 3 anbefalinger på norsk. Kort, konkret og handlingsrettet.
Hver anbefaling må referere til ett mål (goal) og ett tema (topic), og foreslå neste steg.

Svar KUN med gyldig JSON:
{"suggestions":[{"goal":"R1-04","topic":"Derivasjonsregler","recommendation":"..."}]}`

  const response = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.3,
  })

  const raw = response.text.trim()
  const jsonText = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'))

  try {
    const parsed = JSON.parse(jsonText) as { suggestions?: LlmSuggestion[] }
    const suggestions = (parsed.suggestions ?? []).slice(0, 3)

    if (suggestions.length < 2) {
      return null
    }

    return suggestions.map((item, index) => {
      const mappedTopic =
        sanitizeTopic(item.topic ?? context.suggestedTopics.find((entry) => entry.goal === item.goal)?.topic ?? '') ||
        context.suggestedTopics[index]?.topic ||
        `Tema ${item.goal}`

      return {
        id: `${item.goal}-${index}`,
        text: item.recommendation.trim(),
        topic: mappedTopic,
        subjectId: context.subjectId,
        href: toHref(context.subjectId, mappedTopic),
      }
    })
  } catch {
    return null
  }
}

export async function getStudyRecommendations(input: {
  studentId: string
  forceRefresh?: boolean
}): Promise<{ recommendations: StudyRecommendation[]; cached: boolean }> {
  const context = await loadRecommendationContext(input.studentId)
  if (!context) {
    return { recommendations: [], cached: false }
  }

  const profileHash = buildHash({
    targetGrade: context.targetGrade,
    totalExercises: context.totalExercises,
    strugglingGoals: context.strugglingGoals,
    masteredGoals: context.masteredGoals,
    topGoalStats: context.topGoalStats,
    suggestedTopics: context.suggestedTopics,
  })

  const cacheKey = context.studentId
  const existing = recommendationCache.get(cacheKey)
  const now = Date.now()

  if (!input.forceRefresh && existing && existing.hash === profileHash && now - existing.createdAt < CACHE_TTL_MS) {
    return { recommendations: existing.recommendations, cached: true }
  }

  const llmRecommendations = await generateWithLlm(context)
  const recommendations = (llmRecommendations ?? buildFallbackRecommendations(context)).slice(0, 3)

  recommendationCache.set(cacheKey, {
    hash: profileHash,
    createdAt: now,
    recommendations,
  })

  return { recommendations, cached: false }
}
