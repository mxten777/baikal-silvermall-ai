// Auto-generated types for Supabase Database
// Run: supabase gen types typescript --project-id <project-id> > types/database.ts
// 아래는 수동 초안 — 실제 사용 시 위 명령어로 재생성

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          name: string | null
          role: 'member' | 'admin'
          is_active: boolean
          marketing_agreed: boolean
          point_balance: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      elder_profiles: {
        Row: {
          id: string
          user_id: string
          nickname: string
          birth_year: number | null
          gender: 'M' | 'F' | null
          care_grade: 'none' | '1' | '2' | '3' | '4' | '5' | 'cognitive'
          survey: Json
          benefit_input: Json
          is_primary: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['elder_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['elder_profiles']['Insert']>
      }
      products: {
        Row: {
          id: string
          category_id: number
          brand_id: number | null
          slug: string
          name: string
          description: string | null
          detail_html: string | null
          price: number
          sale_price: number | null
          rental_price: number | null
          product_type: 'purchase' | 'rental' | 'both'
          is_insurance: boolean
          insurance_code: string | null
          status: 'draft' | 'active' | 'inactive' | 'soldout'
          shipping_info: Json
          care_info: Json
          view_count: number
          sold_count: number
          search_tsv: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'view_count' | 'sold_count' | 'search_tsv' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_no: string
          status: 'pending_payment' | 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'return_requested' | 'returned'
          subtotal: number
          shipping_fee: number
          coupon_discount: number
          points_used: number
          total: number
          shipping_address: Json
          user_coupon_id: string | null
          elder_profile_id: string | null
          memo: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_no' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
    }
    Functions: {
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
      process_payment_confirm: {
        Args: {
          p_order_id: string
          p_payment_key: string
          p_toss_raw: Json
          p_receipt_url: string | null
          p_method: string | null
          p_points_to_earn: number
        }
        Returns: void
      }
      get_recommended_products: {
        Args: {
          p_user_id: string
          p_profile_id?: string | null
          p_limit?: number
        }
        Returns: Array<{ product_id: string; match_score: number }>
      }
      process_order_cancel: {
        Args: {
          p_order_id: string
          p_admin_id: string
          p_reason?: string
        }
        Returns: void
      }
    }
    Enums: {
      user_role: 'member' | 'admin'
      order_status: 'pending_payment' | 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'return_requested' | 'returned'
      payment_status: 'pending' | 'done' | 'cancelled' | 'partial_cancelled' | 'aborted' | 'expired'
      product_status: 'draft' | 'active' | 'inactive' | 'soldout'
      product_type: 'purchase' | 'rental' | 'both'
      coupon_type: 'fixed' | 'rate'
    }
  }
}

// 편의 타입
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// 도메인 타입
export type User = Tables<'users'>
export type ElderProfile = Tables<'elder_profiles'>
export type Product = Tables<'products'>
export type Order = Tables<'orders'>

export interface ProductWithDetails extends Product {
  categories?: { id: number; name: string; slug: string }
  brands?: { id: number; name: string }
  product_images?: { id: number; url: string; alt: string | null; is_primary: boolean; sort_order: number }[]
  avg_rating?: number
  review_count?: number
}

export interface CartItem {
  product_id: string
  option_key: Record<string, string>
  qty: number
  snapshot: {
    name: string
    price: number
    image_url: string
    is_insurance: boolean
    slug: string
  }
}

export interface ShippingAddress {
  recipient: string
  phone: string
  zip_code: string
  address1: string
  address2?: string
  request?: string
}

export interface SurveyData {
  mobility: 'low' | 'medium' | 'high'
  bedsore_risk: 'high' | 'medium' | 'low'
  toileting: 'full' | 'partial' | 'independent'
  meal: 'full' | 'partial' | 'independent'
  cognitive: 'yes' | 'no'
}

export interface BenefitInput {
  annual_limit: number      // 연간 급여 한도 (원)
  used_amount: number       // 이미 사용한 금액
  self_pay_rate: number     // 본인 부담률 (%, 보통 15)
}
