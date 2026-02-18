import { saveContentEdit } from '@/app/actions/content'
import { Button } from '@/components/ui/button'

interface Props {
  id: string
  title: string
  content: string
}

export function ContentEditor({ id, title, content }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Rediger: {title}
      </h2>
      <form action={saveContentEdit} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <textarea
          name="content"
          defaultValue={content}
          className="min-h-[340px] w-full rounded-md border bg-background p-3 text-sm"
        />
        <input
          name="changeNote"
          defaultValue="Inline edit from /admin/innhold"
          className="w-full rounded-md border bg-background p-2 text-sm"
          placeholder="Endringsnotat"
        />
        <Button type="submit" size="sm">
          Lagre endring
        </Button>
      </form>
    </div>
  )
}
