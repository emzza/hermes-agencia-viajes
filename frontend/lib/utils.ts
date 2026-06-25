import type { ConversationStatus } from './types'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const statusLabel: Record<ConversationStatus, string> = {
  ia_activa: 'IA Activa',
  humano_activo: 'Humano',
  esperando_humano: 'Esperando',
  cerrada: 'Cerrada',
}

export const statusColor: Record<ConversationStatus, string> = {
  ia_activa: 'bg-green-100 text-green-700 border-green-200',
  humano_activo: 'bg-blue-100 text-blue-700 border-blue-200',
  esperando_humano: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cerrada: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const logTypeLabel: Record<string, string> = {
  'webhook.received': 'Webhook recibido',
  'webhook.duplicated': 'Webhook duplicado',
  'message.inbound': 'Mensaje entrante',
  'message.outbound': 'Mensaje saliente',
  'agent.response': 'Respuesta IA',
  'agent.skipped': 'IA omitida',
  'handoff.started': 'Handoff iniciado',
  'handoff.released': 'Devuelto a IA',
  'ai.paused': 'IA pausada',
  'ai.activated': 'IA activada',
  'whatsapp.error': 'Error WhatsApp',
  'status.changed': 'Estado cambiado',
  'mark.read': 'Marcado leído',
}
