#!/usr/bin/env npx tsx
/**
 * Content generation script.
 *
 * Generates content elements for a competency goal using LLM with RAG context.
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts --subject r1 --goal R1-04 --type all
 *   npx tsx scripts/generate-content.ts --subject r1 --goal R1-04 --type exercise --dry-run
 *
 * Environment variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Service role key
 *   ANTHROPIC_API_KEY     - For content generation (Claude)
 *   OPENAI_API_KEY        - For embedding queries (RAG retrieval)
 */

import { generateContent, type GeneratedElement } from '../src/lib/generation/content-generator';
import { embedQuery } from '../src/lib/ingestion/embedder';
import type { ContentType } from '../src/lib/generation/prompts';

// --- CLI args ---

interface CliArgs {
  subject: string;
  goal: string;
  type: ContentType | 'all';
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { subject: 'r1', goal: '', type: 'all', dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--subject':
        result.subject = args[++i];
        break;
      case '--goal':
        result.goal = args[++i];
        break;
      case '--type':
        result.type = args[++i] as ContentType | 'all';
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
    }
  }

  if (!result.goal) {
    console.error('Error: --goal is required (e.g. --goal R1-04)');
    process.exit(1);
  }

  return result;
}

// --- RAG retrieval ---

async function fetchRagContext(goalCode: string): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('No Supabase credentials — skipping RAG context');
    return '(Ingen kildemateriale tilgjengelig)';
  }

  try {
    // Embed the goal code as query
    const queryEmbedding = await embedQuery(goalCode);

    // Call Supabase RPC or direct query for vector search
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/match_src_chunks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          query_embedding: queryEmbedding,
          match_count: 10,
          filter_goals: [goalCode],
        }),
      },
    );

    if (!response.ok) {
      // Fallback: try direct filtering by competency_goals
      const fallbackResponse = await fetch(
        `${supabaseUrl}/rest/v1/src_chunks?competency_goals=cs.{${goalCode}}&limit=10`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (!fallbackResponse.ok) {
        console.warn('RAG retrieval failed, continuing without context');
        return '(Ingen kildemateriale tilgjengelig)';
      }

      const chunks = (await fallbackResponse.json()) as Array<{ content: string }>;
      return chunks.map((c) => c.content).join('\n\n---\n\n');
    }

    const chunks = (await response.json()) as Array<{ content: string }>;
    return chunks.map((c) => c.content).join('\n\n---\n\n');
  } catch (err) {
    console.warn('RAG retrieval error:', err);
    return '(Ingen kildemateriale tilgjengelig)';
  }
}

// --- Supabase insert ---

async function insertElements(
  elements: GeneratedElement[],
  subjectId: string | null,
): Promise<number> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }

  const rows = elements.map((el) => ({
    subject_id: subjectId,
    content_type: el.content_type,
    title: el.title,
    content: el.content,
    sort_order: el.sort_order,
    competency_goals: el.competency_goals,
    content_metadata: el.content_metadata,
    status: 'draft',
  }));

  const response = await fetch(`${supabaseUrl}/rest/v1/content_elements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Insert failed (${response.status}): ${error}`);
  }

  return rows.length;
}

// --- Main ---

async function main() {
  const args = parseArgs();
  console.log(`Generating content for ${args.goal} (type: ${args.type})`);

  // Fetch RAG context
  console.log('Fetching RAG context...');
  const ragContext = await fetchRagContext(args.goal);
  console.log(`RAG context: ${ragContext.length} chars`);

  // Generate content
  console.log('Calling LLM for content generation...');
  const elements = await generateContent({
    goalCode: args.goal,
    contentType: args.type,
    ragContext,
  });

  console.log(`Generated ${elements.length} content elements:`);
  for (const el of elements) {
    console.log(`  [${el.content_type}] ${el.title} (${el.content.length} chars)`);
  }

  if (args.dryRun) {
    console.log('\n--- DRY RUN: not inserting into database ---');
    console.log(JSON.stringify(elements, null, 2));
    return;
  }

  // Insert into database
  console.log('Inserting into content_elements...');
  const count = await insertElements(elements, null);
  console.log(`✓ ${count} elements inserted with status=draft`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
