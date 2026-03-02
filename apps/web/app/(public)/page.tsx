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

// ─── 데모용 목업 데이터 (DB 없을 때 폴백) ──────────────────────────────────
const MOCK_CATEGORIES = [
  { id: '1', name: '이동편의용품', slug: 'mobility' },
  { id: '2', name: '욕창예방용품', slug: 'pressure-care' },
  { id: '3', name: '세면·목욕용품', slug: 'bath' },
  { id: '4', name: '배변처리용품', slug: 'toilet' },
  { id: '5', name: '감각·인지기능', slug: 'cognitive' },
  { id: '6', name: '치매·인지증', slug: 'dementia' },
  { id: '7', name: '호흡기·흡인기', slug: 'respiratory' },
]

const MOCK_PRODUCTS = [
  { id: 'demo-1', name: '전동 휠체어 (경량형)', price: 1200000, sale_price: 980000, image_url: null, category: { name: '이동편의용품' }, slug: 'demo-electric-wheelchair', sold_count: 320, status: 'active' },
  { id: 'demo-2', name: '에어매트리스 (욕창예방)', price: 350000, sale_price: 290000, image_url: null, category: { name: '욕창예방용품' }, slug: 'demo-air-mattress', sold_count: 210, status: 'active' },
  { id: 'demo-3', name: '샤워 의자 (접이식)', price: 85000, sale_price: null, image_url: null, category: { name: '세면·목욕용품' }, slug: 'demo-shower-chair', sold_count: 185, status: 'active' },
  { id: 'demo-4', name: '이동식 좌변기', price: 120000, sale_price: 99000, image_url: null, category: { name: '배변처리용품' }, slug: 'demo-commode', sold_count: 163, status: 'active' },
  { id: 'demo-5', name: '보행 보조기 (4발 지팡이)', price: 65000, sale_price: null, image_url: null, category: { name: '이동편의용품' }, slug: 'demo-walker', sold_count: 142, status: 'active' },
  { id: 'demo-6', name: '치매 배회 감지기', price: 280000, sale_price: 240000, image_url: null, category: { name: '치매·인지증' }, slug: 'demo-wandering-sensor', sold_count: 98, status: 'active' },
  { id: 'demo-7', name: '자동 흡인기 (가정용)', price: 450000, sale_price: null, image_url: null, category: { name: '호흡기·흡인기' }, slug: 'demo-suction', sold_count: 87, status: 'active' },
  { id: 'demo-8', name: '수동 휠체어 (표준형)', price: 380000, sale_price: 320000, image_url: null, category: { name: '이동편의용품' }, slug: 'demo-wheelchair', sold_count: 75, status: 'active' },
]

// ─── 서버 컴포넌트 ──────────────────────────────────────────────────────────
export const revalidate = 3600 // 1시간마다 ISR

export default async function HomePage() {
  const supabase = await createClient()
  const db = supabase as any // DB 타입 생성 전 임시 캐스팅

  // 카테고리 + 인기상품 병렬 fetch
  const [{ data: categoriesRaw }, { data: popularRaw }, { data: newRaw }] =
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

  // DB 연결 안 되면 목업 데이터 사용
  const categories = (categoriesRaw && categoriesRaw.length > 0) ? categoriesRaw : MOCK_CATEGORIES
  const popularProducts = (popularRaw && popularRaw.length > 0) ? popularRaw : MOCK_PRODUCTS
  const newProducts = (newRaw && newRaw.length > 0) ? newRaw : MOCK_PRODUCTS.slice(0, 4)

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
