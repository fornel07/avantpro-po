import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHoursFromSeconds(seconds: number | null | undefined): string {
  if (seconds == null || seconds === 0) return '—'
  const hours = seconds / 3600
  return hours < 1 ? `${Math.round(seconds / 60)}m` : `${hours.toFixed(1)}h`
}

export function getSubtaskCount(subtasks: unknown): number {
  if (Array.isArray(subtasks)) return subtasks.length
  return 0
}

export type KanbanColumn = 'triagem' | 'desenvolvimento' | 'validacao'

export function getKanbanColumn(issue: {
  status?: string | null
  statusCategory?: string | null
}): KanbanColumn {
  const status = (issue.status ?? '').toLowerCase()
  const category = (issue.statusCategory ?? '').toLowerCase()

  if (
    category === 'new' ||
    category === 'to do' ||
    status.includes('triagem') ||
    status.includes('backlog') ||
    status.includes('to do') ||
    status.includes('open') ||
    status.includes('aberto') ||
    status.includes('pendente')
  ) {
    return 'triagem'
  }

  if (
    category === 'indeterminate' ||
    category === 'in progress' ||
    status.includes('desenvolv') ||
    status.includes('progress') ||
    status.includes('doing') ||
    status.includes('andamento') ||
    status.includes('em curso')
  ) {
    return 'desenvolvimento'
  }

  return 'validacao'
}

export const PRIORITY_CYCLE = [
  'Highest',
  'High',
  'Medium',
  'Low',
  'Lowest',
] as const

export function nextPriority(current: string | null | undefined): string {
  const idx = PRIORITY_CYCLE.findIndex(
    (p) => p.toLowerCase() === (current ?? '').toLowerCase(),
  )
  if (idx === -1) return PRIORITY_CYCLE[2]
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]
}
