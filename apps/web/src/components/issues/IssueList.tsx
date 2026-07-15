import type { Issue } from '@/lib/api'
import type { PoNoteSavePayload } from '../notes/PoNoteStick'
import { IssueRow } from './IssueRow'

interface IssueListProps {
  issues: Issue[]
  selectedKey: string | null
  flashingKeys: Set<string>
  triageMode: boolean
  onSelect: (key: string) => void
  onOpen: (key: string) => void
  onSaveNote?: (jiraKey: string, payload: PoNoteSavePayload) => void
}

export function IssueList({
  issues,
  selectedKey,
  flashingKeys,
  triageMode,
  onSelect,
  onOpen,
  onSaveNote,
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
        Nenhuma issue encontrada para os filtros atuais.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <th className="px-3 py-2.5">Chave · Produto</th>
              <th className="px-3 py-2.5">Nota</th>
              <th className="px-3 py-2.5">Resumo</th>
              <th className="px-3 py-2.5">Tipo</th>
              <th className="px-3 py-2.5">Prioridade</th>
              <th className="px-3 py-2.5">Status Jira</th>
              <th className="px-3 py-2.5">Sprint</th>
              <th className="px-3 py-2.5">Assignee</th>
              <th className="px-3 py-2.5 text-right">SP</th>
              <th className="px-3 py-2.5 text-right">Estimativa</th>
              <th className="px-3 py-2.5 text-right">Subtasks</th>
              <th className="px-3 py-2.5">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <IssueRow
                key={issue.jiraKey}
                issue={issue}
                selected={selectedKey === issue.jiraKey}
                flashing={flashingKeys.has(issue.jiraKey)}
                triageMode={triageMode}
                noteContent={issue.poNote?.content}
                noteColor={issue.poNote?.color}
                poStatus={issue.poNote?.poStatus}
                onNoteSave={
                  onSaveNote
                    ? (payload) => onSaveNote(issue.jiraKey, payload)
                    : undefined
                }
                onClick={() => {
                  onSelect(issue.jiraKey)
                  if (!triageMode) onOpen(issue.jiraKey)
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
