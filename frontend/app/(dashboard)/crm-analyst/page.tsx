'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, BrainCircuit, Loader2, Bot } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  '¿Qué leads necesitan atención hoy?',
  '¿Cuál es el estado del embudo de ventas?',
  '¿Hay tareas vencidas?',
  'Generá el reporte diario completo',
  '¿Cuánto pipeline tenemos activo?',
  '¿Qué alertas están pendientes?',
]

export default function CrmAnalystPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [sessionId] = useState(() => `crm-analyst-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/agent/status`)
        if (res.ok) {
          const data = await res.json()
          if (!data.online) {
            setAgentError('Backend no disponible. Verificá que el servicio esté corriendo.')
          }
        }
      } catch { /* no-op */ }
    }
    checkStatus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/crm-analyst/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sessionId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }])
      setAgentError(null)
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Analista CRM"
        subtitle="Consultá el estado de tu pipeline, leads y seguimientos"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Quick prompts sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col p-4 gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Consultas rápidas</p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <p className="text-xs font-semibold text-indigo-700">HermesCRMAnalyst</p>
            </div>
            <p className="text-xs text-indigo-600 leading-relaxed">
              Analiza tu CRM en tiempo real. No interactúa con clientes.
            </p>
            {agentError ? (
              <p className="text-xs text-red-600 mt-2 leading-relaxed">{agentError}</p>
            ) : (
              <div className="flex items-center gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-xs text-green-700">Listo</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                  <BrainCircuit className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-gray-600 font-medium text-lg">Analista CRM listo</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  Preguntame sobre el estado de tu pipeline, leads calientes, tareas vencidas o pedí el reporte diario.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-700" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                )}>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-2">
                  <Bot className="w-3.5 h-3.5 text-indigo-700" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-sm text-gray-400">Analizando datos del CRM...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Consultá el estado del CRM..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
