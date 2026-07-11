import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Lakshya IAS Academy — Book Your Session',
  description: 'Schedule mentorship sessions with Lakshya IAS Academy. Expert UPSC coaching in New Delhi.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
