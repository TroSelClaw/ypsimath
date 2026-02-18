/**
 * Text chunker for source RAG ingestion.
 * Splits text into overlapping chunks of approximately `chunkSize` tokens.
 * Uses simple word-based tokenization (1 token ≈ 0.75 words for Norwegian text).
 */

export interface Chunk {
  content: string;
  chunkIndex: number;
}

export interface ChunkerOptions {
  /** Target chunk size in tokens (default: 500) */
  chunkSize?: number;
  /** Overlap in tokens between consecutive chunks (default: 100) */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 100;
const WORDS_PER_TOKEN = 0.75;

/**
 * Split text into overlapping chunks.
 * Splits on paragraph boundaries when possible, falls back to sentence/word boundaries.
 */
export function chunkText(text: string, options: ChunkerOptions = {}): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  if (overlap >= chunkSize) {
    throw new Error('Overlap must be smaller than chunk size');
  }

  const trimmed = text.trim();
  if (!trimmed) return [];

  const wordTarget = Math.round(chunkSize * WORDS_PER_TOKEN);
  const overlapWords = Math.round(overlap * WORDS_PER_TOKEN);

  // Split into paragraphs first
  const paragraphs = trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  const chunks: Chunk[] = [];
  let currentWords: string[] = [];
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);

    // If adding this paragraph exceeds target, flush current chunk
    if (currentWords.length > 0 && currentWords.length + words.length > wordTarget) {
      chunks.push({
        content: currentWords.join(' '),
        chunkIndex: chunkIndex++,
      });

      // Keep overlap words from the end
      const overlapStart = Math.max(0, currentWords.length - overlapWords);
      currentWords = currentWords.slice(overlapStart);
    }

    currentWords.push(...words);

    // If current buffer exceeds target, split it
    while (currentWords.length > wordTarget) {
      const chunkWords = currentWords.slice(0, wordTarget);
      chunks.push({
        content: chunkWords.join(' '),
        chunkIndex: chunkIndex++,
      });

      const overlapStart = Math.max(0, wordTarget - overlapWords);
      currentWords = currentWords.slice(overlapStart);
    }
  }

  // Flush remaining
  if (currentWords.length > 0) {
    chunks.push({
      content: currentWords.join(' '),
      chunkIndex: chunkIndex,
    });
  }

  return chunks;
}
