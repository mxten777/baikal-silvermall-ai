import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

// 한글 최적화 폰트 (Pretendard 로컬 폰트 대체 — public/fonts/PretendardVariable.woff2 추가 시 localFont로 교체)
const pretendard = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-pretendard',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0fa0a0',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: '실버몰 — 복지용구 전문 쇼핑몰',
    template: '%s | 실버몰',
  },
  description: '장기요양 수급자·보호자를 위한 복지용구 전문 쇼핑몰. 급여·비급여 복지용구 구매·대여 서비스.',
  keywords: ['복지용구', '장기요양', '노인용품', '보행보조', '욕창예방', '실버케어'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '실버몰',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
