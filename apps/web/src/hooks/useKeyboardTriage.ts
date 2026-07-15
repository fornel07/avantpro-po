import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { nextPriority } from '@/lib/utils'

interface UseKeyboardTriageOptions {
  enabled: boolean
  issueKeys: string[]
  selectedKey: string | null
  onSelect: (key: string) => void
  onOpen: (key: string) => void
  onClose: () => void
}

export function useKeyboardTriage({
  enabled,
  issueKeys,
  selectedKey,
  onSelect,
  onOpen,
  onClose,
}: UseKeyboardTriageOptions) {
  const keysRef = useRef(issueKeys)
  keysRef.current = issueKeys

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const keys = keysRef.current
      if (keys.length === 0) return

      const currentIdx = selectedKey ? keys.indexOf(selectedKey) : -1

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = currentIdx < keys.length - 1 ? currentIdx + 1 : 0
        onSelect(keys[next])
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = currentIdx > 0 ? currentIdx - 1 : keys.length - 1
        onSelect(keys[prev])
        return
      }

      if (e.key === 'Enter' && selectedKey) {
        e.preventDefault()
        onOpen(selectedKey)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if ((e.key === 'p' || e.key === 'P') && selectedKey) {
        e.preventDefault()
        void (async () => {
          try {
            const issue = await api.issues.get(selectedKey)
            const newPriority = nextPriority(issue.priority)
            await api.issues.triage(selectedKey, { priority: newPriority })
          } catch {
            // silent fail for keyboard shortcut
          }
        })()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, selectedKey, onSelect, onOpen, onClose])
}
