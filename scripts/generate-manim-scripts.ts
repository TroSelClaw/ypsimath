#!/usr/bin/env npx tsx
/**
 * Manim script generation script.
 *
 * Generates Manim CE Python scripts for published example content elements
 * that don't already have associated video entries.
 *
 * Usage:
 *   npx tsx scripts/generate-manim-scripts.ts --subject r1
 *   npx tsx scripts/generate-manim-scripts.ts --subject r1 --limit 5 --dry-run
 *   npx tsx scripts/generate-manim-scripts.ts --subject r1 --element <uuid>
 *
 * Environment variables:
 *   SUPABASE_URL          - Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Service role key
 *   ANTHROPIC_API_KEY     - For script generation (Claude Sonnet)
 */

import { createClient } from '@supabase/supabase-js';
import {
  generateManimScript,
  validateManimScript,
} from '../src/lib/generation/manim-script-generator';

// --- CLI args ---

interface CliArgs {
  subject: string;
  limit: number;
  dryRun: boolean;
  elementId?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { subject: 'r1', limit: 50, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--subject':
        result.subject = args[++i];
        break;
      case '--limit':
        result.limit = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--element':
        result.elementId = args[++i];
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  return result;
}

// --- Main ---

async function main() {
  const cli = parseArgs();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  if (!anthropicKey) {
    console.error('Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find published examples without videos
  let query = supabase
    .from('content_elements')
    .select('id, title, content, competency_goals, subject_id')
    .eq('content_type', 'example')
    .eq('status', 'published')
    .limit(cli.limit);

  if (cli.elementId) {
    query = query.eq('id', cli.elementId);
  }

  const { data: examples, error: fetchError } = await query;

  if (fetchError) {
    console.error('Failed to fetch examples:', fetchError.message);
    process.exit(1);
  }

  if (!examples || examples.length === 0) {
    console.log('No published examples found.');
    return;
  }

  // Filter out examples that already have a video entry
  const exampleIds = examples.map((e) => e.id);
  const { data: existingVideos } = await supabase
    .from('videos')
    .select('content_element_id')
    .in('content_element_id', exampleIds);

  const existingSet = new Set((existingVideos ?? []).map((v) => v.content_element_id));
  const toProcess = examples.filter((e) => !existingSet.has(e.id));

  console.log(
    `Found ${examples.length} published examples, ${toProcess.length} without videos.`
  );

  if (toProcess.length === 0) {
    console.log('Nothing to generate.');
    return;
  }

  let generated = 0;
  let failed = 0;
  const MAX_RETRIES = 3;

  for (const example of toProcess) {
    console.log(`\n--- Generating: ${example.title} (${example.id}) ---`);

    let script: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await generateManimScript({
          content: example.content,
          title: example.title,
          contentElementId: example.id,
          competencyGoals: example.competency_goals ?? [],
          apiKey: anthropicKey,
        });

        const validationError = validateManimScript(result.script);
        if (validationError) {
          lastError = validationError;
          console.warn(`  Attempt ${attempt}: validation failed — ${validationError}`);
          continue;
        }

        script = result.script;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`  Attempt ${attempt}: API error — ${lastError}`);
      }
    }

    if (!script) {
      console.error(`  FAILED after ${MAX_RETRIES} attempts: ${lastError}`);
      failed++;
      continue;
    }

    if (cli.dryRun) {
      console.log('  [dry-run] Script generated successfully:');
      console.log(script.slice(0, 200) + '...');
      generated++;
      continue;
    }

    // Insert into videos table
    const { error: insertError } = await supabase.from('videos').insert({
      content_element_id: example.id,
      manim_script: script,
      status: 'generating',
    });

    if (insertError) {
      console.error(`  DB insert failed: ${insertError.message}`);
      failed++;
    } else {
      console.log('  ✅ Script stored, status=generating');
      generated++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped (already have video): ${existingSet.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
