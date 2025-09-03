import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase"; // make sure you generated types

export function createSupabaseServerClient() {
  return createServerActionClient<Database>({ cookies });
}
