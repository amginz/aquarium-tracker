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
  url: '',      // e.g. 'https://mszgtrxtzzzsidtasajt.supabase.co'
  anonKey: ''   // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zemd0cnh0enp6c2lkdGFzYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDI3NTcsImV4cCI6MjA5OTQxODc1N30.GStkA_8jcfFvtgf70XN28QVaj0R2HuN27lEQj3dMROE'
};
