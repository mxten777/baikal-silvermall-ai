'use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal, Search, X } from 'lucide-react'

const SORT_LABELS: Record<string, string> = {
  popular: '인기순',
  newest: '신규순',
  price_asc: '낮은가격순',
  price_desc: '높은가격순',
}

const PAGE_SIZE = 12

interface Category {
  id: number
  name: string
  slug: string
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-screen-lg px-4 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <StoreContent />
    </Suspense>
  )
}

function StoreContent() {
  const router   = useRouter()
  const params   = useSearchParams()

  const category = params.get('category') ?? ''
  const typeParam = params.get('type') ?? 'all'  // all | purchase | rental
  const sortParam = params.get('sort') ?? 'popular'
  const q         = params.get('q') ?? ''

  const [categories, setCategories]   = useState<Category[]>([])
  const [products, setProducts]       = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [hasMore, setHasMore]         = useState(true)
  const [pageIndex, setPageIndex]     = useState(0)
  const [searchText, setSearchText]   = useState(q)
  const [filterOpen, setFilterOpen]   = useState(false)

  const supabase = createClient()
  const db       = supabase as any
  const loaderRef = useRef<HTMLDivElement>(null)

  // 카테고리 로드
  useEffect(() => {
    db.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order')
      .then(({ data }: { data: Category[] | null }) => setCategories(data ?? []))
  }, []) // eslint-disable-line

  const buildQuery = useCallback((from: number) => {
    let q = db.from('products').select('*, category:categories(name)')
      .eq('status', 'active')
      .range(from, from + PAGE_SIZE - 1)

    if (category) q = q.eq('categories.slug', category)
    if (typeParam === 'rental')   q = q.in('product_type', ['rental', 'both'])
    if (typeParam === 'purchase') q = q.eq('product_type', 'purchase')

    switch (sortParam) {
      case 'newest':    q = q.order('created_at', { ascending: false }); break
      case 'price_asc': q = q.order('price', { ascending: true });       break
      case 'price_desc':q = q.order('price', { ascending: false });      break
      default:          q = q.order('sold_count', { ascending: false });  break
    }

    return q
  }, [db, category, typeParam, sortParam]) // eslint-disable-line

  // 첫 페이지 로드
  useEffect(() => {
    setProducts([])
    setPageIndex(0)
    setHasMore(true)
    setIsLoading(true)

    buildQuery(0).then(({ data }: { data: any[] | null }) => {
      setProducts(data ?? [])
      setHasMore((data?.length ?? 0) >= PAGE_SIZE)
      setIsLoading(false)
    })
  }, [category, typeParam, sortParam]) // eslint-disable-line

  // 무한 스크롤
  useEffect(() => {
    if (pageIndex === 0) return
    buildQuery(pageIndex * PAGE_SIZE).then(({ data }: { data: any[] | null }) => {
      setProducts((prev) => [...prev, ...(data ?? [])])
      setHasMore((data?.length ?? 0) >= PAGE_SIZE)
    })
  }, [pageIndex]) // eslint-disable-line

  // Intersection Observer
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoading) setPageIndex((p) => p + 1) },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading])

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value); else p.delete(key)
    router.push(`/store?${p.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchText)
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-4">
      {/* 검색바 */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="상품 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
          {searchText && (
            <button type="button" onClick={() => { setSearchText(''); setParam('q', '') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm">검색</Button>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm"><SlidersHorizontal className="h-4 w-4" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader><SheetTitle>필터 · 정렬</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">상품 유형</p>
                {[['all', '전체'], ['purchase', '구매'], ['rental', '대여']].map(([v, l]) => (
                  <Button key={v} variant={typeParam === v ? 'default' : 'outline'} size="sm"
                    className="mr-2" onClick={() => { setParam('type', v); setFilterOpen(false) }}>{l}</Button>
                ))}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">정렬</p>
                {Object.entries(SORT_LABELS).map(([v, l]) => (
                  <Button key={v} variant={sortParam === v ? 'default' : 'outline'} size="sm"
                    className="mb-2 mr-2" onClick={() => { setParam('sort', v); setFilterOpen(false) }}>{l}</Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </form>

      {/* 카테고리 탭 */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          <Button size="sm" variant={!category ? 'default' : 'outline'}
            onClick={() => setParam('category', '')}>전체</Button>
          {categories.map((cat) => (
            <Button key={cat.id} size="sm" variant={category === cat.slug ? 'default' : 'outline'}
              className="whitespace-nowrap"
              onClick={() => setParam('category', cat.slug)}>{cat.name}</Button>
          ))}
        </div>
      </div>

      {/* 현재 필터 표시 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? '검색 중...' : `${products.length}개 상품`}
        </p>
        {q && <Badge variant="secondary" className="cursor-pointer" onClick={() => setParam('q', '')}>{q} ×</Badge>}
        {typeParam !== 'all' && <Badge variant="secondary">{typeParam === 'rental' ? '대여' : '구매'}</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">{SORT_LABELS[sortParam]}</span>
      </div>

      {/* 상품 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl">📦</p>
          <p className="mt-3 text-lg font-medium">상품이 없습니다</p>
          <p className="mt-1 text-sm">다른 카테고리나 검색어를 시도해보세요</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {/* 무한스크롤 트리거 */}
          <div ref={loaderRef} className="flex justify-center py-6">
            {hasMore && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          </div>
        </>
      )}
    </div>
  )
}
