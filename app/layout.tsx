import './globals.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'WebRTC Stream Monitoring',
  description: 'Monitor multiple WebRTC streams in real-time',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/missile.js"
          strategy="beforeInteractive"
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/h265web.js@latest/dist/h265webjs.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
} 