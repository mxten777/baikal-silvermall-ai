import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: users } = await db
    .from('profiles')
    .select('id, full_name, phone, role, point_balance, order_count, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const userList = (users ?? []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <p className="text-sm text-gray-500 mt-1">총 {userList.length}명</p>
      </div>

      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">회원</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">권한</th>
              <th className="px-4 py-3 font-medium text-right">주문수</th>
              <th className="px-4 py-3 font-medium text-right">적립금</th>
              <th className="px-4 py-3 font-medium">가입일</th>
            </tr>
          </thead>
          <tbody>
            {userList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  회원이 없습니다
                </td>
              </tr>
            ) : (
              userList.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name ?? '이름 미설정'}</p>
                        <p className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone ?? '-'}</td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">관리자</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">일반</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{(user.order_count ?? 0)}건</td>
                  <td className="px-4 py-3 text-right">
                    {(user.point_balance ?? 0).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
