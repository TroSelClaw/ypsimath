import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'

type HealthStat = {
  label: string
  value: string
  description: string
}

function formatMs(ms: number) {
  return `${Math.round(ms)} ms`
}

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now()
  const data = await fn()
  return { data, durationMs: performance.now() - start }
}

async function getHealthData() {
  const supabase = createAdminClient()
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const dbPing = await timed(async () => {
    const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1)
    if (error) throw error
  })

  const [activeUsers, errorRate, apiSamples] = await Promise.all([
    timed(async () => {
      const { count, error } = await supabase
        .from('activity_log')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)

      if (error) throw error
      return count ?? 0
    }),
    timed(async () => {
      const { count: total, error: totalError } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)

      if (totalError) throw totalError

      const { count: failed, error: failedError } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('activity_type', 'error')
        .gte('created_at', sinceIso)

      if (failedError) throw failedError
      return { total: total ?? 0, failed: failed ?? 0 }
    }),
    Promise.all([
      timed(async () => {
        const { error } = await supabase.from('content_elements').select('id', { head: true, count: 'exact' }).limit(1)
        if (error) throw error
      }),
      timed(async () => {
        const { error } = await supabase.from('messages').select('id', { head: true, count: 'exact' }).limit(1)
        if (error) throw error
      }),
      timed(async () => {
        const { error } = await supabase.from('exam_submissions').select('id', { head: true, count: 'exact' }).limit(1)
        if (error) throw error
      }),
    ]),
  ])

  const errorRatePercent =
    errorRate.data.total > 0 ? ((errorRate.data.failed / errorRate.data.total) * 100).toFixed(2) : '0.00'
  const averageApiMs = apiSamples.reduce((sum, sample) => sum + sample.durationMs, 0) / apiSamples.length

  const stats: HealthStat[] = [
    {
      label: 'DB-status',
      value: `OK (${formatMs(dbPing.durationMs)})`,
      description: 'Round-trip mot Supabase',
    },
    {
      label: 'API-responstid (snitt)',
      value: formatMs(averageApiMs),
      description: 'Tre representative backend-spørringer',
    },
    {
      label: 'Feilrate siste 24t',
      value: `${errorRatePercent}%`,
      description: `${errorRate.data.failed} feil-hendelser av ${errorRate.data.total} logger`,
    },
    {
      label: 'Aktive brukere siste 24t',
      value: String(activeUsers.data),
      description: 'Unike aktivitetslogger i activity_log',
    },
  ]

  return {
    stats,
    generatedAt: new Date().toISOString(),
  }
}

export default async function AdminHealthPage() {
  await requireRole(['admin'])

  const health = await getHealthData()

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Helse og observability</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot av drift siste 24 timer. Oppdatert: {new Date(health.generatedAt).toLocaleString('nb-NO')}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {health.stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
