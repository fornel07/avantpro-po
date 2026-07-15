import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { getSocket, type RealtimeEnvelope } from '@/lib/socket'

export type RealtimeEventType =
  | 'issue.updated'
  | 'issue.created'
  | 'issue.deleted'
  | 'sync.completed'
  | 'connection.status'

interface UseRealtimeOptions {
  onIssueUpdated?: (key: string) => void
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const [redisOk, setRedisOk] = useState(false)
  const [apiOk, setApiOk] = useState(false)

  const handleEnvelope = useCallback(
    (envelope: RealtimeEnvelope) => {
      const { type, payload } = envelope

      if (type === 'connection.status') {
        const p = payload as { connected?: boolean; redis?: boolean }
        setConnected(!!p.connected)
        setRedisOk(!!p.redis)
        return
      }

      if (type === 'issue.created' || type === 'issue.updated' || type === 'issue.deleted') {
        void queryClient.invalidateQueries({ queryKey: ['issues'] })
        void queryClient.invalidateQueries({ queryKey: ['metrics'] })

        if (type === 'issue.updated') {
          const p = payload as { jiraKey?: string; key?: string }
          const key = p.jiraKey ?? p.key
          if (key) options.onIssueUpdated?.(key)
        }
        return
      }

      if (type === 'sync.completed') {
        void queryClient.invalidateQueries({ queryKey: ['issues'] })
        void queryClient.invalidateQueries({ queryKey: ['boards'] })
        void queryClient.invalidateQueries({ queryKey: ['spaces'] })
        void queryClient.invalidateQueries({ queryKey: ['metrics'] })
      }
    },
    [queryClient, options],
  )

  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onError = () => setConnected(false)

    const handlers: Array<[RealtimeEventType, (e: RealtimeEnvelope) => void]> = [
      ['issue.created', handleEnvelope],
      ['issue.updated', handleEnvelope],
      ['issue.deleted', handleEnvelope],
      ['sync.completed', handleEnvelope],
      ['connection.status', handleEnvelope],
    ]

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onError)
    for (const [event, handler] of handlers) {
      socket.on(event, handler)
    }

    if (!socket.connected) socket.connect()
    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onError)
      for (const [event, handler] of handlers) {
        socket.off(event, handler)
      }
    }
  }, [handleEnvelope])

  // Fallback heartbeat: API up counts as "live" when webhook isn't available.
  useEffect(() => {
    let cancelled = false

    const ping = async () => {
      try {
        const health = await fetch('/api/health').then(async (r) => {
          if (!r.ok) throw new Error('health failed')
          return r.json() as Promise<{ ok?: boolean; redisConnected?: boolean }>
        })
        if (!cancelled) {
          setApiOk(!!health.ok)
          if (typeof health.redisConnected === 'boolean') {
            setRedisOk(health.redisConnected)
          }
        }
      } catch {
        if (!cancelled) setApiOk(false)
      }
    }

    void ping()
    const id = window.setInterval(ping, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  // Live = websocket connected OR API healthy (cron sync mode).
  return { connected: connected || apiOk, redisOk, socketConnected: connected, apiOk }
}
