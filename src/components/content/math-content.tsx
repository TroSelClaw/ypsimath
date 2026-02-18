import { renderMarkdown } from '@/lib/markdown/pipeline'

interface MathContentProps {
  content: string
  className?: string
}

/**
 * Server Component that renders Markdown + KaTeX to HTML.
 * Supports inline $...$ and display $$...$$ math.
 * Renders on server for SEO and performance — no hydration errors.
 */
export async function MathContent({ content, className }: MathContentProps) {
  let html: string

  try {
    html = await renderMarkdown(content)
  } catch {
    // Graceful fallback for malformed content
    html = `<p class="text-destructive">Feil ved rendering av innhold.</p>`
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
