import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui 표준 className 병합 유틸 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 숫자를 한국 원(₩) 포맷으로 변환 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원'
}

/** 날짜를 'YYYY.MM.DD' 포맷으로 변환 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '')
}

/** 주문 상태 한글 변환 */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: '결제대기',
  paid:            '결제완료',
  preparing:       '배송준비',
  shipping:        '배송중',
  delivered:       '배송완료',
  cancelled:       '취소',
  return_requested:'반품신청',
  returned:        '반품완료',
}

/** 배송비 계산 */
export function calcShippingFee(subtotal: number): number {
  return subtotal >= 30_000 ? 0 : 3_000
}

/** 쿠폰 할인금액 계산 */
export function calcCouponDiscount(
  coupon: { type: 'fixed' | 'rate'; discount_value: number; max_discount_amount?: number | null },
  subtotal: number
): number {
  if (coupon.type === 'fixed') return coupon.discount_value
  const rate = Math.floor(subtotal * (coupon.discount_value / 100))
  return coupon.max_discount_amount ? Math.min(rate, coupon.max_discount_amount) : rate
}

/** 복지용구 급여 본인부담금 계산 */
export function calcSelfPayAmount(price: number, selfPayRate: number): number {
  return Math.ceil(price * (selfPayRate / 100))
}

