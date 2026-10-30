const SUPABASE_URL = "https://fzltwiahbxgutvlzeiyr.supabase.co";
if(!document.querySelector('link[href^="product-images.css"]')){const imageStyles=document.createElement("link");imageStyles.rel="stylesheet";imageStyles.href="product-images.css?v=1";document.head.append(imageStyles)}
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
