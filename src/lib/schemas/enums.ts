import { z } from 'zod/v4'

// Matches DB ENUM types exactly

export const roleEnum = z.enum(['student', 'teacher', 'admin'])
export type Role = z.infer<typeof roleEnum>

export const contentTypeEnum = z.enum([
  'theory',
  'rule',
  'example',
  'exercise',
  'exploration',
  'flashcard',
])
export type ContentType = z.infer<typeof contentTypeEnum>

export const exerciseFormatEnum = z.enum([
  'freeform',
  'multiple_choice',
  'numeric_input',
  'drag_drop',
  'interactive',
])
export type ExerciseFormat = z.infer<typeof exerciseFormatEnum>

export const contentStatusEnum = z.enum(['draft', 'flagged', 'reviewed', 'published'])
export type ContentStatus = z.infer<typeof contentStatusEnum>

export const activityTypeEnum = z.enum([
  'wiki_view',
  'exercise_attempt',
  'chat_message',
  'exam_graded',
  'video_watched',
  'flashcard_session',
])
export type ActivityType = z.infer<typeof activityTypeEnum>

export const checkMethodEnum = z.enum(['self_report', 'auto_check', 'image_check'])
export type CheckMethod = z.infer<typeof checkMethodEnum>

export const selfReportResultEnum = z.enum(['correct', 'partial', 'incorrect'])
export type SelfReportResult = z.infer<typeof selfReportResultEnum>

export const messageRoleEnum = z.enum(['user', 'assistant', 'system'])
export type MessageRole = z.infer<typeof messageRoleEnum>

export const examStatusEnum = z.enum(['draft', 'ready', 'completed'])
export type ExamStatus = z.infer<typeof examStatusEnum>

export const submissionStatusEnum = z.enum(['scanned', 'grading', 'graded', 'reviewed'])
export type SubmissionStatus = z.infer<typeof submissionStatusEnum>

export const entryTypeEnum = z.enum(['topic', 'assessment', 'revision', 'holiday', 'event'])
export type EntryType = z.infer<typeof entryTypeEnum>

export const assessmentTypeEnum = z.enum(['full_day_exam', 'half_day_exam', 'short_quiz'])
export type AssessmentType = z.infer<typeof assessmentTypeEnum>

export const videoStatusEnum = z.enum(['generating', 'ready', 'failed'])
export type VideoStatus = z.infer<typeof videoStatusEnum>
