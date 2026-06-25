'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import type { Lead, LeadStatus } from '@/lib/types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Borrador', value: 'draft' },
  { label: 'Cotizado', value: 'cotizado' },
  { label: 'Confirmado', value: 'confirmado' },
  { label: 'Cancelado', value: 'cancelado' },
]

const STATUS_COLORS: Record<LeadStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  cotizado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  draft: 'Borrador',
  cotizado: 'Cotizado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

export default function PresupuestosPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(() => {
    const params = new URLSearchParams({ limit: '200' })
    if (statusFilter !== 'all') params.set('status', statusFilter)
    setLoading(true)
    fetch(`${API}/api/leads?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((data) => { setLeads(data); setLoading(false) })
  }, [statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const updateStatus = async (id: string, status: LeadStatus) => {
    await fetch(`${API}/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
  }

  const totalCotizado = leads
    .filter((l) => l.status === 'cotizado' || l.status === 'confirmado')
    .reduce((sum, l) => sum + (l.total_usd ?? 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Presupuestos" subtitle="Leads capturados por el agente de viajes" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total leads" value={leads.length} />
          <SummaryCard label="Cotizados" value={leads.filter((l) => l.status === 'cotizado').length} color="blue" />
          <SummaryCard label="Confirmados" value={leads.filter((l) => l.status === 'confirmado').length} color="green" />
          <SummaryCard label="Pipeline (USD)" value={`$${totalCotizado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`} color="green" />
        </div>

        <div className="flex gap-2 mb-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 flex items-center">
            {loading ? 'Cargando...' : `${leads.length} leads`}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Destino</th>
                <th className="text-left px-4 py-3 font-medium">Viaje</th>
                <th className="text-left px-4 py-3 font-medium">Pasajeros</th>
                <th className="text-right px-4 py-3 font-medium">Presupuesto</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Cargando...</td></tr>}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Sin presupuestos todavía. El agente los registrará automáticamente.</td></tr>
              )}
              {leads.map((lead) => <LeadRow key={lead.id} lead={lead} onStatusChange={updateStatus} />)}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {loading ? 'Cargando...' : `${leads.length} leads registrados`}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color = 'gray' }: { label: string; value: number | string; color?: 'gray' | 'blue' | 'green' }) {
  const colors = { gray: 'text-gray-900', blue: 'text-blue-700', green: 'text-green-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colors[color]}`}>{value}</p>
    </div>
  )
}

function LeadRow({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, status: LeadStatus) => void }) {
  const viajeInfo = [lead.fecha_inicio, lead.noches ? `${lead.noches}n` : null].filter(Boolean).join(' · ')
  const origen = lead.origen ? `${lead.origen} → ` : ''

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3">
        <p className="font-medium text-gray-800 text-sm">{lead.nombre}</p>
        <p className="text-xs text-gray-400">{lead.telefono}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <span className="text-gray-400 text-xs">{origen}</span>{lead.destino}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        <p>{viajeInfo || '—'}</p>
        {lead.tipo_viaje && <p className="text-gray-400">{lead.tipo_viaje}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-center">{lead.pasajeros ?? '—'}</td>
      <td className="px-4 py-3 text-right">
        {lead.total_usd ? (
          <div>
            <p className="font-semibold text-gray-800 text-sm">USD {lead.total_usd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            {lead.precio_base_usd && <p className="text-xs text-gray-400">base: USD {lead.precio_base_usd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin cotizar</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:ring-1 focus:ring-green-400 ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
        {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </td>
    </tr>
  )
}
