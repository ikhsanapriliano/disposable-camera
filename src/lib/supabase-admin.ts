import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

let _admin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin(): ReturnType<typeof createClient<Database>> {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    _admin = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}