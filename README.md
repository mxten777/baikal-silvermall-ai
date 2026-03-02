# 실버몰 - 복지용구 쇼핑몰 플랫폼

> 장기요양 수급자/보호자 대상 복지용구 B2C 쇼핑몰 + 운영자 콘솔

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| State | TanStack Query + Zustand |
| Backend | Supabase (Postgres 15, Auth, Storage, Edge Functions) |
| Payment | Toss Payments (카드, 가상계좌) |
| Search | Postgres FTS (pg_bigm 한글) |
| Test | Playwright (E2E) |
| Observability | Sentry + Supabase Logs |
| Deploy | Vercel (FE) + Supabase Managed (BE) |

---

## 프로젝트 구조

```
baikal-silvermall-ai/
├── apps/
│   └── web/                  # Next.js 앱
│       ├── app/              # App Router 페이지
│       │   ├── (public)/     # 공개 페이지 (메인, 스토어, 상품상세)
│       │   ├── (auth)/       # 로그인, 회원가입
│       │   ├── (shop)/       # 장바구니, 체크아웃
│       │   ├── (mypage)/     # 마이페이지
│       │   ├── admin/        # 어드민 콘솔
│       │   └── api/          # Route Handlers
│       ├── components/       # 공유 컴포넌트
│       │   ├── ui/           # shadcn/ui 베이스
│       │   ├── product/      # 상품 관련
│       │   ├── cart/         # 장바구니
│       │   ├── checkout/     # 체크아웃
│       │   └── admin/        # 어드민 전용
│       ├── hooks/            # 커스텀 훅
│       ├── lib/              # 유틸, Supabase 클라이언트
│       ├── types/            # TypeScript 타입
│       └── e2e/              # Playwright 테스트
├── supabase/
│   ├── migrations/           # DB 마이그레이션
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_seed_data.sql
│   │   ├── 004_functions.sql
│   │   └── 005_auth_trigger.sql
│   └── functions/            # Edge Functions
│       ├── payments-toss-confirm/
│       ├── webhooks-toss/
│       └── admin-orders-ship/
└── docs/
    ├── 00_MVP_SCOPE.md
    ├── 01_ROUTE_MAP.md
    ├── 02_TOSS_PAYMENTS_DESIGN.md
    ├── 03_TASK_TICKETS.md
    └── 04_ERD_RLS.md
```

---

## 빠른 시작

### 1. 환경 변수 설정
```bash
cd apps/web
cp .env.example .env.local
# .env.local 편집: Supabase, Toss 키 입력
```

### 2. DB 마이그레이션
```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 시작 (Docker 필요)
supabase start

# 마이그레이션 실행
supabase db push

# 또는 스테이징/프로덕션
supabase db push --linked
```

### 3. Edge Functions 배포
```bash
supabase functions deploy payments-toss-confirm
supabase functions deploy webhooks-toss
supabase functions deploy admin-orders-ship

# 환경 변수 설정
supabase secrets set TOSS_SECRET_KEY=sk_test_...
supabase secrets set TOSS_WEBHOOK_SECRET=whsec_...
```

### 4. Frontend 개발 서버
```bash
cd apps/web
npm install
npm run dev
```

### 5. E2E 테스트
```bash
cd apps/web
# .env.local에 테스트 계정 정보 입력 후
npx playwright test
npx playwright test --ui  # UI 모드
```

---

## 주요 비즈니스 규칙

### 복지용구 급여 처리 (MVP)
- `is_insurance=true` 상품 = 장기요양 급여 품목 (상품카드에 🟢 뱃지)
- 연간 한도/사용액/본인부담률은 **사용자가 직접 입력** (elder_profiles.benefit_input)
- 본인부담금 = 구매금액 × 본인부담률% (기본 15%)
- 실시간 공단 API 연동은 2차 개발

### 추천 로직 (규칙 엔진)
- 어르신 프로필 설문 → 태그 매핑 → 태그 매칭 상품 우선 노출
- `get_recommended_products()` DB 함수
- 프로필 없으면 판매량 기반 인기상품

### 적립금
- 구매금액의 1% 적립 (결제 완료 즉시)
- 리뷰 작성 보상 별도 설정 가능
- 사용/적립/차감은 반드시 `points_ledger` 통해 처리 (이벤트 소싱)

### 배송비
- 30,000원 이상 무료배송
- 미만 시 3,000원

---

## 어드민 구분

```
/admin/* 접근 = users.role = 'admin' 필수

관리자 계정 등록 방법:
supabase=> SELECT public.promote_to_admin('USER_UUID');
```

---

## Toss Payments 테스트 키
- 테스트 카드: 4330-0000-0000-0001 (일반 승인)
- 실패 카드: 4330-0000-0000-0002 (잔액 부족)
- 공식 문서: https://docs.tosspayments.com/reference/testing

---

## 참고 문서
- [MVP 범위](./docs/00_MVP_SCOPE.md)
- [라우트 맵](./docs/01_ROUTE_MAP.md)
- [Toss 결제 설계](./docs/02_TOSS_PAYMENTS_DESIGN.md)
- [작업 티켓](./docs/03_TASK_TICKETS.md)
- [ERD + RLS](./docs/04_ERD_RLS.md)
