# ✈️ susucloud — 優惠機票訂閱系統

設定想追蹤的航線和優惠價格，系統 **24 小時自動查票**，發現低於你目標價的機票時，主動用 **Email 通知**你。訂閱制，月月自動續訂。

> 這是圖片那個變現 idea 的完整 MVP。原架構的 **AWS Lambda 已用 Vercel Cron 取代**，整套都跑在 Vercel + Supabase，不用多管一個雲服務。

## 技術棧

| 功能 | 用的工具 |
| --- | --- |
| 前端 + 後端 API | Next.js 14（App Router）部署在 **Vercel** |
| 資料庫 + 登入 | **Supabase**（Postgres + Auth + RLS）|
| 海外訂閱金流 | **Stripe**（訂閱、自動續訂、升降方案、Billing Portal）|
| 查機票價格 | **Travelpayouts / Aviasales API** |
| 寄送通知 | **Resend**（Email；LINE / 簡訊已預留接口）|
| 定時自動查票 | **Vercel Cron Jobs**（取代 AWS Lambda）|
| 網域 | **susucloud.site**（GoDaddy）|

## 專案結構

```
src/
├── app/
│   ├── page.tsx                      # 行銷首頁
│   ├── pricing/                      # 方案價格頁 + 升級按鈕
│   ├── login/                        # 免密碼 Email 登入
│   ├── auth/callback/                # 登入連結回呼
│   ├── dashboard/                    # 會員後台：管理追蹤航線
│   └── api/
│       ├── alerts/                   # 新增 / 刪除追蹤航線
│       ├── stripe/                   # checkout / portal / webhook
│       └── cron/check-flights/       # ★ 自動查票（Vercel Cron 呼叫）
├── lib/
│   ├── supabase/                     # client / server / admin
│   ├── stripe.ts
│   ├── travelpayouts.ts              # 查機票
│   ├── email.ts                      # Resend 通知信
│   └── types.ts                      # 方案上限等
supabase/schema.sql                   # 資料庫結構（貼到 Supabase SQL Editor 跑）
vercel.json                           # Cron 排程設定
```

---

## 從零開始設定（照做就能上線）

### 0. 安裝與本機啟動

```bash
npm install
cp .env.example .env.local   # 填入下面各服務的金鑰
npm run dev                  # http://localhost:3000
```

### 1. Supabase（資料庫 + 登入）

1. 到 [supabase.com](https://supabase.com) 建立專案。
2. 後台 **SQL Editor** → 貼上 `supabase/schema.sql` 整段 → Run。
3. 後台 **Project Settings → API** 複製：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（機密，只在伺服器用）
4. **Authentication → URL Configuration**：把 Site URL 設成 `https://susucloud.site`，並在 Redirect URLs 加上 `https://susucloud.site/auth/callback`（本機測試再加 `http://localhost:3000/auth/callback`）。

### 2. Travelpayouts（查機票）

1. 到 [travelpayouts.com](https://www.travelpayouts.com) 註冊。
2. 後台拿 **API token** → `TRAVELPAYOUTS_TOKEN`。
3. （選配）拿你的聯盟 **marker** → `TRAVELPAYOUTS_MARKER`，之後使用者透過通知信訂票可抽成。

### 3. Resend（寄通知信）

1. 到 [resend.com](https://resend.com) 註冊，拿 API key → `RESEND_API_KEY`。
2. **Domains** 裡新增並驗證 `susucloud.site`（在 GoDaddy 加它給的 DNS 記錄）。
3. `EMAIL_FROM` 設成 `優惠機票通知 <alerts@susucloud.site>`。

### 4. Stripe（訂閱金流）

1. 到 [stripe.com](https://stripe.com) 註冊。
2. 建立一個 **Product → 經常性價格（每月）**，例如 NT$199 / 月 → 複製 price id → `STRIPE_PRICE_PRO`。
3. **Developers → API keys**：`STRIPE_SECRET_KEY`、`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`。
4. **Developers → Webhooks** → 新增端點 `https://susucloud.site/api/stripe/webhook`，
   訂閱事件：`checkout.session.completed`、`customer.subscription.created/updated/deleted` → 拿 `STRIPE_WEBHOOK_SECRET`。
   - 本機測試可用 `stripe listen --forward-to localhost:3000/api/stripe/webhook`。

### 5. Cron 金鑰

`CRON_SECRET` 自己設一段長亂碼（例如 `openssl rand -hex 32`）。Vercel Cron 會自動帶 `Authorization: Bearer <CRON_SECRET>` 呼叫查票 API。

---

## 部署到 Vercel + 接上 susucloud.site

1. 把這個 repo 連到 [Vercel](https://vercel.com)，Import 專案。
2. **Settings → Environment Variables** 把 `.env.local` 裡的每一個變數都填進去。
3. Deploy。Vercel 會自動讀 `vercel.json`，把 **Cron 排程**（預設每 6 小時）建好。
4. **接網域**：Vercel **Settings → Domains** 輸入 `susucloud.site` → Vercel 會給你 DNS 設定。
   到 **GoDaddy → 你的網域 → DNS**：
   - 加一筆 `A` 記錄 `@` → `76.76.21.21`（依 Vercel 畫面為準）
   - 加一筆 `CNAME` 記錄 `www` → `cname.vercel-dns.com`
   - 等 DNS 生效（通常幾分鐘到幾小時），Vercel 會自動發 SSL 憑證。
5. 上線後把 Supabase、Stripe webhook、Resend 寄件網域裡的網址都改成 `https://susucloud.site`。

### 手動測試自動查票

```bash
curl https://susucloud.site/api/cron/check-flights \
  -H "Authorization: Bearer <你的 CRON_SECRET>"
# 回傳 { ok, checked, notified, errors }
```

---

## 運作流程

1. 使用者用 Email 登入 → 在後台新增「航線 + 目標價」。
2. Vercel Cron 每 6 小時呼叫 `/api/cron/check-flights`。
3. 對每條 active 航線向 Travelpayouts 查最低價，寫回 `last_price`。
4. 當最低價 **≤ 目標價** 且 **比上次通知更低** → 用 Resend 寄優惠信，記錄通知、更新 `last_notified_price`（避免同價重複轟炸）。
5. Stripe 處理訂閱；webhook 把訂閱狀態同步回 Supabase，控制方案可追蹤的航線數量。

## 之後要加 LINE / 簡訊？

`src/lib/email.ts` 與 cron 裡的通知邏輯已抽象成「channel」。要加 LINE：
- 申請 LINE Messaging API channel，新增 `src/lib/line.ts`，在 cron 的通知段落多呼叫一次即可（notifications 表已有 `channel` 欄位）。
- 簡訊同理，接 Twilio。

## 方案設定

`src/lib/types.ts` 的 `PLAN_LIMITS` 控制各方案可追蹤的航線數（free=1、pro=20），可自由調整。
