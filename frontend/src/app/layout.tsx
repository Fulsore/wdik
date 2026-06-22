import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Where — Never forget where you put things',
  description: 'Just tell Help. It remembers everything and reminds you when it matters.',
  openGraph: {
    title: 'Where — Your memory, finally fixed',
    description: 'No typing. No thinking. Just talk and Where remembers everything.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0F0F0F',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 20px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}