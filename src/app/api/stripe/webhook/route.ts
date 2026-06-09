import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook 需要原始 body 來驗簽，所以不能用 JSON 解析
export const dynamic = "force-dynamic";

async function syncSubscription(customerId: string, subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const status = subscription.status; // active | trialing | past_due | canceled ...
  const isPaid = status === "active" || status === "trialing";

  await admin
    .from("profiles")
    .update({
      plan: isPaid ? "pro" : "free",
      subscription_status: status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "缺少簽章" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json(
      { error: `簽章驗證失敗: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          await syncSubscription(session.customer as string, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub.customer as string, sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("webhook 處理失敗", err);
    return NextResponse.json({ error: "處理失敗" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
