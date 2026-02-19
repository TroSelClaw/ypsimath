import { flagContentForReview } from '@/app/actions/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function TeacherContentPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_elements')
    .select('id,title,chapter,topic,content_type,content,competency_goals,updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(80)

  if (error) {
    return <p className="text-sm text-destructive">Kunne ikke laste publisert innhold: {error.message}</p>
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Publisert innhold (read-only)</h1>
        <p className="text-sm text-muted-foreground">
          Lærere kan lese publisert innhold og flagge elementer for admin-review med kommentar.
        </p>
      </header>

      <div className="space-y-3">
        {(data ?? []).map((item) => (
          <article key={item.id} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{item.title}</h2>
              <Badge variant="secondary">{item.content_type}</Badge>
              {(item.competency_goals ?? []).map((goal: string) => (
                <Badge key={goal} variant="outline">
                  {goal}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.chapter} · {item.topic} · Oppdatert {new Date(item.updated_at).toLocaleString('nb-NO')}
            </p>
            <p className="line-clamp-4 text-sm text-muted-foreground">{item.content}</p>

            <form action={flagContentForReview} className="space-y-2 rounded-md border p-3">
              <input type="hidden" name="id" value={item.id} />
              <label htmlFor={`comment-${item.id}`} className="text-xs font-medium">
                Kommentar til admin (hvorfor flagges dette?)
              </label>
              <textarea
                id={`comment-${item.id}`}
                name="comment"
                required
                minLength={8}
                className="min-h-24 w-full rounded-md border bg-background p-2 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                Flagg for admin-review
              </Button>
            </form>
          </article>
        ))}
      </div>
    </div>
  )
}
