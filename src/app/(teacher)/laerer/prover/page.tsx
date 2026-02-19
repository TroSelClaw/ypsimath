import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ExamRow = {
  id: string
  title: string
  status: 'draft' | 'ready' | 'completed'
  created_at: string
  subject_id: string
  subjects: Array<{
    name: string
  }> | null
}

type SubmissionAggregate = {
  exam_id: string
  total_submissions: number
  graded_submissions: number
  average_score: number | null
}

const STATUS_LABEL: Record<ExamRow['status'], string> = {
  draft: 'Kladd',
  ready: 'Klar',
  completed: 'Fullført',
}

const STATUS_VARIANT: Record<ExamRow['status'], 'secondary' | 'default' | 'outline'> = {
  draft: 'secondary',
  ready: 'default',
  completed: 'outline',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nb-NO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatPercent(value: number | null) {
  if (value === null) return '—'
  return `${Math.round(value)}%`
}

function actionsForExam(exam: ExamRow) {
  if (exam.status === 'draft') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/laerer/prover/${exam.id}`}>Rediger</Link>
      </Button>
    )
  }

  if (exam.status === 'ready') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/api/exams/${exam.id}/pdf?type=exam`}>Last ned PDF</Link>
      </Button>
    )
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/laerer/prover/${exam.id}/resultater`}>Se resultater</Link>
    </Button>
  )
}

export default async function TeacherExamsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: exams, error } = await supabase
    .from('exams')
    .select('id, title, status, created_at, subject_id, subjects(name)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const typedExams = (exams ?? []) as ExamRow[]

  const aggregatesByExam = new Map<string, SubmissionAggregate>()

  if (typedExams.length > 0) {
    const { data: aggregates } = await supabase
      .from('exam_submissions')
      .select('exam_id, status, total_score_percent')
      .in(
        'exam_id',
        typedExams.map((exam) => exam.id),
      )

    const grouped = new Map<string, { total: number; graded: number; scores: number[] }>()

    for (const row of aggregates ?? []) {
      const current = grouped.get(row.exam_id) ?? { total: 0, graded: 0, scores: [] }
      current.total += 1

      if (row.status === 'graded' || row.status === 'reviewed') {
        current.graded += 1
      }

      if (row.total_score_percent !== null) {
        current.scores.push(Number(row.total_score_percent))
      }

      grouped.set(row.exam_id, current)
    }

    for (const [examId, value] of grouped.entries()) {
      const average =
        value.scores.length > 0
          ? value.scores.reduce((sum, score) => sum + score, 0) / value.scores.length
          : null

      aggregatesByExam.set(examId, {
        exam_id: examId,
        total_submissions: value.total,
        graded_submissions: value.graded,
        average_score: average,
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Prøver</h1>
          <p className="mt-1 text-sm text-muted-foreground">Administrer prøver for klassene dine.</p>
        </div>

        <Button asChild>
          <Link href="/laerer/prover/ny">Ny prøve</Link>
        </Button>
      </header>

      {typedExams.length === 0 ? (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-medium">Ingen prøver ennå</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lag din første prøve og få rask tilgang til redigering, PDF-eksport og resultater.
          </p>
          <Button asChild className="mt-4">
            <Link href="/laerer/prover/ny">Opprett ny prøve</Link>
          </Button>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/30 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Tittel</th>
                  <th className="px-4 py-3 font-medium">Fag</th>
                  <th className="px-4 py-3 font-medium">Opprettet</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Vurdert</th>
                  <th className="px-4 py-3 font-medium">Snitt</th>
                  <th className="px-4 py-3 font-medium text-right">Handling</th>
                </tr>
              </thead>
              <tbody>
                {typedExams.map((exam) => {
                  const aggregate = aggregatesByExam.get(exam.id)
                  const gradedCount = aggregate?.graded_submissions ?? 0
                  const totalCount = aggregate?.total_submissions ?? 0

                  return (
                    <tr key={exam.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{exam.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {exam.subjects?.[0]?.name ?? exam.subject_id.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(exam.created_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[exam.status]}>{STATUS_LABEL[exam.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{`${gradedCount}/${totalCount}`}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatPercent(aggregate?.average_score ?? null)}
                      </td>
                      <td className="px-4 py-3 text-right">{actionsForExam(exam)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
