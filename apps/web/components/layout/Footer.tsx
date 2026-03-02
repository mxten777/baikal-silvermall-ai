import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t bg-muted/40 py-10', className)}>
      <div className="container space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          {/* 브랜드 */}
          <div className="space-y-2">
            <p className="font-bold text-lg text-primary">🌿 실버몰</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              장기요양 수급자·보호자를 위한<br />
              복지용구 전문 쇼핑몰
            </p>
          </div>

          {/* 링크 */}
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold">쇼핑</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/store" className="hover:text-foreground">전체 상품</Link></li>
                <li><Link href="/store/walking-aids" className="hover:text-foreground">보행보조</Link></li>
                <li><Link href="/store/bed-care" className="hover:text-foreground">침상케어</Link></li>
                <li><Link href="/store/pressure-sore" className="hover:text-foreground">욕창예방</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">가이드</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/guide" className="hover:text-foreground">복지용구 가이드</Link></li>
                <li><Link href="/guide?category=benefit" className="hover:text-foreground">급여 이용 안내</Link></li>
                <li><Link href="/notice" className="hover:text-foreground">공지사항</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">고객센터</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><span>평일 09:00~18:00</span></li>
                <li><a href="tel:1588-0000" className="hover:text-foreground font-medium">1588-0000</a></li>
                <li><Link href="/mypage/inquiries" className="hover:text-foreground">1:1 문의</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* 법적 고지 */}
        <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          <p>상호: 실버몰 | 사업자등록번호: 000-00-00000 | 대표: 홍길동</p>
          <p>통신판매업신고: 2026-서울강남-0000 | 주소: 서울특별시 강남구</p>
          <div className="flex gap-4 mt-2">
            <Link href="/terms" className="hover:underline">이용약관</Link>
            <Link href="/privacy" className="hover:underline font-medium">개인정보처리방침</Link>
            <Link href="/refund-policy" className="hover:underline">환불정책</Link>
          </div>
          <p className="mt-2">© 2026 실버몰. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
