import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch before importing the module
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { ocrPageImage, ocrPages } from './ocr'

describe('ocr', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key')
    mockFetch.mockReset()
  })

  describe('ocrPageImage', () => {
    it('parses structured JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"text": "$f(x) = x^2$", "confidence": "high"}' }],
              },
            },
          ],
        }),
      })

      const result = await ocrPageImage('base64data', 'application/pdf')
      expect(result.text).toBe('$f(x) = x^2$')
      expect(result.confidence).toBe('high')
    })

    it('falls back to raw text on invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'raw OCR text without JSON' }],
              },
            },
          ],
        }),
      })

      const result = await ocrPageImage('base64data', 'application/pdf')
      expect(result.text).toBe('raw OCR text without JSON')
      expect(result.confidence).toBe('medium')
    })

    it('throws on missing API key', async () => {
      vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', '')
      await expect(ocrPageImage('data', 'image/png')).rejects.toThrow('mangler')
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      await expect(ocrPageImage('data', 'image/png')).rejects.toThrow('Gemini OCR-feil')
    })
  })

  describe('ocrPages', () => {
    it('processes multiple pages in order', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"text": "side 1", "confidence": "high"}' }] } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '{"text": "side 2", "confidence": "low"}' }] } }],
          }),
        })

      const results = await ocrPages([
        { imageBase64: 'a', mimeType: 'application/pdf', pageNumber: 1 },
        { imageBase64: 'b', mimeType: 'application/pdf', pageNumber: 2 },
      ])

      expect(results).toHaveLength(2)
      expect(results[0].text).toBe('side 1')
      expect(results[1].confidence).toBe('low')
    })
  })
})
