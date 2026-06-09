import { createClient } from "@supabase/supabase-js";

// service_role client：繞過 RLS，只能在伺服器端用（cron、stripe webhook）
// 千萬不要在瀏覽器端 import 這個檔案
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
