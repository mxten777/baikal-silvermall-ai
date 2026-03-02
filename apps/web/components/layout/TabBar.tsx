'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Gift, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TAB_ITEMS = [
  { href: '/',        label: '홈',    icon: Home },
  { href: '/store',   label: '스토어', icon: ShoppingBag },
  { href: '/event',   label: '이벤트', icon: Gift },
  { href: '/guide',   label: '가이드', icon: BookOpen },
  { href: '/mypage',  label: '내정보', icon: User },
] as const

export function TabBar() {
  const pathname = usePathname()

  // 어드민 페이지에서는 tabbar 숨김
  if (pathname.startsWith('/admin')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="하단 탭바"
    >
      <div className="flex h-16">
        {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'fill-primary/20')}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
