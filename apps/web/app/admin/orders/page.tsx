'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Search } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '결제대기' },
  { value: 'paid', label: '결제완료' },
  { value: 'preparing', label: '준비중' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소' },
]

const NEXT_STATUS: Record<string, string> = {
  paid: 'preparing',
  preparing: 'shipped',
  shipped: 'delivered',
}

const NEXT_LABEL: Record<string, string> = {
  paid: '준비 시작',
  preparing: '배송 처리',
  shipped: '배송 완료',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'secondary',
  paid: 'default',
  preparing: 'default',
  shipped: 'insurance',
  delivered: 'best',
  cancelled: 'secondary',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const db = supabase as any

    let query = db
      .from('orders')
      .select('id, created_at, status, total_amount, shipping_address, items')
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data } = await query
    setOrders((data ?? []) as any[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId)
    const supabase = createClient()
    const db = supabase as any
    await db.from('orders').update({ status: nextStatus }).eq('id', orderId)
    await fetchOrders()
    setUpdatingId(null)
  }

  const filtered = orders.filter((o) => {
    if (!search) return true
    return o.id.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 주문 현황 및 상태 관리</p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="주문번호 검색"
            className="pl-8 w-52 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">주문번호</th>
              <th className="px-4 py-3 font-medium">주문일시</th>
              <th className="px-4 py-3 font-medium">수령인</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">금액</th>
              <th className="px-4 py-3 font-medium text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  불러오는 중...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  주문이 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const shipping = order.shipping_address as any
                const nextStatus = NEXT_STATUS[order.status]
                const nextLabel = NEXT_LABEL[order.status]

                return (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p>{shipping?.recipient ?? '-'}</p>
                      <p className="text-xs text-gray-400">{shipping?.phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(STATUS_COLOR[order.status] ?? 'secondary') as any}>
                        {STATUS_OPTIONS.find((s) => s.value === order.status)?.label ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {(order.total_amount ?? 0).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center">
                      {nextStatus && nextLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        >
                          {updatingId === order.id ? '처리중...' : nextLabel}
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
