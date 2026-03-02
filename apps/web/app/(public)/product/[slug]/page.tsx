import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { formatPrice } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db.from('products').select('name, description').eq('slug', params.slug).single()
  if (!data) return {}
  return { title: data.name, description: data.description }
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: product } = await db
    .from('products')
    .select(`
      *,
      category:categories(name, slug),
      product_images (id, url, alt_text, is_primary, sort_order)
    `)
    .eq('slug', params.slug)
    .single()

  if (!product || product.status === 'draft') notFound()

  const images: any[] = (product.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  const primaryImage = images.find((i: any) => i.is_primary) ?? images[0]
  const displayPrice = product.sale_price ?? product.price
  const discountRate = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0
  const copayAmount = Math.ceil(displayPrice * 0.15)

  return (
    <div className="mx-auto max-w-screen-lg">
      {/* 이미지 + 구매 정보 */}
      <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
        {/* 이미지 */}
        <div className="space-y-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text ?? product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">
                <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {/* 서브 이미지 썸네일 */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: any) => (
                <div key={img.id} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border">
                  <Image src={img.url} alt={img.alt_text ?? ''} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 & 구매 */}
        <div className="space-y-4">
          {/* 배지 */}
          <div className="flex flex-wrap gap-2">
            {product.is_insurance && <Badge variant="insurance">급여 품목</Badge>}
            {(product.product_type === 'rental' || product.product_type === 'both') && <Badge variant="rental">대여 가능</Badge>}
            {discountRate >= 5 && <Badge variant="new">{discountRate}% 할인</Badge>}
          </div>

          {/* 카테고리 */}
          {product.category && (
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
          )}

          {/* 상품명 */}
          <h1 className="text-xl font-bold leading-snug">{product.name}</h1>

          {/* 가격 */}
          <div className="space-y-1">
            {discountRate >= 5 && (
              <p className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</p>
            )}
            <p className="text-3xl font-bold text-brand-500">{formatPrice(displayPrice)}</p>
            {product.is_insurance && (
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-800">💡 급여 적용 시 본인부담금</p>
                <p className="text-xl font-bold text-emerald-700">{formatPrice(copayAmount)} ~</p>
                <p className="mt-1 text-xs text-emerald-600">
                  장기요양 급여 限 연 160만원 • 본인부담 15% (일반) / 9% (감경) / 6% (최저)
                </p>
              </div>
            )}
            {product.rental_price && (
              <p className="text-sm text-blue-700">대여: 월 {formatPrice(product.rental_price)}</p>
            )}
          </div>

          <Separator />

          {/* 배송 안내 */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>배송비</span>
              <span>30,000원 이상 무료 (미만 3,000원)</span>
            </div>
            <div className="flex justify-between">
              <span>예상 도착</span>
              <span>주문 후 2~3 영업일</span>
            </div>
          </div>

          <Separator />

          {/* 장바구니 / 바로구매 버튼 */}
          <AddToCartButton product={product} />
        </div>
      </div>

      {/* 상세 탭 */}
      <div className="px-4 pb-8">
        <Tabs defaultValue="detail">
          <TabsList className="w-full">
            <TabsTrigger value="detail" className="flex-1">상품 정보</TabsTrigger>
            <TabsTrigger value="care" className="flex-1">케어 정보</TabsTrigger>
            <TabsTrigger value="shipping" className="flex-1">배송/교환</TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="mt-4">
            {product.detail_html ? (
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: product.detail_html }}
              />
            ) : (
              <p className="py-8 text-center text-muted-foreground">상품 상세 정보가 없습니다.</p>
            )}
          </TabsContent>

          <TabsContent value="care" className="mt-4 space-y-3 text-sm">
            {product.care_info && typeof product.care_info === 'object' ? (
              Object.entries(product.care_info as Record<string, string>).map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="min-w-[80px] font-medium text-muted-foreground">{k}</span>
                  <span>{String(v)}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">케어 정보가 없습니다.</p>
            )}
          </TabsContent>

          <TabsContent value="shipping" className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">배송 안내</p>
            <p>• 기본 배송비: 3,000원 (30,000원 이상 무료)</p>
            <p>• 택배사: CJ대한통운, 로젠택배</p>
            <p>• 배송 기간: 주문 확인 후 2~3 영업일 이내</p>
            <p className="mt-3 font-medium text-foreground">교환 / 반품</p>
            <p>• 상품 수령일로부터 7일 이내 가능</p>
            <p>• 단순 변심 반품 시 왕복 6,000원 부담</p>
            <p>• 급여 품목 개봉 후 반품 불가</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
