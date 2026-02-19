import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const routeFiles = [
  'src/app/api/activity/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/exams/[id]/pdf/route.ts',
  'src/app/api/exams/[id]/practice-submit/route.ts',
  'src/app/api/exams/generate/route.ts',
  'src/app/api/exams/grade/route.ts',
  'src/app/api/exercise/image-check/route.ts',
  'src/app/api/profile/recommendations/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/teacher/assessment-report/route.ts',
  'src/app/api/video/[id]/url/route.ts',
]

function hasAuthGuard(source: string) {
  return (
    source.includes('requireApiUser(') ||
    source.includes('supabase.auth.getUser(') ||
    source.includes('getProfile(')
  )
}

describe('API auth contract', () => {
  it.each(routeFiles)('%s has explicit auth guard', (filePath) => {
    const source = readFileSync(resolve(process.cwd(), filePath), 'utf8')
    expect(hasAuthGuard(source)).toBe(true)
  })
})
