import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xccrkalsujefsghtuirp.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8OgpONUHDIggAbE1uJ9s9g_OY0uXLPd";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
