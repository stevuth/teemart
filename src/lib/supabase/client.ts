
"use client";

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}
