import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { User, Mail, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function MypagePage() {
  const supabase = await createClient()
  const db = supabase as any

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/mypage')

  // users 테이블에서 프로필 조회 (profiles → users)
  const { data: profile } = await db
    .from('users')
    .select('name, phone, marketing_agreed, point_balance, role')
    .eq('id', user.id)
    .single()

  // 주문 수 / 쿠폰 수 병렬 조회
  const [{ count: orderCount }, { count: couponCount }] = await Promise.all([
    db.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('user_coupons').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_used', false),
  ])

  const joinedAt = new Date(user.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* 프로필 카드 */}
      <div className="border rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
          <User className="w-8 h-8 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">
            {profile?.name ?? user.email?.split('@')[0]}
          </h2>
          <div className="flex flex-col gap-1 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {joinedAt} 가입
            </span>
          </div>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '주문', value: orderCount ?? 0, unit: '건' },
          { label: '쿠폰', value: couponCount ?? 0, unit: '장' },
          { label: '적립금', value: (profile?.point_balance ?? 0).toLocaleString(), unit: '원' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="border rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold text-teal-700">
              {value}
              <span className="text-sm font-normal text-gray-500 ml-0.5">{unit}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 빠른 메뉴 */}
      <div className="border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">내 정보 관리</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="py-2 border-b last:border-0">
            <span className="font-medium">이름</span>
            <span className="float-right text-gray-500">
              {profile?.name ?? '미설정'}
            </span>
          </li>
          <li className="py-2 border-b last:border-0">
            <span className="font-medium">휴대폰</span>
            <span className="float-right text-gray-500">
              {profile?.phone ?? '미설정'}
            </span>
          </li>
          <li className="py-2">
            <span className="font-medium">이메일 수신</span>
            <span className="float-right">
              {profile?.marketing_agreed ? (
                <Badge variant="default" className="text-xs">동의</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">미동의</Badge>
              )}
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

