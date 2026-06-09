// Travelpayouts / Aviasales 機票價格查詢
// 文件：https://support.travelpayouts.com/hc/en-us/articles/203956163

export interface FlightQuote {
  origin: string;
  destination: string;
  price: number;
  currency: string;
  departureAt: string;
  returnAt?: string;
  airline?: string;
  flightNumber?: string;
  transfers?: number;
  // 可直接帶聯盟 marker 的訂票連結
  bookingLink: string;
}

interface PricesForDatesResponse {
  success: boolean;
  data: Array<{
    origin: string;
    destination: string;
    price: number;
    airline: string;
    flight_number: number;
    departure_at: string;
    return_at?: string;
    transfers: number;
    link: string;
  }>;
  currency: string;
}

/**
 * 查某條航線目前最便宜的票價。
 * @param origin       出發地 IATA，例如 TPE
 * @param destination  目的地 IATA，例如 NRT
 * @param opts.month   目標月份 YYYY-MM（可選，不給就查最近）
 * @param opts.oneWay  是否單程
 * @param opts.currency 幣別，預設 twd
 */
export async function getCheapestFlight(
  origin: string,
  destination: string,
  opts: { month?: string; oneWay?: boolean; currency?: string } = {}
): Promise<FlightQuote | null> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    throw new Error("缺少 TRAVELPAYOUTS_TOKEN 環境變數");
  }

  const currency = (opts.currency || "twd").toLowerCase();
  const params = new URLSearchParams({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    unique: "false",
    sorting: "price",
    direct: "false",
    currency,
    limit: "1",
    page: "1",
    one_way: String(Boolean(opts.oneWay)),
    token,
  });
  if (opts.month) {
    // departure_at 接受 YYYY-MM（整個月）或 YYYY-MM-DD
    params.set("departure_at", opts.month);
  }

  const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    throw new Error(`Travelpayouts API 回應 ${res.status}`);
  }

  const json = (await res.json()) as PricesForDatesResponse;
  if (!json.success || !json.data?.length) return null;

  const top = json.data[0];
  const marker = process.env.TRAVELPAYOUTS_MARKER;
  const base = `https://www.aviasales.com${top.link}`;
  const bookingLink = marker ? `${base}${base.includes("?") ? "&" : "?"}marker=${marker}` : base;

  return {
    origin: top.origin,
    destination: top.destination,
    price: top.price,
    currency: json.currency || currency,
    departureAt: top.departure_at,
    returnAt: top.return_at,
    airline: top.airline,
    flightNumber: String(top.flight_number),
    transfers: top.transfers,
    bookingLink,
  };
}
