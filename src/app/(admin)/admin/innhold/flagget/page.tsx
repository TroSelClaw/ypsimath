import Link from 'next/link'

import { FlaggedQueue, type FlaggedQueueItem } from '@/components/admin/flagged-queue'
import { createClient } from '@/lib/supabase/server'

export default async function FlaggedContentQueuePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_elements')
    .select(
      'id,title,content,content_type,competency_goals,content_metadata,updated_at,reviewed_by,reviewed_at',
    )
    .eq('status', 'flagged')
    .order('updated_at', { ascending: false })

  if (error) {
    return <p className="text-sm text-destructive">Kunne ikke laste flagget kø: {error.message}</p>
  }

  const items = (data ?? []) as FlaggedQueueItem[]
  const reviewerIds = Array.from(new Set(items.map((item) => item.reviewed_by).filter(Boolean) as string[]))

  let reviewerNameById: Record<string, string> = {}
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from('profiles')
      .select('id,full_name,email')
      .in('id', reviewerIds)

    reviewerNameById = Object.fromEntries(
      (reviewers ?? []).map((row) => [row.id as string, (row.full_name as string | null) ?? (row.email as string)]),
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Flagget innhold</h1>
          <p className="text-sm text-muted-foreground">
            Prioritert kø (nyeste først) med hurtig-godkjenning og avvisning.
          </p>
        </div>
        <Link href="/admin/innhold" className="text-sm font-medium underline underline-offset-4">
          Til full innholdsreview
        </Link>
      </header>

      <FlaggedQueue items={items} reviewerNameById={reviewerNameById} />
    </div>
  )
}
