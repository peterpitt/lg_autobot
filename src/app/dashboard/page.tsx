import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Alert, type Plan } from "@/lib/types";
import AlertManager from "./AlertManager";
import SignOutButton from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const plan: Plan = (profile?.plan as Plan) || "free";
  const limit = PLAN_LIMITS[plan];
  const isActive = profile?.subscription_status === "active" || plan === "free";

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="text-xl font-extrabold text-brand">
          ✈️ susucloud
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="rounded-full bg-brand-light px-3 py-1 font-medium text-brand">
            {limit.label}
          </span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">我的機票追蹤</h1>
            <p className="mt-1 text-slate-500 text-sm">
              已使用 {alerts?.length ?? 0} / {limit.maxAlerts} 條追蹤
              {plan === "free" && (
                <>
                  {" · "}
                  <Link href="/pricing" className="text-brand font-medium hover:underline">
                    升級 Pro 可追蹤 {PLAN_LIMITS.pro.maxAlerts} 條
                  </Link>
                </>
              )}
            </p>
          </div>
          {plan === "pro" && (
            <form action="/api/stripe/portal" method="POST">
              <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-brand">
                管理訂閱
              </button>
            </form>
          )}
        </div>

        <div className="mt-6">
          <AlertManager
            initialAlerts={(alerts as Alert[]) ?? []}
            maxAlerts={limit.maxAlerts}
            userEmail={user.email ?? ""}
            canUse={isActive}
          />
        </div>
      </div>
    </main>
  );
}
