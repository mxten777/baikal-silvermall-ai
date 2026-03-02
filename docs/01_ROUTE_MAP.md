# 라우트 맵 (Next.js App Router)

> 규칙: `(group)` = 레이아웃 그룹, `[slug]` = 동적 세그먼트

---

## Public / Store

| 경로 | 파일 | 설명 | 렌더링 |
|---|---|---|---|
| `/` | `app/(public)/page.tsx` | 메인(히어로/인기상품/카테고리/가이드) | ISR 60s |
| `/store` | `app/(public)/store/page.tsx` | 스토어 전체(카테고리 탭+필터+리스트) | SSR+캐시 |
| `/store/[category]` | `app/(public)/store/[category]/page.tsx` | 카테고리별 상품 목록 | SSR+캐시 |
| `/product/[slug]` | `app/(public)/product/[slug]/page.tsx` | 상품 상세 | ISR 60s |
| `/search` | `app/(public)/search/page.tsx` | 검색결과 (q, filter) | SSR |
| `/guide` | `app/(public)/guide/page.tsx` | 가이드 메인 | ISR 300s |
| `/guide/[slug]` | `app/(public)/guide/[slug]/page.tsx` | 가이드 아티클 | ISR 300s |
| `/notice` | `app/(public)/notice/page.tsx` | 공지사항 목록 | ISR 60s |
| `/notice/[id]` | `app/(public)/notice/[id]/page.tsx` | 공지사항 상세 | ISR 60s |
| `/event` | `app/(public)/event/page.tsx` | 이벤트/기획전 목록 | ISR 60s |

---

## Auth

| 경로 | 파일 | 설명 |
|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | 로그인 |
| `/signup` | `app/(auth)/signup/page.tsx` | 회원가입 |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | 비밀번호 재설정 요청 |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | 비밀번호 재설정 (magic link) |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase Auth 콜백 |

---

## 장바구니 / 체크아웃 (인증 필요)

| 경로 | 파일 | 설명 |
|---|---|---|
| `/cart` | `app/(shop)/cart/page.tsx` | 장바구니 |
| `/checkout` | `app/(shop)/checkout/page.tsx` | 주문서 작성 |
| `/checkout/complete` | `app/(shop)/checkout/complete/page.tsx` | 결제 완료 |
| `/checkout/fail` | `app/(shop)/checkout/fail/page.tsx` | 결제 실패 |

---

## 마이페이지 (인증 필요)

| 경로 | 파일 | 설명 |
|---|---|---|
| `/mypage` | `app/(mypage)/mypage/page.tsx` | 마이페이지 홈(요약) |
| `/mypage/orders` | `app/(mypage)/mypage/orders/page.tsx` | 주문 목록 |
| `/mypage/orders/[orderId]` | `.../orders/[orderId]/page.tsx` | 주문 상세 + 배송추적 |
| `/mypage/orders/[orderId]/return` | `.../orders/[orderId]/return/page.tsx` | 교환·반품 신청 |
| `/mypage/reviews` | `.../reviews/page.tsx` | 내 리뷰 목록 |
| `/mypage/reviews/write/[orderItemId]` | `.../reviews/write/[orderItemId]/page.tsx` | 리뷰 작성 |
| `/mypage/inquiries` | `.../inquiries/page.tsx` | 상품 문의 내역 |
| `/mypage/wishlist` | `.../wishlist/page.tsx` | 관심상품 |
| `/mypage/coupons` | `.../coupons/page.tsx` | 쿠폰함 |
| `/mypage/points` | `.../points/page.tsx` | 적립금 내역 |
| `/mypage/addresses` | `.../addresses/page.tsx` | 배송지 관리 |
| `/mypage/profiles` | `.../profiles/page.tsx` | 어르신 프로필 목록 |
| `/mypage/profiles/new` | `.../profiles/new/page.tsx` | 어르신 프로필 등록 |
| `/mypage/profiles/[profileId]` | `.../profiles/[profileId]/page.tsx` | 어르신 프로필 수정 |
| `/mypage/notifications` | `.../notifications/page.tsx` | 알림 내역 |
| `/mypage/account` | `.../account/page.tsx` | 계정 설정 / 탈퇴 |

---

## 어드민 (admin role 필요)

| 경로 | 파일 | 설명 |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | 대시보드 (KPI 요약) |
| `/admin/products` | `.../products/page.tsx` | 상품 목록/검색 |
| `/admin/products/new` | `.../products/new/page.tsx` | 상품 등록 |
| `/admin/products/[id]` | `.../products/[id]/page.tsx` | 상품 수정 |
| `/admin/products/[id]/inventory` | `.../products/[id]/inventory/page.tsx` | 재고/가격 관리 |
| `/admin/orders` | `.../orders/page.tsx` | 주문 목록 (필터/검색) |
| `/admin/orders/[id]` | `.../orders/[id]/page.tsx` | 주문 상세 + 상태전환 + 송장등록 |
| `/admin/coupons` | `.../coupons/page.tsx` | 쿠폰 목록 |
| `/admin/coupons/new` | `.../coupons/new/page.tsx` | 쿠폰 발행 |
| `/admin/points` | `.../points/page.tsx` | 적립금 수동 지급 |
| `/admin/users` | `.../users/page.tsx` | 회원 목록/상세 |
| `/admin/banners` | `.../banners/page.tsx` | 배너 관리 |
| `/admin/guides` | `.../guides/page.tsx` | 가이드 CMS 목록 |
| `/admin/guides/new` | `.../guides/new/page.tsx` | 가이드 작성 |
| `/admin/guides/[id]` | `.../guides/[id]/page.tsx` | 가이드 수정 |
| `/admin/notices` | `.../notices/page.tsx` | 공지사항 관리 |
| `/admin/inquiries` | `.../inquiries/page.tsx` | 문의 목록 + 답변 |
| `/admin/reviews` | `.../reviews/page.tsx` | 리뷰 목록 + 숨김/신고 |
| `/admin/categories` | `.../categories/page.tsx` | 카테고리 CRUD |
| `/admin/audit-logs` | `.../audit-logs/page.tsx` | 감사 로그 |

---

## API Routes (Next.js Route Handlers)

| 경로 | 설명 |
|---|---|
| `app/api/recommendations/route.ts` | 프로필 기반 추천 상품 (규칙 엔진) |
| `app/api/search/route.ts` | 검색 프록시 |
| `app/api/cart/sync/route.ts` | 장바구니 비회원→회원 동기화 |
| `app/api/wishlist/route.ts` | 위시리스트 토글 |
| `app/api/reviews/[id]/image/route.ts` | 리뷰 이미지 signed URL |

## Supabase Edge Functions

| Function | 경로에서 호출 |
|---|---|
| `payments-toss-confirm` | `/checkout/complete` 리다이렉트 처리 시 |
| `webhooks-toss` | Toss 서버 → Supabase |
| `admin-orders-ship` | `/admin/orders/[id]` 송장 등록 |

---

## 하단 탭바 (모바일 전용)

```
홈(/) | 스토어(/store) | 이벤트(/event) | 가이드(/guide) | 내정보(/mypage)
```

---

## 미들웨어 보호 규칙 (`middleware.ts`)

```ts
// 인증 필요
protected:  /checkout/*, /mypage/*, /admin/*

// admin role 필요 (JWT custom claim: role === 'admin')
admin_only: /admin/*

// 이미 로그인 시 리다이렉트
auth_pages:  /login, /signup
```
