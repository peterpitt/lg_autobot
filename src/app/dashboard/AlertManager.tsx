"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Alert } from "@/lib/types";

const emptyForm = {
  origin: "",
  destination: "",
  depart_month: "",
  target_price: "",
  one_way: false,
  currency: "twd",
};

function formatPrice(price: number | null, currency: string) {
  if (price == null) return "尚未查詢";
  try {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency.toUpperCase()}`;
  }
}

export default function AlertManager({
  initialAlerts,
  maxAlerts,
  canUse,
}: {
  initialAlerts: Alert[];
  maxAlerts: number;
  userEmail: string;
  canUse: boolean;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = alerts.length >= maxAlerts;

  async function addAlert(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (atLimit) {
      setError(`已達上限 ${maxAlerts} 條，請升級方案`);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        target_price: Number(form.target_price),
      }),
    });
    setLoading(false);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "新增失敗");
      return;
    }
    setAlerts([json.alert, ...alerts]);
    setForm(emptyForm);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAlerts(alerts.filter((a) => a.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* 新增表單 */}
      <form
        onSubmit={addAlert}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-bold mb-4">➕ 新增追蹤航線</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-500">出發地 (IATA)</span>
            <input
              required
              maxLength={3}
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value.toUpperCase() })}
              placeholder="TPE"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-brand"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">目的地 (IATA)</span>
            <input
              required
              maxLength={3}
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value.toUpperCase() })
              }
              placeholder="NRT"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-brand"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">出發月份（可留空）</span>
            <input
              type="month"
              value={form.depart_month}
              onChange={(e) => setForm({ ...form, depart_month: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-500">目標價（低於此價就通知）</span>
            <input
              type="number"
              required
              min={1}
              value={form.target_price}
              onChange={(e) => setForm({ ...form, target_price: e.target.value })}
              placeholder="8000"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.one_way}
            onChange={(e) => setForm({ ...form, one_way: e.target.checked })}
          />
          只查單程
        </label>

        {!canUse && (
          <p className="mt-3 text-sm text-amber-600">
            訂閱已逾期，請先到「管理訂閱」更新付款方式。
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || atLimit || !canUse}
          className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "新增中…" : atLimit ? `已達上限 ${maxAlerts} 條` : "開始追蹤"}
        </button>
      </form>

      {/* 清單 */}
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          還沒有追蹤航線，新增一條開始吧 ✈️
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="text-lg font-bold">
                  {a.origin} → {a.destination}
                  {a.one_way && (
                    <span className="ml-2 text-xs font-normal text-slate-400">單程</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  目標價 {formatPrice(a.target_price, a.currency)}
                  {a.depart_month && ` · ${a.depart_month}`}
                  {" · 最近查到 "}
                  <span
                    className={
                      a.last_price != null && a.last_price <= a.target_price
                        ? "font-semibold text-green-600"
                        : ""
                    }
                  >
                    {formatPrice(a.last_price, a.currency)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="text-sm text-slate-400 hover:text-red-500"
              >
                刪除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
