// Supabase Edge Function: payments-toss-confirm
// POST /functions/v1/payments-toss-confirm
// 호출: 결제 완료 successUrl 후, 클라이언트에서 supabase.functions.invoke() 로 호출

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "paymentKey, orderId, amount 는 필수입니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 서비스 롤 클라이언트 (RLS 우회)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. 호출자 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증 필요" }), {
        status: 401, headers: corsHeaders,
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "인증 실패" }), {
        status: 401, headers: corsHeaders,
      });
    }

    // 2. 주문 조회 및 금액 검증
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, total, status, user_id, user_coupon_id")
      .eq("order_no", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "주문을 찾을 수 없습니다." }), {
        status: 404, headers: corsHeaders,
      });
    }

    // 본인 주문인지 확인
    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "권한 없음" }), {
        status: 403, headers: corsHeaders,
      });
    }

    // 금액 위변조 방지
    if (order.total !== Number(amount)) {
      console.error(`금액 불일치: DB=${order.total}, 요청=${amount}`);
      return new Response(JSON.stringify({ error: "결제 금액 불일치" }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (order.status !== "pending_payment") {
      return new Response(JSON.stringify({ error: "이미 처리된 주문입니다." }), {
        status: 409, headers: corsHeaders,
      });
    }

    // 3. Toss 결제 승인 API 호출
    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(TOSS_SECRET_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error("Toss 결제 실패:", tossData);
      // 결제 실패 → 주문 취소 처리
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);
      await supabase
        .from("payments")
        .update({ status: "aborted" })
        .eq("order_id", order.id);

      return new Response(
        JSON.stringify({ error: tossData.message ?? "결제 승인 실패", code: tossData.code }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. raw 데이터에서 필요한 필드만 추출 (개인정보 최소화)
    const rawSnapshot = {
      method: tossData.method,
      approvedAt: tossData.approvedAt,
      receiptUrl: tossData.receipt?.url,
      ...(tossData.card && {
        card: {
          issuerCode: tossData.card.issuerCode,
          issuerName: tossData.card.issuerCode, // 실제론 issuer 매핑 필요
          approveNo: tossData.card.approveNo,
          number: tossData.card.number?.slice(-4), // 마지막 4자리만
        },
      }),
      ...(tossData.virtualAccount && {
        virtualAccount: {
          bankCode: tossData.virtualAccount.bankCode,
          accountNumber: tossData.virtualAccount.accountNumber,
          dueDate: tossData.virtualAccount.dueDate,
        },
      }),
    };

    // 5. 적립금 계산 (구매금액의 1%)
    const pointsToEarn = Math.floor(order.total * 0.01);

    // 6. DB 트랜잭션 처리 (RPC)
    const { error: rpcErr } = await supabase.rpc("process_payment_confirm", {
      p_order_id: order.id,
      p_payment_key: paymentKey,
      p_toss_raw: rawSnapshot,
      p_receipt_url: tossData.receipt?.url ?? null,
      p_method: tossData.method ?? null,
      p_points_to_earn: pointsToEarn,
    });

    if (rpcErr) {
      console.error("process_payment_confirm RPC 오류:", rpcErr);
      return new Response(
        JSON.stringify({ error: "주문 처리 중 오류가 발생했습니다.", detail: rpcErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, pointsEarned: pointsToEarn }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
