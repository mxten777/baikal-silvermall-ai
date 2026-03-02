-- =============================================================
-- Migration: 001_initial_schema.sql
-- 복지용구 쇼핑몰 초기 스키마
-- Supabase Postgres 15+
-- =============================================================

-- ─────────────────────────────────────────
-- 확장 기능
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- 한글 FTS (trigram, pg_bigm 로컬 대체)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─────────────────────────────────────────
-- ENUM 타입
-- ─────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('member', 'admin');
CREATE TYPE care_grade      AS ENUM ('1', '2', '3', '4', '5', 'cognitive', 'none');
CREATE TYPE product_status  AS ENUM ('draft', 'active', 'inactive', 'soldout');
CREATE TYPE product_type    AS ENUM ('purchase', 'rental', 'both');
CREATE TYPE order_status    AS ENUM (
  'pending_payment', 'paid', 'preparing', 'shipping',
  'delivered', 'cancelled', 'return_requested', 'returned'
);
CREATE TYPE payment_status  AS ENUM ('pending', 'done', 'cancelled', 'partial_cancelled', 'aborted', 'expired');
CREATE TYPE payment_provider AS ENUM ('toss', 'kakao', 'naver');
CREATE TYPE coupon_type     AS ENUM ('fixed', 'rate');
CREATE TYPE coupon_target    AS ENUM ('all', 'category', 'product');
CREATE TYPE inquiry_status  AS ENUM ('pending', 'answered');
CREATE TYPE points_reason   AS ENUM (
  'purchase_reward', 'review_reward', 'admin_grant',
  'admin_deduct', 'coupon_convert', 'order_use', 'order_cancel_refund',
  'expire'
);
CREATE TYPE notification_type AS ENUM (
  'order_status', 'inquiry_answered', 'review_reply',
  'coupon_issued', 'point_change', 'notice'
);
CREATE TYPE banner_position AS ENUM ('hero', 'category_top', 'product_bottom', 'popup');

