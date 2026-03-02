# Toss Payments 연동 설계

## 시퀀스 다이어그램

```
Client (Browser)          Next.js Route Handler          Supabase Edge Function          Toss Payments API
      │                          │                               │                              │
      │ 1. 주문서 작성 완료       │                               │                              │
      │ (배송지/쿠폰/적립금 확정) │                               │                              │
      │──────────────────────────▶│                              │                              │
      │                           │ 2. POST /api/checkout/prepare │                             │
      │                           │   - orders INSERT (status=pending_payment)                  │
      │                           │   - payments INSERT (status=pending)                        │
      │                           │   - 재고 임시 차감 (선택)     │                              │
      │                           │◀──────────────────────────────│                              │
      │ 3. { orderId, amount }    │                               │                              │
      │◀──────────────────────────│                               │                              │
      │                           │                               │                              │
      │ 4. Toss SDK loadTossPayments().requestPayment()           │                              │
      │   - amount, orderId, orderName, successUrl, failUrl       │                              │
      │───────────────────────────────────────────────────────────────────────────────────────────▶│
      │                           │                               │                Toss 결제창 표시│
      │◀──────────────────────────────────────────────────────────────────────────────────────────│
      │                           │                               │                              │
      │ 5. 결제 완료 후 successUrl 리다이렉트                      │                              │
      │   /checkout/complete?paymentKey=...&orderId=...&amount=... │                              │
      │                           │                               │                              │
      │ 6. 결제 승인 요청         │                               │                              │
      │──────────────────────────▶│                               │                              │
      │                           │ POST supabase.functions.invoke('payments-toss-confirm')      │
      │                           │──────────────────────────────▶│                              │
      │                           │                               │ 7. POST /v1/payments/confirm │
      │                           │                               │   { paymentKey, orderId, amount }
      │                           │                               │──────────────────────────────▶│
      │                           │                               │◀──────────────────────────────│
      │                           │                               │ 8. 응답 처리 (트랜잭션)       │
      │                           │                               │   - payments UPDATE (status=done, raw=필요필드)
      │                           │                               │   - orders UPDATE (status=paid, paid_at)
      │                           │                               │   - inventory qty 차감       │
      │                           │                               │   - points_ledger INSERT (적립 예정)
      │                           │                               │   - user_coupons.used_at UPDATE
      │                           │                               │   - notifications INSERT     │
      │                           │◀──────────────────────────────│                              │
      │◀──────────────────────────│                               │                              │
      │ 9. 주문완료 페이지 렌더링 │                               │                              │
      │                           │                               │                              │
      │                           │    [웹훅 별도 경로]           │                              │
      │                           │                               │◀──────────────────────────────│
      │                           │                               │ 10. POST /webhooks/toss      │
      │                           │                               │   (결제완료/취소/가상계좌입금 알림)
      │                           │                               │   - HMAC 서명 검증           │
      │                           │                               │   - 상태 멱등 업데이트        │
      │                           │                               │──────────────────────────────▶│
      │                           │                               │ 11. 200 OK (웹훅 응답)        │
```

---

## 결제 실패 / 이탈 처리

```
5'. failUrl 리다이렉트 /checkout/fail?code=...&message=...
  → orders.status = 'cancelled' (pending_payment → cancelled)
  → payments.status = 'aborted'
  → 재고 임시 차감 rollback
  → 사용자에게 실패 사유 표시
```

---

## Edge Function: `payments-toss-confirm`

### 환경 변수 (Supabase Secret)
```
TOSS_SECRET_KEY=sk_test_...     # 시크릿 키 (서버에서만 사용)
TOSS_WEBHOOK_SECRET=...         # 웹훅 서명 검증용
```

### 처리 흐름

```typescript
// 1. 입력 검증
const { paymentKey, orderId, amount } = body

// 2. DB에서 주문 확인 (금액 위변조 방지)
const order = await supabase.from('orders').select().eq('order_no', orderId).single()
if (order.total !== amount) throw new Error('금액 불일치')
if (order.status !== 'pending_payment') throw new Error('이미 처리된 주문')

// 3. Toss API 결제 승인 호출
const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${btoa(TOSS_SECRET_KEY + ':')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ paymentKey, orderId, amount }),
})

// 4. Supabase 트랜잭션 (RPC 사용)
await supabase.rpc('process_payment_confirm', {
  p_order_id: order.id,
  p_payment_key: paymentKey,
  p_toss_raw: extract_necessary_fields(tossData), // 최소 필드만
  p_points_to_earn: calculate_points(order.total),
})
```

