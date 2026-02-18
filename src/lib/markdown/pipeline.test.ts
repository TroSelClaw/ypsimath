import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './pipeline'

describe('renderMarkdown', () => {
  it('renders plain text', async () => {
    const html = await renderMarkdown('Hello world')
    expect(html).toContain('Hello world')
    expect(html).toContain('<p>')
  })

  it('renders inline math $x^2$', async () => {
    const html = await renderMarkdown('The expression $x^2$ is quadratic.')
    expect(html).toContain('katex')
    expect(html).toContain('x')
  })

  it('renders display math $$...$$', async () => {
    const html = await renderMarkdown('$$\\int_0^1 x\\,dx$$')
    // remark-math renders $$ as display when on its own paragraph
    expect(html).toContain('katex')
    expect(html).toContain('∫')
  })

  it('renders code blocks', async () => {
    const html = await renderMarkdown('```python\nprint("hello")\n```')
    expect(html).toContain('<code')
    expect(html).toContain('print')
  })

  it('renders mixed content', async () => {
    const md = `# Derivasjon

Kjerneregelen sier at $(f(g(x)))' = f'(g(x)) \\cdot g'(x)$.

$$\\frac{d}{dx}[\\sin(x^2)] = \\cos(x^2) \\cdot 2x$$

## Eksempel

\`\`\`python
import sympy as sp
x = sp.Symbol('x')
sp.diff(sp.sin(x**2), x)
\`\`\``
    const html = await renderMarkdown(md)
    expect(html).toContain('Derivasjon')
    expect(html).toContain('katex')
    expect(html).toContain('Eksempel')
    expect(html).toContain('<code')
  })

  it('handles malformed LaTeX gracefully', async () => {
    // Should not throw, rehype-katex has throwOnError: false
    const html = await renderMarkdown('Bad math: $\\invalid{$')
    expect(html).toBeDefined()
  })
})
