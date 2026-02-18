export const THEMES = ['dark', 'light', 'uu'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  dark: 'Mørkt',
  light: 'Lyst',
  uu: 'UU (høykontrast)',
}

export const THEME_ICONS: Record<Theme, string> = {
  dark: '🌙',
  light: '☀️',
  uu: '👁️',
}
