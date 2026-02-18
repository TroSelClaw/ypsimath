import {
  BookOpen,
  MessageCircle,
  LayoutDashboard,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Show in mobile bottom nav (max 5) */
  mobile: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, mobile: true },
  { label: 'Wiki', href: '/wiki', icon: BookOpen, mobile: true },
  { label: 'Chat', href: '/chat', icon: MessageCircle, mobile: true },
  { label: 'Prøver', href: '/exams', icon: FileText, mobile: true },
  { label: 'Innstillinger', href: '/settings', icon: Settings, mobile: false },
]
