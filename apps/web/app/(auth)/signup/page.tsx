'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function SignupPage() {
  const router   = useRouter()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone]         = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: '비밀번호 불일치', description: '비밀번호가 일치하지 않습니다.', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({ title: '회원가입 실패', description: error.message, variant: 'destructive' })
    } else {
      setDone(true)
    }
    setIsLoading(false)
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>이메일 인증 확인</CardTitle>
          <CardDescription>
            {email} 주소로 인증 메일을 보냈습니다.<br />
            이메일을 확인하고 링크를 클릭해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl">📧</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => router.push('/login')}>
            로그인 페이지로
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>회원가입</CardTitle>
        <CardDescription>실버몰 계정을 만드세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input id="phone" type="tel" placeholder="010-0000-0000" value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" placeholder="8자리 이상" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">비밀번호 확인</Label>
            <Input id="confirm" type="password" placeholder="비밀번호 재입력" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <p className="text-xs text-muted-foreground">
            가입하면{' '}
            <Link href="/terms" className="underline">이용약관</Link>과{' '}
            <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의하는 것으로 간주됩니다.
          </p>
          <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" disabled={isLoading}>
            {isLoading ? '처리 중...' : '가입하기'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="ml-1 font-medium text-brand-500 hover:underline">로그인</Link>
      </CardFooter>
    </Card>
  )
}
