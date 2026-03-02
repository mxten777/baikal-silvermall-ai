'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/hooks/useCart'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clear = useCartStore((s) => s.clear)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      router.replace('/cart')
      return
    }

    const confirm = async () => {
      try {
        const res = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        })

        if (res.ok) {
          clear() // 결제 성공 → 장바구니 비우기
          setStatus('success')
        } else {
          const { error } = await res.json()
          throw new Error(error ?? '결제 확인 중 오류')
        }
      } catch (err: unknown) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : '오류가 발생했습니다')
      }
    }

    confirm()
  }, [paymentKey, orderId, amount, clear, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Skeleton className="w-16 h-16 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-lg font-semibold text-red-500">결제 확인 실패</p>
        <p className="text-sm text-gray-500">{errorMsg}</p>
        <Link href="/cart">
          <Button variant="outline">장바구니로 돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <CheckCircle2 className="w-16 h-16 text-teal-500" />
      <div>
        <h1 className="text-2xl font-bold mb-2">결제 완료!</h1>
        <p className="text-gray-500 text-sm">
          주문번호: <span className="font-medium text-gray-800">{orderId}</span>
        </p>
        {amount && (
          <p className="text-gray-500 text-sm mt-1">
            결제금액:{' '}
            <span className="font-medium text-gray-800">
              {Number(amount).toLocaleString()}원
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link href="/mypage/orders">
          <Button className="bg-primary text-white hover:bg-primary/90 gap-2">
            <Package className="w-4 h-4" />
            주문 내역 보기
          </Button>
        </Link>
        <Link href="/store">
          <Button variant="outline" className="gap-2">
            쇼핑 계속하기
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 py-16">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  )
}
