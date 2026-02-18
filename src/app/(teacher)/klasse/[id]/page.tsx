import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/get-profile'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddStudentForm } from './add-student-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params
  await requireRole(['teacher', 'admin'])
  const supabase = await createClient()

  const { data: classData } = await supabase
    .from('classes')
    .select('id, name, subject_id, school_year')
    .eq('id', id)
    .single()

  if (!classData) notFound()

  const { data: members } = await supabase
    .from('class_memberships')
    .select('student_id, enrolled_at, profiles(display_name, email)')
    .eq('class_id', id)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{classData.name}</h1>
        <div className="flex gap-2 mt-1">
          <Badge variant="secondary">{classData.subject_id.toUpperCase()}</Badge>
          <Badge variant="outline">{classData.school_year}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elever ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <ul className="space-y-2">
              {members.map((m) => {
                const p = m.profiles as unknown as { display_name: string; email: string }
                return (
                  <li key={m.student_id} className="flex items-center justify-between text-sm">
                    <span>{p?.display_name ?? 'Ukjent'}</span>
                    <span className="text-muted-foreground">{p?.email}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Ingen elever ennå.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legg til elev</CardTitle>
        </CardHeader>
        <CardContent>
          <AddStudentForm classId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
