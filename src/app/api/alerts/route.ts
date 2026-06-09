import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await request.json();
  const origin = String(body.origin || "").toUpperCase().trim();
  const destination = String(body.destination || "").toUpperCase().trim();
  const target_price = Number(body.target_price);

  if (origin.length !== 3 || destination.length !== 3) {
    return NextResponse.json({ error: "請填寫 3 碼機場代碼（IATA）" }, { status: 400 });
  }
  if (!Number.isFinite(target_price) || target_price <= 0) {
    return NextResponse.json({ error: "目標價需為正整數" }, { status: 400 });
  }

  // 依方案檢查上限
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan: Plan = (profile?.plan as Plan) || "free";
  const limit = PLAN_LIMITS[plan].maxAlerts;

  const { count } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `已達方案上限 ${limit} 條，請升級 Pro` },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      origin,
      destination,
      depart_month: body.depart_month || null,
      one_way: Boolean(body.one_way),
      target_price: Math.round(target_price),
      currency: (body.currency || "twd").toLowerCase(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data });
}
