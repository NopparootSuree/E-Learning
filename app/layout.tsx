import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout/app-layout'
import { cn } from '@/lib/utils'
import { SessionProvider } from 'next-auth/react'

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'E-Learning System',
  description: 'ระบบการเรียนรู้ภายในองค์กร',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body
        className={cn(
          'min-h-screen bg-gray-50 font-sans antialiased',
          sarabun.className
        )}
      >
        <SessionProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </SessionProvider>
      </body>
    </html>
  )
}