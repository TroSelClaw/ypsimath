import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the stripContent logic and search grouping (unit-level)
describe('search helpers', () => {
  function stripContent(content: string): string {
    return content
      .replace(/\$\$[\s\S]*?\$\$/g, '[formel]')
      .replace(/\$[^$]+\$/g, '[formel]')
      .replace(/[#*_`~>]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 150)
  }

  it('strips inline LaTeX', () => {
    expect(stripContent('Vi har $x^2 + 1$ her')).toBe('Vi har [formel] her')
  })

  it('strips display LaTeX', () => {
    expect(stripContent('Se:\n$$\\int_0^1 x\\,dx$$\nResultat')).toBe(
      'Se: [formel] Resultat',
    )
  })

  it('strips markdown formatting', () => {
    expect(stripContent('## Overskrift\n**Bold** og *kursiv*')).toBe(
      'Overskrift Bold og kursiv',
    )
  })

  it('truncates at 150 chars', () => {
    const long = 'a'.repeat(200)
    expect(stripContent(long)).toHaveLength(150)
  })

  it('handles empty string', () => {
    expect(stripContent('')).toBe('')
  })
})

describe('search grouping', () => {
  it('groups results by content_type', () => {
    const results = [
      { content_type: 'theory', id: '1' },
      { content_type: 'rule', id: '2' },
      { content_type: 'theory', id: '3' },
    ]
    const grouped: Record<string, typeof results> = {}
    for (const row of results) {
      const type = row.content_type
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(row)
    }
    expect(grouped['theory']).toHaveLength(2)
    expect(grouped['rule']).toHaveLength(1)
  })
})
