# ERD + RLS 정책 문서

## ERD (Entity Relationship Diagram)

```
┌─────────────────┐         ┌──────────────────┐
│   auth.users    │ 1     1 │  public.users    │
│  (Supabase)     │─────────│  id, email,      │
└─────────────────┘         │  role, phone,    │
                             │  point_balance   │
                             └──────────┬───────┘
                                        │ 1
                   ┌────────────────────┼────────────────────────┐
                   │ N                  │ N                       │ N
          ┌────────▼────────┐  ┌────────▼────────┐  ┌───────────▼───────┐
          │ elder_profiles  │  │    addresses    │  │      orders       │
          │ user_id(FK)     │  │ user_id(FK)     │  │ user_id(FK)       │
          │ nickname        │  │ recipient       │  │ order_no (UNIQUE) │
          │ birth_year      │  │ zip_code        │  │ status            │
          │ care_grade      │  │ address1/2      │  │ subtotal/total    │
          │ survey (jsonb)  │  │ is_default      │  │ shipping_address  │
          │ benefit_input   │  └─────────────────┘  │ paid_at           │
          └─────────────────┘                        └───────┬───────────┘
                                                              │ 1
                                              ┌───────────────┼──────────────────┐
                                              │ N             │ 1                │ 1
                                    ┌─────────▼─────┐ ┌──────▼──────┐  ┌───────▼──────┐
                                    │  order_items  │ │  payments   │  │  shipments   │
                                    │ order_id(FK)  │ │ order_id(FK)│  │ order_id(FK) │
                                    │ product_id(FK)│ │ payment_key │  │ tracking_no  │
                                    │ option_key    │ │ provider    │  │ carrier_name │
                                    │ qty, price    │ │ status      │  │ shipped_at   │
                                    │ is_reviewed   │ │ raw(jsonb)  │  └──────────────┘
                                    └────────┬──────┘ └─────────────┘
                                             │ 1
                                    ┌────────▼──────┐
                                    │    reviews    │
                                    │ order_item_id │
                                    │ rating (1-5)  │
                                    │ content       │
                                    │ images(jsonb) │
                                    └───────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     상품 도메인                                │
│                                                               │
│  categories ──N── products ──N── product_images              │
│      │               │                                        │
│      │ (1:N)         ├──N── product_options ──N── option_values│
│      │               ├──N── inventory (product_id, option_key, qty)│
│  brands ──N──────────┤                                        │
│                       └──N── product_tags ──N── tags          │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     혜택 도메인                                │
│                                                               │
│  users ──N── user_coupons ──N── coupons                      │
│  users ──N── points_ledger (적립금 원장)                      │
│  users ──N── wishlist ──N── products                          │
│  users ──1── carts (items jsonb)                              │
│  users ──N── notifications                                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     콘텐츠/운영 도메인                         │
│                                                               │
│  products ──N── inquiries ──N── users                         │
│  banners                                                      │
│  guide_articles                                               │
│  notices                                                      │
│  admin_audit_logs ──N── users(admin)                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 핵심 관계 요약

| 관계 | 카디널리티 | 비고 |
|------|-----------|------|
| auth.users ↔ public.users | 1:1 | 트리거로 자동 생성 |
| users → elder_profiles | 1:N | 최대 3개 권장 |
| users → addresses | 1:N | 최대 5개, is_default 하나 |
| users → orders | 1:N | - |
| orders → order_items | 1:N | - |
| order_items → reviews | 1:1 | UNIQUE 제약 |
| orders → payments | 1:1 | - |
| orders → shipments | 1:1 (반품 시 추가) | is_return 플래그 |
| products → inventory | 1:N | option_key 조합 per SKU |
| users ↔ coupons | N:M (user_coupons) | - |
| users → points_ledger | 1:N | 이벤트 소싱 패턴 |

---

## RLS 정책 매트릭스

| 테이블 | 읽기(SELECT) | 쓰기(INSERT/UPDATE/DELETE) | 비고 |
|--------|-------------|--------------------------|------|
| users | 본인 or admin | 본인(role 변경 불가) / admin | - |
| elder_profiles | 본인 or admin | 본인 | - |
| addresses | 본인 | 본인 | - |
| categories | 공개(active) or admin | admin only | - |
| brands | 공개(active) or admin | admin only | - |
| products | 공개(active) or admin | admin only | - |
| product_images | 공개 | admin only | - |
| inventory | 공개 | admin only | - |
| wishlist | 본인 | 본인 | - |
| carts | 본인 | 본인 | - |
| coupons | 공개(active) | admin only | - |
| user_coupons | 본인 or admin | admin/서버 only | 직접 쿠폰 추가 불가 |
| orders | 본인 or admin | 본인(생성) / admin(수정) | 금액 변조 방지 |
| order_items | 본인 주문 or admin | 본인(생성) | - |
| payments | 본인 주문 or admin | service_role only | 결제 위변조 방지 |
| points_ledger | 본인 or admin | admin/service only | 직접 적립 불가 |
| reviews | 공개(미숨김) or admin | 본인(구매완료+미작성) | 구매 검증 필수 |
| inquiries | 공개+본인+admin | 본인(생성/pending 수정) | is_private 고려 |
| notifications | 본인 | admin/서버 | - |
| banners | 공개(active) | admin only | - |
| guide_articles | 공개(published) | admin only | - |
| admin_audit_logs | admin only | admin/서버 only | - |

---

## RLS 핵심 보안 포인트

### 1. 금액 위변조 방지
```sql
-- payments 테이블: 일반 유저는 INSERT/UPDATE 불가
-- → Edge Function(service_role)에서만 처리
-- → 결제 승인 전 DB total vs 요청 amount 서버 측 검증
```

### 2. 리뷰 작성 조건 검증
```sql
-- reviews INSERT 정책에 서브쿼리로:
-- order_items.order_id → orders.user_id = auth.uid()
-- orders.status = 'delivered'
-- order_items.is_reviewed = FALSE
```

### 3. admin role은 DB + JWT 이중 검증
```sql
-- is_admin() 함수: JWT claim 또는 DB role 확인
-- Edge Function 에서도 DB 조회로 이중 확인
```

### 4. 쿠폰/적립금 직접 조작 방지
```sql
-- user_coupons INSERT: is_admin() 조건
-- points_ledger INSERT: is_admin() 조건
-- → 반드시 서버 사이드 함수(RPC)를 통해서만 처리
```

---

## Storage 버킷 정책

| 버킷 | 공개여부 | 읽기 | 쓰기 |
|------|---------|------|------|
| product-images | public | 전체 | service_role(admin) |
| review-images | private | 소유자(signed URL) | 인증된 사용자 |
| guide-images | public | 전체 | service_role(admin) |
| banner-images | public | 전체 | service_role(admin) |

### review-images signed URL 예시
```typescript
const { data } = await supabase.storage
  .from('review-images')
  .createSignedUrl(`${userId}/${filename}`, 3600) // 1시간
```
