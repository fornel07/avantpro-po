import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import {
  getFieldLabel,
  type FilterChip,
  type FilterChipField,
} from '@/hooks/useIssueFilters'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const DEFAULT_FIELDS: FilterChipField[] = [
  'type',
  'priority',
  'status',
  'sprint',
  'assignee',
]

interface QueryBuilderProps {
  chips: FilterChip[]
  onAddChip: (field: FilterChipField, value: string) => void
  onRemoveChip: (field: FilterChipField, value?: string) => void
  onSaveFilter?: (name: string) => void
  fields?: FilterChipField[]
  /** Optional suggestions per field (e.g. space keys) */
  suggestions?: Partial<Record<FilterChipField, string[]>>
  search?: string
  onSearchChange?: (value: string) => void
  quickFilters?: Array<{ label: string; field: FilterChipField; value: string }>
  /** Start expanded; default collapsed to keep list visible */
  defaultExpanded?: boolean
}

export function QueryBuilder({
  chips,
  onAddChip,
  onRemoveChip,
  onSaveFilter,
  fields = DEFAULT_FIELDS,
  suggestions,
  search,
  onSearchChange,
  quickFilters,
  defaultExpanded = false,
}: QueryBuilderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeField, setActiveField] = useState<FilterChipField>(fields[0] ?? 'type')
  const [inputValue, setInputValue] = useState('')
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)

  const fieldSuggestions = suggestions?.[activeField] ?? []

  const handleAdd = (value = inputValue) => {
    if (!value.trim()) return
    onAddChip(activeField, value)
    setInputValue('')
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-2 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange != null && (
          <div className="relative min-w-[12rem] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar chave ou resumo…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        )}

        {quickFilters && quickFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {quickFilters.map((qf) => {
              const active = chips.some(
                (c) =>
                  c.field === qf.field &&
                  c.value.toLowerCase() === qf.value.toLowerCase(),
              )
              return (
                <button
                  key={`${qf.field}:${qf.value}`}
                  type="button"
                  onClick={() => {
                    if (active) onRemoveChip(qf.field, qf.value)
                    else onAddChip(qf.field, qf.value)
                  }}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--primary)] text-white'
                      : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {qf.label}
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          aria-expanded={expanded}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filtros
          {chips.length > 0 && (
            <span className="rounded bg-[var(--primary)]/15 px-1.5 py-px text-[10px] text-[var(--primary)]">
              {chips.length}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={`${chip.field}:${chip.value}`}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] text-[var(--primary)]"
            >
              <span className="font-medium">{getFieldLabel(chip.field)}:</span>
              {chip.value}
              <button
                type="button"
                onClick={() => onRemoveChip(chip.field, chip.value)}
                className="rounded p-0.5 hover:bg-[var(--primary)]/20"
                aria-label={`Remover ${chip.field} ${chip.value}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              Adicionar (AND):
            </span>
            {fields.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setActiveField(field)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  activeField === field
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {getFieldLabel(field)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fieldSuggestions.length > 0 ? (
              <select
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="h-8 max-w-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              >
                <option value="">
                  Selecionar {getFieldLabel(activeField).toLowerCase()}…
                </option>
                {fieldSuggestions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`Valor para ${getFieldLabel(activeField)}…`}
                className="h-8 max-w-xs"
              />
            )}
            <Button size="sm" className="h-8" onClick={() => handleAdd()}>
              Adicionar
            </Button>
            {onSaveFilter && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setShowSave((s) => !s)}
              >
                Salvar filtro
              </Button>
            )}
          </div>

          {showSave && onSaveFilter && (
            <div className="flex items-center gap-2">
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Nome do filtro…"
                className="h-8 max-w-xs"
              />
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  if (saveName.trim()) {
                    onSaveFilter(saveName.trim())
                    setSaveName('')
                    setShowSave(false)
                  }
                }}
              >
                Confirmar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
