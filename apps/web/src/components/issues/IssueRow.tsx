import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'
import type { Issue } from '@/lib/api'
import {
  cn,
  formatHoursFromSeconds,
  getSubtaskCount,
} from '@/lib/utils'
import { PoNoteStick, type PoNoteSavePayload } from '../notes/PoNoteStick'
import { PoStatusSelect } from '../notes/PoStatusSelect'
import { Badge, priorityVariant, typeVariant } from '../ui/badge'

interface IssueRowProps {
  issue: Issue
  selected?: boolean
  flashing?: boolean
  triageMode?: boolean
  noteContent?: string | null
  noteColor?: string
  poStatus?: string | null
  onNoteSave?: (payload: PoNoteSavePayload) => void
  onClick: () => void
}

export function IssueRow({
  issue,
  selected,
  flashing,
  triageMode,
  noteContent,
  noteColor,
  poStatus,
  onNoteSave,
  onClick,
}: IssueRowProps) {
  const updated = issue.jiraUpdatedAt ?? issue.updatedAt

  const savePayload = (patch: Partial<PoNoteSavePayload>) => {
    if (!onNoteSave) return
    onNoteSave({
      content: patch.content ?? noteContent ?? '',
      poStatus: patch.poStatus !== undefined ? patch.poStatus : (poStatus ?? null),
    })
  }

  return (
    <tr
      onClick={onClick}
      className={cn(
        'group cursor-pointer border-b border-[var(--border)] transition-all duration-300',
        'hover:bg-[var(--row-hover)]',
        selected && 'bg-[var(--primary)]/8 ring-1 ring-inset ring-[var(--primary)]/30',
        triageMode && selected && 'focus-within:ring-2 focus-within:ring-[var(--primary)]',
        flashing && 'animate-flash',
      )}
    >
      <td
        className="whitespace-nowrap px-3 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <a
            href={issue.browseUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex min-w-[4.5rem] items-center gap-1 font-mono text-xs text-[var(--primary)] hover:underline"
          >
            {issue.jiraKey}
            <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </a>
          {onNoteSave ? (
            <PoStatusSelect
              value={poStatus}
              onChange={(next) => savePayload({ poStatus: next })}
            />
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-2" onClick={(e) => e.stopPropagation()}>
        {onNoteSave ? (
          <PoNoteStick
            compact
            content={noteContent}
            poStatus={poStatus}
            color={noteColor}
            onSave={onNoteSave}
          />
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        )}
      </td>
      <td className="max-w-xs truncate px-3 py-2 text-sm text-[var(--text)]">
        {issue.summary}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <Badge variant={typeVariant(issue.issueType)}>
          {issue.issueType ?? '—'}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <Badge variant={priorityVariant(issue.priority)}>
          {issue.priority ?? '—'}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--text-muted)]">
        {issue.status ?? '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--text-muted)]">
        {issue.sprint ?? '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--text-muted)]">
        {issue.assignee ?? '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-[var(--text-muted)]">
        {issue.storyPoints ?? '—'}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-[var(--text-muted)]">
        {formatHoursFromSeconds(issue.originalEstimateSeconds)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums text-[var(--text-muted)]">
        {getSubtaskCount(issue.subtasks)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--text-muted)]">
        {updated
          ? formatDistanceToNow(new Date(updated), {
              addSuffix: true,
              locale: ptBR,
            })
          : '—'}
      </td>
    </tr>
  )
}
