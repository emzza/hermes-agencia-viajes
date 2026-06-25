'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Send, Bot, User, AlertCircle, Phone, Loader2,
  CheckCircle2, Clock, MapPin, Users, Calendar, ChevronDown,
} from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { cn, formatRelativeTime, getInitials } from '@/lib/utils'
import type { Conversation, Message, TravelBudget, Task, FunnelStage } from '@/lib/types'

const FUNNEL_CONFIG: Record<string, { label: string; color: string }> = {
  nuevo_lead:             { label: 'Nuevo lead',      color: 'bg-gray-100 text-gray-600' },
  calificando_viaje:      { label: 'Calificando',     color: 'bg-blue-100 text-blue-700' },
  interesado:             { label: 'Interesado',      color: 'bg-indigo-100 text-indigo-700' },
  presupuesto_en_armado:  { label: 'Armando ppto.',   color: 'bg-amber-100 text-amber-700' },
  presupuesto_enviado:    { label: 'Ppto. enviado',   color: 'bg-orange-100 text-orange-700' },
  seguimiento:            { label: 'Seguimiento',     color: 'bg-purple-100 text-purple-700' },
  ajustes_solicitados:    { label: 'Ajustes',         color: 'bg-yellow-100 text-yellow-700' },
  cierre:                 { label: 'Cierre',          color: 'bg-green-100 text-green-700' },
  reservado:              { label: 'Reservado',       color: 'bg-emerald-100 text-emerald-700' },
  vendido:                { label: 'Vendido',         color: 'bg-green-200 text-green-800' },
  pre_viaje:              { label: 'Pre-viaje',       color: 'bg-teal-100 text-teal-700' },
  viajando:               { label: 'Viajando',        color: 'bg-cyan-100 text-cyan-700' },
  post_viaje:             { label: 'Post-viaje',      color: 'bg-sky-100 text-sky-700' },
  perdido:                { label: 'Perdido',         color: 'bg-red-100 text-red-600' },
}

const FUNNEL_STAGES = Object.keys(FUNNEL_CONFIG)

const TASK_TYPE_LABELS: Record<string, string> = {
  follow_up: 'Seguimiento',
  call: 'Llamada',
  send_budget: 'Enviar presupuesto',
  contact: 'Contactar',
  other: 'Otro',
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'IA Activa', value: 'ia_activa' },
  { label: 'Humano', value: 'humano_activo' },
  { label: 'Esperando', value: 'esperando_humano' },
  { label: 'No leídas', value: 'unread' },
  { label: 'Cerradas', value: 'cerrada' },
]

