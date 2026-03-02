import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'

export default async function PointsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mypage/points')

  const { data: profile } = await db
    .from('profiles')
    .select('point_balance')
    .eq('id', user.id)
    .single()

  const { data: history } = await db
    .from('point_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const balance = profile?.point_balance ?? 0
  const historyList = (history ?? []) as any[]

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-lg">적립금</h2>

      {/* 잔액 카드 */}
      <div className="bg-teal-600 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80 mb-1">사용 가능 적립금</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()}<span className="text-lg ml-1">원</span></p>
        </div>
        <Coins className="w-10 h-10 opacity-60" />
      </div>

      {/* 적립/사용 내역 */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-600">적립/사용 내역</h3>

        {historyList.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            포인트 내역이 없어요
          </div>
        ) : (
          <ul className="space-y-2">
            {historyList.map((item: any) => {
              const isEarn = item.amount > 0
              const date = new Date(item.created_at).toLocaleDateString('ko-KR')
              return (
                <li key={item.id} className="border rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isEarn ? (
                      <TrendingUp className="w-4 h-4 text-teal-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.description ?? (isEarn ? '적립' : '사용')}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${isEarn ? 'text-teal-600' : 'text-red-400'}`}>
                    {isEarn ? '+' : ''}{item.amount.toLocaleString()}원
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
