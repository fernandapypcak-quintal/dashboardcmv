import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CMV Dashboard — Quintal do Espeto',
  description: 'Inteligência operacional de CMV · Rede Quintal do Espeto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-[#f7f7f5] text-[#111] antialiased">{children}</body>
    </html>
  )
}
