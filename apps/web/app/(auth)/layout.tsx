import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-2xl font-bold text-brand-500">실버몰</span>
        <span className="text-xs text-muted-foreground">복지용구 전문 쇼핑몰</span>
      </Link>
      {children}
    </div>
  )
}
