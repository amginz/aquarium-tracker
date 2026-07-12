/* ============================================================
   PERSISTENCE
   ------------------------------------------------------------
   Three interchangeable backends, auto-selected in this order:

     1. Supabase        - if js/supabase-config.js has url + anonKey
                           filled in AND the supabase-js CDN script
                           loaded successfully AND the user is signed
                           in with a real account (email/password).
                           Data follows that account across ANY
                           device/browser where they log in.
     2. Artifact storage - window.storage, only present when this app
                           runs inside a Claude.ai artifact.
     3. localStorage     - plain browser storage, always available as
                           the final fallback. This is what a fresh
                           GitHub Pages deploy uses out of the box,
                           and what's used before the user logs in.

   Every backend is driven through the same two functions,
   saveState()/loadState(), so the rest of the app never needs to
   know which one is active.

   AUTH
   ------------------------------------------------------------
   Unlike the old anonymous-sign-in version, this build requires a
   real account (email + password) to use Supabase sync - that's
   what makes "log in on your phone, see the same tanks as your
   computer" possible. window.AquariumAuth exposes everything a
   login UI needs; see js/auth-ui.js for the actual login screen.
   ============================================================ */
const STORAGE_KEY = 'aquarium-tracker-state';
const hasArtifactStorage = typeof window !== 'undefined' && !!window.storage;
const supabaseConfigured = typeof SUPABASE_CONFIG !== 'undefined' &&
  !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;

let supabaseClient = null;
let supabaseReady = null; // Promise, resolves true/false once client init finishes
let authUser = null;      // the signed-in Supabase user object, or null
let authListeners = [];   // callbacks notified whenever auth state changes

function notifyAuthListeners() {
  for (const fn of authListeners) {
    try { fn(authUser); } catch (err) { console.error('auth listener error:', err); }
  }
}

// Creates the Supabase client (does NOT sign anyone in - that's a
// separate, explicit step now). Safe to call multiple times.
function initSupabase() {
  if (supabaseReady) return supabaseReady;

  supabaseReady = (async () => {
    if (!supabaseConfigured) return false;
    if (typeof window.supabase === 'undefined') {
      console.warn('Supabase config found, but the supabase-js library did not load. Check the <script> tag / network connection.');
      return false;
    }
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

      // Pick up an existing session (e.g. user logged in earlier and
      // Supabase's own localStorage token is still valid).
      const { data: { session } } = await supabaseClient.auth.getSession();
      authUser = session ? session.user : null;

      // Keep authUser in sync going forward (covers login, logout,
      // token refresh, and the same session syncing across tabs).
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        authUser = session ? session.user : null;
        notifyAuthListeners();
      });

      notifyAuthListeners();
      return true;
    } catch (err) {
      console.error('Supabase init failed, falling back to local storage:', err);
      supabaseClient = null;
      return false;
    }
  })();

  return supabaseReady;
}

// Kick off Supabase init as soon as this file loads, so auth-ui.js can
// immediately show "checking session..." -> login form or logged-in state.
if (supabaseConfigured) initSupabase();

/* ------------------------------------------------------------
   Public auth API - used by js/auth-ui.js (or your own UI)
   ------------------------------------------------------------ */
const AquariumAuth = {
  // true only if config is filled in AND the client loaded - i.e.
  // whether login is even possible in this deployment.
  isAvailable() {
    return supabaseConfigured;
  },

  // Currently signed-in user, or null.
  getUser() {
    return authUser;
  },

  // Register a callback: fn(user | null) is called immediately with
  // the current state, then again every time auth state changes.
  onChange(fn) {
    authListeners.push(fn);
    fn(authUser);
    return () => { authListeners = authListeners.filter(f => f !== fn); };
  },

  async signUp(email, password) {
    await initSupabase();
    if (!supabaseClient) throw new Error('Supabase ยังไม่พร้อมใช้งาน');
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    // If "Confirm email" is enabled in the Supabase dashboard, data.session
    // will be null here until the user clicks the confirmation link.
    return data;
  },

  async signIn(email, password) {
    await initSupabase();
    if (!supabaseClient) throw new Error('Supabase ยังไม่พร้อมใช้งาน');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    await initSupabase();
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email) {
    await initSupabase();
    if (!supabaseClient) throw new Error('Supabase ยังไม่พร้อมใช้งาน');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
};
if (typeof window !== 'undefined') window.AquariumAuth = AquariumAuth;

/* ------------------------------------------------------------
   Save / load - same shape as before, but Supabase is only used
   once a real user is signed in (authUser !== null). Signed out,
   or Supabase not configured -> falls back to artifact/local
   storage exactly like before.
   ------------------------------------------------------------ */
async function saveState() {
  const payload = {
    cur: S.cur,
    tankSeq: S.tankSeq,
    tanks: S.tanks
  };
  const json = JSON.stringify(payload);

  try {
    if (supabaseConfigured && await initSupabase() && authUser) {
      const { error } = await supabaseClient
        .from('aquarium_state')
        .upsert({ user_id: authUser.id, data: payload, updated_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    }
    if (hasArtifactStorage) {
      await window.storage.set(STORAGE_KEY, json, false); // personal, not shared
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
    return true;
  } catch (err) {
    console.error('บันทึกข้อมูลไม่สำเร็จ:', err);
    return false;
  }
}

async function loadState() {
  try {
    let saved = null;

    if (supabaseConfigured && await initSupabase() && authUser) {
      const { data, error } = await supabaseClient
        .from('aquarium_state')
        .select('data')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (error) throw error;
      if (data) saved = data.data;
    } else if (hasArtifactStorage) {
      const res = await window.storage.get(STORAGE_KEY, false);
      saved = res ? JSON.parse(res.value) : null;
    } else {
      const json = localStorage.getItem(STORAGE_KEY);
      saved = json ? JSON.parse(json) : null;
    }

    if (saved && Array.isArray(saved.tanks) && saved.tanks.length) {
      S.tanks = saved.tanks;
      S.cur = Math.min(saved.cur || 0, S.tanks.length - 1);
      // Older saved states (or rows saved before this field existed) won't
      // have tankSeq - derive a safe starting point from existing tank
      // names ("Tank 07" -> 7) so newly added tanks still get unique names.
      if (typeof saved.tankSeq === 'number') {
        S.tankSeq = saved.tankSeq;
      } else {
        const maxN = S.tanks.reduce((max, t) => {
          const m = /(\d+)\s*$/.exec(t.name || '');
          return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0);
        S.tankSeq = maxN + 1;
      }
    }
  } catch (err) {
    // ยังไม่เคยบันทึกไว้ก่อนหน้านี้ — ใช้ข้อมูลตัวอย่างเริ่มต้นแทน
    console.warn('ไม่พบข้อมูลที่บันทึกไว้ก่อนหน้า ใช้ข้อมูลตัวอย่างเริ่มต้นแทน:', err);
  }
}
