import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '이벤트 — 실버몰',
  description: '실버몰 진행 이벤트 및 프로모션 안내',
}

const EVENTS = [
  {
    id: 1,
    badge: '진행중',
    badgeColor: 'bg-rose-100 text-rose-700',
    emoji: '🎉',
    title: '신규 회원 가입 이벤트',
    desc: '회원 가입 시 5,000포인트 즉시 지급! 첫 주문에 바로 사용 가능',
    period: '2026.03.01 ~ 2026.04.30',
    href: '/signup',
    cta: '지금 가입하기',
  },
  {
    id: 2,
    badge: '진행중',
    badgeColor: 'bg-rose-100 text-rose-700',
    emoji: '🚚',
    title: '3만원 이상 무료배송',
    desc: '3만원 이상 구매 시 전국 무료배송. 급여·비급여 통합 금액 기준',
    period: '상시 진행',
    href: '/store',
    cta: '쇼핑하러 가기',
  },
  {
    id: 3,
    badge: '진행중',
    badgeColor: 'bg-rose-100 text-rose-700',
    emoji: '⭐',
    title: '구매 후기 작성 포인트',
    desc: '상품 구매 후 리뷰 작성 시 최대 2,000포인트 적립',
    period: '상시 진행',
    href: '/store',
    cta: '상품 보러가기',
  },
  {
    id: 4,
    badge: '예정',
    badgeColor: 'bg-gray-100 text-gray-600',
    emoji: '🏷️',
    title: '봄맞이 복지용구 특가전',
    desc: '보행보조용구, 욕창예방용품 최대 20% 할인 예정',
    period: '2026.04.01 예정',
    href: '/store',
    cta: '알림 받기',
  },
]

export default function EventPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 pb-8">
      {/* 헤더 */}
      <section className="py-8 text-center">
        <Badge className="mb-3 bg-amber-100 text-amber-800 border-transparent">🎉 이벤트</Badge>
        <h1 className="mb-2 text-2xl font-bold">진행중인 이벤트</h1>
        <p className="text-sm text-muted-foreground">실버몰의 다양한 혜택을 놓치지 마세요</p>
      </section>

      {/* 이벤트 목록 */}
      <section className="space-y-4">
        {EVENTS.map((ev) => (
          <div key={ev.id} className="overflow-hidden rounded-xl border bg-white">
            <div className="flex items-start gap-4 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-3xl">
                {ev.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ev.badgeColor}`}>
                    {ev.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-base leading-snug">{ev.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{ev.desc}</p>
                <p className="mt-2 text-xs text-muted-foreground">📅 {ev.period}</p>
              </div>
            </div>
            <div className="border-t px-5 py-3 bg-gray-50">
              <Button asChild size="sm" variant="outline">
                <Link href={ev.href}>{ev.cta}</Link>
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* 포인트 안내 */}
      <section className="mt-8 rounded-xl bg-brand-50 p-5">
        <h2 className="mb-2 font-bold">💰 포인트 적립 안내</h2>
        <ul className="space-y-1.5 text-sm">
          <li className="flex justify-between">
            <span className="text-muted-foreground">회원 가입</span>
            <span className="font-medium">5,000P</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">구매 적립</span>
            <span className="font-medium">결제금액의 1%</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">텍스트 리뷰</span>
            <span className="font-medium">500P</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted-foreground">포토 리뷰</span>
            <span className="font-medium">2,000P</span>
          </li>
        </ul>
        <Button asChild size="sm" className="mt-4 w-full">
          <Link href="/mypage/points">내 포인트 확인</Link>
        </Button>
      </section>
    </div>
  )
}
