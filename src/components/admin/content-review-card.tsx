import { updateContentStatus } from '@/app/actions/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Status = 'draft' | 'flagged' | 'reviewed' | 'published'

const statusVariant: Record<Status, 'secondary' | 'destructive' | 'default' | 'outline'> = {
  draft: 'secondary',
  flagged: 'destructive',
  reviewed: 'default',
  published: 'outline',
}

export interface ContentReviewItem {
  id: string
  title: string
  chapter: string
  topic: string
  content_type: string
  status: Status
  content_metadata: Record<string, unknown> | null
  updated_at: string
}

export function ContentReviewCard({ item }: { item: ContentReviewItem }) {
  const flagReason =
    typeof item.content_metadata?.flag_reason === 'string' ? item.content_metadata.flag_reason : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <CardDescription>
              {item.chapter} · {item.topic} · {item.content_type}
            </CardDescription>
          </div>
          <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
        </div>
        {flagReason ? <p className="text-sm text-destructive">Flagg: {flagReason}</p> : null}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <form action={updateContentStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="reviewed" />
          <Button size="sm" type="submit" variant="default">
            Godkjenn
          </Button>
        </form>

        <form action={updateContentStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="draft" />
          <Button size="sm" type="submit" variant="secondary">
            Send tilbake
          </Button>
        </form>

        <form action={updateContentStatus}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="status" value="published" />
          <Button size="sm" type="submit" variant="outline">
            Publiser
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
