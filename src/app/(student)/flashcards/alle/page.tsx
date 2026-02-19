import Link from 'next/link'
import { requireRole } from '@/lib/auth/get-profile'
import { renderMarkdown } from '@/lib/markdown/pipeline'
import { createClient } from '@/lib/supabase/server'

interface FlashcardRow {
  id: string
  chapter: string
  topic: string
  content: string
  content_metadata: { front?: string; back?: string } | null
}

function extractFrontBack(row: FlashcardRow) {
  const front = row.content_metadata?.front?.trim()
  const back = row.content_metadata?.back?.trim()

  if (front && back) return { front, back }

  const [frontPart, ...rest] = row.content.split(/\*\*Bak:\*\*/i)
  return {
    front: frontPart.replace(/^\*\*Foran:\*\*/i, '').trim() || '—',
    back: rest.join('**Bak:**').trim() || '—',
  }
}

export default async function AllFlashcardsPage() {
  const profile = await requireRole(['student'])
  const supabase = await createClient()

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('current_subject')
    .eq('id', profile.id)
    .single()

  const subject = (studentProfile?.current_subject ?? 'r1').toLowerCase()

  const { data } = await supabase
    .from('content_elements')
    .select('id, chapter, topic, content, content_metadata')
    .eq('subject_id', subject)
    .eq('content_type', 'flashcard')
    .eq('status', 'published')
    .order('chapter', { ascending: true })
    .order('topic', { ascending: true })
    .order('sort_order', { ascending: true })

  const cards = await Promise.all(
    (data ?? []).map(async (row) => {
      const { front, back } = extractFrontBack(row as FlashcardRow)
      const [frontHtml, backHtml] = await Promise.all([renderMarkdown(front), renderMarkdown(back)])
      return { ...row, frontHtml, backHtml }
    }),
  )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Alle flashcards</h1>
          <p className="text-sm text-muted-foreground">Bla i alle kort for faget ditt.</p>
        </div>
        <Link href="/flashcards" className="rounded-md border px-3 py-2 text-sm">
          Til økt
        </Link>
      </header>

      <div className="grid gap-4">
        {cards.map((card) => (
          <article key={card.id} className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {card.chapter} · {card.topic}
            </p>
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Forside</p>
                <div
                  className="prose prose-neutral max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: card.frontHtml }}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Bakside</p>
                <div
                  className="prose prose-neutral max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: card.backHtml }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
