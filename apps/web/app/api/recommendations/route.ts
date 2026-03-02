import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profile_id')

  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { data: popular } = await db
      .from('products')
      .select('id, slug, name, price, discount_price, is_insurance_benefit, thumbnail_url')
      .eq('status', 'active')
      .order('sales_count', { ascending: false })
      .limit(12)
    return NextResponse.json({ products: popular ?? [], type: 'popular' })
  }

  if (profileId) {
    const { data: recommended } = await db
      .rpc('get_recommended_products', { p_elder_profile_id: profileId, p_limit: 12 })
    if (recommended && recommended.length > 0) {
      return NextResponse.json({ products: recommended, type: 'personalized' })
    }
  }

  const { data: products } = await db
    .from('products')
    .select('id, slug, name, price, discount_price, is_insurance_benefit, thumbnail_url')
    .eq('status', 'active')
    .order('sales_count', { ascending: false })
    .limit(12)

  return NextResponse.json({ products: products ?? [], type: 'popular' })
}