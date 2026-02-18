import { z } from 'zod/v4'
import { entryTypeEnum, assessmentTypeEnum } from './enums'

export const semesterPlanSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  subject_id: z.string(),
  start_date: z.string().date(),
  end_date: z.string().date(),
  schedule: z.object({
    days: z.array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        start_time: z.string(),
        duration_minutes: z.number().int().positive(),
      }),
    ),
  }),
  holidays: z.array(
    z.object({
      date: z.string().date(),
      name: z.string(),
    }),
  ),
  version: z.number().int().default(1),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})
export type SemesterPlan = z.infer<typeof semesterPlanSchema>

export const semesterPlanEntrySchema = z.object({
  id: z.string().uuid(),
  semester_plan_id: z.string().uuid(),
  date: z.string().date(),
  entry_type: entryTypeEnum,
  topic: z.string().nullable().optional(),
  assessment_type: assessmentTypeEnum.nullable().optional(),
  exam_id: z.string().uuid().nullable().optional(),
  title: z.string(),
  sort_order: z.number().int(),
  duration_minutes: z.number().int().positive(),
})
export type SemesterPlanEntry = z.infer<typeof semesterPlanEntrySchema>
