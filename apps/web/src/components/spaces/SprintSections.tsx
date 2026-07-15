import type { Issue } from '@/lib/api'
import { cn } from '@/lib/utils'
import { IssueList } from '../issues/IssueList'
import type { PoNoteSavePayload } from '../notes/PoNoteStick'

const NO_SPRINT = 'Sem sprint'

interface SprintSectionsProps {
  issues: Issue[]
  sprintOrder?: string[]
  sortDir?: 'asc' | 'desc'
  selectedKey: string | null
  flashingKeys: Set<string>
  triageMode: boolean
  onSelect: (key: string) => void
  onOpen: (key: string) => void
  onSaveNote?: (jiraKey: string, payload: PoNoteSavePayload) => void
}

function groupBySprint(issues: Issue[]): Map<string, Issue[]> {
  const groups = new Map<string, Issue[]>()
  for (const issue of issues) {
    const sprint = issue.sprint?.trim() || NO_SPRINT
    const list = groups.get(sprint) ?? []
    list.push(issue)
    groups.set(sprint, list)
  }
  return groups
}

function orderSprints(
  groups: Map<string, Issue[]>,
  _sprintOrder: string[] = [],
  sortDir: 'asc' | 'desc' = 'desc',
): string[] {
  const cmp = (a: string, b: string) =>
    sortDir === 'asc'
      ? a.localeCompare(b, 'pt-BR')
      : b.localeCompare(a, 'pt-BR')

  const named = [...groups.keys()]
    .filter((name) => name !== NO_SPRINT)
    .sort(cmp)

  if (groups.has(NO_SPRINT)) {
    named.push(NO_SPRINT)
  }

  return named
}

export function SprintSections({
  issues,
  sprintOrder,
  sortDir = 'desc',
  selectedKey,
  flashingKeys,
  triageMode,
  onSelect,
  onOpen,
  onSaveNote,
}: SprintSectionsProps) {
  if (issues.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        Nenhuma issue encontrada para os filtros atuais.
      </div>
    )
  }

  const groups = groupBySprint(issues)
  const sprints = orderSprints(groups, sprintOrder, sortDir)

  return (
    <div className="space-y-6">
      {sprints.map((sprint) => {
        const sprintIssues = groups.get(sprint) ?? []
        const isNoSprint = sprint === NO_SPRINT

        return (
          <section key={sprint} className="overflow-hidden">
            <div
              className={cn(
                'mb-3 flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3',
                'bg-[var(--surface)]/80 backdrop-blur-sm',
                isNoSprint && 'border-dashed opacity-90',
              )}
            >
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                {sprint}
              </h2>
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                {sprintIssues.length}
              </span>
            </div>
            <IssueList
              issues={sprintIssues}
              selectedKey={selectedKey}
              flashingKeys={flashingKeys}
              triageMode={triageMode}
              onSelect={onSelect}
              onOpen={onOpen}
              onSaveNote={onSaveNote}
            />
          </section>
        )
      })}
    </div>
  )
}
