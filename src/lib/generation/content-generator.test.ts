import { describe, it, expect } from 'vitest';
import { validateKatex } from './content-generator';
import { buildSystemPrompt, buildGenerationPrompt, R1_COMPETENCY_GOALS } from './prompts';

describe('validateKatex', () => {
  it('returns no issues for valid KaTeX', () => {
    const content = 'Her er en formel: $x^2 + y^2 = r^2$ og display: $$\\int_0^1 x\\,dx$$';
    expect(validateKatex(content)).toEqual([]);
  });

  it('detects unsupported commands', () => {
    const content = '\\begin{align*} x &= 1 \\end{align*}';
    const issues = validateKatex(content);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes('align*'))).toBe(true);
  });

  it('detects unmatched single dollar signs', () => {
    const content = 'Her er $x^2 og mer tekst';
    const issues = validateKatex(content);
    expect(issues.some((i) => i.includes('single dollar'))).toBe(true);
  });

  it('detects unmatched double dollar signs', () => {
    const content = '$$x^2 + 1';
    const issues = validateKatex(content);
    expect(issues.some((i) => i.includes('double dollar'))).toBe(true);
  });
});

describe('prompts', () => {
  it('system prompt includes all R1 goals', () => {
    const prompt = buildSystemPrompt();
    for (const goal of R1_COMPETENCY_GOALS) {
      expect(prompt).toContain(goal.code);
    }
  });

  it('generation prompt includes goal code and RAG context', () => {
    const prompt = buildGenerationPrompt('R1-04', 'theory', 'Some context here');
    expect(prompt).toContain('R1-04');
    expect(prompt).toContain('Some context here');
  });

  it('generation prompt for "all" mentions all types', () => {
    const prompt = buildGenerationPrompt('R1-01', 'all', '');
    expect(prompt).toContain('alle innholdstyper');
  });
});
