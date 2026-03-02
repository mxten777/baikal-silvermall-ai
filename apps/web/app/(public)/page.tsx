import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// ─── 카테고리 아이콘 매핑 ──────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  '이동편의용품': '🦽',
  '욕창예방용품': '🛏️',
  '세면·목욕용품': '🛁',
  '배변처리용품': '🚽',
  '감각·인지기능': '👁️',
  '치매·인지증': '🧠',
  '호흡기·흡인기': '💨',
}

// ─── 서버 컴포넌트 ──────────────────────────────────────────────────────────
export const revalidate = 3600 // 1시간마다 ISR

export default async function HomePage() {
  const supabase = await createClient()
  const db = supabase as any // DB 타입 생성 전 임시 캐스팅

  // 카테고리 + 인기상품 병렬 fetch
  const [{ data: categories }, { data: popularProducts }, { data: newProducts }] =
    await Promise.all([
      db
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order'),
      db
        .from('products')
        .select('*, category:categories(name)')
        .eq('status', 'active')
        .order('sold_count', { ascending: false })
        .limit(8),
      db
        .from('products')
        .select('*, category:categories(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4),
    ])

  return (
    <div className="pb-4">
      {/* ── 히어로 배너 ─────────────────────────────────────────────── */}
      <section
        className="bg-gradient-to-br from-brand-500 to-teal-700 px-5 py-12 sm:py-16 text-white"
        style={{ background: 'linear-gradient(to bottom right, #0fa0a0, #0a6060)' }}
      >
        <div className="mx-auto max-w-screen-sm">
          <Badge className="mb-3 border-white/30 bg-white/20 text-white text-xs">🏥 공식 급여 품목 판매</Badge>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold leading-snug">
            장기요양 수급자를 위한<br />복지용구 전문 쇼핑몰
          </h1>
          <p className="mb-6 text-sm sm:text-base text-white/85">국가 지원 급여 품목 · 본인부담금 최소화</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-brand-600 font-bold hover:bg-white/90 shadow-md">
              <Link href="/store">쇼핑 시작하기</Link>
            </Button>
            <Button asChild size="lg" className="border-2 border-white bg-transparent text-white font-bold hover:bg-white/15 shadow-md">
              <Link href="/guide">급여 안내</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 급여 혜택 안내 배너 ──────────────────────────────────────── */}
      <section className="bg-emerald-50 border-b border-emerald-100 px-4 py-3.5">
        <div className="mx-auto max-w-screen-sm">
          <p className="text-center text-sm text-emerald-900 leading-relaxed">
            💡 장기요양 인정서가 있으면 <strong className="text-emerald-700">연 160만원 한도</strong>에서 구매·대여 비용의 <strong className="text-emerald-700">85%</strong>를 국가가 지원합니다
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-sm px-4">
        {/* ── 카테고리 ──────────────────────────────────────────────────── */}
        <section className="py-6">
          <h2 className="mb-4 text-lg font-bold">카테고리</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {(categories ?? []).map((cat: { id: string; name: string; slug: string }) => (
              <Link
                key={cat.id}
                href={`/store?category=${cat.slug}`}
              className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-2.5 text-center transition-colors hover:bg-brand-50"
            >
              <span className="text-xl sm:text-2xl">{CATEGORY_ICONS[cat.name] ?? '📦'}</span>
              <span className="line-clamp-2 text-[11px] leading-tight text-gray-700">{cat.name}</span>
              </Link>
            ))}
            <Link
              href="/store"
              className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 p-2.5 text-center transition-colors hover:bg-brand-50"
            >
              <span className="text-xl sm:text-2xl">🔍</span>
              <span className="text-[11px] leading-tight text-gray-700">전체보기</span>
            </Link>
          </div>
        </section>

        <Separator />

        {/* ── 신규 입고 ──────────────────────────────────────────────── */}
        {newProducts && newProducts.length > 0 && (
          <section className="py-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">신규 입고</h2>
              <Link href="/store?sort=newest" className="text-sm text-brand-500">전체보기 →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {newProducts.map((product: any) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* ── 인기 상품 ──────────────────────────────────────────────── */}
        <section className="py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">인기 상품</h2>
            <Link href="/store?sort=popular" className="text-sm text-brand-500">전체보기 →</Link>
          </div>
          {popularProducts && popularProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {popularProducts.map((product: any) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* ── 대여 서비스 프로모 ─────────────────────────────────────── */}
        <section className="py-6">
          <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 p-5 text-white">
            <p className="mb-1 text-xs font-medium text-blue-100">대여 서비스</p>
            <h3 className="mb-2 text-lg font-bold">전동침대·수동휠체어<br />월 렌탈로 부담 없이</h3>
            <p className="mb-4 text-sm text-blue-100">월 최저 15,000원 · 설치·배송 포함</p>
            <Button asChild size="sm" className="bg-white text-blue-700 hover:bg-white/90">
              <Link href="/store?type=rental">대여 상품 보기</Link>
            </Button>
          </div>
        </section>

        {/* ── 공지 / 이벤트 링크 ────────────────────────────────────── */}
        <section className="pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/event"
              className="rounded-xl border bg-amber-50 p-4 text-center transition-colors hover:bg-amber-100"
            >
              <p className="text-2xl">🎉</p>
              <p className="mt-1 text-sm font-medium text-amber-900">진행 이벤트</p>
            </Link>
            <Link
              href="/guide"
              className="rounded-xl border bg-teal-50 p-4 text-center transition-colors hover:bg-teal-100"
            >
              <p className="text-2xl">📋</p>
              <p className="mt-1 text-sm font-medium text-teal-900">급여 이용 가이드</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
