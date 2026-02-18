import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { SemesterPlanEditor } from '@/components/semester/semester-plan-editor'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SemesterPlanDetailPage({ params }: PageProps) {
  const profile = await requireRole(['teacher', 'admin'])
  const { id } = await params
  const supabase = await createClient()

  const { data: plan, error: planError } = await supabase
    .from('semester_plans')
    .select('id, class_id, version, classes!inner(id, name, teacher_id)')
    .eq('id', id)
    .single()

  if (planError || !plan) notFound()

  const classRows = plan.classes as Array<{ name: string; teacher_id: string }>
  const classRow = classRows[0]
  if (!classRow) notFound()

  if (profile.role === 'teacher' && classRow.teacher_id !== profile.id) {
    notFound()
  }

  const { data: entries, error: entriesError } = await supabase
    .from('semester_plan_entries')
    .select('id, date, entry_type, topic, title, sort_order')
    .eq('semester_plan_id', id)
    .order('date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (entriesError) notFound()

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Semesterplan: {classRow.name}</h1>
        <p className="text-sm text-muted-foreground">
          Dra temaer mellom datoer, bruk chatfeltet for raske flytt, og lagre versjoner underveis.
        </p>
      </header>

      <SemesterPlanEditor
        planId={id}
        initialEntries={(entries ?? []).map((entry) => ({
          id: entry.id,
          date: entry.date,
          entryType: entry.entry_type,
          topic: entry.topic,
          title: entry.title,
          sortOrder: entry.sort_order,
        }))}
      />
    </main>
  )
}
