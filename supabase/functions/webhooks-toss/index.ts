// Supabase Edge Function: webhooks-toss
// POST /functions/v1/webhooks-toss
// Toss Payments 서버 → Supabase 웹훅 수신
// 필수: Toss Dashboard에서 웹훅 URL 등록 + Secret 설정

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const TOSS_WEBHOOK_SECRET = Deno.env.get("TOSS_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // 1. HMAC-SHA256 서명 검증
  const signature = req.headers.get("Toss-Signature");
  if (!signature || !TOSS_WEBHOOK_SECRET) {
    return new Response("Signature required", { status: 401 });
  }

  const expectedSig = await hmac("sha256", TOSS_WEBHOOK_SECRET, rawBody, "utf8", "hex");
  if (signature !== expectedSig) {
    console.error("웹훅 서명 불일치");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const eventType = payload.eventType as string;
  const data = payload.data as Record<string, unknown>;

  console.log("Toss Webhook:", eventType, data?.paymentKey);

  try {
    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const status = data.status as string;
        const paymentKey = data.paymentKey as string;
        const orderId = data.orderId as string; // PG 주문번호

        if (status === "DONE") {
          // 가상계좌 입금 완료 등
          const { data: order } = await supabase
            .from("orders")
            .select("id, total, status, user_id, user_coupon_id")
            .eq("order_no", orderId)
            .single();

          if (order && order.status === "pending_payment") {
            const rawSnapshot = {
              method: data.method,
              approvedAt: data.approvedAt,
              virtualAccount: (data.virtualAccount as Record<string, unknown>) ?? null,
            };
            const pointsToEarn = Math.floor((order.total as number) * 0.01);
            await supabase.rpc("process_payment_confirm", {
              p_order_id: order.id,
              p_payment_key: paymentKey,
              p_toss_raw: rawSnapshot,
              p_receipt_url: null,
              p_method: data.method as string ?? null,
              p_points_to_earn: pointsToEarn,
            });
          }
        } else if (status === "CANCELED" || status === "ABORTED") {
          await supabase
            .from("payments")
            .update({ status: status === "CANCELED" ? "cancelled" : "aborted" })
            .eq("payment_key", paymentKey);
        }
        break;
      }

      case "PAYMENT_CANCELED": {
        const paymentKey = data.paymentKey as string;
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("payment_key", paymentKey);
        break;
      }

      default:
        console.log("처리하지 않는 이벤트:", eventType);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("웹훅 처리 오류:", err);
    // Toss는 5xx 응답 시 재전송하므로 멱등 처리 중요
    return new Response("Internal error", { status: 500 });
  }
});
