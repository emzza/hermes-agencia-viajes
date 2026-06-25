'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { logTypeLabel } from '@/lib/utils'
import type { LogEvent } from '@/lib/types'

const API = ''

const ORIGIN_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'IA', value: 'agent' },
  { label: 'Humano', value: 'human' },
  { label: 'Sistema', value: 'system' },
  { label: 'Errores', value: '_errors' },
]

export default function LogsPage() {
  const [originFilter, setOriginFilter] = useState('all')
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (originFilter === '_errors') params.set('status', 'error')
    else if (originFilter !== 'all') params.set('origin', originFilter)

    setLoading(true)
    fetch(`${API}/api/logs?${params}`)
      .then((r) => r.ok ? r.json() : [])
      .catch(() => [])
      .then((data) => { setLogs(data); setLoading(false) })
  }, [originFilter])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Logs y Eventos" subtitle="Registro de actividad del sistema" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2 mb-4">
          {ORIGIN_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setOriginFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                originFilter === f.value ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 flex items-center">
            {loading ? 'Cargando...' : `${logs.length} eventos`}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Fecha y hora</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Origen</th>
                <th className="text-left px-4 py-3 font-medium">Detalle</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Cargando...</td></tr>}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Sin logs para este filtro</td></tr>
              )}
              {logs.map((log) => <LogRow key={log.id} log={log} />)}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {loading ? 'Cargando eventos...' : `Mostrando ${logs.length} eventos`}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogRow({ log }: { log: LogEvent }) {
  const originColors: Record<string, string> = {
    whatsapp: 'bg-green-100 text-green-700',
    agent: 'bg-purple-100 text-purple-700',
    human: 'bg-blue-100 text-blue-700',
    system: 'bg-gray-100 text-gray-600',
  }
  const statusColors: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  }
  const statusLabels: Record<string, string> = { success: 'Exitoso', warning: 'Aviso', error: 'Error' }
  const originLabels: Record<string, string> = { whatsapp: 'WhatsApp', agent: 'IA', human: 'Humano', system: 'Sistema' }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
        {new Date(log.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </td>
      <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">
        {logTypeLabel[log.type] || log.type}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${originColors[log.origin] ?? 'bg-gray-100 text-gray-600'}`}>
          {originLabels[log.origin] || log.origin}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-sm">
        <span className="truncate block">{log.detail ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[log.status] ?? ''}`}>
          {statusLabels[log.status] || log.status}
        </span>
      </td>
    </tr>
  )
}
