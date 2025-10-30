import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth/auth-context'
import { Toaster } from '@/components/ui/toaster'
import { ConfirmProvider } from '@/components/ui/confirm'
import './globals.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://s7robotics.space'),
  title: {
    default: 'S7 Robotics',
    template: '%s | S7 Robotics',
  },
  description: 'S7 Robotics: курсы, ивенты и инструменты по IT и робототехнике',
  generator: 'S7 Robotics',
  applicationName: 'S7 Robotics',
  openGraph: {
    type: 'website',
    url: 'https://s7robotics.space',
    title: 'S7 Robotics',
    description: 'Курсы, ивенты, инструменты по IT и робототехнике',
    siteName: 'S7 Robotics',
    images: [
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'S7 Robotics' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@s7robotics',
    title: 'S7 Robotics',
    description: 'Курсы, ивенты и инструменты по IT и робототехнике',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/logo-s7.png',
    shortcut: '/logo-s7.png',
    apple: '/logo-s7.png',
  },
  themeColor: '#0e0e12',
}

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${inter.variable} ${jetbrains.variable}`}>
        <AuthProvider>
          <ConfirmProvider>
            <div className="site-content">
              {children}
            </div>
            <Toaster />
          </ConfirmProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
