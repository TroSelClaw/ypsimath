import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

/**
 * Render Markdown + LaTeX to HTML string.
 * Safe for server-side rendering (RSC compatible).
 *
 * Supports:
 * - Inline math: $...$
 * - Display math: $$...$$
 * - Code blocks with syntax highlighting
 * - Standard Markdown (headings, lists, links, etc.)
 */
export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, { throwOnError: false } as Parameters<typeof rehypeKatex>[0])
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify)
    .process(content)

  return String(result)
}
