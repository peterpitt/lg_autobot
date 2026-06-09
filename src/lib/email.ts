import { Resend } from "resend";
import type { FlightQuote } from "./travelpayouts";

// 延遲初始化，避免 build 階段缺少金鑰時報錯
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "優惠機票通知 <alerts@susucloud.site>";

function formatPrice(price: number, currency: string) {
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

export async function sendDealEmail(params: {
  to: string;
  origin: string;
  destination: string;
  targetPrice: number;
  quote: FlightQuote;
}) {
  const { to, origin, destination, targetPrice, quote } = params;
  const price = formatPrice(quote.price, quote.currency);
  const target = formatPrice(targetPrice, quote.currency);
  const depart = quote.departureAt?.slice(0, 10) ?? "";

  const html = `
  <div style="font-family:-apple-system,'PingFang TC','Microsoft JhengHei',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a2e;">
    <h2 style="color:#2f5fd0;margin:0 0 4px;">✈️ 發現優惠機票！</h2>
    <p style="color:#666;margin:0 0 20px;">你追蹤的航線出現低於目標價的票了</p>
    <div style="background:#eaf0fc;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="font-size:18px;font-weight:700;">${origin} → ${destination}</div>
      <div style="font-size:32px;font-weight:800;color:#2f5fd0;margin:8px 0;">${price}</div>
      <div style="color:#666;font-size:14px;">你的目標價：${target}　|　出發日：${depart}</div>
      <div style="color:#666;font-size:14px;">${quote.airline ?? ""} ${
        quote.transfers === 0 ? "・直飛" : `・轉機 ${quote.transfers ?? "-"} 次`
      }</div>
    </div>
    <a href="${quote.bookingLink}" style="display:block;text-align:center;background:#2f5fd0;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:700;">
      立即查看 / 訂票
    </a>
    <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
      由 susucloud 優惠機票訂閱系統自動為你監控　·　<a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="color:#999;">管理我的追蹤</a>
    </p>
  </div>`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `✈️ ${origin}→${destination} 出現優惠：${price}`,
    html,
  });
}