### `process_payment_confirm` DB 함수 (PL/pgSQL, 트랜잭션)

```sql
CREATE FUNCTION process_payment_confirm(
  p_order_id UUID,
  p_payment_key TEXT,
  p_toss_raw JSONB,
  p_points_to_earn INT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_new_balance INT;
BEGIN
  -- 1. 주문 상태 업데이트
  UPDATE orders SET status = 'paid', paid_at = NOW()
  WHERE id = p_order_id AND status = 'pending_payment';

  IF NOT FOUND THEN
    RAISE EXCEPTION '이미 처리된 주문: %', p_order_id;
  END IF;

  SELECT user_id INTO v_user_id FROM orders WHERE id = p_order_id;

  -- 2. payments 업데이트
  UPDATE payments
  SET status = 'done',
      payment_key = p_payment_key,
      raw = p_toss_raw,
      approved_at = NOW()
  WHERE order_id = p_order_id;

  -- 3. inventory 차감
  UPDATE inventory inv
  SET qty = qty - oi.qty
  FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND inv.product_id = oi.product_id
    AND inv.option_key = oi.option_key;

  -- 4. 적립금 적립 (구매 완료 시 바로 적립, 또는 배송완료 시 적립으로 변경 가능)
  v_new_balance := (SELECT point_balance + p_points_to_earn FROM users WHERE id = v_user_id);
  UPDATE users SET point_balance = v_new_balance WHERE id = v_user_id;
  INSERT INTO points_ledger (user_id, delta, balance, reason, ref_id)
  VALUES (v_user_id, p_points_to_earn, v_new_balance, 'purchase_reward', p_order_id);

  -- 5. 쿠폰 사용 처리
  UPDATE user_coupons uc
  SET used_at = NOW(), used_order_id = p_order_id
  FROM orders o
  WHERE o.id = p_order_id
    AND uc.id = o.user_coupon_id
    AND uc.used_at IS NULL;

  -- 6. 알림 생성
  INSERT INTO notifications (user_id, type, title, body, link, ref_id)
  SELECT v_user_id, 'order_status', '주문이 완료되었습니다',
         '결제가 정상 처리되었습니다. 주문 상세를 확인하세요.',
         '/mypage/orders/' || p_order_id,
         p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 가상계좌 처리 흐름

```
결제창에서 가상계좌 선택
→ status = 'pending' (미입금 상태)
→ 웹훅: PAYMENT_STATUS_CHANGED (status=DONE, method=가상계좌)
→ webhooks-toss Edge Function에서 동일한 process_payment_confirm RPC 호출
→ 입금 정보는 payments.raw.virtualAccount.accountNumber 에 저장
```

---

## 결제 취소 (환불) 흐름

```
Admin → /admin/orders/[id] → 취소/환불 버튼
→ Edge Function: admin-order-cancel
→ POST https://api.tosspayments.com/v1/payments/{paymentKey}/cancel
   { cancelReason, cancelAmount (부분취소 시) }
→ orders.status = 'cancelled' or 'returned'
→ payments.status = 'cancelled'
→ inventory qty 복원
→ points_ledger INSERT (사용 적립금 반환)
→ audit_log 기록
```

---

## 보안 체크리스트

- [x] `TOSS_SECRET_KEY`는 Edge Function 환경 변수에만 저장 (클라이언트 노출 금지)
- [x] 결제 승인 전 DB 금액과 결제 금액 일치 검증
- [x] 웹훅 HMAC-SHA256 서명 검증 (`Toss-Signature` 헤더)
- [x] `paymentKey` 재사용 방지 (UNIQUE 제약)
- [x] payments.raw에는 카드번호 마지막 4자리, 카드사명, 승인번호만 저장
- [x] 가상계좌 계좌번호는 raw.virtualAccount.accountNumber 만 보관
- [x] 모든 결제 처리는 service_role (Edge Function) 에서만 실행
