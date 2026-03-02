import { createClient } from '@/lib/supabase/server'
import {
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

async function getStats() {
  const supabase = await createClient()
  const db = supabase as any

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalOrders },
    { count: todayOrders },
    { count: totalUsers },
    { data: revenueData },
    { count: pendingOrders },
  ] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }),
    db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('orders').select('total_amount').eq('status', 'paid'),
    db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['paid', 'preparing']),
  ])

  const totalRevenue = ((revenueData ?? []) as any[]).reduce(
    (sum: number, o: any) => sum + (o.total_amount ?? 0),
    0
  )

  return {
    totalOrders: totalOrders ?? 0,
    todayOrders: todayOrders ?? 0,
    totalUsers: totalUsers ?? 0,
    totalRevenue,
    pendingOrders: pendingOrders ?? 0,
  }
}

async function getRecentOrders() {
  const supabase = await createClient()
  const db = supabase as any

  const { data } = await db
    .from('orders')
    .select('id, created_at, status, total_amount, user_id')
    .order('created_at', { ascending: false })
    .limit(10)

  return (data ?? []) as any[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: '결제대기',
  paid: '결제완료',
  preparing: '준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  preparing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()])

  const statCards = [
    {
      label: '총 주문',
      value: `${stats.totalOrders.toLocaleString()}건`,
      sub: `오늘 ${stats.todayOrders}건`,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: '총 회원',
      value: `${stats.totalUsers.toLocaleString()}명`,
      sub: '누적',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: '누적 매출',
      value: `${stats.totalRevenue.toLocaleString()}원`,
      sub: '결제완료 기준',
      icon: TrendingUp,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      label: '처리 대기',
      value: `${stats.pendingOrders}건`,
      sub: '결제완료+준비중',
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">실버몰 운영 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold text-lg mb-4">최근 주문</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">주문번호</th>
                <th className="pb-3 font-medium">주문일시</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs text-gray-500 truncate max-w-[140px]">
                    {order.id}
                  </td>
                  <td className="py-3 text-gray-600">
                    {new Date(order.created_at).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {(order.total_amount ?? 0).toLocaleString()}원
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    주문 내역이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
