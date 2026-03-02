'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Pencil, Eye, EyeOff } from 'lucide-react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const db = supabase as any

    const { data } = await db
      .from('products')
      .select(
        'id, name, slug, price, sale_price, is_insurance, is_active, sold_count, product_images(url, is_primary), brands(name), categories(name)'
      )
      .order('created_at', { ascending: false })
      .limit(100)

    setProducts((data ?? []) as any[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const toggleActive = async (id: string, current: boolean) => {
    setTogglingId(id)
    const supabase = createClient()
    const db = supabase as any
    await db.from('products').update({ is_active: !current }).eq('id', id)
    await fetchProducts()
    setTogglingId(null)
  }

  const filtered = products.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {products.length}개 상품</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          상품 등록
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          placeholder="상품명 검색"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">카테고리</th>
              <th className="px-4 py-3 font-medium">급여</th>
              <th className="px-4 py-3 font-medium text-right">정가</th>
              <th className="px-4 py-3 font-medium text-right">판매가</th>
              <th className="px-4 py-3 font-medium text-right">판매수</th>
              <th className="px-4 py-3 font-medium text-center">상태</th>
              <th className="px-4 py-3 font-medium text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  불러오는 중...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-gray-400">
                  상품이 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const primaryImage = (product.product_images ?? []).find(
                  (img: any) => img.is_primary
                ) ?? product.product_images?.[0]

                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {primaryImage?.url ? (
                            <Image
                              src={primaryImage.url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                              없음
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1 max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brands?.name ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {product.categories?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {product.is_insurance ? (
                        <Badge variant="insurance" className="text-xs">급여</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">비급여</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {(product.price ?? 0).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-teal-700">
                      {(product.sale_price ?? product.price ?? 0).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(product.sold_count ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {product.is_active ? '판매중' : '숨김'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7"
                          title={product.is_active ? '숨기기' : '표시'}
                          disabled={togglingId === product.id}
                          onClick={() => toggleActive(product.id, product.is_active)}
                        >
                          {product.is_active ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
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
