import { Topbar } from '@/components/layout/Topbar'
import Link from 'next/link'

const integrations = [
  {
    name: 'WhatsApp Meta',
    icon: '📱',
    description: 'Recibí y enviá mensajes de WhatsApp. Webhook activo.',
    status: 'connected' as const,
    href: '/whatsapp',
    cta: 'Configurar',
  },
  {
    name: 'Google Sheets',
    icon: '📊',
    description: 'Registrá leads automáticamente en tu hoja de cálculo.',
    status: 'soon' as const,
    href: null,
    cta: 'Próximamente',
  },
  {
    name: 'Google Drive',
    icon: '📁',
    description: 'Almacená documentos y cotizaciones de clientes.',
    status: 'soon' as const,
    href: null,
    cta: 'Próximamente',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Integraciones" subtitle="Conectá herramientas externas al agente" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-5 max-w-4xl">
          {integrations.map((integ) => (
            <div
              key={integ.name}
              className={`bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4 ${
                integ.status === 'soon' ? 'opacity-60' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">
                  {integ.icon}
                </div>
                {integ.status === 'connected' ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Conectado
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    Próximamente
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">{integ.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{integ.description}</p>
              </div>

              {integ.href ? (
                <Link href={integ.href} className="mt-auto w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg text-center transition-colors">
                  {integ.cta}
                </Link>
              ) : (
                <button disabled className="mt-auto w-full py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
                  {integ.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
