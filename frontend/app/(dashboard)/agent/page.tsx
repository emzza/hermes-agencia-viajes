'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Send, Bot, User, Loader2, WifiOff, Plus, Trash2, MessageSquare } from 'lucide-react'

const API = ''
const CHATS_KEY = 'hermes_agent_chats_v1'

interface StoredMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
}

interface Message extends Omit<StoredMessage, 'timestamp'> {
  timestamp: Date
}

interface ChatSession {
  id: string
  name: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
}

function loadChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChats(chats: ChatSession[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

function createSession(): ChatSession {
  return {
    id: `hermes-${Date.now()}`,
    name: 'Nueva conversación',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function toMessage(m: StoredMessage): Message {
  return { ...m, timestamp: new Date(m.timestamp) }
}

function toStored(m: Message): StoredMessage {
  return { ...m, timestamp: m.timestamp.toISOString() }
}

function AgentStatusBadge({ online }: { online: boolean | null }) {
  if (online === null) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
      online ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-red-400'}`} />
      {online ? 'Hermes activo' : 'Agente offline'}
    </span>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
        isUser ? 'bg-gray-200' : 'bg-green-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-green-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-xs text-gray-400">
          {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onDelete,
}: {
  chats: ChatSession[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {chats.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8 px-4">Sin conversaciones todavía</p>
        )}
        {chats.map((chat) => {
          const date = new Date(chat.updatedAt)
          const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
          const active = chat.id === activeChatId
          return (
            <div
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={`group relative flex items-start gap-2.5 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors ${
                active ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${active ? 'text-green-700' : 'text-gray-700'}`}>
                  {chat.name}
                </p>
                <p className="text-xs text-gray-400">{dateStr} · {chat.messages.length} msgs</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(chat.id) }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 rounded hover:text-red-500 text-gray-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default function AgentChatPage() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const stored = loadChats()
    setChats(stored)
    if (stored.length > 0) setActiveChatId(stored[0].id)
  }, [])

  useEffect(() => {
    fetch(`${API}/api/agent/status`)
      .then((r) => r.json())
      .then((d) => setAgentOnline(d.online))
      .catch(() => setAgentOnline(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChatId, chats, loading])

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null
  const activeMessages: Message[] = activeChat?.messages.map(toMessage) ?? []

  const updateChats = useCallback((updated: ChatSession[]) => {
    setChats(updated)
    saveChats(updated)
  }, [])

  function newChat() {
    const session = createSession()
    const updated = [session, ...chats]
    updateChats(updated)
    setActiveChatId(session.id)
    setInput('')
    inputRef.current?.focus()
  }

  function selectChat(id: string) {
    setActiveChatId(id)
    setInput('')
  }

  function deleteChat(id: string) {
    const updated = chats.filter((c) => c.id !== id)
    updateChats(updated)
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading || !activeChatId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    const updatedChats = chats.map((c) => {
      if (c.id !== activeChatId) return c
      const isFirst = c.messages.length === 0
      return {
        ...c,
        name: isFirst ? text.slice(0, 38) + (text.length > 38 ? '…' : '') : c.name,
        messages: [...c.messages, toStored(userMsg)],
        updatedAt: new Date().toISOString(),
      }
    })
    updateChats(updatedChats)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: activeChatId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error del servidor')

      const agentMsg: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: data.content,
        timestamp: new Date(),
      }
      setChats((prev) => {
        const next = prev.map((c) =>
          c.id !== activeChatId ? c : {
            ...c,
            messages: [...c.messages, toStored(agentMsg)],
            updatedAt: new Date().toISOString(),
          }
        )
        saveChats(next)
        return next
      })
      setAgentOnline(true)
    } catch (err: unknown) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: `Error: ${err instanceof Error ? err.message : 'No se pudo conectar al agente.'}`,
        timestamp: new Date(),
      }
      setChats((prev) => {
        const next = prev.map((c) =>
          c.id !== activeChatId ? c : {
            ...c,
            messages: [...c.messages, toStored(errMsg)],
            updatedAt: new Date().toISOString(),
          }
        )
        saveChats(next)
        return next
      })
      setAgentOnline(false)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Chat con el Agente"
        subtitle="Probá el agente Hermes directamente desde el panel"
        actions={<AgentStatusBadge online={agentOnline} />}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelect={selectChat}
          onNew={newChat}
          onDelete={deleteChat}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {!activeChat && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Creá un nuevo chat para empezar</p>
                <button
                  onClick={newChat}
                  className="mt-1 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo chat
                </button>
              </div>
            )}

            {activeChat && activeMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Hablale al agente Hermes</p>
                <p className="text-xs text-gray-400">Simulá ser un cliente y probá cómo responde el agente</p>
                {agentOnline === false && (
                  <div className="flex items-center gap-2 mt-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <WifiOff className="w-4 h-4 flex-shrink-0" />
                    <span>Agente offline. Verificá que el backend esté corriendo.</span>
                  </div>
                )}
              </div>
            )}

            {activeMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {activeChat && (
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribí un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                  rows={1}
                  className="flex-1 resize-none px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 placeholder-gray-400 max-h-32 overflow-y-auto"
                  style={{ minHeight: '42px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 pl-1">
                Sesión: <span className="font-mono">{activeChatId}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
