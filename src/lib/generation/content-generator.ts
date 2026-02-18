/**
 * Content generator using LLM with RAG context.
 * Generates content elements for a given competency goal.
 */

import { buildSystemPrompt, buildGenerationPrompt, type ContentType } from './prompts';

export interface GeneratedElement {
  content_type: string;
  title: string;
  content: string;
  sort_order: number;
  competency_goals: string[];
  content_metadata: Record<string, unknown>;
}

export interface GenerateOptions {
  /** Competency goal code, e.g. 'R1-04' */
  goalCode: string;
  /** Content type to generate, or 'all' */
  contentType: ContentType | 'all';
  /** RAG context chunks joined as text */
  ragContext: string;
  /** API base URL */
  apiBaseUrl?: string;
  /** Model to use (default: claude-opus-4-6-20250219) */
  model?: string;
  /** API key */
  apiKey?: string;
}

const DEFAULT_MODEL = 'claude-opus-4-6-20250219';

/**
 * Validate that generated LaTeX uses KaTeX-compatible syntax.
 * Returns array of issues found.
 */
export function validateKatex(content: string): string[] {
  const issues: string[] = [];

  // Check for common non-KaTeX commands
  const unsupported = [
    '\\begin{align*}',
    '\\end{align*}',
    '\\begin{equation}',
    '\\end{equation}',
    '\\newcommand',
    '\\DeclareMathOperator',
  ];

  for (const cmd of unsupported) {
    if (content.includes(cmd)) {
      issues.push(`Unsupported KaTeX command: ${cmd}`);
    }
  }

  // Check for unmatched dollar signs (basic check)
  const singleDollarMatches = content.match(/(?<!\$)\$(?!\$)/g);
  if (singleDollarMatches && singleDollarMatches.length % 2 !== 0) {
    issues.push('Unmatched single dollar sign ($) in LaTeX');
  }

  const doubleDollarMatches = content.match(/\$\$/g);
  if (doubleDollarMatches && doubleDollarMatches.length % 2 !== 0) {
    issues.push('Unmatched double dollar sign ($$) in LaTeX');
  }

  return issues;
}

/**
 * Call LLM to generate content elements.
 */
export async function generateContent(options: GenerateOptions): Promise<GeneratedElement[]> {
  const {
    goalCode,
    contentType,
    ragContext,
    model = DEFAULT_MODEL,
  } = options;

  const apiBaseUrl = options.apiBaseUrl ?? process.env.AI_API_BASE_URL ?? 'https://api.anthropic.com/v1';
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildGenerationPrompt(goalCode, contentType, ragContext);

  const response = await fetch(`${apiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content.find((c) => c.type === 'text')?.text;
  if (!text) {
    throw new Error('No text content in LLM response');
  }

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON array from LLM response');
  }

  const elements: GeneratedElement[] = JSON.parse(jsonMatch[0]);

  // Validate each element
  for (const el of elements) {
    const katexIssues = validateKatex(el.content);
    if (katexIssues.length > 0) {
      console.warn(`KaTeX issues in "${el.title}":`, katexIssues);
    }
  }

  return elements;
}
