/* ============================================================
   PERSISTENCE
   ------------------------------------------------------------
   Three interchangeable backends, auto-selected in this order:

     1. Supabase        - if js/supabase-config.js has url + anonKey
                           filled in AND the supabase-js CDN script
                           loaded successfully. Data is synced to the
                           cloud and follows the signed-in user across
                           devices/browsers.
     2. Artifact storage - window.storage, only present when this app
                           runs inside a Claude.ai artifact.
     3. localStorage     - plain browser storage, always available as
                           the final fallback. This is what a fresh
                           GitHub Pages deploy uses out of the box.

   Every backend is driven through the same two functions,
   saveState()/loadState(), so the rest of the app never needs to
   know which one is active.
   ============================================================ */
const STORAGE_KEY = 'aquarium-tracker-state';
const hasArtifactStorage = typeof window !== 'undefined' && !!window.storage;
const supabaseConfigured = typeof SUPABASE_CONFIG !== 'undefined' &&
  !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;

let supabaseClient = null;
let supabaseUserId = null;
let supabaseReady = null; // Promise, resolves true/false once init attempt finishes

// Lazily creates the Supabase client and signs in anonymously so each
// visitor gets a stable, private row (no email/password needed). Safe to
// call multiple times - the underlying work only runs once.
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

      let { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        const { data, error } = await supabaseClient.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
      }
      supabaseUserId = session.user.id;
      return true;
    } catch (err) {
      console.error('Supabase init failed, falling back to local storage:', err);
      supabaseClient = null;
      return false;
    }
  })();

  return supabaseReady;
}

async function saveState() {
  const payload = {
    cur: S.cur,
    tankSeq: S.tankSeq,
    tanks: S.tanks
  };
  const json = JSON.stringify(payload);

  try {
    if (supabaseConfigured && await initSupabase()) {
      const { error } = await supabaseClient
        .from('aquarium_state')
        .upsert({ user_id: supabaseUserId, data: payload, updated_at: new Date().toISOString() });
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
  // แก้ไขเป็น 2 บรรทัดนี้ เพื่อบีบให้เบราว์เซอร์กาง Object ออกมาดูแบบละเอียด
  console.error('บันทึกข้อมูลไม่สำเร็จ (Error Object):', err);
  console.error('เหตุผลจาก Supabase:', err.message || JSON.stringify(err));
  return false;
}
}

async function loadState() {
  try {
    let saved = null;

    if (supabaseConfigured && await initSupabase()) {
      const { data, error } = await supabaseClient
        .from('aquarium_state')
        .select('data')
        .eq('user_id', supabaseUserId)
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
