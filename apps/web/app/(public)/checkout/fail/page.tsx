'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function FailContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') ?? ''
  const message = searchParams.get('message') ?? '결제가 취소되었습니다'
  const orderId = searchParams.get('orderId') ?? ''

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <XCircle className="w-16 h-16 text-red-400" />
      <div>
        <h1 className="text-2xl font-bold mb-2">결제 실패</h1>
        <p className="text-gray-600 text-sm">{decodeURIComponent(message)}</p>
        {code && (
          <p className="text-xs text-gray-400 mt-1">오류 코드: {code}</p>
        )}
        {orderId && (
          <p className="text-xs text-gray-400">주문번호: {orderId}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link href="/checkout">
          <Button className="bg-primary text-white hover:bg-primary/90">
            다시 결제하기
          </Button>
        </Link>
        <Link href="/cart">
          <Button variant="outline">장바구니로 돌아가기</Button>
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutFailPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Suspense fallback={<div className="py-16 text-center text-gray-400">로딩 중...</div>}>
        <FailContent />
      </Suspense>
    </main>
  )
}
