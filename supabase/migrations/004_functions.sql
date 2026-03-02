-- =============================================================
-- Migration: 004_functions.sql
-- 서버 사이드 DB 함수 (결제/추천/포인트 등)
-- =============================================================

-- ─────────────────────────────────────────
-- 1. 결제 완료 트랜잭션 처리
-- ─────────────────────────────────────────
CREATE FUNCTION public.process_payment_confirm(
  p_order_id       UUID,
  p_payment_key    TEXT,
  p_toss_raw       JSONB,
  p_receipt_url    TEXT,
  p_method         TEXT,
  p_points_to_earn INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- service_role 에서만 호출
AS $$
DECLARE
  v_user_id        UUID;
  v_new_balance    INT;
  v_coupon_id      UUID;
BEGIN
  -- 1) 주문 상태 변경 (멱등 처리: 이미 paid인 경우 무시)
  UPDATE public.orders
  SET status   = 'paid',
      paid_at  = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'pending_payment';

  IF NOT FOUND THEN
    -- 이미 처리됐거나 존재하지 않음 → 멱등 성공으로 처리
    RETURN;
  END IF;

  -- 2) 결제 record 업데이트
  UPDATE public.payments
  SET status       = 'done',
      payment_key  = p_payment_key,
      method       = p_method,
      receipt_url  = p_receipt_url,
      raw          = p_toss_raw,
      approved_at  = NOW(),
      updated_at   = NOW()
  WHERE order_id = p_order_id;

  -- 3) 사용자 ID, 쿠폰 ID 조회
  SELECT user_id, user_coupon_id
  INTO v_user_id, v_coupon_id
  FROM public.orders
  WHERE id = p_order_id;

  -- 4) 재고 차감
  UPDATE public.inventory inv
  SET qty        = inv.qty - oi.qty,
      updated_at = NOW()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND inv.product_id = oi.product_id
    AND inv.option_key = oi.option_key;

  -- 재고 부족 체크 (음수 방지 — products.sold_count 업데이트 포함)
  IF EXISTS (
    SELECT 1 FROM public.inventory WHERE product_id IN (
      SELECT product_id FROM public.order_items WHERE order_id = p_order_id
    ) AND qty < 0
  ) THEN
    RAISE EXCEPTION '재고 부족';
  END IF;

  -- sold_count 업데이트
  UPDATE public.products p
  SET sold_count = sold_count + oi.qty
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id;

  -- 5) 쿠폰 사용 처리
  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.user_coupons
    SET used_at       = NOW(),
        used_order_id = p_order_id
    WHERE id      = v_coupon_id
      AND used_at IS NULL;
  END IF;

  -- 6) 적립금 적립
  IF p_points_to_earn > 0 THEN
    UPDATE public.users
    SET point_balance = point_balance + p_points_to_earn
    WHERE id = v_user_id
    RETURNING point_balance INTO v_new_balance;

    INSERT INTO public.points_ledger (user_id, delta, balance, reason, ref_id)
    VALUES (v_user_id, p_points_to_earn, v_new_balance, 'purchase_reward', p_order_id);
  END IF;

  -- 7) 알림 생성
  INSERT INTO public.notifications (user_id, type, title, body, link, ref_id)
  VALUES (
    v_user_id,
    'order_status',
    '주문이 완료되었습니다',
    '결제가 정상 처리되었습니다. 주문 상세를 확인하세요.',
    '/mypage/orders/' || p_order_id::TEXT,
    p_order_id
  );
END;
$$;

-- ─────────────────────────────────────────
-- 2. 프로필 기반 추천 점수 계산
-- ─────────────────────────────────────────
-- 입력: elder_profile 의 survey JSON
-- 출력: 태그 슬러그 배열 (가중치 순)
CREATE FUNCTION public.get_recommendation_tags(
  p_survey JSONB
) RETURNS TEXT[]
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_tags TEXT[] := '{}';
BEGIN
  -- 거동 상태
  IF p_survey->>'mobility' = 'low' THEN
    v_tags := array_append(v_tags, 'mobility_low');
    v_tags := array_append(v_tags, 'fall_risk');
  ELSIF p_survey->>'mobility' = 'medium' THEN
    v_tags := array_append(v_tags, 'mobility_medium');
  END IF;

  -- 욕창 위험
  IF p_survey->>'bedsore_risk' = 'high' THEN
    v_tags := array_append(v_tags, 'bedsore_risk_high');
  ELSIF p_survey->>'bedsore_risk' = 'medium' THEN
    v_tags := array_append(v_tags, 'bedsore_risk_medium');
  END IF;

  -- 배변 도움
  IF p_survey->>'toileting' IN ('partial', 'full') THEN
    v_tags := array_append(v_tags, 'toileting_assist');
  END IF;

  -- 식사 도움
  IF p_survey->>'meal' IN ('partial', 'full') THEN
    v_tags := array_append(v_tags, 'meal_assist');
  END IF;

  -- 인지 저하
  IF p_survey->>'cognitive' = 'yes' THEN
    v_tags := array_append(v_tags, 'cognitive_decline');
  END IF;

  RETURN v_tags;
