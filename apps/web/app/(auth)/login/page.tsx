'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-gray-100" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router      = useRouter()
  const params      = useSearchParams()
  const next        = params.get('next') ?? '/'
  const supabase    = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({ title: '로그인 실패', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: '로그인 성공', variant: 'success' as any })
      router.push(next)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>로그인</CardTitle>
        <CardDescription>실버몰 계정으로 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/80"
          onClick={handleKakaoLogin}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-4 w-4">
            <path d="M12 3C6.48 3 2 6.92 2 11.77c0 3.05 1.77 5.74 4.49 7.35l-.97 3.61 4.07-2.68C10.27 20.02 11.12 20.1 12 20.1c5.52 0 10-3.93 10-8.77S17.52 3 12 3z" />
          </svg>
          카카오로 계속하기
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          비밀번호를 잊으셨나요?
        </Link>
        <p className="text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-brand-500 hover:underline">
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}