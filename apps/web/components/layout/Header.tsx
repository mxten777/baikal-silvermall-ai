'use client'

import Link from 'next/link'

import { ShoppingCart, User, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartCount } from '@/hooks/useCart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const cartCount = useCartCount()

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-14 items-center gap-4">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-primary shrink-0"
          aria-label="실버몰 홈"
        >
          <span className="text-2xl">🌿</span>
          <span>실버몰</span>
        </Link>

        {/* 검색창 (데스크탑) */}
        <Link
          href="/search"
          className="hidden md:flex flex-1 max-w-lg items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
          aria-label="상품 검색"
        >
          <Search className="h-4 w-4" />
          <span>복지용구 검색...</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {/* 모바일 검색 버튼 */}
          <Link href="/search" className="md:hidden" aria-label="검색">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {/* 장바구니 */}
          <Link href="/cart" className="relative" aria-label={`장바구니 ${cartCount}개`}>
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary"
                  aria-hidden
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* 내 정보 */}
          <Link href="/mypage" aria-label="내 정보">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
