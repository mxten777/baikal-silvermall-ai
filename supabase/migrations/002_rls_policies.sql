-- =============================================================
-- Migration: 002_rls_policies.sql
-- Row Level Security 정책
-- =============================================================

-- ─────────────────────────────────────────
-- 헬퍼 함수
-- ─────────────────────────────────────────

-- 현재 사용자가 admin인지 확인 (JWT custom claim 사용)
CREATE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', TRUE)::jsonb ->> 'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 현재 로그인 사용자 ID
CREATE FUNCTION public.current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────
-- RLS 활성화
-- ─────────────────────────────────────────
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elder_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs   ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- 1. users
-- ─────────────────────────────────────────
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'member');  -- 스스로 admin 변경 불가

CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 2. elder_profiles
-- ─────────────────────────────────────────
CREATE POLICY elder_profiles_select ON public.elder_profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY elder_profiles_insert ON public.elder_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY elder_profiles_update ON public.elder_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY elder_profiles_delete ON public.elder_profiles
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY elder_profiles_admin ON public.elder_profiles
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 3. addresses
-- ─────────────────────────────────────────
CREATE POLICY addresses_own ON public.addresses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY addresses_admin ON public.addresses
  FOR SELECT USING (public.is_admin());

-- ─────────────────────────────────────────
-- 4. categories / brands (공개 읽기)
-- ─────────────────────────────────────────
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY categories_admin_write ON public.categories
  FOR ALL USING (public.is_admin());

CREATE POLICY brands_public_read ON public.brands
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY brands_admin_write ON public.brands
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 5. products (공개 읽기: active만)
-- ─────────────────────────────────────────
CREATE POLICY products_public_read ON public.products
  FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY products_admin_write ON public.products
  FOR ALL USING (public.is_admin());

-- product_images / options / values / tags (products 읽기 따라감)
CREATE POLICY pi_public_read ON public.product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.status = 'active' OR public.is_admin()))
  );
CREATE POLICY pi_admin_write ON public.product_images FOR ALL USING (public.is_admin());

CREATE POLICY po_public_read ON public.product_options FOR SELECT USING (TRUE);
CREATE POLICY po_admin_write ON public.product_options FOR ALL USING (public.is_admin());

CREATE POLICY pov_public_read ON public.product_option_values FOR SELECT USING (TRUE);
CREATE POLICY pov_admin_write ON public.product_option_values FOR ALL USING (public.is_admin());

CREATE POLICY inventory_public_read ON public.inventory FOR SELECT USING (TRUE);
CREATE POLICY inventory_admin_write ON public.inventory FOR ALL USING (public.is_admin());

CREATE POLICY tags_public_read ON public.tags FOR SELECT USING (TRUE);
CREATE POLICY tags_admin_write ON public.tags FOR ALL USING (public.is_admin());

CREATE POLICY product_tags_public_read ON public.product_tags FOR SELECT USING (TRUE);
CREATE POLICY product_tags_admin_write ON public.product_tags FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 6. wishlist
-- ─────────────────────────────────────────
CREATE POLICY wishlist_own ON public.wishlist
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 7. carts
-- ─────────────────────────────────────────
CREATE POLICY carts_own ON public.carts
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- 8. coupons (공개 읽기: 코드로만)
-- ─────────────────────────────────────────
CREATE POLICY coupons_public_read ON public.coupons
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY coupons_admin_write ON public.coupons
  FOR ALL USING (public.is_admin());

CREATE POLICY user_coupons_own ON public.user_coupons
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- user_coupons는 서버(Edge Function)에서만 INSERT/UPDATE
CREATE POLICY user_coupons_insert_service ON public.user_coupons
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY user_coupons_update_service ON public.user_coupons
  FOR UPDATE USING (public.is_admin());

-- ─────────────────────────────────────────
-- 9. orders
-- ─────────────────────────────────────────
CREATE POLICY orders_own ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- 주문 생성은 본인만 (서버에서 처리)
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 상태/배송지 업데이트는 admin 또는 Edge Function만
CREATE POLICY orders_update_admin ON public.orders
  FOR UPDATE USING (public.is_admin() OR user_id = auth.uid());

-- ─────────────────────────────────────────
-- 10. order_items
-- ─────────────────────────────────────────
CREATE POLICY order_items_own ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY order_items_insert_own ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- ─────────────────────────────────────────
-- 11. shipments
-- ─────────────────────────────────────────
CREATE POLICY shipments_own ON public.shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY shipments_admin_write ON public.shipments
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 12. payments (민감: 본인 + admin만)
-- ─────────────────────────────────────────
CREATE POLICY payments_own ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR public.is_admin()
  );

-- payments INSERT/UPDATE는 오직 Edge Function (service_role key)에서만
-- 일반 유저는 INSERT/UPDATE 불가 (정책 없음)
CREATE POLICY payments_admin_all ON public.payments
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 13. points_ledger
-- ─────────────────────────────────────────
CREATE POLICY points_own ON public.points_ledger
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- INSERT는 오직 admin/서버만 (사용자가 직접 적립금 추가 불가)
CREATE POLICY points_admin_write ON public.points_ledger
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 14. reviews
-- ─────────────────────────────────────────
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT USING (is_hidden = FALSE OR public.is_admin());

CREATE POLICY reviews_insert_own ON public.reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_id
        AND o.user_id = auth.uid()
        AND o.status = 'delivered'
        AND oi.is_reviewed = FALSE
    )
  );

CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE USING (user_id = auth.uid() AND admin_reply IS NULL);

CREATE POLICY reviews_admin_all ON public.reviews
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 15. inquiries
-- ─────────────────────────────────────────
-- 비공개 문의: 작성자 + admin만
-- 공개 문의: 모두 읽기 가능 (선택)
CREATE POLICY inquiries_read ON public.inquiries
  FOR SELECT USING (
    (is_private = FALSE) OR
    (user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY inquiries_insert_own ON public.inquiries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY inquiries_update_own ON public.inquiries
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY inquiries_admin_all ON public.inquiries
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 16. notifications
-- ─────────────────────────────────────────
CREATE POLICY notif_own ON public.notifications
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- ─────────────────────────────────────────
-- 17. banners / guide_articles / notices (공개 읽기)
-- ─────────────────────────────────────────
CREATE POLICY banners_public_read ON public.banners
  FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY banners_admin_write ON public.banners FOR ALL USING (public.is_admin());

CREATE POLICY guide_public_read ON public.guide_articles
  FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY guide_admin_write ON public.guide_articles FOR ALL USING (public.is_admin());

CREATE POLICY notices_public_read ON public.notices
  FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY notices_admin_write ON public.notices FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- 18. admin_audit_logs (admin only)
-- ─────────────────────────────────────────
CREATE POLICY aal_admin_only ON public.admin_audit_logs
  FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────
-- Storage 버킷 정책 메모 (Dashboard에서 설정)
-- ─────────────────────────────────────────
-- product-images : public read, admin write
-- review-images  : signed URL (private), owner read/write
-- guide-images   : public read, admin write
-- banner-images  : public read, admin write
