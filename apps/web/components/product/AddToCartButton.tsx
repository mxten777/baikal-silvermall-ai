'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/hooks/useCart'
import { toast } from '@/hooks/use-toast'
import { ShoppingCart, Zap } from 'lucide-react'

interface AddToCartButtonProps {
  product: {
    id: string
    slug: string
    name: string
    price: number
    sale_price: number | null
    is_insurance: boolean
    thumbnail_url?: string | null
    product_images?: { url: string; is_primary: boolean }[]
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  const displayPrice = product.sale_price ?? product.price
  const thumbnailUrl =
    product.thumbnail_url ??
    product.product_images?.find((i) => i.is_primary)?.url ??
    product.product_images?.[0]?.url ??
    ''

  const cartItem = {
    product_id: product.id,
    option_key: {},
    qty,
    snapshot: {
      name: product.name,
      price: displayPrice,
      image_url: thumbnailUrl,
      is_insurance: product.is_insurance,
      slug: product.slug,
    },
  }

  const handleAddToCart = () => {
    addItem(cartItem)
    toast({ title: '장바구니에 담았습니다', description: product.name })
  }

  return (
    <div className="space-y-4">
      {/* 수량 선택 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">수량</span>
        <div className="flex items-center rounded-md border">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg leading-none hover:bg-muted"
            aria-label="수량 감소"
          >−</button>
          <span className="min-w-[40px] py-2 text-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-3 py-2 text-lg leading-none hover:bg-muted"
            aria-label="수량 증가"
          >+</button>
        </div>
        <span className="ml-auto text-sm font-bold text-brand-500">
          {(displayPrice * qty).toLocaleString('ko-KR')}원
        </span>
      </div>

      {/* 버튼 그룹 */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={handleAddToCart} className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          장바구니
        </Button>
        <Button onClick={handleAddToCart} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600">
          <Zap className="h-4 w-4" />
          바로 구매
        </Button>
      </div>

      {product.is_insurance && (
        <p className="text-center text-xs text-muted-foreground">
          장기요양 급여 품목 — 인정서 보유 시 최대 85% 지원
        </p>
      )}
    </div>
  )
}
