import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "susucloud ｜ 優惠機票訂閱系統",
  description:
    "設定想追蹤的航線與優惠價格，系統自動查票，發現優惠時主動用 Email 通知你。訂閱制，月月自動續訂。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://susucloud.site"),
  openGraph: {
    title: "susucloud ｜ 優惠機票訂閱系統",
    description: "設定航線與目標價，自動查票、優惠主動通知。",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  );
}
