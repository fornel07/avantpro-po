import { io, type Socket } from 'socket.io-client'

export type RealtimeEventType =
  | 'issue.updated'
  | 'issue.created'
  | 'issue.deleted'
  | 'sync.completed'
  | 'connection.status'

export interface RealtimeEnvelope<T = unknown> {
  type: RealtimeEventType
  payload: T
  timestamp: string
}

function resolveWsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL?.trim()
  // Prefer same-origin so Vite can proxy /socket.io → API (dev).
  if (!configured) {
    return window.location.origin
  }
  return configured
}

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(resolveWsUrl(), {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
