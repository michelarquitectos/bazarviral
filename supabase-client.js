const SUPABASE_URL = "https://fzltwiahbxgutvlzeiyr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HeEMQ4CNh7O3PxCpz9wDLw_dBttJK2N";

window.bazarSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
