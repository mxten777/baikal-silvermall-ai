'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface CartState {
  items: CartItem[]
  isLoading: boolean
  // actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string, optionKey: Record<string, string>) => void
  updateQty: (productId: string, optionKey: Record<string, string>, qty: number) => void
  clear: () => void
  syncToDb: (userId: string) => Promise<void>
  loadFromDb: (userId: string) => Promise<void>
  // 계산
  totalCount: () => number
  totalPrice: () => number
}

const isSameItem = (a: CartItem, b: CartItem) =>
  a.product_id === b.product_id &&
  JSON.stringify(a.option_key) === JSON.stringify(b.option_key)

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => isSameItem(i, newItem))
          if (existing) {
            return {
              items: state.items.map((i) =>
                isSameItem(i, newItem) ? { ...i, qty: i.qty + newItem.qty } : i
              ),
            }
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (productId, optionKey) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.product_id === productId &&
                JSON.stringify(i.option_key) === JSON.stringify(optionKey))
          ),
        }))
      },

      updateQty: (productId, optionKey, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, optionKey)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId &&
            JSON.stringify(i.option_key) === JSON.stringify(optionKey)
              ? { ...i, qty }
              : i
          ),
        }))
      },

      clear: () => set({ items: [] }),

      // 로그인 시 로컬 카트 → DB 동기화
      syncToDb: async (userId) => {
        const supabase = createClient()
        const db = supabase as any
        const localItems = get().items
        if (localItems.length === 0) return

        const { data: existing } = await db
          .from('carts')
          .select('items')
          .eq('user_id', userId)
          .single()

        const dbItems: CartItem[] = (existing?.items as CartItem[]) ?? []
        const merged = [...dbItems]

        for (const localItem of localItems) {
          const dbIdx = merged.findIndex((i) => isSameItem(i, localItem))
          if (dbIdx >= 0) {
            merged[dbIdx].qty += localItem.qty
          } else {
            merged.push(localItem)
          }
        }

        await db.from('carts').upsert(
          { user_id: userId, items: merged as unknown as Record<string, unknown>[] },
          { onConflict: 'user_id' }
        )

        set({ items: merged })
      },

      // DB에서 카트 불러오기
      loadFromDb: async (userId) => {
        set({ isLoading: true })
        const supabase = createClient()
        const db = supabase as any
        const { data } = await db
          .from('carts')
          .select('items')
          .eq('user_id', userId)
          .single()

        if (data?.items) {
          set({ items: data.items as CartItem[] })
        }
        set({ isLoading: false })
      },

      totalCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.snapshot.price * i.qty, 0),
    }),
    {
      name: 'silvermall-cart',
      // 비회원은 localStorage 유지, 로그인 후 syncToDb 호출
    }
  )
)

// 선택자 훅
export const useCartItems = () => useCartStore((s) => s.items)
export const useCartCount = () => useCartStore((s) => s.totalCount())
export const useCartTotal = () => useCartStore((s) => s.totalPrice())
