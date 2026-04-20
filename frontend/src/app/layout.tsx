import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Toaster } from 'sonner'
import { Header, Footer } from '@/components'
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Point55 - Loja de Roupas e Acessórios',
  description: 'Encontre as melhores roupas, acessórios e calçados com os melhores preços',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <Header />
              <main style={{ minHeight: '60vh' }}>
                {children}
              </main>
              <Footer />
              <WhatsAppButton />
              <Toaster 
                position="bottom-right"
                richColors
                closeButton
                theme="light"
              />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
