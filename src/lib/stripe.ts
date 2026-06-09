import Stripe from "stripe";

// 延遲初始化：build 階段沒有環境變數，等實際被呼叫時才建立，避免 build 失敗
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
  }
  return _stripe;
}
