import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WebRTC Stream Monitoring',
  description: 'Monitor multiple WebRTC streams in real-time',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
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
      <body>{children}</body>
    </html>
  )
} 