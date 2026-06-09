export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  plan: Plan;
  subscription_status: string;
  current_period_end: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  depart_month: string | null;
  one_way: boolean;
  target_price: number;
  currency: string;
  active: boolean;
  last_price: number | null;
  last_notified_price: number | null;
  last_checked_at: string | null;
  created_at: string;
}

export const PLAN_LIMITS: Record<Plan, { maxAlerts: number; label: string }> = {
  free: { maxAlerts: 1, label: "免費版" },
  pro: { maxAlerts: 20, label: "Pro 訂閱版" },
};
