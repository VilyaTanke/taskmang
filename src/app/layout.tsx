import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/app.css'
import { AuthProvider } from '@/contexts/AuthContext'
import '@/lib/init'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ivanje-Gestión - Sistema de Gestión de Tareas',
  description: 'Sistema completo de gestión de tareas con autenticación, roles y seguimiento de empleados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
