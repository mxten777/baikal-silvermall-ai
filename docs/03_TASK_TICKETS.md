# 우선 구현 10개 작업 티켓

> Sprint 1 (Week 1~2) 기준 | 완료 기준(DoD) 명시

---

## TICKET-001: Supabase 프로젝트 초기화 + DB 마이그레이션
**담당**: 백엔드/DB  
**예상**: 0.5일  
**Priority**: P0 (모든 것의 기반)

### 작업 목록
- [ ] Supabase 프로젝트 생성 (staging / production 분리)
- [ ] `pg_bigm` 확장 활성화
- [ ] `supabase/migrations/001~004` SQL 순서대로 실행
- [ ] Supabase Storage 버킷 생성: `product-images`(public), `review-images`(private), `guide-images`(public)
- [ ] `.env.local` 환경 변수 설정:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  TOSS_CLIENT_KEY=
  TOSS_SECRET_KEY=
  NEXT_PUBLIC_TOSS_CLIENT_KEY=
  SENTRY_DSN=
  ```
- [ ] 시드 데이터 실행 (`003_seed_data.sql`)
- [ ] RLS 정책 동작 확인 (Supabase Dashboard Table Editor에서 anonymous/user/admin 역할 테스트)

**완료 기준**: `supabase db push` 성공 + 시드 30개 상품 확인 + RLS Test 통과

---

## TICKET-002: Next.js 앱 뼈대 + 레이아웃 시스템
**담당**: 프론트엔드  
**예상**: 1일  
**Priority**: P0

### 작업 목록
- [ ] `npx create-next-app@latest apps/web --typescript --tailwind --app`
- [ ] shadcn/ui 설치 + 컴포넌트 초기화: `button, input, dialog, sheet, badge, card, tabs, skeleton, toast`
- [ ] TanStack Query 설정 (`QueryClientProvider`)
- [ ] Supabase 클라이언트 설정 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] 루트 레이아웃: `Header` (로고+검색+회원/장바구니 아이콘), `Footer`, 모바일 `TabBar`
- [ ] `middleware.ts`: 인증 보호 라우트 + admin role 검증
- [ ] Sentry 초기화
- [ ] `app/(public)/page.tsx`: Hero 섹션(히어로 이미지+CTA) + 카테고리 그리드 + 인기상품 플레이스홀더

**완료 기준**: `npm run dev` 정상 기동 + 메인 페이지 렌더링 + 모바일 탭바 표시

---

## TICKET-003: 상품 목록 + 상세 페이지
**담당**: 풀스택  
**예상**: 2일  
**Priority**: P0

### 작업 목록
- [ ] `app/(public)/store/page.tsx`: 카테고리 탭 + 필터 사이드바(Sheet) + 상품 그리드
  - 필터: 가격범위(슬라이더), 구매/대여, 급여품목, 정렬(최신/인기/저가/고가)
- [ ] `ProductCard` 컴포넌트: 이미지/이름/가격/급여뱃지/리뷰평점/장바구니 버튼
- [ ] Infinite scroll (react-intersection-observer + TanStack Query `useInfiniteQuery`)
- [ ] `app/(public)/product/[slug]/page.tsx`:
  - 이미지 갤러리 (swiper or embla)
  - 옵션 선택 + 수량 + 재고 표시
  - 배송비 계산 표시 (무료/3,000원)
  - 탭: 상품정보 / Q&A / 리뷰
  - 추천상품 섹션 (같은 카테고리 4개)
- [ ] `generateStaticParams` + ISR 60s
- [ ] `generateMetadata` (OG tags)

**완료 기준**: 카테고리 필터 동작 + 상품 클릭 시 상세 로딩 + SEO 메타태그 확인

---

## TICKET-004: Auth 플로우 (회원가입/로그인/프로필)
**담당**: 풀스택  
**예상**: 1일  
**Priority**: P0

### 작업 목록
- [ ] `app/(auth)/login/page.tsx`: 이메일+패스워드 로그인 폼 (shadcn Form + zod)
- [ ] `app/(auth)/signup/page.tsx`: 이름+이메일+패스워드+약관동의
- [ ] Supabase Auth `onAuthStateChange` 구독 → users 테이블 upsert 트리거
  ```sql
  -- auth trigger: new user → public.users INSERT
  CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```
- [ ] `app/(auth)/forgot-password/page.tsx` + reset-password 페이지
- [ ] `app/auth/callback/route.ts` (PKCE 핸들러)
- [ ] useUser hook (zustand or context)

**완료 기준**: 회원가입 → 로그인 → 헤더 아이콘 변경 확인 + 비밀번호 리셋 이메일 수신

---

## TICKET-005: 장바구니 + 어드민 상품 CRUD
**담당**: 풀스택  
**예상**: 2일  
**Priority**: P0

### 장바구니
- [ ] `useCart` 훅: 비회원(localStorage) / 회원(DB carts 테이블) 동기화
- [ ] `app/(shop)/cart/page.tsx`: 아이템 목록/수량 변경/삭제/소계 표시
- [ ] 로그인 시 로컬 카트 → DB 합병 로직

### 어드민 상품 CRUD
- [ ] `app/admin/products/page.tsx`: 목록(테이블), 검색, 필터(상태/카테고리)
- [ ] `app/admin/products/new/page.tsx`: 폼 (이름/카테고리/브랜드/가격/타입/급여여부/상태)
  - 이미지 업로드: Supabase Storage `product-images` 버킷
  - 옵션/재고 동적 추가 UI
- [ ] `app/admin/products/[id]/page.tsx`: 수정 폼
- [ ] Admin 감사 로그 INSERT (상품 생성/수정 시 `admin_audit_logs`)

**완료 기준**: 상품 등록 → 이미지 업로드 확인 → 스토어에서 상품 표시 확인 + 장바구니 담기/삭제

---

## TICKET-006: 체크아웃 + Toss Payments 결제
**담당**: 풀스택  
**예상**: 2일  
**Priority**: P0

### 작업 목록
- [ ] `app/(shop)/checkout/page.tsx`:
  - 배송지 선택/새 배송지 입력
  - 주문상품 요약
  - 쿠폰 적용 (쿠폰코드 입력 or 보유 쿠폰 모달)
  - 적립금 사용 (최대 사용 가능 금액 표시)
  - 결제 수단 선택 (카드/가상계좌)
  - 최종 금액 계산
- [ ] `POST /api/checkout/prepare` route: 주문 생성 + payments 레코드 생성
- [ ] Toss SDK 로드 (`@tosspayments/payment-widget-sdk`)
- [ ] successUrl: `app/(shop)/checkout/complete/page.tsx`
  - `supabase.functions.invoke('payments-toss-confirm')` 호출
  - 결과 표시 (주문번호/결제금액/적립금)
- [ ] failUrl: `app/(shop)/checkout/fail/page.tsx`
- [ ] Edge Function `payments-toss-confirm` 배포 + 시크릿 설정

**완료 기준**: 테스트 카드로 결제 → 주문 상태 paid → 마이페이지 주문 목록 표시

---

## TICKET-007: 마이페이지 (주문/배송/리뷰/문의)
**담당**: 프론트엔드  
**예상**: 2일  
**Priority**: P1

### 작업 목록
- [ ] `app/(mypage)/mypage/orders/page.tsx`: 기간 필터 + 상태 탭 + 주문카드
- [ ] `app/(mypage)/mypage/orders/[orderId]/page.tsx`: 상품/배송지/결제정보/배송추적 링크
- [ ] `app/(mypage)/mypage/orders/[orderId]/return/page.tsx`: 교환·반품 신청 폼
- [ ] `app/(mypage)/mypage/reviews/write/[orderItemId]/page.tsx`: 별점 + 텍스트 + 이미지 업로드(최대 3장)
- [ ] `app/(mypage)/mypage/inquiries/page.tsx` + 문의 작성 모달
- [ ] `app/(mypage)/mypage/coupons/page.tsx`: 사용가능/사용완료/만료 탭
- [ ] `app/(mypage)/mypage/points/page.tsx`: 잔액 + 원장 목록
- [ ] `app/(mypage)/mypage/addresses/page.tsx`: CRUD + 기본배송지 설정
- [ ] `app/(mypage)/mypage/profiles/page.tsx`: 어르신 프로필 CRUD

**완료 기준**: 주문 후 마이페이지 → 주문확인 → 리뷰 작성 → 적립금 반영 확인

---

## TICKET-008: 어드민 주문 관리 + 배송 처리
**담당**: 풀스택  
**예상**: 1.5일  
**Priority**: P1

### 작업 목록
- [ ] `app/admin/orders/page.tsx`: 데이터 테이블 (상태/날짜/주문번호 필터, CSV export 옵션)
- [ ] `app/admin/orders/[id]/page.tsx`:
  - 주문정보/결제정보/배송지/아이템 상세
  - 상태 전환 버튼 (결제완료→배송준비→배송중→완료 / 취소/반품)
  - 송장 등록 폼 (택배사+운송장번호) → `admin-orders-ship` Edge Function 호출
  - 취소/환불 처리 → `process_order_cancel` RPC 호출 + Toss 취소 API 호출
- [ ] Edge Function `admin-orders-ship` 배포
- [ ] 감사 로그 페이지 (`app/admin/audit-logs/page.tsx`)

**완료 기준**: 어드민에서 주문 상태 변경 → 사용자 알림 수신 → 감사로그 기록 확인

---

## TICKET-009: 프로필 기반 추천 + 복지용구 정보
**담당**: 풀스택  
**예상**: 1일  
**Priority**: P1

### 작업 목록
- [ ] `app/(mypage)/mypage/profiles/new/page.tsx`: 설문 UI
  - 생년도/성별/요양등급 선택
  - 거동 상태 | 욕창 위험도 | 배변 도움 | 식사 도움 | 인지 저하 (라디오/토글)
  - 급여 한도 입력 (연간 한도/이미 사용액/본인부담률)
- [ ] `app/api/recommendations/route.ts`: `get_recommended_products` RPC 호출 → 결과 캐시 (60초)
- [ ] 메인 히어로 섹션: 프로필 등록 유도 CTA + 등록 시 맞춤 추천 표시
- [ ] 상품 상세 → `care_info.suitable_grades` / `target_conditions` 표시 배지
- [ ] 급여한도 안내 계산기 컴포넌트:
  ```
  구매 예정 금액: X원
  연간 잔여 한도: Y원
  실 부담금(15%) = X * 0.15
  한도 초과분 전액 본인 부담
  ```

**완료 기준**: 프로필 등록 → 메인 페이지 추천 상품 변화 확인

---

## TICKET-010: QA / 보안 / 성능 / SEO / 배포
**담당**: 전체  
**예상**: 3일 (Week 4)  
**Priority**: P1

### 보안
- [ ] RLS 정책 전체 재검증 (Supabase Inspector 활용)
- [ ] `payments.raw` 에 카드번호 전체/개인정보 미포함 확인
- [ ] Admin 페이지 접근 시 role 이중 검증 (middleware + Edge Function)
- [ ] Toss 웹훅 HMAC 서명 검증 동작 확인
- [ ] SQL Injection 방어 (parameterized, RPC 사용 확인)

### 성능
- [ ] `next/image` + Supabase Storage Image Transformation 적용
- [ ] 상품 목록 ISR + stale-while-revalidate 설정
- [ ] Lighthouse 모바일 점수 85+ 목표

### SEO
- [ ] `generateMetadata` 상품/카테고리/가이드 페이지 전반
- [ ] `sitemap.ts` 자동 생성 (상품/카테고리/가이드)
- [ ] `robots.ts` 설정

### E2E 테스트 (Playwright 5개 시나리오)
- [ ] TC-01: 비회원 → 상품 탐색 → 로그인 유도 → 장바구니 보존 후 로그인
- [ ] TC-02: 회원 → 상품 검색(한글) → 필터 → 상품 상세 → 장바구니 추가 → 체크아웃 → Toss 테스트 결제 → 주문 완료
- [ ] TC-03: 마이페이지 → 주문 상세 → 리뷰 작성 → 적립금 확인
- [ ] TC-04: 어드민 → 상품 등록 → 스토어 노출 확인 → 주문 상태 변경 → 사용자 알림 확인
- [ ] TC-05: 결제 실패 시나리오 → 주문 cancelled 처리 → 재고 복원 확인

### 배포
- [ ] Vercel 프로젝트 생성 + 환경변수 설정
- [ ] Supabase CLI `supabase db push --linked` (production)
- [ ] 도메인 연결 + HTTPS 확인
- [ ] Sentry 프로젝트 연결 + 에러 테스트

**완료 기준**: 스테이징 환경 실제 결제 성공 + Playwright 5개 시나리오 통과 + Lighthouse 85+

---

## 전체 일정 요약

| Week | 핵심 티켓 | 완료 목표 |
|------|----------|----------|
| 1 | T001, T002, T003, T004 | DB+인프라+스토어+Auth |
| 2 | T005, T006 | 장바구니+체크아웃+결제 |
| 3 | T007, T008, T009 | 마이페이지+어드민+추천 |
| 4 | T010 | QA+보안+배포 |
