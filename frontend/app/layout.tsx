import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hermes Agencia de Viajes',
  description: 'Panel de control del agente de viajes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
