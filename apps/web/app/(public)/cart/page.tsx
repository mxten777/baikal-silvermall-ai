'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCartStore,
  useCartItems,
  useCartTotal,
} from '@/hooks/useCart'
import type { CartItem } from '@/types/database'

/* 급여 본인부담금 계산 (15%) */
const calcInsuranceCopay = (price: number) => Math.ceil(price * 0.15)

/* 배송비: 50,000원 이상 무료 */
const SHIPPING_FREE_THRESHOLD = 50_000
const SHIPPING_FEE = 3_000

export default function CartPage() {
  const router = useRouter()
  const items = useCartItems()
  const total = useCartTotal()
  const { updateQty, removeItem, isLoading } = useCartStore()

  const shippingFee = total >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = total + shippingFee

  const insuranceItems = items.filter((i) => i.snapshot.is_insurance)
  const insuranceSaving = insuranceItems.reduce(
    (sum, i) =>
      sum + (i.snapshot.price - calcInsuranceCopay(i.snapshot.price)) * i.qty,
    0
  )

  const handleQtyChange = (item: CartItem, delta: number) => {
    const next = item.qty + delta
    if (next <= 0) return
    updateQty(item.product_id, item.option_key, next)
  }

  const handleRemove = (item: CartItem) => {
    removeItem(item.product_id, item.option_key)
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  /* 빈 카트 */
  if (!isLoading && items.length === 0) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <p className="text-lg text-gray-500 font-medium">장바구니가 비어 있어요</p>
        <Link href="/store">
          <Button className="bg-primary text-white hover:bg-primary/90">
            쇼핑 계속하기
          </Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">장바구니</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── 상품 목록 ─── */}
        <section className="flex-1 space-y-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <CartItemSkeleton key={i} />
              ))
            : items.map((item) => (
                <CartItemRow
                  key={`${item.product_id}-${JSON.stringify(item.option_key)}`}
                  item={item}
                  onQtyChange={handleQtyChange}
                  onRemove={handleRemove}
                />
              ))}
        </section>

        {/* ─── 요약 패널 ─── */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="border rounded-2xl p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold text-lg">주문 요약</h2>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>상품 금액</span>
                <span>{total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-teal-600 font-medium">무료</span>
                  ) : (
                    `${shippingFee.toLocaleString()}원`
                  )}
                </span>
              </div>
              {insuranceSaving > 0 && (
                <div className="flex justify-between text-teal-600">
                  <span>급여 혜택 절약</span>
                  <span>-{insuranceSaving.toLocaleString()}원</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>총 결제금액</span>
              <span className="text-teal-700 text-lg">
                {finalTotal.toLocaleString()}원
              </span>
            </div>

            {total < SHIPPING_FREE_THRESHOLD && (
              <p className="text-xs text-gray-400">
                {(SHIPPING_FREE_THRESHOLD - total).toLocaleString()}원 더 담으면
                배송비 무료
              </p>
            )}

            <Button
              className="w-full bg-primary text-white hover:bg-primary/90 py-6 text-base font-semibold rounded-xl"
              onClick={handleCheckout}
            >
              주문하기 ({items.length}개)
            </Button>

            <Link href="/store">
              <Button variant="outline" className="w-full py-5 rounded-xl">
                쇼핑 계속하기
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}

/* ─── CartItemRow ─── */
interface CartItemRowProps {
  item: CartItem
  onQtyChange: (item: CartItem, delta: number) => void
  onRemove: (item: CartItem) => void
}

function CartItemRow({ item, onQtyChange, onRemove }: CartItemRowProps) {
  const { snapshot, qty } = item
  const lineTotal = snapshot.price * qty
  const copayPerUnit = calcInsuranceCopay(snapshot.price)
  const lineCopay = copayPerUnit * qty

  return (
    <div className="border rounded-2xl p-4 flex gap-4 bg-white">
      {/* 이미지 */}
      <Link href={`/product/${snapshot.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
          {snapshot.image_url ? (
            <Image
              src={snapshot.image_url}
              alt={snapshot.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
              이미지 없음
            </div>
          )}
        </div>
      </Link>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 상품명 + 급여 뱃지 */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            href={`/product/${snapshot.slug}`}
            className="text-sm font-medium leading-snug hover:text-teal-700 line-clamp-2"
          >
            {snapshot.name}
          </Link>
          <button
            onClick={() => onRemove(item)}
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 옵션 */}
        {Object.keys(item.option_key).length > 0 && (
          <p className="text-xs text-gray-400 mb-2">
            {Object.entries(item.option_key)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}
          </p>
        )}

        {snapshot.is_insurance && (
          <Badge variant="insurance" className="mb-2 text-xs">
            급여 본인부담 {lineCopay.toLocaleString()}원
          </Badge>
        )}

        {/* 수량 + 금액 */}
        <div className="flex items-center justify-between mt-2">
          {/* 수량 조절 */}
          <div className="flex items-center gap-2 border rounded-lg px-1">
            <button
              onClick={() => onQtyChange(item, -1)}
              disabled={qty <= 1}
              className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
              aria-label="수량 감소"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{qty}</span>
            <button
              onClick={() => onQtyChange(item, 1)}
              className="p-1 text-gray-500 hover:text-gray-900"
              aria-label="수량 증가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 금액 */}
          <div className="text-right">
            <p className="text-base font-bold text-gray-900">
              {lineTotal.toLocaleString()}원
            </p>
            {snapshot.is_insurance && (
              <p className="text-xs text-teal-600">
                급여 {lineCopay.toLocaleString()}원
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ─── */
function CartItemSkeleton() {
  return (
    <div className="border rounded-2xl p-4 flex gap-4">
      <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-24 mt-4" />
      </div>
    </div>
  )
}
