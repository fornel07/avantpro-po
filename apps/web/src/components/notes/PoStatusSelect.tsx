import { type MouseEvent } from 'react'
import { getPoStatusSelectClass, PO_STATUSES } from '@/lib/poStatus'
import { cn } from '@/lib/utils'

interface PoStatusSelectProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  className?: string
  compact?: boolean
}

export function PoStatusSelect({
  value,
  onChange,
  className,
  compact = true,
}: PoStatusSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value || null
    onChange(next)
  }

  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <select
      value={value ?? ''}
      onChange={handleChange}
      onClick={stop}
      onMouseDown={stop}
      title="Status de produto"
      className={cn(
        'cursor-pointer rounded-lg border outline-none transition-colors focus:ring-2',
        compact ? 'h-7 max-w-[8.5rem] px-1.5 text-[11px]' : 'h-8 px-2 text-xs',
        getPoStatusSelectClass(value),
        className,
      )}
    >
      <option value="">— Produto —</option>
      {PO_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.shortLabel}
        </option>
      ))}
    </select>
  )
}
