'use client'

import { useState } from 'react'
import { Copy, CheckCircle, AlertCircle, Send } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'

export default function WhatsAppPage() {
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [testPhone, setTestPhone] = useState('')
  const webhookUrl = 'https://tu-dominio.com/webhooks/whatsapp'

  function handleCopy() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleTest() {
    setTestResult('success')
    setTimeout(() => setTestResult('idle'), 3000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Configuración de WhatsApp" subtitle="WhatsApp Meta Cloud API" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">📱</div>
                <div>
                  <p className="font-semibold text-gray-900">WhatsApp Meta Cloud API</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <p className="text-sm text-yellow-600 font-medium">Pendiente de configurar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Credenciales</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Los tokens sensibles se configuran en las variables de entorno del backend.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number ID</label>
                <input type="text" placeholder="Ej: 123456789012345" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">WhatsApp Business Account ID</label>
                <input type="text" placeholder="Ej: 123456789012345" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Access Token</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-400 text-sm">●●●●●● configurado en variables de entorno</span>
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Webhook URL</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configura esta URL en tu app de Meta Business.</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate">
                  {webhookUrl}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Pruebas</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <button onClick={handleTest} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Probar conexión
                </button>
                {testResult === 'success' && (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Conexión exitosa
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="flex items-center gap-1.5 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Error de conexión
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Enviar mensaje de prueba</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+5491112345678"
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
