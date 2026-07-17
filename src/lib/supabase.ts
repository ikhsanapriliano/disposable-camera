import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

function getSafeClient() {
  if (typeof window === "undefined") {
    return createClient<Database>("https://placeholder.supabase.co", "placeholder-key");
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = getSafeClient();