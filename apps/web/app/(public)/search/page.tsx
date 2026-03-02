'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-screen-lg px-4 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [inputValue, setInputValue] = useState(params.get('q') ?? '')
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()
  const db = supabase as any

  useEffect(() => {
    if (!query) {
      setProducts([])
      return
    }

    setIsLoading(true)
    db.from('products')
      .select('*, category:categories(name)')
      .eq('status', 'active')
      .ilike('name', `%${query}%`)
      .limit(24)
      .then(({ data }: { data: any[] | null }) => {
        setProducts(data ?? [])
        setIsLoading(false)
      })
  }, [query]) // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(inputValue)
    router.replace(`/search?q=${encodeURIComponent(inputValue)}`)
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 검색창 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="복지용구 검색..."
            className="pl-10 pr-10"
            autoFocus
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => { setInputValue(''); setQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit">검색</Button>
      </form>

      {/* 인기 검색어 */}
      {!query && (
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-muted-foreground">인기 검색어</p>
          <div className="flex flex-wrap gap-2">
            {['전동침대', '휠체어', '욕창예방', '보행기', '목욕의자', '기저귀', '흡인기'].map((kw) => (
              <button
                key={kw}
                onClick={() => { setInputValue(kw); setQuery(kw); router.replace(`/search?q=${kw}`) }}
                className="rounded-full border bg-gray-50 px-3 py-1 text-sm transition-colors hover:bg-brand-50 hover:text-brand-500"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 결과 */}
      {query && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span> 검색 결과
            {!isLoading && <span> {products.length}개</span>}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-lg font-medium">검색 결과가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">다른 검색어를 입력해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
