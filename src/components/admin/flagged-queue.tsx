import { quickReviewFlagged } from '@/app/actions/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface FlaggedQueueItem {
  id: string
  title: string
  content: string
  content_type: string
  competency_goals: string[] | null
  content_metadata: Record<string, unknown> | null
  updated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
}

function preview(text: string, max = 220) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

export function FlaggedQueue({
  items,
  reviewerNameById,
}: {
  items: FlaggedQueueItem[]
  reviewerNameById: Record<string, string>
}) {
  if (items.length === 0) {
    return <p className="rounded-lg border p-6 text-sm text-muted-foreground">Ingen flaggede elementer akkurat nå.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const metadata = item.content_metadata ?? {}
        const reason = typeof metadata.flag_reason === 'string' ? metadata.flag_reason : 'Ingen begrunnelse'
        const goals = item.competency_goals ?? []
        const reviewerName = item.reviewed_by ? (reviewerNameById[item.reviewed_by] ?? item.reviewed_by) : null

        return (
          <article key={item.id} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">{item.content_type}</Badge>
                  {goals.map((goal) => (
                    <Badge key={goal} variant="outline">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Oppdatert {new Date(item.updated_at).toLocaleString('nb-NO')}
              </p>
            </div>

            <p className="text-sm">
              <span className="font-medium">Flagggrunn:</span> {reason}
            </p>
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{preview(item.content)}</p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {reviewerName && item.reviewed_at
                  ? `Sist reviewet av ${reviewerName} (${new Date(item.reviewed_at).toLocaleString('nb-NO')})`
                  : 'Ikke reviewet ennå'}
              </p>

              <div className="flex gap-2">
                <form action={quickReviewFlagged}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="actionType" value="approve" />
                  <Button type="submit" size="sm">
                    Hurtig-godkjenn
                  </Button>
                </form>
                <form action={quickReviewFlagged}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="actionType" value="reject" />
                  <Button type="submit" size="sm" variant="outline">
                    Send tilbake til draft
                  </Button>
                </form>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
