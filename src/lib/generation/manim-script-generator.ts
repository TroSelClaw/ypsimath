/**
 * Manim script generator.
 *
 * Generates Manim Community Edition Python scripts from published example
 * content elements using an LLM. Scripts are stored in the `videos` table.
 */

const MANIM_SYSTEM_PROMPT = `Du er en ekspert på Manim Community Edition (ManimCE v0.18+) og matematikkpedagogikk.
Du genererer Python-scripts som lager animerte matematikkvideoer for norske videregående-elever (R1-nivå).

Regler:
- Bruk Manim CE API (import fra manim, IKKE manimlib/manimgl).
- Klassen skal arve fra Scene og implementere construct().
- Bruk norsk i all tekst som vises i videoen (MathTex for formler, Text for norsk tekst).
- Hold animasjonene korte og fokuserte (30–90 sekunder).
- Vis utregning steg-for-steg med tydelig pauser mellom steg.
- Bruk farger for å fremheve viktige deler.
- Avslutt alltid med self.wait(2) slik at sluttresultatet er synlig.
- Unngå avanserte plugins eller eksterne fonter – bruk kun standard Manim CE.
- Klassens navn skal være ExampleScene.

Svar BARE med Python-koden. Ingen forklaring, ingen markdown-blokk.
Start med "from manim import *" og avslutt med koden.`;

export interface ManimScriptResult {
  script: string;
  contentElementId: string;
  title: string;
}

export interface GenerateManimScriptOptions {
  /** The example content (markdown with KaTeX) */
  content: string;
  /** Title of the example */
  title: string;
  /** Content element ID */
  contentElementId: string;
  /** Competency goals */
  competencyGoals: string[];
  /** API key for LLM */
  apiKey?: string;
  /** Model (default: claude-sonnet-4-6-20250219) */
  model?: string;
}

/**
 * Generate a Manim CE script for an example content element.
 */
export async function generateManimScript(
  options: GenerateManimScriptOptions
): Promise<ManimScriptResult> {
  const {
    content,
    title,
    contentElementId,
    competencyGoals,
    apiKey = process.env.ANTHROPIC_API_KEY,
    model = 'claude-sonnet-4-6-20250219',
  } = options;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  const userPrompt = `Lag et Manim CE-script som animerer dette eksempelet steg-for-steg:

Tittel: ${title}
Kompetansemål: ${competencyGoals.join(', ')}

Innhold (markdown med LaTeX):
${content}

Generer kun Python-koden for Manim CE.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: MANIM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  let script = data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip markdown code fences if present
  script = script.replace(/^```python\n?/m, '').replace(/\n?```$/m, '').trim();

  return { script, contentElementId, title };
}

/**
 * Validate basic Python syntax of a Manim script.
 * Returns null if valid, or error string if invalid.
 */
export function validateManimScript(script: string): string | null {
  // Check for common manimlib (old API) imports — must be checked before manim import
  if (script.includes('from manimlib')) {
    return 'Uses manimlib (old API) instead of manim (Community Edition)';
  }

  // Check essential imports
  if (!script.includes('from manim import')) {
    return 'Missing "from manim import *" statement';
  }

  // Check for Scene class
  if (!script.includes('class ExampleScene') && !script.includes('class ') && !script.includes('Scene')) {
    return 'Missing Scene subclass';
  }

  // Check for construct method
  if (!script.includes('def construct(')) {
    return 'Missing construct() method';
  }

  // Check balanced parentheses/brackets
  const counts = { '(': 0, '[': 0, '{': 0 };
  const closers: Record<string, keyof typeof counts> = { ')': '(', ']': '[', '}': '{' };
  for (const ch of script) {
    if (ch in counts) counts[ch as keyof typeof counts]++;
    if (ch in closers) counts[closers[ch]]--;
  }
  for (const [char, count] of Object.entries(counts)) {
    if (count !== 0) return `Unbalanced '${char}' (off by ${count})`;
  }

  return null;
}
