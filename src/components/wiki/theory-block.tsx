import { MathContent } from '@/components/content/math-content'

export function TheoryBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <MathContent content={content} />
    </section>
  )
}
