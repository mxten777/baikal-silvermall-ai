import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Ticket } from 'lucide-react'

export default async function CouponsPage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mypage/coupons')

  const { data: coupons } = await db
    .from('user_coupons')
    .select('*, coupons(code, name, discount_type, discount_value, min_order_amount, expires_at)')
    .eq('user_id', user.id)
    .eq('is_used', false)
    .order('created_at', { ascending: false })

  const couponList = (coupons ?? []) as any[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">쿠폰함</h2>
        <span className="text-sm text-gray-500">
          사용 가능 <span className="text-teal-600 font-bold">{couponList.length}</span>장
        </span>
      </div>

      {couponList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Ticket className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">보유한 쿠폰이 없어요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {couponList.map((uc: any) => {
            const c = uc.coupons
            if (!c) return null
            const expiryDate = c.expires_at
              ? new Date(c.expires_at).toLocaleDateString('ko-KR')
              : null
            const discountText =
              c.discount_type === 'percent'
                ? `${c.discount_value}% 할인`
                : `${(c.discount_value ?? 0).toLocaleString()}원 할인`

            return (
              <li key={uc.id}>
                <div className="border rounded-2xl p-4 flex items-center justify-between bg-white">
                  <div>
                    <p className="font-semibold text-teal-700">{discountText}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{c.name}</p>
                    {c.min_order_amount > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(c.min_order_amount).toLocaleString()}원 이상 구매 시
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="insurance" className="mb-1">사용 가능</Badge>
                    {expiryDate && (
                      <p className="text-xs text-gray-400">{expiryDate} 만료</p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
