import { requireRole } from '@/lib/auth/get-profile'
import { AppShell } from '@/components/app-shell'

const ADMIN_NAV = [
  { label: 'Oversikt', href: '/laerer', icon: '📊' },
  { label: 'Prøver', href: '/laerer/prover', icon: '📝' },
  { label: 'Semesterplan', href: '/laerer/semesterplan', icon: '📅' },
  { label: 'Elever', href: '/laerer/elever', icon: '👥' },
  { label: 'Innhold', href: '/admin/innhold', icon: '📚' },
  { label: 'Brukere', href: '/admin/brukere', icon: '⚙️' },
  { label: 'Helse', href: '/admin/helse', icon: '🩺' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['admin'])

  return (
    <AppShell profile={profile} navItems={ADMIN_NAV}>
      {children}
    </AppShell>
  )
}
