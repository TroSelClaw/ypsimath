import { z } from 'zod/v4'
import { examStatusEnum, submissionStatusEnum } from './enums'

export const examSchema = z.object({
  id: z.string().uuid(),
  created_by: z.string().uuid(),
  title: z.string(),
  subject_id: z.string(),
  total_duration_minutes: z.number().int().positive(),
  part1_duration_minutes: z.number().int().positive(),
  part2_duration_minutes: z.number().int().positive(),
  competency_goals: z.array(z.string()),
  exam_pdf_url: z.string().url().nullable().optional(),
  solution_pdf_url: z.string().url().nullable().optional(),
  status: examStatusEnum,
  created_at: z.string().datetime().optional(),
})
export type Exam = z.infer<typeof examSchema>

export const examQuestionSchema = z.object({
  id: z.string().uuid(),
  exam_id: z.string().uuid(),
  part: z.number().int().min(1).max(2),
  question_number: z.number().int().positive(),
  content: z.string(),
  max_points: z.number().positive(),
  solution: z.string(),
  grading_criteria: z.string(),
})
export type ExamQuestion = z.infer<typeof examQuestionSchema>

export const examSubmissionSchema = z.object({
  id: z.string().uuid(),
  exam_id: z.string().uuid(),
  student_id: z.string().uuid(),
  scanned_at: z.string().datetime().optional(),
  scan_pdf_url: z.string().nullable().optional(),
  total_score_percent: z.number().min(0).max(100).nullable().optional(),
  status: submissionStatusEnum,
})
export type ExamSubmission = z.infer<typeof examSubmissionSchema>

export const createExamInputSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd.'),
  subject_id: z.string(),
  total_duration_minutes: z.number().int().min(15).max(300),
  part1_duration_minutes: z.number().int().min(10),
  part2_duration_minutes: z.number().int().min(10),
  competency_goals: z.array(z.string()).min(1, 'Velg minst ett kompetansemål.'),
  difficulty_mix: z
    .object({
      easy: z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard: z.number().min(0).max(100),
    })
    .refine((d) => d.easy + d.medium + d.hard === 100, {
      message: 'Vanskelighetsmiks må summere til 100%.',
    }),
})
export type CreateExamInput = z.infer<typeof createExamInputSchema>
