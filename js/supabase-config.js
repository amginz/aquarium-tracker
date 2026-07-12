/* ============================================================
   SUPABASE CONFIG
   ------------------------------------------------------------
   Fill these two values in to enable cloud sync via Supabase.
   Leave them blank ('') to keep using local/browser storage only
   - the app works completely fine without Supabase.

   Where to find these values:
   1. Open your project on https://supabase.com/dashboard
   2. Go to Project Settings -> API
   3. Copy "Project URL"           -> url
   4. Copy "anon public" API key   -> anonKey   (never use the
      "service_role" key here, it must stay server-side only)

   See /supabase/schema.sql for the table + RLS policies this
   app expects, and README.md for the full setup walkthrough.
   ============================================================ */
const SUPABASE_CONFIG = {
  url: 'https://jygjcgctbsukcqwcphjc.supabase.co',
  anonKey: 'sb_publishable_rUImYx42x9wJKos5713dQg_H0R8huQF'
};
