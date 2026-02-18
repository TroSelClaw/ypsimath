import { describe, it, expect, vi } from 'vitest'
import { extractPagesAsImages, type GradingInput } from './exam-grader'
import { PDFDocument } from 'pdf-lib'

describe('exam-grader', () => {
  describe('extractPagesAsImages', () => {
    async function makeTestPdf(pageCount: number): Promise<Uint8Array> {
      const doc = await PDFDocument.create()
      for (let i = 0; i < pageCount; i++) {
        const page = doc.addPage([595, 842]) // A4
        page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24 })
      }
      return doc.save()
    }

    it('extracts correct number of pages', async () => {
      const pdf = await makeTestPdf(5)
      const pages = await extractPagesAsImages(pdf, 2, 4)
      expect(pages).toHaveLength(3)
      expect(pages[0].pageNumber).toBe(2)
      expect(pages[1].pageNumber).toBe(3)
      expect(pages[2].pageNumber).toBe(4)
    })

    it('returns valid base64 and mime type', async () => {
      const pdf = await makeTestPdf(3)
      const pages = await extractPagesAsImages(pdf, 1, 1)
      expect(pages[0].mimeType).toBe('application/pdf')
      expect(pages[0].imageBase64.length).toBeGreaterThan(0)
      // Verify it's valid base64 by decoding
      expect(() => atob(pages[0].imageBase64)).not.toThrow()
    })

    it('throws on invalid page range', async () => {
      const pdf = await makeTestPdf(3)
      await expect(extractPagesAsImages(pdf, 0, 2)).rejects.toThrow('Ugyldig sideintervall')
      await expect(extractPagesAsImages(pdf, 2, 5)).rejects.toThrow('Ugyldig sideintervall')
      await expect(extractPagesAsImages(pdf, 3, 1)).rejects.toThrow('Ugyldig sideintervall')
    })

    it('handles single-page extraction', async () => {
      const pdf = await makeTestPdf(1)
      const pages = await extractPagesAsImages(pdf, 1, 1)
      expect(pages).toHaveLength(1)
      expect(pages[0].pageNumber).toBe(1)
    })
  })

  describe('scoring total calculation', () => {
    it('computes weighted total score correctly', () => {
      const questions = [
        { max_points: 4 },
        { max_points: 6 },
        { max_points: 10 },
      ]
      const scores = [100, 50, 80] // percent per question

      const totalMax = questions.reduce((s, q) => s + q.max_points, 0)
      const totalEarned = questions.reduce((s, q, i) => s + (q.max_points * scores[i]) / 100, 0)
      const totalPercent = Math.round((totalEarned / totalMax) * 100)

      // 4*1 + 6*0.5 + 10*0.8 = 4 + 3 + 8 = 15 out of 20 = 75%
      expect(totalPercent).toBe(75)
    })
  })
})
