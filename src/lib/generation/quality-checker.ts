/**
 * LLM quality-flagging for generated content.
 * Runs a separate review pass to check mathematical correctness,
 * pedagogical clarity, LaTeX validity, and Norwegian notation.
 */

export interface QualityResult {
  passed: boolean;
  confidence: number;
  issues: string[];
  flagReason: string | null;
}

export interface QualityCheckOptions {
  apiBaseUrl?: string;
  model?: string;
  apiKey?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6-20250219';

const REVIEW_SYSTEM_PROMPT = `Du er en kvalitetskontrollør for matematisk innhold på norsk bokmål (R1, videregående).

Vurder innholdet på følgende kriterier:
1. **Matematisk korrekthet**: Er formler, utregninger og svar riktige?
2. **Pedagogisk klarhet**: Er forklaringene tydelige og trinnvise?
3. **LaTeX-validitet**: Er all LaTeX KaTeX-kompatibel ($...$ for inline, $$...$$ for display)?
4. **Norsk notasjon**: Brukes komma som desimalskilletegn? Norske termer?
5. **Fullstendighet**: Mangler det viktige steg eller forklaringer?

Svar som JSON:
{
  "passed": true/false,
  "confidence": 0.0-1.0,
  "issues": ["beskrivelse av problem 1", "beskrivelse av problem 2"],
  "summary": "kort oppsummering"
}

Vær streng men rettferdig. Mindre formateringsproblemer er OK, men matematiske feil er alltid flagget.`;

export function parseQualityResponse(text: string): QualityResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from quality check response')
  }

  const result = JSON.parse(jsonMatch[0]) as {
    passed: boolean
    confidence: number
    issues: string[]
    summary: string
  }

  return {
    passed: result.passed,
    confidence: result.confidence,
    issues: result.issues ?? [],
    flagReason: result.passed ? null : result.summary ?? (result.issues ?? []).join('; '),
  }
}

/**
 * Run quality check on a single content element.
 */
export async function checkQuality(
  content: string,
  title: string,
  contentType: string,
  options: QualityCheckOptions = {},
): Promise<QualityResult> {
  const model = options.model ?? DEFAULT_MODEL;
  const apiBaseUrl = options.apiBaseUrl ?? process.env.AI_API_BASE_URL ?? 'https://api.anthropic.com/v1';
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  const response = await fetch(`${apiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Vurder dette innholdet (type: ${contentType}):\n\nTittel: ${title}\n\n${content}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Quality check API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content.find((c) => c.type === 'text')?.text;
  if (!text) {
    throw new Error('No text content in quality check response');
  }

  return parseQualityResponse(text);
}
