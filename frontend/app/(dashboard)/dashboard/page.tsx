import { MessageSquare, MessageCircle, Clock, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelativeTime, getInitials, logTypeLabel } from '@/lib/utils'
import type { Conversation, LogEvent, Alert, DailyReport } from '@/lib/types'
import Link from 'next/link'
import { AlertsWidget } from '@/components/dashboard/AlertsWidget'
import { DailyReportWidget } from '@/components/dashboard/DailyReportWidget'

const API = process.env.BACKEND_URL || 'http://backend:8000'

async function getStats() {
  try {
    const res = await fetch(`${API}/api/dashboard`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return { activeConversations: 0, waitingHuman: 0, messagesToday: 0, recentErrors: 0, whatsappStatus: 'pending' }
  }
}

async function getRecentConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API}/api/conversations?limit=4`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return []
  }
}

async function getRecentLogs(): Promise<LogEvent[]> {
  try {
    const res = await fetch(`${API}/api/logs?limit=5`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return []
  }
}

async function getPendingAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API}/api/alerts?status=pending&limit=10`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return []
  }
}

async function getDailyReport(): Promise<DailyReport | null> {
  try {
    const res = await fetch(`${API}/api/daily-report/latest`, { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const [stats, conversations, logs, alerts, report] = await Promise.all([
    getStats(),
    getRecentConversations(),
    getRecentLogs(),
    getPendingAlerts(),
    getDailyReport(),
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Panel de Control — Hermes Agencia de Viajes" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="Conversaciones activas"
            value={stats.activeConversations}
            icon={MessageSquare}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <MetricCard
            title="Mensajes hoy"
            value={stats.messagesToday}
            icon={MessageCircle}
            iconColor="text-blue-600"
            iconBg="bg-blue-100"
          />
          <MetricCard
            title="Esperando humano"
            value={stats.waitingHuman}
            icon={Clock}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
            subtitle={stats.waitingHuman > 0 ? 'Requieren atención' : undefined}
            alert={stats.waitingHuman > 0}
          />
          <MetricCard
            title="Errores recientes"
            value={stats.recentErrors}
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBg="bg-red-100"
            subtitle={stats.recentErrors > 0 ? 'Requieren revisión' : undefined}
            alert={stats.recentErrors > 0}
          />
        </div>

        {/* Alerts + Daily report row */}
        <div className="grid grid-cols-2 gap-6">
          <AlertsWidget initialAlerts={alerts} />
          <DailyReportWidget report={report} />
        </div>

        {/* Conversations + Integrations row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent conversations */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Conversaciones recientes</h2>
              <Link href="/inbox" className="text-xs text-green-600 hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {conversations.length === 0 ? (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin conversaciones todavía</p>
              ) : conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href="/inbox"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold flex-shrink-0">
                    {getInitials(conv.customer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.customer_name}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.last_message_preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatRelativeTime(conv.last_message_at)}</p>
                    <StatusBadge status={conv.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Integrations status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Integraciones</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${stats.whatsappStatus === 'connected' ? 'bg-green-50' : 'bg-gray-50'}`}>
                    📱
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">WhatsApp Meta</p>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${stats.whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                      <p className={`text-xs ${stats.whatsappStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {stats.whatsappStatus === 'connected' ? 'Conectado' : 'Pendiente de configurar'}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href="/whatsapp" className="text-xs text-gray-400 hover:text-gray-600">Config →</Link>
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-base">📊</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Google Sheets</p>
                    <p className="text-xs text-gray-400">Próximamente</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-base">📁</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Google Drive</p>
                    <p className="text-xs text-gray-400">Próximamente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Actividad reciente</h2>
            <Link href="/logs" className="text-xs text-green-600 hover:underline">Ver todos los logs →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Fecha y hora</th>
                  <th className="text-left px-4 py-3 font-medium">Evento</th>
                  <th className="text-left px-4 py-3 font-medium">Origen</th>
                  <th className="text-left px-4 py-3 font-medium">Detalle</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Sin actividad reciente</td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
                      {logTypeLabel[log.type] || log.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-gray-500">{log.origin}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.detail ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.status === 'success' ? 'Exitoso' : log.status === 'warning' ? 'Aviso' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
