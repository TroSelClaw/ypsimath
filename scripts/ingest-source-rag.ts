#!/usr/bin/env npx tsx
/**
 * Source RAG ingestion script.
 *
 * Reads source files from data/raw/, chunks them, generates embeddings,
 * and stores them in the src_chunks table.
 *
 * Usage:
 *   npx tsx scripts/ingest-source-rag.ts --dir data/raw/ --subject-id <uuid>
 *   npx tsx scripts/ingest-source-rag.ts --file data/raw/r1-derivasjon.html --subject-id <uuid> --goals R1-04,R1-05
 *   npx tsx scripts/ingest-source-rag.ts --dry-run --dir data/raw/
 *
 * Environment variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_SERVICE_KEY   - Service role key (bypasses RLS)
 *   OPENAI_API_KEY         - For embedding generation
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { chunkText } from '../src/lib/ingestion/chunker';
import { embedTexts } from '../src/lib/ingestion/embedder';

// --- CLI argument parsing ---

interface CliArgs {
  dir?: string;
  file?: string;
  subjectId?: string;
  goals?: string[];
  dryRun: boolean;
  contentType: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { dryRun: false, contentType: 'text' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        result.dir = args[++i];
        break;
      case '--file':
        result.file = args[++i];
        break;
      case '--subject-id':
        result.subjectId = args[++i];
        break;
      case '--goals':
        result.goals = args[++i]?.split(',').map((g) => g.trim());
        break;
      case '--content-type':
        result.contentType = args[++i] ?? 'text';
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
    }
  }

  if (!result.dir && !result.file) {
    console.error('Error: --dir or --file is required');
    process.exit(1);
  }

  return result;
}

// --- File reading ---

const SUPPORTED_EXTENSIONS = new Set(['.html', '.htm', '.txt', '.md']);

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function readSourceFile(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const raw = readFileSync(filePath, 'utf-8');

  if (ext === '.html' || ext === '.htm') {
    return stripHtml(raw);
  }
  return raw;
}

function collectFiles(dirOrFile: string): string[] {
  const stat = statSync(dirOrFile);
  if (stat.isFile()) {
    return [dirOrFile];
  }

  return readdirSync(dirOrFile)
    .filter((f) => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()))
    .map((f) => join(dirOrFile, f))
    .sort();
}

// --- Supabase upsert ---

async function upsertChunks(
  chunks: Array<{
    source_file: string;
    chunk_index: number;
    content: string;
    content_type: string;
    subject_id: string | null;
    competency_goals: string[];
    embedding: number[];
  }>,
) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }

  // Upsert via PostgREST — conflict on (source_file, chunk_index)
  const response = await fetch(`${supabaseUrl}/rest/v1/src_chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(chunks),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase upsert failed (${response.status}): ${error}`);
  }

  return chunks.length;
}

// --- Main ---

async function main() {
  const args = parseArgs();
  const target = args.dir ?? args.file!;
  const files = collectFiles(target);

  console.log(`Found ${files.length} source file(s) to process`);

  let totalChunks = 0;

  for (const filePath of files) {
    const fileName = basename(filePath);
    console.log(`\nProcessing: ${fileName}`);

    const text = readSourceFile(filePath);
    if (text.length < 50) {
      console.log(`  Skipping (too short: ${text.length} chars)`);
      continue;
    }

    const chunks = chunkText(text);
    console.log(`  Chunked into ${chunks.length} pieces`);

    if (args.dryRun) {
      for (const chunk of chunks) {
        console.log(`  [${chunk.chunkIndex}] ${chunk.content.slice(0, 80)}...`);
      }
      totalChunks += chunks.length;
      continue;
    }

    // Generate embeddings
    console.log(`  Generating embeddings...`);
    const embeddings = await embedTexts(chunks.map((c) => c.content));

    // Prepare rows
    const rows = chunks.map((chunk, i) => ({
      source_file: fileName,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      content_type: args.contentType,
      subject_id: args.subjectId ?? null,
      competency_goals: args.goals ?? [],
      embedding: embeddings[i].embedding,
    }));

    // Upsert to Supabase
    console.log(`  Upserting ${rows.length} chunks...`);
    const count = await upsertChunks(rows);
    totalChunks += count;
    console.log(`  ✓ ${count} chunks upserted`);
  }

  console.log(`\nDone. Total chunks: ${totalChunks}${args.dryRun ? ' (dry-run)' : ''}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
