import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CheckoutButton from "./CheckoutButton";

export const dynamic = "force-dynamic";

const plans = [
  {
    name: "免費版",
    price: "NT$0",
    period: "",
    features: ["追蹤 1 條航線", "每 6 小時自動查票", "Email 優惠通知"],
    cta: "免費開始",
    plan: "free" as const,
  },
  {
    name: "Pro 訂閱版",
    price: "NT$199",
    period: "/ 月",
    features: [
      "追蹤多達 20 條航線",
      "每 6 小時自動查票",
      "Email 優惠通知",
      "優先支援，未來新管道優先開通",
    ],
    cta: "升級 Pro",
    plan: "pro" as const,
    highlight: true,
  },
];

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 還沒設定 Stripe 金鑰時，先只提供免費版（隱藏付費升級）
  const stripeEnabled =
    !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_PRO;

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-extrabold text-brand">
          ✈️ susucloud
        </Link>
        <Link href={user ? "/dashboard" : "/login"} className="text-sm text-slate-600 hover:text-brand">
          {user ? "我的追蹤" : "登入"}
        </Link>
      </nav>

      <section className="px-6 py-12 text-center">
        <h1 className="text-3xl font-extrabold">選擇你的方案</h1>
        <p className="mt-3 text-slate-500">隨時可升級、降級或取消</p>
      </section>

      <section className="px-6 pb-24 max-w-3xl mx-auto grid gap-6 sm:grid-cols-2">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl border p-8 ${
              p.highlight ? "border-brand shadow-lg shadow-brand/10" : "border-slate-200"
            }`}
          >
            {p.highlight && (
              <div className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white mb-3">
                最受歡迎
              </div>
            )}
            <h2 className="text-xl font-bold">{p.name}</h2>
            <div className="mt-2">
              <span className="text-4xl font-extrabold">{p.price}</span>
              <span className="text-slate-500">{p.period}</span>
            </div>
            <ul className="mt-6 space-y-2 text-slate-600">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-brand">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {p.plan === "free" ? (
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="block rounded-xl border border-slate-300 py-3 text-center font-semibold hover:border-brand"
                >
                  {p.cta}
                </Link>
              ) : stripeEnabled ? (
                <CheckoutButton loggedIn={!!user} />
              ) : (
                <div className="block rounded-xl border border-dashed border-slate-300 py-3 text-center text-sm text-slate-400">
                  即將開放
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
