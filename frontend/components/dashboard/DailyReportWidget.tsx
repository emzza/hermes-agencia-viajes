'use client'

import { useState } from 'react'
import { BrainCircuit, Loader2, RefreshCw } from 'lucide-react'
import type { DailyReport } from '@/lib/types'

const API_BASE = ''

interface Props {
  report: DailyReport | null
}

export function DailyReportWidget({ report: initialReport }: Props) {
  const [report, setReport] = useState<DailyReport | null>(initialReport)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch(`${API_BASE}/api/crm-analyst/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generá el reporte diario completo para el ${today}. Incluí: resumen ejecutivo, consultas activas, tareas pendientes, embudo de ventas y recomendaciones para hoy.`,
          session_id: `daily-report-${today}`,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      const content = data.content || ''
      if (content) {
        const saveRes = await fetch(`${API_BASE}/api/daily-report/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_date: today, content }),
        })
        if (saveRes.ok) {
          setReport(await saveRes.json())
        } else {
          setReport({ id: 'local', report_date: today, content, created_at: new Date().toISOString() })
        }
        setExpanded(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const isToday = report?.report_date === today

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900">Reporte diario</h2>
          {report && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isToday ? 'Hoy' : report.report_date}
            </span>
          )}
        </div>
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors">
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {generating ? 'Generando...' : report ? 'Actualizar' : 'Generar'}
        </button>
      </div>
      <div className="flex-1 p-4">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {!report && !generating && !error && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400 mb-3">No hay reporte para hoy todavía.</p>
            <button onClick={handleGenerate} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Generar reporte ahora →</button>
          </div>
        )}
        {generating && (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Analizando datos...
          </div>
        )}
        {report && !generating && (
          <div>
            <div className={`overflow-hidden transition-all ${expanded ? '' : 'max-h-36'}`}>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{report.content}</pre>
            </div>
            {(report.content?.length ?? 0) > 300 && (
              <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                {expanded ? 'Ver menos ↑' : 'Ver completo ↓'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
