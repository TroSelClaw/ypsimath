import Link from 'next/link'
import { TeacherNotes } from '@/components/dashboard/teacher-notes'

type TimelineEntry = {
  id: string
  activityType: string
  topic: string | null
  createdAt: string
}

type ExamEntry = {
  submissionId: string
  examId: string
  title: string
  createdAt: string
  scorePercent: number | null
}

type StudentDetailProps = {
  className: string
  student: {
    id: string
    name: string
    email: string
    currentSubject: string
    goals: { target_grade?: number; focus_areas?: string }
    learningStylePrefs: Record<string, unknown>
    masteredGoals: string[]
    strugglingGoals: string[]
    totalExercisesCompleted: number
    totalTimeSpentMinutes: number
  }
  timeline: TimelineEntry[]
  exams: ExamEntry[]
  chatSummary: {
    conversations: number
    messagesThisWeek: number
  }
  initialTeacherNote: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function activityLabel(activityType: string) {
  const labels: Record<string, string> = {
    wiki_view: 'Wiki-visning',
    exercise_attempt: 'Øvingsforsøk',
    chat_message: 'Chat-melding',
    exam_graded: 'Prøve vurdert',
    video_watched: 'Video sett',
    flashcard_session: 'Flashcard-økt',
  }

  return labels[activityType] ?? activityType
}

export function StudentDetail({ className, student, timeline, exams, chatSummary, initialTeacherNote }: StudentDetailProps) {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/laerer" className="hover:underline">Klasse</Link>
        <span className="mx-2">→</span>
        <span className="font-medium text-foreground">{student.name}</span>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Elevdetalj</h1>
        <p className="text-sm text-muted-foreground">
          {className} · {student.email}
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Elevprofil</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-muted-foreground">Fag</dt><dd className="font-medium uppercase">{student.currentSubject}</dd></div>
          <div><dt className="text-muted-foreground">Målkarakter</dt><dd className="font-medium">{student.goals.target_grade ?? '—'}</dd></div>
          <div><dt className="text-muted-foreground">Øvinger fullført</dt><dd className="font-medium">{student.totalExercisesCompleted}</dd></div>
          <div><dt className="text-muted-foreground">Tid brukt</dt><dd className="font-medium">{student.totalTimeSpentMinutes} min</dd></div>
        </dl>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Mestrede mål ({student.masteredGoals.length})</h3>
            <p className="mt-1 text-sm text-muted-foreground">{student.masteredGoals.length ? student.masteredGoals.join(', ') : 'Ingen ennå'}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Utfordringsmål ({student.strugglingGoals.length})</h3>
            <p className="mt-1 text-sm text-muted-foreground">{student.strugglingGoals.length ? student.strugglingGoals.join(', ') : 'Ingen registrert'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Mål/fokus</h3>
            <p className="mt-1 text-sm text-muted-foreground">{student.goals.focus_areas?.trim() || 'Ikke satt'}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Læringsstil</h3>
            <p className="mt-1 text-sm text-muted-foreground">{Object.keys(student.learningStylePrefs).length ? JSON.stringify(student.learningStylePrefs) : 'Ingen preferanser registrert'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Aktivitet siste 30 dager</h2>
        {timeline.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {timeline.map((entry) => (
              <li key={entry.id} className="rounded-md border border-border/70 px-3 py-2">
                <p className="font-medium">{activityLabel(entry.activityType)}</p>
                <p className="text-muted-foreground">{formatDate(entry.createdAt)}{entry.topic ? ` · ${entry.topic}` : ''}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Ingen aktivitet registrert siste 30 dager.</p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Prøveresultater</h2>
        {exams.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {exams.map((exam) => (
              <li key={exam.submissionId} className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-muted-foreground">{formatDate(exam.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">{exam.scorePercent == null ? '—' : `${exam.scorePercent}%`}</p>
                  <Link href={`/laerer/prover/${exam.examId}/resultater?submission=${exam.submissionId}`} className="text-sm underline underline-offset-4">Se detalj</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Ingen prøver registrert ennå.</p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <h2 className="text-lg font-semibold">Chat-bruk</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Samtaler</dt><dd className="text-xl font-semibold">{chatSummary.conversations}</dd></div>
          <div><dt className="text-muted-foreground">Meldinger siste uke</dt><dd className="text-xl font-semibold">{chatSummary.messagesThisWeek}</dd></div>
        </dl>
      </section>

      <TeacherNotes studentId={student.id} initialContent={initialTeacherNote} />
    </div>
  )
}
