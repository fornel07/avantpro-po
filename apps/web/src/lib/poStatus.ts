export const PO_STATUSES = [
  {
    value: 'devolvido_dev',
    label: 'Devolvido para Dev',
    shortLabel: 'Devolvido',
    variant: 'danger' as const,
    selectClass:
      'border-red-500/40 bg-red-500/15 text-red-400 focus:ring-red-500/30',
  },
  {
    value: 'aguardando_dev',
    label: 'Aguardando Dev',
    shortLabel: 'Aguardando',
    variant: 'warning' as const,
    selectClass:
      'border-amber-500/40 bg-amber-500/15 text-amber-400 focus:ring-amber-500/30',
  },
  {
    value: 'homologacao',
    label: 'Homologação',
    shortLabel: 'Homologação',
    variant: 'accent' as const,
    selectClass:
      'border-cyan-500/40 bg-cyan-500/15 text-cyan-400 focus:ring-cyan-500/30',
  },
  {
    value: 'concluido',
    label: 'Concluído',
    shortLabel: 'Concluído',
    variant: 'success' as const,
    selectClass:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 focus:ring-emerald-500/30',
  },
] as const

export type PoStatusValue = (typeof PO_STATUSES)[number]['value']

const EMPTY_SELECT_CLASS =
  'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] focus:ring-[var(--primary)]/30'

export function getPoStatusMeta(value: string | null | undefined) {
  if (!value) return null
  return PO_STATUSES.find((s) => s.value === value) ?? null
}

export function getPoStatusSelectClass(value: string | null | undefined) {
  return getPoStatusMeta(value)?.selectClass ?? EMPTY_SELECT_CLASS
}
