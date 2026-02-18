import { z } from 'zod/v4'
import { contentTypeEnum, exerciseFormatEnum, contentStatusEnum, videoStatusEnum } from './enums'

export const contentElementSchema = z.object({
  id: z.string().uuid(),
  subject_id: z.string(),
  chapter: z.string(),
  topic: z.string(),
  sort_order: z.number().int(),
  content_type: contentTypeEnum,
  exercise_format: exerciseFormatEnum.nullable().optional(),
  content: z.string(),
  content_metadata: z
    .object({
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      prerequisites: z.array(z.string()).optional(),
      hints: z.array(z.string()).optional(),
      answer: z.string().optional(),
      choices: z.array(z.string()).optional(),
      tolerance: z.number().optional(),
      geogebra_id: z.string().optional(),
      geogebra_url: z.string().url().optional(),
      flag_reason: z.string().optional(),
      flag_confidence: z.number().min(0).max(100).optional(),
    })
    .optional(),
  competency_goals: z.array(z.string()),
  status: contentStatusEnum,
  version: z.number().int().default(1),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
})
export type ContentElement = z.infer<typeof contentElementSchema>

export const videoSchema = z.object({
  id: z.string().uuid(),
  content_element_id: z.string().uuid(),
  video_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  duration_seconds: z.number().int().optional(),
  manim_script: z.string().optional(),
  status: videoStatusEnum,
})
export type Video = z.infer<typeof videoSchema>

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  competency_goals: z.record(z.string(), z.string()).optional(),
})
export type Subject = z.infer<typeof subjectSchema>
