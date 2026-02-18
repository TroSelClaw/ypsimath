import { MathContent } from '@/components/content/math-content'

export function RuleBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="space-y-2 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
      <h2 className="text-lg font-semibold">Regel: {title}</h2>
      <MathContent content={content} />
    </section>
  )
}
