import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InsertDto } from '@/types/database'
import { z } from 'zod'

const PrepareSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    option_key: z.record(z.string()),
    qty: z.number().int().positive(),
    snapshot: z.object({
      name: z.string(),
      price: z.number(),
      image_url: z.string(),
      is_insurance: z.boolean(),
      slug: z.string(),
    }),
  })).min(1),
  shipping_address: z.object({
    recipient: z.string().min(1),
    phone: z.string().min(1),
    zip_code: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
    request: z.string().optional(),
  }),
  user_coupon_id: z.string().uuid().optional().nullable(),
  points_used: z.number().int().min(0).optional().default(0),
  elder_profile_id: z.string().uuid().optional().nullable(),
  memo: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  let body: z.infer<typeof PrepareSchema>
  try {
    body = PrepareSchema.parse(await request.json())
  } catch (e) {
    return NextResponse.json({ error: '잘못된 요청입니다.', detail: e }, { status: 400 })
  }

  const { items, shipping_address, user_coupon_id, points_used, elder_profile_id, memo } = body

  const productIds = [...new Set(items.map((i) => i.product_id))]
  const { data: products } = await db
    .from('products')
    .select('id, price, discount_price, status')
    .in('id', productIds)
    .eq('status', 'active')

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: '구매 불가한 상품이 포함되어 있습니다.' }, { status: 400 })
  }

  const subtotal = items.reduce((sum: number, item: any) => {
    const product = products.find((p: any) => p.id === item.product_id)
    const price = product?.discount_price ?? product?.price ?? 0
    return sum + price * item.qty
  }, 0)

  const SHIPPING_FREE_THRESHOLD = 30_000
  const SHIPPING_FEE = 3_000
  const shippingFee = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE

  let couponDiscount = 0
  if (user_coupon_id) {
    const { data: uc } = await db
      .from('user_coupons')
      .select('coupon_id, used_at, coupons (type, discount_value, min_order_amount, max_discount_amount)')
      .eq('id', user_coupon_id)
      .eq('user_id', user.id)
      .is('used_at', null)
      .single()
    if (uc?.coupons) {
      const coupon = uc.coupons as any
      if (subtotal >= coupon.min_order_amount) {
        couponDiscount = coupon.type === 'fixed'
          ? coupon.discount_value
          : Math.min(Math.floor(subtotal * (coupon.discount_value / 100)), coupon.max_discount_amount ?? Infinity)
      }
    }
  }

  const { data: userData } = await db.from('users').select('point_balance').eq('id', user.id).single()
  const maxPointsUsable = Math.min(points_used ?? 0, userData?.point_balance ?? 0)
  const total = Math.max(subtotal + shippingFee - couponDiscount - maxPointsUsable, 0)

  const orderInsert: InsertDto<'orders'> = {
    user_id: user.id,
    status: 'pending_payment',
    subtotal,
    shipping_fee: shippingFee,
    coupon_discount: couponDiscount,
    points_used: maxPointsUsable,
    total,
    shipping_address: shipping_address as any,
    user_coupon_id: user_coupon_id ?? null,
    elder_profile_id: elder_profile_id ?? null,
    memo: memo ?? null,
    paid_at: null,
  }

  const { data: order, error: orderErr } = await db
    .from('orders').insert(orderInsert).select('id, order_no, total').single()

  if (orderErr || !order) {
    console.error('주문 생성 실패:', orderErr)
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
  }

  const orderItems = items.map((item: any) => {
    const product = products.find((p: any) => p.id === item.product_id)
    return {
      order_id: order.id,
      product_id: item.product_id,
      option_key: item.option_key,
      qty: item.qty,
      unit_price: product?.discount_price ?? product?.price ?? item.snapshot.price,
      product_snapshot: item.snapshot,
    }
  })

  const { error: itemsErr } = await db.from('order_items').insert(orderItems)
  if (itemsErr) {
    await db.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: '주문 아이템 저장 실패' }, { status: 500 })
  }

  await db.from('payments').insert({
    order_id: order.id,
    provider: 'toss',
    amount: order.total,
    status: 'pending',
    order_id_pg: order.order_no,
  })

  return NextResponse.json({
    orderId: order.order_no,
    orderDbId: order.id,
    amount: order.total,
    orderName: items.length === 1 ? items[0].snapshot.name : `${items[0].snapshot.name} 외 ${items.length - 1}건`,
  })
}