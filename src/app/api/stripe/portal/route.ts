import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// 讓使用者管理訂閱（升降方案、取消、更新卡片）
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${SITE}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(`${SITE}/pricing`);
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE}/dashboard`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
