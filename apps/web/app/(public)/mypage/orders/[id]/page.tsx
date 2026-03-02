import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Phone } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
  refunded: '환불',
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/mypage/orders/${params.id}`)

  const { data: order } = await db
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const items = (order.items ?? []) as any[]
  const shipping = order.shipping_address as any
  const date = new Date(order.created_at).toLocaleString('ko-KR')
  const paidDate = order.paid_at
    ? new Date(order.paid_at).toLocaleString('ko-KR')
    : null

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/mypage/orders">
          <Button variant="ghost" size="icon" aria-label="뒤로">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-semibold text-lg">주문 상세</h2>
          <p className="text-xs text-gray-400">주문번호: {order.id}</p>
        </div>
        <div className="ml-auto">
          <Badge>{STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
      </div>

      {/* 주문 상품 */}
      <section className="border rounded-2xl p-5 space-y-4">
        <h3 className="font-medium">주문 상품</h3>
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {item.snapshot?.image_url ? (
                <Image
                  src={item.snapshot.image_url}
                  alt={item.snapshot.name ?? '상품'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  이미지
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">
                {item.snapshot?.name ?? '상품명 없음'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                수량: {item.qty}개
              </p>
              <p className="text-sm font-bold text-teal-700 mt-1">
                {((item.snapshot?.price ?? 0) * item.qty).toLocaleString()}원
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* 배송 정보 */}
      {shipping && (
        <section className="border rounded-2xl p-5 space-y-3">
          <h3 className="font-medium">배송지 정보</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{shipping.recipient} · {shipping.phone}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span>
                ({shipping.zip_code}) {shipping.address1}
                {shipping.address2 && ` ${shipping.address2}`}
              </span>
            </div>
            {shipping.request && (
              <p className="text-xs text-gray-400 pl-6">요청: {shipping.request}</p>
            )}
          </div>
        </section>
      )}

      {/* 결제 정보 */}
      <section className="border rounded-2xl p-5 space-y-3">
        <h3 className="font-medium">결제 정보</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>주문일시</span>
            <span>{date}</span>
          </div>
          {paidDate && (
            <div className="flex justify-between">
              <span>결제일시</span>
              <span>{paidDate}</span>
            </div>
          )}
          {order.payment_key && (
            <div className="flex justify-between">
              <span>결제키</span>
              <span className="text-xs text-gray-400 truncate max-w-[180px]">
                {order.payment_key}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-base">
          <span>총 결제금액</span>
          <span className="text-teal-700">
            {(order.total_amount ?? 0).toLocaleString()}원
          </span>
        </div>
      </section>

      {/* 주문 취소 (pending / paid 만) */}
      {['pending', 'paid'].includes(order.status) && (
        <div className="text-center">
          <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
            주문 취소 신청
          </Button>
        </div>
      )}
    </div>
  )
}
