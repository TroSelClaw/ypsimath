import { FlashcardSession } from '@/components/flashcards/session'
import { requireRole } from '@/lib/auth/get-profile'
import { renderMarkdown } from '@/lib/markdown/pipeline'
import { createClient } from '@/lib/supabase/server'

interface FlashcardRow {
  id: string
  content: string
  content_metadata: { front?: string; back?: string } | null
}

function extractFrontBack(row: FlashcardRow) {
  const front = row.content_metadata?.front?.trim()
  const back = row.content_metadata?.back?.trim()

  if (front && back) {
    return { front, back }
  }

  const [frontPart, ...rest] = row.content.split(/\*\*Bak:\*\*/i)
  const parsedFront = frontPart.replace(/^\*\*Foran:\*\*/i, '').trim()
  const parsedBack = rest.join('**Bak:**').trim()

  return {
    front: parsedFront || '—',
    back: parsedBack || '—',
  }
}

export default async function FlashcardsPage() {
  const profile = await requireRole(['student'])
  const supabase = await createClient()

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('current_subject')
    .eq('id', profile.id)
    .single()

  const subject = (studentProfile?.current_subject ?? 'r1').toLowerCase()

  const { data: progressRows } = await supabase
    .from('flashcard_progress')
    .select('content_element_id, next_review')
    .eq('user_id', profile.id)

  const todayIso = new Date().toISOString().slice(0, 10)
  const dueSet = new Set(
    (progressRows ?? []).filter((row) => row.next_review <= todayIso).map((row) => row.content_element_id),
  )

  const { data: flashcards } = await supabase
    .from('content_elements')
    .select('id, content, content_metadata')
    .eq('subject_id', subject)
    .eq('content_type', 'flashcard')
    .eq('status', 'published')
    .order('chapter', { ascending: true })
    .order('topic', { ascending: true })
    .order('sort_order', { ascending: true })

  const dueCards = (flashcards ?? []).filter((row) => dueSet.has(row.id))
  const newCards = (flashcards ?? []).filter((row) => !progressRows?.some((p) => p.content_element_id === row.id))
  const sessionRows = [...dueCards, ...newCards]

  const cards = await Promise.all(
    sessionRows.map(async (row) => {
      const { front, back } = extractFrontBack(row as FlashcardRow)
      const [frontHtml, backHtml] = await Promise.all([renderMarkdown(front), renderMarkdown(back)])

      return {
        id: row.id,
        frontHtml,
        backHtml,
      }
    }),
  )

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 overflow-x-hidden px-4 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Forfalte kort vises først, deretter nye kort. Trykk på kortet eller mellomrom for å vise svaret.
        </p>
      </header>

      <FlashcardSession cards={cards} />
    </div>
  )
}
