import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IssueQuery } from '@/lib/api'

export type FilterChipField =
  | 'type'
  | 'priority'
  | 'status'
  | 'sprint'
  | 'assignee'
  | 'projectKey'

export interface FilterChip {
  field: FilterChipField
  value: string
}

const FIELD_LABELS: Record<FilterChipField, string> = {
  type: 'Tipo',
  priority: 'Prioridade',
  status: 'Status',
  sprint: 'Sprint',
  assignee: 'Assignee',
  projectKey: 'Espaço',
}

export function getFieldLabel(field: FilterChipField): string {
  return FIELD_LABELS[field]
}

/** Collapse chips into query params (comma-separated for multiple values). */
export function chipsToQuery(chips: FilterChip[]): IssueQuery {
  const grouped = new Map<FilterChipField, string[]>()
  for (const chip of chips) {
    const list = grouped.get(chip.field) ?? []
    if (!list.some((v) => v.toLowerCase() === chip.value.toLowerCase())) {
      list.push(chip.value)
    }
    grouped.set(chip.field, list)
  }

  const query: IssueQuery = {}
  for (const [field, values] of grouped) {
    query[field] = values.join(',')
  }
  return query
}

export function queryToChips(query: Record<string, unknown>): FilterChip[] {
  const chips: FilterChip[] = []
  const fields: FilterChipField[] = [
    'type',
    'priority',
    'status',
    'sprint',
    'assignee',
    'projectKey',
  ]
  for (const field of fields) {
    const value = query[field]
    if (typeof value === 'string' && value.trim()) {
      for (const part of value.split(',').map((v) => v.trim()).filter(Boolean)) {
        chips.push({ field, value: part })
      }
    }
  }
  return chips
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function useIssueFilters(options?: {
  initialProjectKey?: string
  /** Global dashboard — always Bug/Melhoria across spaces */
  overview?: boolean
}) {
  const overview = options?.overview ?? false
  const [chips, setChips] = useState<FilterChip[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [projectKey, setProjectKey] = useState<string | undefined>(
    options?.initialProjectKey,
  )

  const addChip = useCallback((field: FilterChipField, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setChips((prev) => {
      const exists = prev.some(
        (c) =>
          c.field === field && c.value.toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return prev
      return [...prev, { field, value: trimmed }]
    })
  }, [])

  const removeChip = useCallback(
    (field: FilterChipField, value?: string) => {
      setChips((prev) =>
        prev.filter((c) => {
          if (c.field !== field) return true
          if (value == null) return false
          return c.value.toLowerCase() !== value.toLowerCase()
        }),
      )
    },
    [],
  )

  const clearChips = useCallback(() => {
    setChips([])
    if (overview) setProjectKey(undefined)
  }, [overview])

  const loadFromQuery = useCallback(
    (query: Record<string, unknown>) => {
      setChips(queryToChips(query))
      if (typeof query.q === 'string') setSearch(query.q)
      if (typeof query.projectKey === 'string') {
        setProjectKey(query.projectKey.split(',')[0]?.trim() || undefined)
      } else if (overview) {
        setProjectKey(undefined)
      }
    },
    [overview],
  )

  const issueQuery = useMemo<IssueQuery>(() => {
    const base = chipsToQuery(chips)

    if (overview) {
      base.sustentacao = true
      // Keep projetKey from chips (possibly comma-separated); don't force single route key
      if (!base.projectKey && projectKey) {
        base.projectKey = projectKey
      }
    } else if (projectKey) {
      base.projectKey = projectKey
      base.sustentacao = projectKey.toUpperCase() !== 'IDEIA'
    }

    if (debouncedSearch.trim()) base.q = debouncedSearch.trim()
    return base
  }, [chips, projectKey, debouncedSearch, overview])

  return {
    chips,
    search,
    projectKey,
    issueQuery,
    setSearch,
    setProjectKey,
    addChip,
    removeChip,
    clearChips,
    loadFromQuery,
  }
}
