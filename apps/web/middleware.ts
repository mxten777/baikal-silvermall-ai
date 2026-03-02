import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/checkout', '/mypage']
const ADMIN_PREFIX = '/admin'
const AUTH_PAGES = ['/login', '/signup']

/**
 * Supabase 세션 쿠키 존재 여부로 로그인 상태를 빠르게 확인.
 * Edge-compatible (no @supabase/ssr import → 번들 크기 최소화)
 * 실제 토큰 검증은 각 서버 컴포넌트/API 라우트에서 수행.
 */
function hasSession(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  return cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoggedIn = hasSession(request)

  // 이미 로그인된 경우 auth 페이지 리다이렉트
  if (isLoggedIn && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 인증 필요 페이지
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isLoggedIn && isProtected) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 어드민 페이지 (간단 보호 — 실제 권한 체크는 admin layout에서)
  if (pathname.startsWith(ADMIN_PREFIX) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
