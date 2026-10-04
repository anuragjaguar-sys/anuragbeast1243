import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase now calls this a "publishable key". Keep supporting the older
// anon-key variable so existing local and deployed environments keep working.
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Supabase credentials! Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  } else {
    console.warn(
      "[Supabase] Warning: Running without a Supabase URL or publishable/anon key. Remote sync operations will fail."
    );
  }
}

// The proxy reads the session from cookies. createBrowserClient keeps the
// browser session in those same cookies, so a successful password login is
// visible on the following navigation instead of redirecting back to /login.
export const supabase = createBrowserClient(
  supabaseUrl || "https://unconfigured.supabase.co",
  supabaseKey || "unconfigured-publishable-key"
);