-- ─────────────────────────────────────────
-- 1. users (Supabase auth.users 확장)
-- ─────────────────────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  phone         TEXT,
  name          TEXT,
  role          user_role   NOT NULL DEFAULT 'member',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  marketing_agreed BOOLEAN  NOT NULL DEFAULT FALSE,
  point_balance INT         NOT NULL DEFAULT 0 CHECK (point_balance >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. elder_profiles (어르신 프로필)
-- ─────────────────────────────────────────
CREATE TABLE public.elder_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nickname      TEXT        NOT NULL,          -- 별칭(예: '아버지', '어머니')
  birth_year    SMALLINT    CHECK (birth_year BETWEEN 1900 AND 2010),
  gender        CHAR(1)     CHECK (gender IN ('M', 'F')),
  care_grade    care_grade  NOT NULL DEFAULT 'none',
  -- 간단 설문 JSON 예: {"mobility":"low","bedsore_risk":"high","toileting":"partial","meal":"normal"}
  survey        JSONB       NOT NULL DEFAULT '{}',
  -- 복지용구 급여 정보 (사용자 직접 입력, MVP)
  benefit_input JSONB       NOT NULL DEFAULT '{}',
  -- 예: {"annual_limit":1620000,"used_amount":0,"self_pay_rate":15}
  is_primary    BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order    SMALLINT    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX elder_profiles_user_idx ON public.elder_profiles(user_id);

-- ─────────────────────────────────────────
-- 3. addresses (배송지)
-- ─────────────────────────────────────────
CREATE TABLE public.addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL DEFAULT '배송지',
  recipient     TEXT        NOT NULL,
  phone         TEXT        NOT NULL,
  zip_code      VARCHAR(10) NOT NULL,
  address1      TEXT        NOT NULL,
  address2      TEXT,
  is_default    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX addresses_user_idx ON public.addresses(user_id);

-- ─────────────────────────────────────────
-- 4. categories
-- ─────────────────────────────────────────
CREATE TABLE public.categories (
  id            SERIAL      PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  description   TEXT,
  image_url     TEXT,
  parent_id     INT         REFERENCES public.categories(id),
  sort_order    SMALLINT    NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. brands
-- ─────────────────────────────────────────
CREATE TABLE public.brands (
  id            SERIAL  PRIMARY KEY,
  name          TEXT    NOT NULL UNIQUE,
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─────────────────────────────────────────
-- 6. products
-- ─────────────────────────────────────────
CREATE TABLE public.products (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     INT           NOT NULL REFERENCES public.categories(id),
  brand_id        INT           REFERENCES public.brands(id),
  slug            TEXT          NOT NULL UNIQUE,
  name            TEXT          NOT NULL,
  description     TEXT,
  detail_html     TEXT,                          -- 상품 상세(에디터 HTML)
  price           INT           NOT NULL CHECK (price >= 0),
  sale_price      INT           CHECK (sale_price >= 0),
  rental_price    INT,                           -- 월 대여료
  product_type    product_type  NOT NULL DEFAULT 'purchase',
  is_insurance    BOOLEAN       NOT NULL DEFAULT FALSE,  -- 급여 품목 여부
  insurance_code  TEXT,                          -- 복지용구 품목 코드
  status          product_status NOT NULL DEFAULT 'draft',
  shipping_info   JSONB         NOT NULL DEFAULT '{}',
  -- 예: {"free_threshold":30000,"base_fee":3000,"return_fee":3000}
  care_info       JSONB         NOT NULL DEFAULT '{}',
  -- 예: {"suitable_grades":["3","4","5"],"target_conditions":["mobility_low"]}
  view_count      INT           NOT NULL DEFAULT 0,
  sold_count      INT           NOT NULL DEFAULT 0,
  search_tsv      TSVECTOR,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_brand_idx    ON public.products(brand_id);
CREATE INDEX products_status_idx   ON public.products(status);
CREATE INDEX products_tsv_idx      ON public.products USING GIN(search_tsv);
CREATE INDEX products_bigm_idx     ON public.products USING GIN(name gin_trgm_ops);

-- FTS 트리거
CREATE FUNCTION products_tsv_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce((SELECT name FROM public.brands WHERE id = NEW.brand_id), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_tsv
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION products_tsv_update();

-- ─────────────────────────────────────────
-- 7. product_images
-- ─────────────────────────────────────────
CREATE TABLE public.product_images (
  id          SERIAL      PRIMARY KEY,
  product_id  UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  alt         TEXT,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX pi_product_idx ON public.product_images(product_id);

-- ─────────────────────────────────────────
-- 8. product_options + option_values
-- ─────────────────────────────────────────
CREATE TABLE public.product_options (
  id          SERIAL  PRIMARY KEY,
  product_id  UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,    -- 예: '색상', '사이즈'
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE public.product_option_values (
  id          SERIAL  PRIMARY KEY,
  option_id   INT     NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  value       TEXT    NOT NULL,   -- 예: '블랙', 'L'
  price_delta INT     NOT NULL DEFAULT 0,
  sort_order  SMALLINT NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- 9. inventory (SKU 기반)
-- ─────────────────────────────────────────
CREATE TABLE public.inventory (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- option_key: JSON 키-값 조합, 예: {"색상":"블랙","사이즈":"L"} 또는 "{}" (옵션없음)
  option_key  JSONB   NOT NULL DEFAULT '{}',
  sku         TEXT,
  qty         INT     NOT NULL DEFAULT 0 CHECK (qty >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, option_key)
);
CREATE INDEX inventory_product_idx ON public.inventory(product_id);

-- ─────────────────────────────────────────
-- 10. tags + product_tags
-- ─────────────────────────────────────────
CREATE TABLE public.tags (
  id    SERIAL PRIMARY KEY,
  name  TEXT   NOT NULL UNIQUE,   -- 예: 'mobility_low', 'bedsore_risk_high'
  label TEXT                       -- 표시용: '거동불편', '욕창위험높음'
);

CREATE TABLE public.product_tags (
  product_id  UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id      INT     NOT NULL REFERENCES public.tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
CREATE INDEX product_tags_tag_idx ON public.product_tags(tag_id);

-- ─────────────────────────────────────────
-- 11. wishlist
-- ─────────────────────────────────────────
CREATE TABLE public.wishlist (
  user_id     UUID  NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  product_id  UUID  NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- ─────────────────────────────────────────
-- 12. carts
-- ─────────────────────────────────────────
CREATE TABLE public.carts (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- items: [{ product_id, option_key, qty, snapshot: {name, price, image_url} }]
  items       JSONB   NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 13. coupons + user_coupons
-- ─────────────────────────────────────────
CREATE TABLE public.coupons (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT          NOT NULL UNIQUE,
  name            TEXT          NOT NULL,
  type            coupon_type   NOT NULL,
  discount_value  INT           NOT NULL CHECK (discount_value > 0),
  -- type=rate 면 %, type=fixed 면 원
  min_order_amount INT          NOT NULL DEFAULT 0,
  max_discount_amount INT,      -- rate 쿠폰 최대 할인 캡
  target          coupon_target NOT NULL DEFAULT 'all',
  target_id       TEXT,         -- category slug or product_id
  issue_limit     INT,          -- NULL = 무제한
  issued_count    INT           NOT NULL DEFAULT 0,
  valid_from      DATE          NOT NULL,
  valid_until     DATE          NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by      UUID          REFERENCES public.users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_coupons (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  coupon_id   UUID    NOT NULL REFERENCES public.coupons(id)  ON DELETE CASCADE,
  used_at     TIMESTAMPTZ,
  used_order_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coupon_id)
);
CREATE INDEX uc_user_idx   ON public.user_coupons(user_id);
CREATE INDEX uc_coupon_idx ON public.user_coupons(coupon_id);

-- ─────────────────────────────────────────
-- 14. orders
-- ─────────────────────────────────────────
CREATE TABLE public.orders (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES public.users(id),
  order_no        TEXT          NOT NULL UNIQUE, -- 예: ORD-20260302-001
  status          order_status  NOT NULL DEFAULT 'pending_payment',
  subtotal        INT           NOT NULL,
  shipping_fee    INT           NOT NULL DEFAULT 0,
  coupon_discount INT           NOT NULL DEFAULT 0,
  points_used     INT           NOT NULL DEFAULT 0,
  total           INT           NOT NULL,
  shipping_address JSONB        NOT NULL,
  -- {recipient, phone, zip_code, address1, address2, request}
  user_coupon_id  UUID          REFERENCES public.user_coupons(id),
  elder_profile_id UUID         REFERENCES public.elder_profiles(id),
  memo            TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX orders_user_idx      ON public.orders(user_id);
CREATE INDEX orders_status_idx    ON public.orders(status);
CREATE INDEX orders_created_idx   ON public.orders(created_at DESC);
CREATE INDEX orders_order_no_idx  ON public.orders(order_no);

-- ─────────────────────────────────────────
-- 15. order_items
-- ─────────────────────────────────────────
CREATE TABLE public.order_items (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID    NOT NULL REFERENCES public.products(id),
  option_key  JSONB   NOT NULL DEFAULT '{}',
  qty         INT     NOT NULL CHECK (qty > 0),
  unit_price  INT     NOT NULL,
  product_snapshot JSONB NOT NULL DEFAULT '{}',
  -- {name, image_url, brand, is_insurance}
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX oi_order_idx ON public.order_items(order_id);

-- ─────────────────────────────────────────
-- 16. shipments (배송 / 반품 추적)
-- ─────────────────────────────────────────
CREATE TABLE public.shipments (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID    NOT NULL REFERENCES public.orders(id),
  carrier_code    TEXT,   -- 택배사 코드 (CJ=04, LOGEN=06, 한진=05...)
  carrier_name    TEXT,
  tracking_no     TEXT,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  is_return       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 17. payments
-- ─────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID            NOT NULL REFERENCES public.orders(id),
  provider        payment_provider NOT NULL DEFAULT 'toss',
  payment_key     TEXT            UNIQUE,    -- Toss paymentKey
  order_id_pg     TEXT,                      -- PG사 주문번호 (orderId)
  amount          INT             NOT NULL,
  status          payment_status  NOT NULL DEFAULT 'pending',
  method          TEXT,           -- 카드, 가상계좌 등
  receipt_url     TEXT,
  -- raw: 필요 필드만 보관 (카드사명, 승인번호, 가상계좌번호 정도)
  raw             JSONB           NOT NULL DEFAULT '{}',
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX payments_order_idx ON public.payments(order_id);

-- ─────────────────────────────────────────
-- 18. points_ledger (적립금 원장)
-- ─────────────────────────────────────────
CREATE TABLE public.points_ledger (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta       INT           NOT NULL,         -- 양수=적립, 음수=차감
  balance     INT           NOT NULL,         -- 잔액 스냅샷
  reason      points_reason NOT NULL,
  ref_id      UUID,                           -- 연관 엔티티 ID
  note        TEXT,
  expires_at  DATE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX pl_user_idx    ON public.points_ledger(user_id, created_at DESC);
CREATE INDEX pl_expires_idx ON public.points_ledger(expires_at) WHERE expires_at IS NOT NULL;

-- ─────────────────────────────────────────
-- 19. reviews
-- ─────────────────────────────────────────
CREATE TABLE public.reviews (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id   UUID    NOT NULL REFERENCES public.order_items(id),
  product_id      UUID    NOT NULL REFERENCES public.products(id),
  user_id         UUID    NOT NULL REFERENCES public.users(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content         TEXT,
  images          JSONB   NOT NULL DEFAULT '[]',  -- [{url, thumb_url}]
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  is_best         BOOLEAN NOT NULL DEFAULT FALSE,
  admin_reply     TEXT,
  admin_replied_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_item_id)   -- 주문 아이템당 리뷰 1개
);
CREATE INDEX reviews_product_idx ON public.reviews(product_id);
CREATE INDEX reviews_user_idx    ON public.reviews(user_id);

-- ─────────────────────────────────────────
-- 20. inquiries (상품 문의)
-- ─────────────────────────────────────────
CREATE TABLE public.inquiries (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID            NOT NULL REFERENCES public.products(id),
  user_id     UUID            NOT NULL REFERENCES public.users(id),
  title       TEXT            NOT NULL,
  question    TEXT            NOT NULL,
  answer      TEXT,
  status      inquiry_status  NOT NULL DEFAULT 'pending',
  is_private  BOOLEAN         NOT NULL DEFAULT TRUE,
  answered_at TIMESTAMPTZ,
  answered_by UUID            REFERENCES public.users(id),
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX inquiries_product_idx ON public.inquiries(product_id);
CREATE INDEX inquiries_user_idx    ON public.inquiries(user_id);
CREATE INDEX inquiries_status_idx  ON public.inquiries(status);

-- ─────────────────────────────────────────
-- 21. notifications
-- ─────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT              NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN           NOT NULL DEFAULT FALSE,
  ref_id      UUID,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);

-- ─────────────────────────────────────────
-- 22. banners
-- ─────────────────────────────────────────
CREATE TABLE public.banners (
  id          SERIAL      PRIMARY KEY,
  position    banner_position NOT NULL DEFAULT 'hero',
  title       TEXT        NOT NULL,
  image_url   TEXT        NOT NULL,
  link_url    TEXT,
  sort_order  SMALLINT    NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  valid_from  DATE,
  valid_until DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 23. guide_articles (가이드/CMS)
-- ─────────────────────────────────────────
CREATE TABLE public.guide_articles (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  summary     TEXT,
  content_html TEXT   NOT NULL,
  cover_url   TEXT,
  category    TEXT    NOT NULL DEFAULT 'general',  -- 'care_guide','selection','benefit' 등
  tags        JSONB   NOT NULL DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  view_count  INT     NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by  UUID    REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX guide_published_idx ON public.guide_articles(is_published, published_at DESC);

-- ─────────────────────────────────────────
-- 24. notices (공지사항)
-- ─────────────────────────────────────────
CREATE TABLE public.notices (
  id          SERIAL  PRIMARY KEY,
  title       TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID    REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 25. admin_audit_logs
-- ─────────────────────────────────────────
CREATE TABLE public.admin_audit_logs (
  id          BIGSERIAL   PRIMARY KEY,
  admin_id    UUID        NOT NULL REFERENCES public.users(id),
  action      TEXT        NOT NULL,   -- 'create','update','delete','status_change' 등
  entity      TEXT        NOT NULL,   -- 'product','order','coupon' 등
  entity_id   TEXT        NOT NULL,
  diff        JSONB       NOT NULL DEFAULT '{}',  -- {before:{}, after:{}}
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX aal_admin_idx  ON public.admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX aal_entity_idx ON public.admin_audit_logs(entity, entity_id);

-- ─────────────────────────────────────────
-- 26. updated_at 자동 갱신 함수 + 트리거
-- ─────────────────────────────────────────
CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 적용할 테이블 목록
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'users','elder_profiles','products','orders','payments',
    'shipments','reviews','inquiries','guide_articles','notices'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- 27. 주문번호 자동 생성 함수
-- ─────────────────────────────────────────
CREATE SEQUENCE order_seq START 1;

CREATE FUNCTION generate_order_no() RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
         LPAD(NEXTVAL('order_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- orders 트리거
CREATE FUNCTION orders_set_order_no() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL OR NEW.order_no = '' THEN
    NEW.order_no := generate_order_no();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_order_no
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION orders_set_order_no();

-- ─────────────────────────────────────────
-- 인덱스 추가 (필터 최적화)
-- ─────────────────────────────────────────
CREATE INDEX products_insurance_idx  ON public.products(is_insurance) WHERE is_insurance = TRUE;
CREATE INDEX products_type_idx       ON public.products(product_type);
CREATE INDEX products_price_idx      ON public.products(sale_price NULLS LAST, price);
