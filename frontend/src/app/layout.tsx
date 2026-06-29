import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: 'Where — Never forget where you put things',
  description: 'Just tell Help. It remembers everything and reminds you when it matters.',
manifest: '/manifest.json',
appleWebApp: {
  capable: true,
  statusBarStyle: 'default',
  title: 'Where',
},
  openGraph: {
    title: 'Where — Your memory, fixed',
description: 'No typing. No thinking. Just talk and Where remembers.',
    type: 'website',
  },
}
export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
  <head>
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  </head>
  <body>
        {children}
<Providers />
      </body>
    </html>
  )
}