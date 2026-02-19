import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CookieBanner } from '@/components/cookie-banner'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import 'katex/dist/katex.min.css'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'YpsiMath',
  description: 'Tech-Ed OS for matematikkopplæring i norsk VGS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-primary"
        >
          Hopp til hovedinnhold
        </a>
        <ThemeProvider>
          <TooltipProvider>
            <main id="main-content">{children}</main>
            <CookieBanner />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
