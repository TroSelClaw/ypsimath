import { MathContent } from '@/components/content/math-content'

export function ExampleBlock({ title, content }: { title: string; content: string }) {
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-lg font-semibold">Eksempel: {title} (Vis løsning)</summary>
      <div className="mt-3">
        <MathContent content={content} />
      </div>
    </details>
  )
}
