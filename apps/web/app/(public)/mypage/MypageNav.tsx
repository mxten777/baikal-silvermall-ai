'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Ticket, Coins } from 'lucide-react'

const NAV = [
  { href: '/mypage', label: '프로필', icon: User },
  { href: '/mypage/orders', label: '주문내역', icon: Package },
  { href: '/mypage/coupons', label: '쿠폰함', icon: Ticket },
  { href: '/mypage/points', label: '포인트', icon: Coins },
]

export default function MypageNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">마이페이지</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="w-full md:w-52 shrink-0">
          <ul className="flex md:flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === '/mypage' ? pathname === '/mypage' : pathname.startsWith(href)
              return (
                <li key={href} className="flex-1 md:flex-none">
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
