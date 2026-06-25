'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Plug,
  FileText,
  Settings,
  Bot,
  ChevronLeft,
  BotMessageSquare,
  ClipboardList,
  BrainCircuit,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/agent', label: 'Chat Agente', icon: BotMessageSquare },
  { href: '/crm-analyst', label: 'Analista CRM', icon: BrainCircuit },
  { href: '/presupuestos', label: 'Presupuestos', icon: ClipboardList },
  { href: '/whatsapp', label: 'WhatsApp', icon: Plug },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/integrations', label: 'Integraciones', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/alerts?status=pending&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setAlertCount(Array.isArray(data) ? data.length : 0)
        }
      } catch { /* no-op */ }
    }
    fetchAlerts()
    const t = setInterval(fetchAlerts, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-white transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-gray-900 text-sm">Hermes</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const badge = href === '/dashboard' && alertCount > 0 ? alertCount : null
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-green-600' : '')} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== null && (
                    <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && badge !== null && (
                <span className="absolute ml-6 -mt-4 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Agent status + collapse */}
      <div className="border-t border-gray-100 p-3">
        {!collapsed && (
          <div className="flex items-start gap-2 px-2 py-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs font-medium text-green-700">Agente activo</p>
              <p className="text-xs text-gray-400 leading-tight">Atendiendo consultas</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform', collapsed ? 'rotate-180' : '')}
          />
          {!collapsed && 'Contraer'}
        </button>
      </div>
    </aside>
  )
}