END;
$$;

-- ─────────────────────────────────────────
-- 3. 추천 상품 조회 (태그 매칭 + 가중 정렬)
-- ─────────────────────────────────────────
CREATE FUNCTION public.get_recommended_products(
  p_user_id  UUID,
  p_profile_id UUID DEFAULT NULL,
  p_limit    INT  DEFAULT 20
) RETURNS TABLE (
  product_id   UUID,
  match_score  INT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_survey     JSONB;
  v_tags       TEXT[];
BEGIN
  -- 프로필 조회
  SELECT id, survey INTO v_profile_id, v_survey
  FROM public.elder_profiles
  WHERE user_id = p_user_id
    AND (p_profile_id IS NULL OR id = p_profile_id)
  ORDER BY is_primary DESC, created_at ASC
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    -- 프로필 없으면 인기상품 반환
    RETURN QUERY
      SELECT p.id, 0 AS match_score
      FROM public.products p
      WHERE p.status = 'active'
      ORDER BY p.sold_count DESC, p.view_count DESC
      LIMIT p_limit;
    RETURN;
  END IF;

  -- 추천 태그 계산
  v_tags := public.get_recommendation_tags(v_survey);

  -- 태그 매칭 점수로 정렬
  RETURN QUERY
    SELECT p.id,
           COUNT(pt.tag_id)::INT AS match_score
    FROM public.products p
    LEFT JOIN public.product_tags pt ON pt.product_id = p.id
    LEFT JOIN public.tags t ON t.id = pt.tag_id AND t.name = ANY(v_tags)
    WHERE p.status = 'active'
    GROUP BY p.id
    ORDER BY match_score DESC, p.sold_count DESC
    LIMIT p_limit;
END;
$$;

-- ─────────────────────────────────────────
-- 4. 주문 취소 / 환불 처리
-- ─────────────────────────────────────────
CREATE FUNCTION public.process_order_cancel(
  p_order_id   UUID,
  p_admin_id   UUID,
  p_reason     TEXT DEFAULT '고객 요청'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id      UUID;
  v_points_used  INT;
  v_new_balance  INT;
BEGIN
  SELECT user_id, points_used INTO v_user_id, v_points_used
  FROM public.orders WHERE id = p_order_id;

  -- 주문 상태 변경
  UPDATE public.orders
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  -- 재고 복원
  UPDATE public.inventory inv
  SET qty = inv.qty + oi.qty, updated_at = NOW()
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND inv.product_id = oi.product_id
    AND inv.option_key = oi.option_key;

  -- 사용 적립금 환불
  IF v_points_used > 0 THEN
    UPDATE public.users
    SET point_balance = point_balance + v_points_used
    WHERE id = v_user_id
    RETURNING point_balance INTO v_new_balance;

    INSERT INTO public.points_ledger (user_id, delta, balance, reason, ref_id, note)
    VALUES (v_user_id, v_points_used, v_new_balance, 'order_cancel_refund', p_order_id, p_reason);
  END IF;

  -- 쿠폰 사용 취소
  UPDATE public.user_coupons uc
  SET used_at = NULL, used_order_id = NULL
  FROM public.orders o
  WHERE o.id = p_order_id
    AND uc.id = o.user_coupon_id
    AND uc.used_order_id = p_order_id;

  -- 알림
  INSERT INTO public.notifications (user_id, type, title, body, link, ref_id)
  VALUES (v_user_id, 'order_status', '주문이 취소되었습니다',
          p_reason, '/mypage/orders/' || p_order_id::TEXT, p_order_id);

  -- 감사로그
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, entity, entity_id, diff)
    VALUES (p_admin_id, 'status_change', 'order', p_order_id::TEXT,
            jsonb_build_object('before', jsonb_build_object('status', 'paid'),
                               'after',  jsonb_build_object('status', 'cancelled', 'reason', p_reason)));
  END IF;
END;
$$;
