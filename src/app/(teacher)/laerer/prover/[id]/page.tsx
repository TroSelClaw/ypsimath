import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExamPreview } from '@/components/exams/exam-preview'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExamPreviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!exam) return notFound()

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', id)
    .order('part', { ascending: true })
    .order('question_number', { ascending: true })

  return (
    <ExamPreview
      exam={exam}
      initialQuestions={questions ?? []}
    />
  )
}
