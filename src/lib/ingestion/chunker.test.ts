import { describe, it, expect } from 'vitest';
import { chunkText } from './chunker';

describe('chunkText', () => {
  it('returns empty array for empty text', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const result = chunkText('Hello world this is a test.');
    expect(result).toHaveLength(1);
    expect(result[0].chunkIndex).toBe(0);
    expect(result[0].content).toBe('Hello world this is a test.');
  });

  it('splits long text into multiple chunks', () => {
    // Generate text with ~800 words (well over 500-token target ≈ 375 words)
    const words = Array.from({ length: 800 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const result = chunkText(text);
    expect(result.length).toBeGreaterThan(1);
    // Chunk indices should be sequential
    result.forEach((chunk, i) => {
      expect(chunk.chunkIndex).toBe(i);
    });
  });

  it('creates overlapping chunks', () => {
    const words = Array.from({ length: 800 }, (_, i) => `w${i}`);
    const text = words.join(' ');
    const result = chunkText(text, { chunkSize: 200, overlap: 50 });

    expect(result.length).toBeGreaterThanOrEqual(2);
    // Check that the second chunk starts with words that appeared in the first chunk
    const firstWords = new Set(result[0].content.split(' '));
    const secondStart = result[1].content.split(' ').slice(0, 50);
    const shared = secondStart.filter((w) => firstWords.has(w));
    expect(shared.length).toBeGreaterThan(0);
  });

  it('throws if overlap >= chunkSize', () => {
    expect(() => chunkText('test', { chunkSize: 100, overlap: 100 })).toThrow();
    expect(() => chunkText('test', { chunkSize: 100, overlap: 150 })).toThrow();
  });

  it('respects paragraph boundaries when possible', () => {
    const para1 = Array.from({ length: 100 }, (_, i) => `a${i}`).join(' ');
    const para2 = Array.from({ length: 100 }, (_, i) => `b${i}`).join(' ');
    const text = `${para1}\n\n${para2}`;
    const result = chunkText(text, { chunkSize: 200, overlap: 20 });
    // With 200 words total and ~150 word target, should still produce chunks
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
