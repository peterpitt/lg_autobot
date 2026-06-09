import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheapestFlight } from "@/lib/travelpayouts";
import { sendDealEmail } from "@/lib/email";
import type { Alert } from "@/lib/types";

// Vercel Cron 會定時呼叫這支（見 vercel.json）。
// 這支取代了原本架構裡的 AWS Lambda：定時、自動、無伺服器地查票。
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // 安全檢查：只允許帶正確 CRON_SECRET 的請求
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: alerts, error } = await admin
    .from("alerts")
    .select("*")
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let checked = 0;
  let notified = 0;
  const errors: string[] = [];

  for (const alert of (alerts as Alert[]) ?? []) {
    try {
      const quote = await getCheapestFlight(alert.origin, alert.destination, {
        month: alert.depart_month || undefined,
        oneWay: alert.one_way,
        currency: alert.currency,
      });
      checked++;

      if (!quote) {
        await admin
          .from("alerts")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", alert.id);
        continue;
      }

      // 更新最近查到的價格
      await admin
        .from("alerts")
        .update({
          last_price: quote.price,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", alert.id);

      // 是否該通知：低於目標價，且比上次通知過的價格更低（避免同價重複轟炸）
      const hitTarget = quote.price <= alert.target_price;
      const cheaperThanLastNotice =
        alert.last_notified_price == null || quote.price < alert.last_notified_price;

      if (hitTarget && cheaperThanLastNotice) {
        // 取得使用者 email
        const { data: profile } = await admin
          .from("profiles")
          .select("email")
          .eq("id", alert.user_id)
          .single();

        const to = profile?.email;
        if (to) {
          await sendDealEmail({
            to,
            origin: alert.origin,
            destination: alert.destination,
            targetPrice: alert.target_price,
            quote,
          });

          await admin.from("notifications").insert({
            user_id: alert.user_id,
            alert_id: alert.id,
            channel: "email",
            price: quote.price,
            message: `${alert.origin}→${alert.destination} ${quote.price} ${quote.currency}`,
          });

          await admin
            .from("alerts")
            .update({ last_notified_price: quote.price })
            .eq("id", alert.id);

          notified++;
        }
      }
    } catch (err) {
      errors.push(`alert ${alert.id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ ok: true, checked, notified, errors });
}
