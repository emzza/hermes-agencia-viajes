'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Send, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

const API_BASE = ''

const ALERT_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  follow_up_overdue: { label: 'Seguimiento vencido', icon: '⏰', color: 'border-l-orange-400 bg-orange-50' },
  rate_expiring:     { label: 'Tarifa por vencer',   icon: '⚡', color: 'border-l-red-400 bg-red-50' },
}

interface Props {
  initialAlerts: Alert[]
}

export function AlertsWidget({ initialAlerts }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function handleDismiss(id: string) {
    setLoading((p) => ({ ...p, [id]: true }))
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/dismiss`, { method: 'POST' })
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch { /* no-op */ } finally {
      setLoading((p) => ({ ...p, [id]: false }))
    }
  }

  async function handleFollowup(id: string) {
    setLoading((p) => ({ ...p, [`fu_${id}`]: true }))
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/send-followup`, { method: 'POST' })
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch { /* no-op */ } finally {
      setLoading((p) => ({ ...p, [`fu_${id}`]: false }))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-900">Alertas pendientes</h2>
          {alerts.length > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        {alerts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Sin alertas pendientes</p>
        )}
        {alerts.map((alert) => {
          const cfg = ALERT_TYPE_LABELS[alert.type] ?? { label: alert.type, icon: '•', color: 'border-l-gray-400 bg-gray-50' }
          const isLoading = loading[alert.id]
          const isFuLoading = loading[`fu_${alert.id}`]
          return (
            <div key={alert.id} className={cn('border border-gray-100 border-l-4 rounded-lg p-3', cfg.color)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs">{cfg.icon}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{alert.title}</p>
                  {alert.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{alert.detail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(alert.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => handleDismiss(alert.id)} disabled={isLoading} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
              </div>
              {alert.type === 'follow_up_overdue' && alert.conversation_id && (
                <button onClick={() => handleFollowup(alert.id)} disabled={isFuLoading} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-200 hover:bg-orange-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                  {isFuLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Enviar seguimiento
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
