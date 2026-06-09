"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <Link href="/" className="text-2xl font-extrabold text-brand mb-8">
        ✈️ susucloud
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 p-8">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📬</div>
            <h1 className="text-xl font-bold">登入連結已寄出</h1>
            <p className="mt-2 text-slate-600 text-sm">
              我們寄了一封登入信到 <b>{email}</b>，點信裡的連結就能登入。
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-center">登入 / 註冊</h1>
            <p className="mt-2 text-center text-sm text-slate-500">
              輸入 Email，我們會寄一封免密碼登入連結給你
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-brand"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? "寄送中…" : "寄送登入連結"}
              </button>
            </form>
          </>
        )}
      </div>
      <Link href="/" className="mt-6 text-sm text-slate-400 hover:text-brand">
        ← 回首頁
      </Link>
    </main>
  );
}
