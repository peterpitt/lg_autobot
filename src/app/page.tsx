import Link from "next/link";

const features = [
  {
    icon: "🎯",
    title: "自由設定追蹤航線",
    desc: "在網站上設定你想追蹤的航線和優惠價格，想飛哪、多少錢以下要通知，全部你說了算。",
  },
  {
    icon: "🤖",
    title: "系統自動查票",
    desc: "系統每天自動巡查票價，發現低於你目標價的優惠時，主動用 Email 推播通知（LINE / 簡訊陸續支援）。",
  },
  {
    icon: "💳",
    title: "海外金流訂閱制",
    desc: "支援 Stripe 海外刷卡，月月自動續訂、升降方案、隨時取消都沒問題。",
  },
  {
    icon: "🌐",
    title: "真正屬於你的網站",
    desc: "有自己的網域 susucloud.site，是一個真正屬於你的品牌網站。",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* 導覽列 */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="text-xl font-extrabold text-brand">✈️ susucloud</div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/pricing" className="text-slate-600 hover:text-brand">
            方案價格
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-brand">
            登入
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            免費開始
          </Link>
        </div>
      </nav>

      {/* 主視覺 */}
      <section className="px-6 pt-16 pb-20 text-center max-w-3xl mx-auto">
        <div className="inline-block rounded-full bg-brand-light px-4 py-1 text-sm font-medium text-brand mb-6">
          訂閱制 · 月月自動收錢
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
          優惠機票，
          <span className="text-brand">系統替你自動盯</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          設定想追蹤的航線和優惠價格，系統 24 小時自動查票，
          一發現便宜票就主動通知你。不用再天天自己刷票價。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-brand px-7 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            免費開始追蹤
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-slate-300 px-7 py-3 font-semibold text-slate-700 hover:border-brand hover:text-brand"
          >
            看方案
          </Link>
        </div>
      </section>

      {/* 功能 */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 p-6 hover:border-brand transition-colors"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto rounded-3xl bg-brand px-8 py-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            下一張便宜機票，讓系統幫你找到
          </h2>
          <p className="mt-3 text-brand-light">免費版即可開始追蹤一條航線</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-white px-7 py-3 font-semibold text-brand hover:bg-brand-light"
          >
            立即免費開始
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} susucloud.site · 優惠機票訂閱系統
      </footer>
    </main>
  );
}
