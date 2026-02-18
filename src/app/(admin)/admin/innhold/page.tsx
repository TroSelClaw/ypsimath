import { publishAllReviewed } from '@/app/actions/content'
import { ContentEditor } from '@/components/admin/content-editor'
import { ContentReviewCard, type ContentReviewItem } from '@/components/admin/content-review-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

interface SearchParams {
  status?: string
  contentType?: string
  page?: string
}

const PAGE_SIZE = 50

export default async function ContentAdmin({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('content_elements')
    .select('id,title,chapter,topic,content_type,status,content_metadata,updated_at,content', {
      count: 'exact',
    })
    .order('status', { ascending: true })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (params.status && ['draft', 'flagged', 'reviewed', 'published'].includes(params.status)) {
    query = query.eq('status', params.status)
  }

  if (params.contentType) {
    query = query.eq('content_type', params.contentType)
  }

  const { data, count, error } = await query

  if (error) {
    return <div className="text-sm text-destructive">Kunne ikke laste innhold: {error.message}</div>
  }

  const rows = (data ?? []) as Array<ContentReviewItem & { content: string }>
  const selected = rows[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Innholdsreview</h1>
          <p className="text-sm text-muted-foreground">
            Filtrer på status/type, godkjenn eller rediger før publisering.
          </p>
        </div>

        <form action={publishAllReviewed}>
          <Button type="submit" variant="outline">
            Publiser alle reviewed
          </Button>
        </form>
      </div>

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <select
          name="status"
          defaultValue={params.status ?? ''}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="">Alle statuser</option>
          <option value="flagged">Flagged</option>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="published">Published</option>
        </select>

        <select
          name="contentType"
          defaultValue={params.contentType ?? ''}
          className="rounded-md border bg-background p-2 text-sm"
        >
          <option value="">Alle typer</option>
          <option value="theory">theory</option>
          <option value="rule">rule</option>
          <option value="example">example</option>
          <option value="exercise">exercise</option>
          <option value="exploration">exploration</option>
          <option value="flashcard">flashcard</option>
        </select>

        <input
          type="number"
          min={1}
          name="page"
          defaultValue={page}
          className="rounded-md border bg-background p-2 text-sm"
        />

        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {rows.map((item) => (
            <ContentReviewCard key={item.id} item={item} />
          ))}
          {rows.length === 0 ? (
            <p className="rounded-lg border p-6 text-sm text-muted-foreground">Ingen innholdselementer funnet.</p>
          ) : null}
          <p className="text-xs text-muted-foreground">Viser {rows.length} av {count ?? 0} elementer</p>
        </div>

        {selected ? (
          <ContentEditor id={selected.id} title={selected.title} content={selected.content} />
        ) : (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            Velg et element i listen for å redigere.
          </div>
        )}
      </div>
    </div>
  )
}
