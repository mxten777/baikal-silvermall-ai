'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/hooks/useCart'
import { toast } from '@/hooks/use-toast'

type ProductRow = Database['public']['Tables']['products']['Row']
type Product = ProductRow & {
  category?: { name: string } | null
  thumbnail_url?: string | null  // product_images에서 join 시
}

interface ProductCardProps {
  product: Product
  className?: string
}

// 카테고리별 플레이스홀더 색상/아이콘
const CATEGORY_STYLE: Record<string, { bg: string; icon: string }> = {
  '이동편의용품':   { bg: 'bg-blue-50',   icon: '🦽' },
  '보행보조용구':   { bg: 'bg-blue-50',   icon: '🦽' },
  '목욕위생용구':   { bg: 'bg-cyan-50',   icon: '🛁' },
  '침상케어':       { bg: 'bg-indigo-50', icon: '🛏️' },
  '욕창예방용품':   { bg: 'bg-rose-50',   icon: '💊' },
  '식사보조용구':   { bg: 'bg-orange-50', icon: '🍽️' },
  '케어보조용구':   { bg: 'bg-emerald-50',icon: '💚' },
  '건강관리용품':   { bg: 'bg-teal-50',   icon: '🩺' },
}
const DEFAULT_STYLE = { bg: 'bg-gray-50', icon: '📦' }

// 급여비율에 따른 본인부담금 계산
function calcCopay(price: number): number {
  return Math.ceil(price * 0.15) // 본인부담 15%
}

export function ProductCard({ product, className }: ProductCardProps) {
  const isInsurance  = product.is_insurance
  const salePrice    = product.sale_price
  const isRental     = product.product_type === 'rental' || product.product_type === 'both'
  const discountRate = salePrice ? Math.round((1 - salePrice / product.price) * 100) : 0
  const catName      = product.category?.name ?? ''
  const { bg, icon } = CATEGORY_STYLE[catName] ?? DEFAULT_STYLE
  const addItem      = useCartStore((s) => s.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: product.id,
      option_key: {},
      qty: 1,
      snapshot: {
        name: product.name,
        price: salePrice ?? product.price,
        image_url: product.thumbnail_url ?? '',
        is_insurance: product.is_insurance,
        slug: product.slug,
      },
    })
    toast({ title: '장바구니에 담았습니다', description: product.name })
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md hover:-translate-y-0.5 ${className ?? ''}`}
    >
      {/* 상품 이미지 */}
      <div className={`relative aspect-square w-full overflow-hidden ${product.thumbnail_url ? 'bg-gray-50' : bg}`}>
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <span className="text-4xl">{icon}</span>
            <span className="px-2 text-center text-[10px] font-medium text-muted-foreground line-clamp-2">{product.name}</span>
          </div>
        )}

        {/* 배지 영역 */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isInsurance && <Badge variant="insurance">급여</Badge>}
          {isRental && <Badge variant="rental">대여가능</Badge>}
          {discountRate >= 5 && <Badge variant="new">{discountRate}%</Badge>}
        </div>

        {/* 장바구니 빠른 담기 */}
        <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleQuickAdd}
            aria-label="장바구니 담기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4 text-brand-500" />
          </button>
        </div>
      </div>

      {/* 상품 정보 */}
      <div className="flex flex-1 flex-col p-3">
        {product.category && (
          <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">{product.category.name}</p>
        )}
        <h3 className="line-clamp-2 flex-1 text-[13px] leading-snug font-medium text-foreground">{product.name}</h3>

        <div className="mt-2 space-y-0.5">
          {discountRate >= 5 && (
            <p className="text-[11px] text-muted-foreground line-through">{formatPrice(product.price)}</p>
          )}
          <p className="text-sm font-bold text-brand-600">
            {formatPrice(salePrice ?? product.price)}
          </p>
          {isInsurance && (
            <p className="text-[11px] text-emerald-700 font-medium">
              급여 본인부담 {formatPrice(calcCopay(salePrice ?? product.price))} ~
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white">
      <div className="aspect-square w-full animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}
