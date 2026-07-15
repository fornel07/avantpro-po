import type { FlattenedField } from '@/lib/api'

function formatValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    return value
      .map((v) => {
        if (typeof v === 'string') return v
        if (v && typeof v === 'object' && 'name' in v) return String((v as { name: string }).name)
        if (v && typeof v === 'object' && 'displayName' in v)
          return String((v as { displayName: string }).displayName)
        return JSON.stringify(v)
      })
      .join(', ')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('displayName' in obj) return String(obj.displayName)
    if ('name' in obj) return String(obj.name)
    if ('value' in obj) return String(obj.value)
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

interface FieldRendererProps {
  fields: FlattenedField[]
  compact?: boolean
}

export function FieldRenderer({ fields, compact }: FieldRendererProps) {
  const visible = compact
    ? fields.filter((f) => !f.key.startsWith('customfield_') || f.name)
    : fields

  return (
    <dl className="space-y-3">
      {visible.map((field) => (
        <div
          key={field.key}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/30 px-3 py-2"
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {field.name ?? field.key}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--text)]">
            {formatValue(field.value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
