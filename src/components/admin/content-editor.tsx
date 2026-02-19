import { saveContentEdit } from '@/app/actions/content'
import { Button } from '@/components/ui/button'

interface Props {
  id: string
  title: string
  content: string
  contentType: 'theory' | 'rule' | 'example' | 'exercise' | 'exploration' | 'flashcard'
}

export function ContentEditor({ id, title, content, contentType }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Rediger: {title}
      </h2>
      <form action={saveContentEdit} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <label className="block text-xs font-medium text-muted-foreground" htmlFor="contentType">
          Innholdstype
        </label>
        <select
          id="contentType"
          name="contentType"
          defaultValue={contentType}
          className="w-full rounded-md border bg-background p-2 text-sm"
        >
          <option value="theory">theory</option>
          <option value="rule">rule</option>
          <option value="example">example</option>
          <option value="exercise">exercise</option>
          <option value="exploration">exploration</option>
          <option value="flashcard">flashcard</option>
        </select>
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
