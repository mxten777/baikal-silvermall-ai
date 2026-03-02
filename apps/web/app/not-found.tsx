import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground text-sm mb-6">
        주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/store">상품 보러가기</Link>
        </Button>
      </div>
    </div>
  )
}
