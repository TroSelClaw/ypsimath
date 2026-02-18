import { requireRole } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { SemesterPlanWizard } from '@/components/semester/wizard-steps/semester-plan-wizard'

type TeacherClass = {
  id: string
  name: string
  subject_id: string
  school_year: string
}

export default async function NewSemesterPlanPage() {
  const profile = await requireRole(['teacher', 'admin'])
  const supabase = await createClient()

  const query = supabase.from('classes').select('id, name, subject_id, school_year').order('name')
  const { data: classes } =
    profile.role === 'admin' ? await query : await query.eq('teacher_id', profile.id)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ny semesterplan</h1>
        <p className="text-sm text-muted-foreground">Sett opp datoer, ukerytme, vurderinger og emnerekkefølge.</p>
      </div>
      <SemesterPlanWizard classes={(classes ?? []) as TeacherClass[]} />
    </div>
  )
}
