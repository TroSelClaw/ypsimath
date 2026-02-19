#!/usr/bin/env npx tsx
/**
 * TASK-063: Generate missing flashcards for published topics.
 *
 * Usage:
 *   npx tsx scripts/generate-flashcards.ts --subject r1
 *   npx tsx scripts/generate-flashcards.ts --subject r1 --limit 5 --dry-run
 */

import { generateFlashcardsForTopic, toFlashcardContent } from '../src/lib/generation/flashcard-generator'

interface CliArgs {
  subject: string
  limit: number
  dryRun: boolean
}

interface ContentRow {
  chapter: string
  topic: string
  competency_goals: string[] | null
  content: string
  content_type: string
}

interface TopicGroup {
  chapter: string
  topic: string
  competencyGoals: string[]
  sourceText: string
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: CliArgs = {
    subject: 'r1',
    limit: 10,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    const token = args[i]
    if (token === '--subject') parsed.subject = args[++i]
    if (token === '--limit') parsed.limit = Number(args[++i]) || parsed.limit
    if (token === '--dry-run') parsed.dryRun = true
  }

  return parsed
}

function assertEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

async function fetchRowsForSubject(subject: string): Promise<ContentRow[]> {
  const supabaseUrl = assertEnv('SUPABASE_URL')
  const supabaseKey = assertEnv('SUPABASE_SERVICE_KEY')

  const query = new URLSearchParams({
    subject_id: `eq.${subject}`,
    status: 'eq.published',
    select: 'chapter,topic,content,content_type,competency_goals',
    order: 'chapter.asc,topic.asc,sort_order.asc',
  })

  const response = await fetch(`${supabaseUrl}/rest/v1/content_elements?${query.toString()}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch content rows (${response.status}): ${await response.text()}`)
  }

  return (await response.json()) as ContentRow[]
}

function buildMissingTopicGroups(rows: ContentRow[], limit: number): TopicGroup[] {
  const map = new Map<string, TopicGroup & { hasFlashcards: boolean }>()

  for (const row of rows) {
    const key = `${row.chapter}::${row.topic}`
    const existing = map.get(key)

    if (!existing) {
      map.set(key, {
        chapter: row.chapter,
        topic: row.topic,
        competencyGoals: row.competency_goals ?? [],
        sourceText: row.content_type === 'flashcard' ? '' : row.content,
        hasFlashcards: row.content_type === 'flashcard',
      })
      continue
    }

    if (row.content_type === 'flashcard') {
      existing.hasFlashcards = true
      continue
    }

    if (existing.sourceText.length < 14000) {
      existing.sourceText += `\n\n---\n\n${row.content}`
    }

    if ((row.competency_goals?.length ?? 0) > 0) {
      existing.competencyGoals = Array.from(new Set([...existing.competencyGoals, ...row.competency_goals!]))
    }
  }

  return Array.from(map.values())
    .filter((topic) => !topic.hasFlashcards && topic.sourceText.trim().length > 0)
    .slice(0, limit)
    .map(({ hasFlashcards: _ignored, ...topic }) => topic)
}

async function insertDraftFlashcards(
  subject: string,
  topic: TopicGroup,
  cards: Array<{ front: string; back: string }>,
): Promise<void> {
  const supabaseUrl = assertEnv('SUPABASE_URL')
  const supabaseKey = assertEnv('SUPABASE_SERVICE_KEY')

  const rows = cards.map((card, index) => ({
    subject_id: subject,
    chapter: topic.chapter,
    topic: topic.topic,
    content_type: 'flashcard',
    sort_order: 10_000 + index,
    content: toFlashcardContent(card.front, card.back),
    competency_goals: topic.competencyGoals,
    content_metadata: {
      front: card.front,
      back: card.back,
      generated_by: 'scripts/generate-flashcards.ts',
      generated_at: new Date().toISOString(),
    },
    status: 'draft',
  }))

  const response = await fetch(`${supabaseUrl}/rest/v1/content_elements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    throw new Error(`Failed to insert flashcards (${response.status}): ${await response.text()}`)
  }
}

async function main() {
  const args = parseArgs()
  console.log(`Generating missing flashcards for subject=${args.subject} (limit=${args.limit})`)

  const rows = await fetchRowsForSubject(args.subject)
  const missingTopics = buildMissingTopicGroups(rows, args.limit)

  if (missingTopics.length === 0) {
    console.log('No missing topics found. Done.')
    return
  }

  console.log(`Found ${missingTopics.length} topic(s) missing flashcards.`)

  for (const topic of missingTopics) {
    console.log(`\n[${topic.chapter}] ${topic.topic}`)
    const cards = await generateFlashcardsForTopic({
      subjectId: args.subject,
      chapter: topic.chapter,
      topic: topic.topic,
      competencyGoals: topic.competencyGoals,
      sourceText: topic.sourceText,
    })

    console.log(`Generated ${cards.length} cards`)

    if (args.dryRun) {
      console.log(JSON.stringify(cards.slice(0, 2), null, 2))
      continue
    }

    await insertDraftFlashcards(args.subject, topic, cards)
    console.log('Inserted as draft flashcards')
  }

  console.log('\nDone.')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
