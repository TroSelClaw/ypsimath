import { PracticeExam } from '@/components/exams/practice-exam'

export default function PracticeExamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Øvingsprøve</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generer en egen prøve fra valgte kompetansemål.
        </p>
      </div>
      <PracticeExam />
    </div>
  )
}
