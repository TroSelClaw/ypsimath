import { requireRole } from '@/lib/auth/get-profile'
import { AppShell } from '@/components/app-shell'

const TEACHER_NAV = [
  { label: 'Oversikt', href: '/laerer', icon: '📊' },
  { label: 'Prøver', href: '/laerer/prover', icon: '📝' },
  { label: 'Semesterplan', href: '/laerer/semesterplan', icon: '📅' },
  { label: 'Elever', href: '/laerer/elever', icon: '👥' },
  { label: 'Innhold', href: '/laerer/innhold', icon: '📚' },
]

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['teacher', 'admin'])

  return (
    <AppShell profile={profile} navItems={TEACHER_NAV}>
      {children}
    </AppShell>
  )
}
