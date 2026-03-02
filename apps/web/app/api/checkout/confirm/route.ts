import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? ''
const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm'

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '필수 파라미터가 없습니다' }, { status: 400 })
    }

    // 1. Toss 결제 승인 API 호출
    const authHeader = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')
    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossRes.json()

    if (!tossRes.ok) {
      return NextResponse.json(
        { error: tossData.message ?? '결제 승인 실패' },
        { status: 400 }
      )
    }

    // 2. DB 주문 상태 업데이트
    const supabase = await createClient()
    const db = supabase as any

    await db
      .from('orders')
      .update({
        status: 'paid',
        payment_key: paymentKey,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return NextResponse.json({ success: true, orderId })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : '서버 오류'
    return NextResponse.json({ error }, { status: 500 })
  }
}
