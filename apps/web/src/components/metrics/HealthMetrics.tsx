import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/api'

export function HealthMetrics() {
  const { data } = useQuery({
    queryKey: ['metrics', 'health'],
    queryFn: () => api.metrics.health(),
    refetchInterval: 60_000,
  })

  if (!data) return null

  const leadData = [
    {
      name: 'Lead',
      days: data.averageLeadTimeDays ?? 0,
    },
  ]

  const ratioData = [
    { name: 'Bugs', count: data.bugCount },
    { name: 'Features', count: data.featureCount },
  ]

  return (
    <div className="flex items-stretch gap-4 border-b border-[var(--border)] bg-[var(--surface)]/40 px-4 py-2 backdrop-blur-sm">
      <MetricCard
        label="Lead Time médio"
        value={
          data.averageLeadTimeDays != null
            ? `${data.averageLeadTimeDays}d`
            : '—'
        }
        chart={
          <ResponsiveContainer width="100%" height={40}>
            <BarChart data={leadData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="days"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        }
      />
      <MetricCard
        label="Bug / Feature"
        value={
          data.bugFeatureRatio != null
            ? `${data.bugFeatureRatio}`
            : '—'
        }
        sub={`${data.bugCount} bugs · ${data.featureCount} features`}
        chart={
          <ResponsiveContainer width="100%" height={40}>
            <BarChart data={ratioData}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--accent-cyan)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        }
      />
      <MetricCard
        label="Issues"
        value={String(data.issuesTotal)}
        sub={`${data.doneIssues} concluídas`}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  chart,
}: {
  label: string
  value: string
  sub?: string
  chart?: ReactNode
}) {
  return (
    <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <p className="text-lg font-semibold tabular-nums text-[var(--text)]">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
        )}
      </div>
      {chart && <div className="h-10 w-20 shrink-0">{chart}</div>}
    </div>
  )
}
