import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Package } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
  refunded: '환불',
}

const STATUS_VARIANT: Record<string, string> = {
  pending: 'secondary',
  paid: 'default',
  preparing: 'default',
  shipped: 'insurance',
  delivered: 'best',
  cancelled: 'secondary',
  refunded: 'secondary',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mypage/orders')

  const { data: orders } = await db
    .from('orders')
    .select('id, created_at, status, total_amount, items')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const orderList = (orders ?? []) as any[]

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">주문 내역</h2>

      {orderList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">아직 주문 내역이 없어요</p>
          <Link href="/store" className="text-sm text-teal-600 underline">
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orderList.map((order) => {
            const date = new Date(order.created_at).toLocaleDateString('ko-KR')
            const firstItem = order.items?.[0]
            const moreCount = (order.items?.length ?? 1) - 1
            const statusVariant = STATUS_VARIANT[order.status] ?? 'secondary'

            return (
              <li key={order.id}>
                <Link href={`/mypage/orders/${order.id}`}>
                  <div className="border rounded-2xl p-4 hover:border-teal-400 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">{date}</span>
                      <Badge variant={statusVariant as any}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium line-clamp-1 flex-1 mr-2">
                        {firstItem?.snapshot?.name ?? '상품'}
                        {moreCount > 0 && (
                          <span className="text-gray-400"> 외 {moreCount}건</span>
                        )}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                    <p className="text-base font-bold text-teal-700 mt-1">
                      {(order.total_amount ?? 0).toLocaleString()}원
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
