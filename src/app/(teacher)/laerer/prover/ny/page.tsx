import { ExamConfigForm } from '@/components/exams/exam-config-form'

export default function NewExamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ny prøve</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Konfigurer parametere og la AI generere oppgaver.
        </p>
      </div>
      <ExamConfigForm />
    </div>
  )
}
