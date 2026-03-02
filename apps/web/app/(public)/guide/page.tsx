import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: '급여 이용 가이드 — 장기요양 복지용구',
  description: '장기요양 인정자를 위한 복지용구 급여 이용 방법 안내',
}

const STEPS = [
  {
    step: '01',
    title: '장기요양 인정 신청',
    desc: '국민건강보험공단에 장기요양인정 신청 → 등급 판정 (1~5등급, 인지지원등급)',
    icon: '📋',
  },
  {
    step: '02',
    title: '복지용구 급여 확인',
    desc: '담당 사회복지사 또는 국민건강보험공단에 급여 대상 품목 및 한도 확인',
    icon: '✅',
  },
  {
    step: '03',
    title: '실버몰에서 구매/대여',
    desc: '급여 품목을 실버몰에서 선택 후 주문. 본인부담금(15%)만 결제',
    icon: '🛒',
  },
  {
    step: '04',
    title: '급여 청구',
    desc: '실버몰에서 급여비용 청구서 발급 → 국민건강보험공단에 제출 → 환급',
    icon: '💳',
  },
]

const GRADES = [
  { grade: '1등급', score: '95점 이상', note: '최중증' },
  { grade: '2등급', score: '75~95점', note: '중증' },
  { grade: '3등급', score: '60~75점', note: '중등증' },
  { grade: '4등급', score: '51~60점', note: '경증' },
  { grade: '5등급', score: '45~51점', note: '치매 특별' },
  { grade: '인지지원', score: '45점 미만', note: '인지 기능 저하' },
]

const BENEFIT_ITEMS = [
  '이동편의용구 (수동휠체어, 전동침대 등)',
  '목욕용 의자·미끄럼 방지용품',
  '욕창예방용품 (에어매트리스 등)',
  '보행보조용구 (지팡이, 보행기 등)',
  '식사 보조용품',
  '배변 처리용품',
]

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 pb-8">
      {/* 히어로 */}
      <section className="py-8 text-center">
        <Badge className="mb-3 bg-emerald-100 text-emerald-800 border-transparent">📋 급여 이용 안내</Badge>
        <h1 className="mb-2 text-2xl font-bold">장기요양 복지용구 급여</h1>
        <p className="text-muted-foreground text-sm">
          장기요양 인정서가 있으면 복지용구 비용의 <strong>최대 85%</strong>를 국가가 지원합니다
        </p>
      </section>

      {/* 혜택 강조 */}
      <section className="mb-8 rounded-xl bg-emerald-50 p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-700">연 160만원</p>
            <p className="text-xs text-emerald-600 mt-1">급여 한도</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">15%</p>
            <p className="text-xs text-emerald-600 mt-1">본인 부담</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">1~5등급</p>
            <p className="text-xs text-emerald-600 mt-1">지원 대상</p>
          </div>
        </div>
      </section>

      {/* 이용 절차 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">이용 절차</h2>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-4 rounded-xl border bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl">
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-brand-500 mb-0.5">STEP {s.step}</p>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-6" />

      {/* 장기요양 등급 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">장기요양 등급 기준</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">등급</th>
                <th className="px-4 py-3 text-left font-medium">점수</th>
                <th className="px-4 py-3 text-left font-medium">구분</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {GRADES.map((g) => (
                <tr key={g.grade}>
                  <td className="px-4 py-3 font-medium">{g.grade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.score}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{g.note}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="my-6" />

      {/* 급여 대상 품목 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">주요 급여 대상 품목</h2>
        <ul className="space-y-2">
          {BENEFIT_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <span className="text-emerald-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="rounded-xl bg-brand-50 p-5 text-center">
        <p className="mb-1 font-semibold">급여 혜택 바로 적용</p>
        <p className="mb-4 text-sm text-muted-foreground">급여 품목은 실버몰에서 바로 구매·대여할 수 있습니다</p>
        <Button asChild>
          <Link href="/store?filter=insurance">급여 품목 보러가기</Link>
        </Button>
      </div>

      {/* 고객 안내 */}
      <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1">📞 문의 안내</p>
        <p>급여 신청 및 이용에 관한 문의: 국민건강보험공단 ☎ 1577-1000</p>
        <p className="mt-0.5">실버몰 구매 관련 문의: 1:1 문의 또는 챗봇</p>
      </div>
    </div>
  )
}
