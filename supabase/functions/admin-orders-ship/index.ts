// Supabase Edge Function: admin-orders-ship
// POST /functions/v1/admin-orders-ship
// Body: { orderId: UUID, carrierCode: string, carrierName: string, trackingNo: string }
// 호출: Admin 콘솔에서 송장 등록 시

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. 어드민 인증 검증
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "인증 필요" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "인증 실패" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // admin 권한 확인
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "어드민 권한 필요" }), {
        status: 403, headers: corsHeaders,
      });
    }

    const { orderId, carrierCode, carrierName, trackingNo } = await req.json();

    if (!orderId || !carrierCode || !trackingNo) {
      return new Response(
        JSON.stringify({ error: "orderId, carrierCode, trackingNo 는 필수입니다." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. 주문 상태 확인
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "주문을 찾을 수 없습니다." }), {
        status: 404, headers: corsHeaders,
      });
    }

    if (!["paid", "preparing"].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: `현재 상태(${order.status})에서는 송장 등록 불가` }),
        { status: 409, headers: corsHeaders }
      );
    }

    // 3. 송장 저장 + 주문 상태 변경 (트랜잭션)
    const now = new Date().toISOString();

    const [shipResult, orderResult] = await Promise.all([
      supabase.from("shipments").upsert({
        order_id: orderId,
        carrier_code: carrierCode,
        carrier_name: carrierName,
        tracking_no: trackingNo,
        shipped_at: now,
      }, { onConflict: "order_id" }).select().single(),

      supabase
        .from("orders")
        .update({ status: "shipping", updated_at: now })
        .eq("id", orderId),
    ]);

    if (shipResult.error || orderResult.error) {
      throw new Error(shipResult.error?.message ?? orderResult.error?.message);
    }

    // 4. 배송 알림 생성
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "order_status",
      title: "상품이 출발했습니다!",
      body: `${carrierName} / 운송장번호: ${trackingNo}`,
      link: `/mypage/orders/${orderId}`,
      ref_id: orderId,
    });

    // 5. 감사 로그 기록
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "status_change",
      entity: "order",
      entity_id: orderId,
      diff: {
        before: { status: order.status },
        after: { status: "shipping", tracking_no: trackingNo, carrier: carrierName },
      },
      ip: req.headers.get("x-forwarded-for") ?? null,
    });

    return new Response(
      JSON.stringify({ success: true, shipment: shipResult.data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-orders-ship 오류:", err);
    return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
