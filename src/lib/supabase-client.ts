
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error("Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.");
}

if (!supabaseAnonKey) {
    throw new Error("Supabase Anon Key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
