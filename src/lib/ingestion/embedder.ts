/**
 * Embedding generator for source RAG chunks.
 * Uses text-embedding-3-small (1536d) via OpenAI-compatible API.
 */

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface EmbedderOptions {
  /** API base URL (default: uses OPENAI_API_BASE_URL or OpenAI) */
  apiBaseUrl?: string;
  /** Model name (default: text-embedding-3-small) */
  model?: string;
  /** Batch size for bulk embedding (default: 50) */
  batchSize?: number;
}

const DEFAULT_MODEL = 'text-embedding-3-small';
const DEFAULT_BATCH_SIZE = 50;

/**
 * Generate embeddings for an array of texts.
 * Processes in batches to respect API limits.
 */
export async function embedTexts(
  texts: string[],
  options: EmbedderOptions = {},
): Promise<EmbeddingResult[]> {
  const model = options.model ?? DEFAULT_MODEL;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const apiBaseUrl = options.apiBaseUrl ?? process.env.OPENAI_API_BASE_URL ?? 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for embedding');
  }

  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await fetch(`${apiBaseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: batch,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
      usage: { total_tokens: number };
    };

    const tokensPerItem = Math.ceil(data.usage.total_tokens / batch.length);

    for (const item of data.data) {
      results.push({
        embedding: item.embedding,
        tokenCount: tokensPerItem,
      });
    }
  }

  return results;
}

/**
 * Generate a single embedding for a query string.
 */
export async function embedQuery(
  query: string,
  options: EmbedderOptions = {},
): Promise<number[]> {
  const [result] = await embedTexts([query], options);
  return result.embedding;
}
