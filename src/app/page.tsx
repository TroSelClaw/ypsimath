import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'

export default async function Home() {
  const profile = await getProfile()

  const homeMap: Record<string, string> = {
    student: '/wiki',
    teacher: '/laerer',
    admin: '/admin/innhold',
  }

  redirect(homeMap[profile.role] ?? '/wiki')
}
