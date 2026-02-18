#!/usr/bin/env npx tsx
/**
 * Quality flagging script for generated content.
 *
 * Processes draft content elements and runs LLM-based quality checks.
 * - If issues found: status => flagged + content_metadata.flag_reason/confidence
 * - If no issues: status => reviewed + content_metadata.flag_confidence
 *
 * Usage:
 *   npx tsx scripts/flag-content.ts --subject r1
 *   npx tsx scripts/flag-content.ts --subject r1 --limit 50 --dry-run
 */

import { checkQuality } from '../src/lib/generation/quality-checker';

interface CliArgs {
  subject: string;
  limit: number;
  dryRun: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { subject: 'r1', limit: 100, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--subject':
        result.subject = args[++i] ?? 'r1';
        break;
      case '--limit':
        result.limit = Number(args[++i] ?? '100');
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
    }
  }

  return result;
}

interface DraftRow {
  id: string;
  title: string;
  content: string;
  content_type: string;
  content_metadata: Record<string, unknown> | null;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  return { url, key };
}

async function fetchDraftRows(subject: string, limit: number): Promise<DraftRow[]> {
  const { url, key } = getSupabaseConfig();

  // NOTE: subject filter is currently best-effort because subject code mapping can vary by seed setup.
  const response = await fetch(
    `${url}/rest/v1/content_elements?status=eq.draft&select=id,title,content,content_type,content_metadata&limit=${limit}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch draft content (${response.status}): ${await response.text()}`);
  }

  const rows = (await response.json()) as DraftRow[];
  if (subject) {
    // placeholder hook for future subject-aware filtering
  }
  return rows;
}

async function patchRow(
  id: string,
  status: 'flagged' | 'reviewed',
  metadata: Record<string, unknown>,
): Promise<void> {
  const { url, key } = getSupabaseConfig();

  const response = await fetch(`${url}/rest/v1/content_elements?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status,
      content_metadata: metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update content row ${id} (${response.status}): ${await response.text()}`);
  }
}

async function main() {
  const args = parseArgs();
  console.log(`Running quality flagging for subject=${args.subject}, limit=${args.limit}`);

  const rows = await fetchDraftRows(args.subject, args.limit);
  if (rows.length === 0) {
    console.log('No draft rows found.');
    return;
  }

  let flagged = 0;
  let reviewed = 0;

  for (const row of rows) {
    const result = await checkQuality(row.content, row.title, row.content_type);

    const nextMetadata: Record<string, unknown> = {
      ...(row.content_metadata ?? {}),
      flag_confidence: result.confidence,
      quality_issues: result.issues,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'llm-quality-pass',
    };

    if (!result.passed) {
      nextMetadata.flag_reason = result.flagReason ?? 'Kvalitetskontroll fant avvik';
    } else {
      delete nextMetadata.flag_reason;
    }

    const nextStatus: 'flagged' | 'reviewed' = result.passed ? 'reviewed' : 'flagged';

    if (args.dryRun) {
      console.log(
        `[dry-run] ${row.id} -> ${nextStatus} (${row.title}) | confidence=${result.confidence.toFixed(2)}`,
      );
    } else {
      await patchRow(row.id, nextStatus, nextMetadata);
      console.log(`Updated ${row.id} -> ${nextStatus}`);
    }

    if (nextStatus === 'flagged') flagged++;
    else reviewed++;
  }

  console.log(`\nSummary: ${flagged} flagged, ${reviewed} reviewed, total ${rows.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
