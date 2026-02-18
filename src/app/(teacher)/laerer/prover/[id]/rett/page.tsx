import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ScanUploader } from '@/components/exams/scan-uploader'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExamGradingPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!exam) return notFound()

  // Get class students for the teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id)

  const classIds = (classes ?? []).map((c) => c.id)

  let students: Array<{ id: string; display_name: string; email: string }> = []
  if (classIds.length > 0) {
    const { data: memberships } = await supabase
      .from('class_memberships')
      .select('student_id')
      .in('class_id', classIds)

    const studentIds = [...new Set((memberships ?? []).map((m) => m.student_id))]
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', studentIds)
      students = (profiles ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name ?? p.email ?? 'Ukjent',
        email: p.email ?? '',
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rett prøve: {exam.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last opp skannet PDF og tildel sider til elever.
        </p>
      </div>
      <ScanUploader examId={exam.id} students={students} />
    </div>
  )
}
