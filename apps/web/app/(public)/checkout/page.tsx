'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartItems, useCartTotal, useCartStore } from '@/hooks/useCart'
import type { CartItem } from '@/types/database'

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? 'test_ck_placeholder'
const SHIPPING_FREE_THRESHOLD = 50_000
const SHIPPING_FEE = 3_000

/* ─── zod 스키마 ─── */
const shippingSchema = z.object({
  recipient: z.string().min(2, '이름을 2자 이상 입력해주세요'),
  phone: z
    .string()
    .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요'),
  zip_code: z.string().min(5, '우편번호를 입력해주세요'),
  address1: z.string().min(5, '주소를 입력해주세요'),
  address2: z.string().optional(),
  request: z.string().max(100, '100자 이내로 입력해주세요').optional(),
})
type ShippingForm = z.infer<typeof shippingSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartItems()
  const total = useCartTotal()
  const clear = useCartStore((s) => s.clear)

  const shippingFee = total >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = total + shippingFee

  const [paymentReady, setPaymentReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
  })

  /* 카트 비어 있으면 /cart 로 */
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart')
    }
  }, [items, router])

  /* Toss Payment Widget 초기화 */
  useEffect(() => {
    if (items.length === 0) return
    let widget: PaymentWidgetInstance | null = null

    const init = async () => {
      widget = await loadPaymentWidget(TOSS_CLIENT_KEY, 'ANONYMOUS')
      paymentWidgetRef.current = widget
      await widget.renderPaymentMethods('#payment-widget', { value: finalTotal })
      setPaymentReady(true)
    }

    init().catch(console.error)

    return () => {
      // cleanup — 위젯은 DOM 제거로 정리됨
    }
  }, [finalTotal, items.length])

  /* 주문 제출 */
  const onSubmit = async (shippingData: ShippingForm) => {
    if (!paymentWidgetRef.current) return
    setIsSubmitting(true)

    try {
      // 1. prepare API → DB order 생성 + orderId 발급
      const prepareRes = await fetch('/api/checkout/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shipping: shippingData, total: finalTotal }),
      })

      if (!prepareRes.ok) {
        const { error } = await prepareRes.json()
        throw new Error(error ?? '주문 준비 중 오류가 발생했습니다')
      }

      const { orderId, orderName } = await prepareRes.json()

      // 2. Toss Payments 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerName: shippingData.recipient,
        customerMobilePhone: shippingData.phone.replace(/-/g, ''),
      })

      // requestPayment 는 리다이렉트 → 여기 이하는 실행 안됨
    } catch (err: unknown) {
      setIsSubmitting(false)
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다'
      alert(msg)
    }
  }

  if (items.length === 0) return null

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">결제하기</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── 왼쪽: 배송 정보 + 결제 수단 ─── */}
          <div className="flex-1 space-y-8">
            {/* 배송 정보 */}
            <section className="border rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-lg">배송지 정보</h2>

              <FormField label="수령인" error={errors.recipient?.message}>
                <Input placeholder="홍길동" {...register('recipient')} />
              </FormField>

              <FormField label="휴대폰" error={errors.phone?.message}>
                <Input placeholder="010-1234-5678" {...register('phone')} />
              </FormField>

              <FormField label="우편번호" error={errors.zip_code?.message}>
                <div className="flex gap-2">
                  <Input
                    placeholder="12345"
                    className="w-32"
                    {...register('zip_code')}
                  />
                  <Button type="button" variant="outline" size="sm">
                    주소 검색
                  </Button>
                </div>
              </FormField>

              <FormField label="주소" error={errors.address1?.message}>
                <Input placeholder="도로명 주소" {...register('address1')} />
              </FormField>

              <FormField label="상세주소" error={errors.address2?.message}>
                <Input placeholder="상세주소 (선택)" {...register('address2')} />
              </FormField>

              <FormField label="배송 요청사항" error={errors.request?.message}>
                <Input placeholder="예) 문 앞에 두세요 (선택)" {...register('request')} />
              </FormField>
            </section>

            {/* 결제 수단 */}
            <section className="border rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">결제 수단</h2>
              {paymentReady ? null : (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              <div id="payment-widget" />
            </section>
          </div>

          {/* ─── 오른쪽: 주문 요약 ─── */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="border rounded-2xl p-6 sticky top-24 space-y-4">
              <h2 className="font-semibold text-lg">주문 상품</h2>

              {/* 상품 목록 */}
              <ul className="space-y-3">
                {items.map((item: CartItem) => (
                  <li
                    key={`${item.product_id}-${JSON.stringify(item.option_key)}`}
                    className="flex justify-between text-sm text-gray-700"
                  >
                    <span className="line-clamp-1 flex-1 mr-2">
                      {item.snapshot.name}
                      {item.qty > 1 && (
                        <span className="text-gray-400"> ×{item.qty}</span>
                      )}
                    </span>
                    <span className="shrink-0">
                      {(item.snapshot.price * item.qty).toLocaleString()}원
                    </span>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>상품 합계</span>
                  <span>{total.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span>배송비</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-teal-600">무료</span>
                    ) : (
                      `${shippingFee.toLocaleString()}원`
                    )}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>최종 결제금액</span>
                <span className="text-teal-700 text-lg">
                  {finalTotal.toLocaleString()}원
                </span>
              </div>

              <Button
                type="submit"
                disabled={!paymentReady || isSubmitting}
                className="w-full bg-primary text-white hover:bg-primary/90 py-6 text-base font-semibold rounded-xl"
              >
                {isSubmitting ? '처리 중...' : `${finalTotal.toLocaleString()}원 결제하기`}
              </Button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                결제하기 버튼을 누르면{' '}
                <span className="text-gray-600">이용약관</span> 및{' '}
                <span className="text-gray-600">개인정보 처리방침</span>에 동의하는
                것으로 간주합니다.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </main>
  )
}

/* ─── FormField 헬퍼 ─── */
function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
