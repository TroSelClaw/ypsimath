import { requireRole } from '@/lib/auth/get-profile'
import { AppShell } from '@/components/app-shell'

const STUDENT_NAV = [
  { label: 'Wiki', href: '/wiki', icon: '📖' },
  { label: 'Chat', href: '/chat', icon: '💬' },
  { label: 'Fremgang', href: '/fremgang', icon: '🪐' },
  { label: 'Flashcards', href: '/flashcards', icon: '🗂️' },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['student'])

  return (
    <AppShell profile={profile} navItems={STUDENT_NAV}>
      {children}
    </AppShell>
  )
}