type RightTab = 'control' | 'presupuesto' | 'tareas'

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convMessages, setConvMessages] = useState<Message[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<RightTab>('control')
  const [travelBudget, setTravelBudget] = useState<TravelBudget | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingBudget, setLoadingBudget] = useState(false)
  const [updatingFunnel, setUpdatingFunnel] = useState(false)

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  const fetchConversations = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (filter !== 'all' && filter !== 'unread') params.status = filter
      if (search) params.search = search
      const data = await api.getConversations(params)
      setConversations(filter === 'unread' ? data.filter((c: Conversation) => c.unread_count > 0) : data)
    } catch { /* no-op */ } finally {
      setLoadingConvs(false)
    }
  }, [filter, search])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    try {
      const data = await api.getMessages(convId)
      setConvMessages(data)
    } catch {
      setConvMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  const fetchTravelBudget = useCallback(async (convId: string) => {
    setLoadingBudget(true)
    try {
      const data = await api.getTravelBudget(convId)
      setTravelBudget(data)
    } catch {
      setTravelBudget(null)
    } finally {
      setLoadingBudget(false)
    }
  }, [])

  const fetchTasks = useCallback(async (convId: string) => {
    try {
      const data = await api.getTasks(convId)
      setTasks(data)
    } catch {
      setTasks([])
    }
  }, [])

  useEffect(() => {
    setLoadingConvs(true)
    fetchConversations()
    const t = setInterval(fetchConversations, 5000)
    return () => clearInterval(t)
  }, [fetchConversations])

  useEffect(() => {
    if (!selectedId) { setConvMessages([]); return }
    fetchMessages(selectedId)
    const t = setInterval(() => fetchMessages(selectedId), 4000)
    return () => clearInterval(t)
  }, [selectedId, fetchMessages])

  useEffect(() => {
    if (!selectedId) { setTravelBudget(null); setTasks([]); return }
    fetchTravelBudget(selectedId)
    fetchTasks(selectedId)
  }, [selectedId, fetchTravelBudget, fetchTasks])

  useEffect(() => {
    if (selected) setNotes(selected.internal_notes ?? '')
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages])

  function updateConvLocal(id: string, patch: Partial<Conversation>) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  async function handleSelect(id: string) {
    setSelectedId(id)
    updateConvLocal(id, { unread_count: 0 })
    try { await api.markRead(id) } catch { /* no-op */ }
  }

  async function handleTakeover() {
    if (!selectedId) return
    try { const updated = await api.takeover(selectedId); updateConvLocal(selectedId, updated) } catch { /* no-op */ }
  }

  async function handleReleaseToAI() {
    if (!selectedId) return
    try { const updated = await api.releaseToAI(selectedId); updateConvLocal(selectedId, updated) } catch { /* no-op */ }
  }

  async function handlePauseAI() {
    if (!selectedId) return
    try { const updated = await api.pauseAI(selectedId); updateConvLocal(selectedId, updated) } catch { /* no-op */ }
  }

  async function handleActivateAI() {
    if (!selectedId) return
    try { const updated = await api.activateAI(selectedId); updateConvLocal(selectedId, updated) } catch { /* no-op */ }
  }

  async function handleSend(pauseAI = false) {
    if (!selectedId || !messageText.trim() || sending) return
    setSending(true)
    const text = messageText.trim()
    setMessageText('')
    try {
      await api.sendMessage(selectedId, text, pauseAI)
      await fetchMessages(selectedId)
      updateConvLocal(selectedId, { last_message_preview: text.slice(0, 80), last_message_at: new Date().toISOString() })
    } catch { /* no-op */ } finally {
      setSending(false)
    }
  }

  async function handleSaveNotes() {
    if (!selectedId) return
    try { await api.updateNotes(selectedId, notes); updateConvLocal(selectedId, { internal_notes: notes }) } catch { /* no-op */ }
  }

  async function handleFunnelChange(stage: string) {
    if (!selectedId || updatingFunnel) return
    setUpdatingFunnel(true)
    try {
      await api.updateFunnelStage(selectedId, stage)
      updateConvLocal(selectedId, { funnel_stage: stage as FunnelStage })
    } catch { /* no-op */ } finally {
      setUpdatingFunnel(false)
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await api.updateTask(taskId, { status: 'completada' })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'completada' } : t)))
    } catch { /* no-op */ }
  }

  const pendingTaskCount = tasks.filter((t) => t.status === 'pendiente').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Inbox" subtitle="Centro de conversaciones" />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Conversation list */}
        <div className="w-72 flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-100">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                  filter === f.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs && conversations.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            )}
            {!loadingConvs && conversations.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Sin conversaciones</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                  selectedId === conv.id ? 'bg-green-50 border-l-2 border-l-green-600' : ''
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold flex-shrink-0">
                    {getInitials(conv.customer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.customer_name ?? conv.whatsapp_phone}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatRelativeTime(conv.last_message_at)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message_preview}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={conv.status} />
                        <FunnelBadge stage={conv.funnel_stage} compact />
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER: Chat window */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <InboxIcon className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Seleccioná una conversación</p>
              <p className="text-sm text-gray-400 mt-1">Elegí un chat de la lista para ver los mensajes</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                  {getInitials(selected.customer_name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">
                      {selected.customer_name ?? selected.whatsapp_phone}
                    </p>
                    <StatusBadge status={selected.status} />
                    <FunnelBadge stage={selected.funnel_stage} />
                  </div>
                  <p className="text-xs text-gray-400">{selected.whatsapp_phone}</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">📱 WhatsApp</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {loadingMsgs && convMessages.length === 0 && (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                )}
                {!loadingMsgs && convMessages.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-8">Sin mensajes todavía</p>
                )}
                {convMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                {selected.status === 'cerrada' ? (
                  <div className="flex items-center justify-center py-2 text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                    Conversación cerrada
                  </div>
                ) : selected.status === 'ia_activa' && selected.ai_enabled ? (
                  <>
                    <div className="flex items-start gap-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">La IA está activa. Enviar este mensaje la pausará automáticamente.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(true)}
                        placeholder="Escribe un mensaje (pausará la IA)..."
                        className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        onClick={() => handleSend(true)}
                        disabled={!messageText.trim() || sending}
                        className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Enviar y pausar IA
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!messageText.trim() || sending}
                      className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Tabbed panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-200 flex-shrink-0">
              {(['control', 'presupuesto', 'tareas'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors relative',
                    activeTab === tab ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab === 'control' && 'Control'}
                  {tab === 'presupuesto' && 'Presupuesto'}
                  {tab === 'tareas' && (
                    <span className="flex items-center justify-center gap-1">
                      Tareas
                      {pendingTaskCount > 0 && (
                        <span className="bg-orange-500 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold">
                          {pendingTaskCount}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'control' && (
                <div>
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Control de conversación</p>
                    <div className="flex items-center gap-2 mb-4">
                      <StatusBadge status={selected.status} />
                      {selected.ai_enabled ? (
                        <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">IA ON</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">IA OFF</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selected.status === 'ia_activa' && (
                        <>
                          <button onClick={handleTakeover} className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                            <User className="w-4 h-4" />
                            Tomar control humano
                          </button>
                          {selected.ai_enabled ? (
                            <button onClick={handlePauseAI} className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                              Pausar IA
                            </button>
                          ) : (
                            <button onClick={handleActivateAI} className="w-full py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-colors">
                              Activar IA
                            </button>
                          )}
                        </>
                      )}
                      {selected.status === 'esperando_humano' && (
                        <button onClick={handleTakeover} className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                          <User className="w-4 h-4" />
                          Tomar control humano
                        </button>
                      )}
                      {selected.status === 'humano_activo' && (
                        <button onClick={handleReleaseToAI} className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                          <Bot className="w-4 h-4" />
                          Devolver a IA
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Etapa del embudo</p>
                    <div className="relative">
                      <select
                        value={selected.funnel_stage ?? 'nuevo_lead'}
                        onChange={(e) => handleFunnelChange(e.target.value)}
                        disabled={updatingFunnel}
                        className="w-full appearance-none text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:opacity-60"
                      >
                        {FUNNEL_STAGES.map((stage) => (
                          <option key={stage} value={stage}>{FUNNEL_CONFIG[stage]?.label ?? stage}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {updatingFunnel && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                      </p>
                    )}
                  </div>

                  {(selected.ai_summary || selected.next_action) && (
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resumen IA</p>
                      {selected.ai_summary && <p className="text-sm text-gray-700 leading-relaxed mb-2">{selected.ai_summary}</p>}
                      {selected.next_action && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700">{selected.next_action}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información del cliente</p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{selected.whatsapp_phone}</p>
                      </div>
                      {selected.last_inbound_at && (
                        <div>
                          <p className="text-xs text-gray-400">Último mensaje</p>
                          <p className="text-sm text-gray-700">{formatRelativeTime(selected.last_inbound_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Inicio</p>
                        <p className="text-sm text-gray-700">{new Date(selected.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas internas</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agregar notas sobre este cliente..."
                      rows={4}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    <button onClick={handleSaveNotes} className="mt-2 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                      Guardar notas
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'presupuesto' && <PresupuestoPanel budget={travelBudget} loading={loadingBudget} />}
              {activeTab === 'tareas' && <TareasPanel tasks={tasks} onComplete={handleCompleteTask} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FunnelBadge({ stage, compact = false }: { stage: FunnelStage | string | null | undefined; compact?: boolean }) {
  if (!stage) return null
  const cfg = FUNNEL_CONFIG[stage]
  if (!cfg) return null
  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', cfg.color, compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5')}>
      {cfg.label}
    </span>
  )
}

function PresupuestoPanel({ budget, loading }: { budget: TravelBudget | null; loading: boolean }) {
  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
  if (!budget) return <div className="p-4 text-center text-sm text-gray-400 py-8">Sin ficha de viaje todavía</div>

  const hasData = budget.destination || budget.departure_date || budget.adults

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Estado</p>
        <BudgetStatusBadge status={budget.status} />
      </div>
      {!hasData && <p className="text-sm text-gray-400 text-center py-4">El agente irá completando esta ficha a medida que el cliente dé información.</p>}
      {(budget.destination || budget.origin) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Destino</p>
          {budget.origin && <p className="text-sm text-gray-600"><span className="text-gray-400 text-xs">Origen:</span> {budget.origin}</p>}
          {budget.destination && <p className="text-sm font-medium text-gray-900">{budget.destination}</p>}
        </div>
      )}
      {(budget.departure_date || budget.return_date) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fechas</p>
          <div className="grid grid-cols-2 gap-2">
            {budget.departure_date && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-400">Salida</p><p className="text-sm font-medium text-gray-800">{budget.departure_date}</p></div>}
            {budget.return_date && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-400">Regreso</p><p className="text-sm font-medium text-gray-800">{budget.return_date}</p></div>}
          </div>
        </div>
      )}
      {(budget.adults !== null || budget.children !== null) && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Pasajeros</p>
          <div className="flex gap-3">
            {budget.adults !== null && <span className="text-sm text-gray-700">{budget.adults} adulto{budget.adults !== 1 ? 's' : ''}</span>}
            {budget.children !== null && budget.children > 0 && <span className="text-sm text-gray-700">{budget.children} menor{budget.children !== 1 ? 'es' : ''}</span>}
          </div>
        </div>
      )}
      {budget.estimated_budget && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Presupuesto aprox.</span>
          <span className="text-sm font-semibold text-green-700">{budget.currency ?? 'USD'} {budget.estimated_budget.toLocaleString('es-AR')}</span>
        </div>
      )}
    </div>
  )
}

function BudgetStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sin_datos_suficientes: 'bg-gray-100 text-gray-500',
    listo_para_cotizar: 'bg-blue-100 text-blue-700',
    en_armado: 'bg-amber-100 text-amber-700',
    enviado: 'bg-orange-100 text-orange-700',
    aceptado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-600',
  }
  const labels: Record<string, string> = {
    sin_datos_suficientes: 'Sin datos suficientes',
    listo_para_cotizar: 'Listo para cotizar',
    en_armado: 'En armado',
    enviado: 'Enviado al cliente',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
  }
  return <span className={cn('inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1', map[status] ?? 'bg-gray-100 text-gray-500')}>{labels[status] ?? status}</span>
}

function TareasPanel({ tasks, onComplete }: { tasks: Task[]; onComplete: (id: string) => void }) {
  const pending = tasks.filter((t) => t.status === 'pendiente')
  const done = tasks.filter((t) => t.status !== 'pendiente')
  if (tasks.length === 0) return <div className="p-4 text-center text-sm text-gray-400 py-8">Sin tareas pendientes</div>
  return (
    <div className="p-4 space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pendientes ({pending.length})</p>
          <div className="space-y-2">{pending.map((task) => <TaskCard key={task.id} task={task} onComplete={onComplete} />)}</div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completadas</p>
          <div className="space-y-2 opacity-60">{done.map((task) => <TaskCard key={task.id} task={task} onComplete={onComplete} />)}</div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const isDone = task.status !== 'pendiente'
  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && !isDone
  return (
    <div className={cn('border rounded-lg p-3 transition-colors', isDone ? 'border-gray-100 bg-gray-50' : isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', isDone ? 'text-gray-400 line-through' : 'text-gray-800')}>{task.title}</p>
          {task.type && <p className="text-xs text-gray-400 mt-0.5">{TASK_TYPE_LABELS[task.type] ?? task.type}</p>}
          {task.due_at && (
            <p className={cn('text-xs mt-1 flex items-center gap-1', isOverdue ? 'text-red-600' : 'text-gray-400')}>
              <Clock className="w-3 h-3" />
              {new Date(task.due_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </p>
          )}
        </div>
        {!isDone && (
          <button onClick={() => onComplete(task.id)} className="flex-shrink-0 p-1 text-gray-300 hover:text-green-600 transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </button>
        )}
        {isDone && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isInbound = message.direction === 'inbound'
  const isSystem = message.sender_type === 'system'
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">{message.text}</span>
      </div>
    )
  }
  return (
    <div className={cn('flex', isInbound ? 'justify-start' : 'justify-end')}>
      <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm', getBubbleStyle(message))}>
        {!isInbound && (
          <p className="text-xs font-medium mb-1 opacity-70">{message.sender_type === 'ai' ? '🤖 IA' : '👤 Humano'}</p>
        )}
        {message.message_type !== 'text' ? (
          <div className="flex items-center gap-2 text-gray-500"><AlertCircle className="w-4 h-4" /><span className="text-sm">{message.text}</span></div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        )}
        <p className="text-xs opacity-50 mt-1 text-right">
          {new Date(message.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          {message.status === 'failed' && ' ⚠️'}
        </p>
      </div>
    </div>
  )
}

function getBubbleStyle(msg: Message): string {
  if (msg.status === 'failed') return 'bg-red-50 border border-red-200 text-red-800'
  if (msg.direction === 'inbound') return 'bg-white border border-gray-200 text-gray-900'
  if (msg.sender_type === 'ai') return 'bg-green-50 border border-green-100 text-green-900'
  if (msg.sender_type === 'human') return 'bg-blue-50 border border-blue-100 text-blue-900'
  return 'bg-gray-100 text-gray-600'
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}
