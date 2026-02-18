import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'

// Test the validation schemas used by conversation actions

const renameSchema = z.object({
  conversationId: z.uuid(),
  title: z.string().min(1).max(200),
})

const deleteSchema = z.object({
  conversationId: z.uuid(),
})

describe('conversation action schemas', () => {
  describe('renameSchema', () => {
    it('accepts valid rename input', () => {
      const result = renameSchema.safeParse({
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Min samtale om derivasjon',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty title', () => {
      const result = renameSchema.safeParse({
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects title over 200 chars', () => {
      const result = renameSchema.safeParse({
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'x'.repeat(201),
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid UUID', () => {
      const result = renameSchema.safeParse({
        conversationId: 'not-a-uuid',
        title: 'Test',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteSchema', () => {
    it('accepts valid UUID', () => {
      const result = deleteSchema.safeParse({
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid UUID', () => {
      const result = deleteSchema.safeParse({
        conversationId: 'abc',
      })
      expect(result.success).toBe(false)
    })
  })
})
