import { z } from 'zod/v4'
import { roleEnum } from './enums'

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  display_name: z.string().min(1).max(100),
  role: roleEnum,
  auth_provider: z.string().default('email'),
  provider_user_id: z.string().nullable().optional(),
  school_org_id: z.string().nullable().optional(),
  settings: z
    .object({
      theme: z.enum(['dark', 'light', 'uu']).default('dark'),
      requires_parental_consent: z.boolean().default(false),
    })
    .optional(),
  created_at: z.string().datetime().optional(),
})
export type Profile = z.infer<typeof profileSchema>

export const studentProfileSchema = z.object({
  id: z.string().uuid(),
  current_subject: z.string().default('r1'),
  goals: z
    .object({
      target_grade: z.number().int().min(1).max(6).optional(),
      focus_areas: z.string().optional(),
    })
    .optional(),
  learning_style_prefs: z.record(z.string(), z.unknown()).optional(),
  mastered_competency_goals: z.array(z.string()).default([]),
  struggling_competency_goals: z.array(z.string()).default([]),
  total_exercises_completed: z.number().int().default(0),
  total_time_spent_minutes: z.number().int().default(0),
})
export type StudentProfile = z.infer<typeof studentProfileSchema>

export const classSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  subject_id: z.string(),
  teacher_id: z.string().uuid(),
  school_year: z.string().regex(/^\d{4}-\d{4}$/),
  created_at: z.string().datetime().optional(),
})
export type Class = z.infer<typeof classSchema>

// Input schemas for forms
export const registerInputSchema = z
  .object({
    email: z.email('Ugyldig e-postadresse.'),
    password: z.string().min(8, 'Passordet må være minst 8 tegn.'),
    confirmPassword: z.string(),
    display_name: z.string().min(1, 'Navn er påkrevd.').max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passordene er ikke like.',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  email: z.email('Ugyldig e-postadresse.'),
  password: z.string().min(1, 'Passord er påkrevd.'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const createClassInputSchema = z.object({
  name: z.string().min(1, 'Klassenavn er påkrevd.').max(100),
  subject_id: z.string().min(1),
  school_year: z.string().regex(/^\d{4}-\d{4}$/, 'Ugyldig format. Bruk f.eks. 2026-2027.'),
})
export type CreateClassInput = z.infer<typeof createClassInputSchema>
