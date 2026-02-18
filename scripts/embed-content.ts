#!/usr/bin/env npx tsx
/**
 * Embedding pipeline for production content.
 *
 * Generates embeddings for all content_elements where embedding IS NULL
 * and status is 'reviewed' or 'published'. Processes in batches.
 *
 * Usage:
 *   npx tsx scripts/embed-content.ts
 *   npx tsx scripts/embed-content.ts --batch-size 25 --dry-run
 *
 * Environment variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Service role key
 *   OPENAI_API_KEY        - For embedding generation
 */

import { embedTexts } from '../src/lib/ingestion/embedder';

// --- CLI args ---

interface CliArgs {
  batchSize: number;
  dryRun: boolean;
  maxRetries: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { batchSize: 50, dryRun: false, maxRetries: 3 };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
        result.batchSize = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--max-retries':
        result.maxRetries = parseInt(args[++i], 10);
        break;
    }
  }

  return result;
}

// --- Supabase helpers ---

function getSupabaseHeaders() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }
  return {
    url: supabaseUrl,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  };
}

interface ContentRow {
  id: string;
  content: string;
  title: string;
}

async function fetchUnembeddedContent(batchSize: number): Promise<ContentRow[]> {
  const { url, headers } = getSupabaseHeaders();

  const response = await fetch(
    `${url}/rest/v1/content_elements?embedding=is.null&status=in.(reviewed,published)&select=id,content,title&limit=${batchSize}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as ContentRow[];
}

async function updateEmbedding(id: string, embedding: number[]): Promise<void> {
  const { url, headers } = getSupabaseHeaders();

  const response = await fetch(`${url}/rest/v1/content_elements?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ embedding }),
  });

  if (!response.ok) {
    throw new Error(`Update failed for ${id} (${response.status}): ${await response.text()}`);
  }
}

// --- Main ---

async function main() {
  const args = parseArgs();
  let totalProcessed = 0;
  let totalFailed = 0;

  console.log(`Embedding pipeline started (batch size: ${args.batchSize})`);

  // Process in batches until no more un-embedded content
  while (true) {
    const rows = await fetchUnembeddedContent(args.batchSize);
    if (rows.length === 0) {
      console.log('No more un-embedded content found.');
      break;
    }

    console.log(`\nProcessing batch of ${rows.length} elements...`);

    if (args.dryRun) {
      for (const row of rows) {
        console.log(`  [dry-run] Would embed: ${row.title} (${row.content.length} chars)`);
      }
      totalProcessed += rows.length;
      break; // Don't loop in dry-run
    }

    // Generate embeddings for the batch
    const texts = rows.map((r) => `${r.title}\n\n${r.content}`);

    let embeddings;
    let retries = 0;
    while (retries < args.maxRetries) {
      try {
        embeddings = await embedTexts(texts);
        break;
      } catch (err) {
        retries++;
        console.warn(`  Embedding attempt ${retries}/${args.maxRetries} failed:`, err);
        if (retries >= args.maxRetries) {
          console.error(`  Failed after ${args.maxRetries} retries, skipping batch`);
          totalFailed += rows.length;
          continue;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }

    if (!embeddings) continue;

    // Update each row
    for (let i = 0; i < rows.length; i++) {
      try {
        await updateEmbedding(rows[i].id, embeddings[i].embedding);
        totalProcessed++;
      } catch (err) {
        console.error(`  Failed to update ${rows[i].id}:`, err);
        totalFailed++;
      }
    }

    console.log(`  ✓ Batch complete (${rows.length} processed)`);
  }

  console.log(`\nDone. Processed: ${totalProcessed}, Failed: ${totalFailed}${args.dryRun ? ' (dry-run)' : ''}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
