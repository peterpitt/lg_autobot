"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutButton({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      setLoading(false);
      alert(json.error || "無法建立結帳，請稍後再試");
    }
  }

  return (
    <button
      onClick={checkout}
      disabled={loading}
      className="block w-full rounded-xl bg-brand py-3 text-center font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {loading ? "前往結帳…" : "升級 Pro"}
    </button>
  );
}
