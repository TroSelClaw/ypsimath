import { z } from 'zod/v4'
import { messageRoleEnum } from './enums'

export const conversationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().nullable().optional(),
  subject_context: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
})
export type Conversation = z.infer<typeof conversationSchema>

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: messageRoleEnum,
  content: z.string(),
  sources: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  image_url: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
})
export type Message = z.infer<typeof messageSchema>

export const chatInputSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1, 'Meldingen kan ikke være tom.').max(5000),
  imageUrl: z.string().url().nullable().optional(),
})
export type ChatInput = z.infer<typeof chatInputSchema>
