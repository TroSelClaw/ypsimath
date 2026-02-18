/**
 * Norwegian number and date formatting utilities.
 */

const numberFormatter = new Intl.NumberFormat('nb-NO', {
  maximumFractionDigits: 10,
})

const percentFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

export function formatPercent(n: number): string {
  return percentFormatter.format(n)
}

export function formatDate(d: Date): string {
  return dateFormatter.format(d)
}

export function formatDateTime(d: Date): string {
  return dateTimeFormatter.format(d)
}

export function formatRelativeTime(d: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'akkurat nå'
  if (diffMin < 60) return `${diffMin} min siden`
  if (diffHours < 24) return `${diffHours} t siden`
  if (diffDays < 7) return `${diffDays} d siden`
  return formatDate(d)
}
