/* ============================================================
   AUTH UI
   ------------------------------------------------------------
   Self-contained login / sign-up screen. Include this AFTER
   supabase-config.js and storage.js:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="js/supabase-config.js"></script>
     <script src="js/storage.js"></script>
     <script src="js/auth-ui.js"></script>

   Behavior:
   - If Supabase isn't configured (blank url/anonKey), this does
     nothing - app runs exactly as before, local-only.
   - If configured, it shows a full-screen overlay with an
     email + password form (sign in / sign up) until the visitor
     is authenticated. Once signed in, the overlay disappears and
     the event 'aquarium-auth-ready' fires on window.

   IMPORTANT - wiring this into your app's startup:
   Your existing bootstrap code probably does something like:

       loadState().then(render);

   on page load. Change that to wait for auth first, so it doesn't
   load/render before we know who's logged in:

       window.addEventListener('aquarium-auth-ready', () => {
         loadState().then(render);
       });

   If Supabase isn't configured, 'aquarium-auth-ready' fires
   immediately (nothing to wait for), so this is safe either way.
   A small account badge (email + "ออกจากระบบ") is also injected
   in the top-right corner once logged in, so users can log out.
   ============================================================ */
(function () {
  if (typeof window === 'undefined') return;

  function fireReady() {
    window.__aquariumAuthReady = true;
    window.dispatchEvent(new CustomEvent('aquarium-auth-ready'));
  }

  // Nothing to do if Supabase isn't set up - app stays local-only.
  if (typeof AquariumAuth === 'undefined' || !AquariumAuth.isAvailable()) {
    fireReady();
    return;
  }

  /* ------------------------------------------------------------
     Styles - one shared font-family rule covers every input/
     button/placeholder across the login card AND the account
     badge, so it's declared once here instead of repeated per
     element further down.
     ------------------------------------------------------------ */
  const FONT_STACK = "'Prompt', system-ui, -apple-system, 'Segoe UI', sans-serif";

  const style = document.createElement('style');
  style.textContent = `
    #aq-auth-logo {
      position: fixed;
      top: 95px;           /* ระยะห่างจากขอบบนสุดของจอ */
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
    }
    #aq-auth-logo span {
      font-size: 60px; font-weight: 400; color: #e9f2f6; letter-spacing: .2px;
    }
    #aq-auth-logo span b { color: #22d3ee; font-weight: 800; }

    @media (max-width: 390px) {
      #aq-auth-logo span {
        font-size: 40px;
        top: 20px;
      }
      #aq-auth-card {
        margin-top: 90px;
        margin-left: 20px;
        margin-right: 20px;
      }
    }
    
    /* ---- Overlay + card shell ---- */
    #aq-auth-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: #0f172a; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-family: ${FONT_STACK};
    }
    #aq-auth-card {
      width: 100%; max-width: 400px; background: #1e293b;
      border-radius: 16px; padding: 28px 30px; box-shadow: 0 20px 60px rgba(0,0,0,.4);
      color: #e2e8f0;
    }
    
    #aq-auth-card h1 { font-size: 22px; margin: 0 0 4px; color: #f8fafc; }
    #aq-auth-card p.sub { font-size: 16px; color: #94a3b8; margin: 0 0 14px; }
    #aq-auth-card sub { text-align: center; }
    #aq-auth-card title { text-align: center; }

    /* ---- Shared font-family for all form elements ---- */
    #aq-auth-card input,
    #aq-auth-card button,
    #aq-auth-card input::placeholder,
    #aq-account-badge,
    #aq-account-badge button {
      font-family: ${FONT_STACK};
    }

    /* ---- Text inputs ---- */
    #aq-auth-card input {
      width: 100%; box-sizing: border-box; padding: 10px 12px; margin-bottom: 10px;
      border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9;
      font-size: 14px;
    }
    #aq-auth-card input:focus { outline: none; border-color: #38bdf8; }

    /* ---- Password field + show/hide eye toggle ---- */
    #aq-pass-wrap { position: relative; }
    #aq-pass-wrap input { padding-right: 40px; }
    #aq-pass-toggle {
      position: absolute; right: 6px; top: 41.5%; transform: translateY(-58.5%);
      width: 32px !important; height: 28px; margin: 0 !important;
      background: none !important; border: none; padding: 0 !important;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: .7;
    }
    #aq-pass-toggle:hover { opacity: 1; }
    #aq-pass-toggle svg { width: 18px; height: 18px; }

    /* ---- Forgot-password link (right-aligned, needs full width first) ---- */
    #aq-forgot-link {
      background: none !important; width: 100% !important; padding: 0 !important;
      color: #94a3b8 !important; font-size: 12px !important; font-weight: 400 !important;
      text-decoration: underline; cursor: pointer; margin: 8px 0 0 !important;
      display: block; text-align: right !important;
    }
    #aq-forgot-link:hover { color: #cbd5e1 !important; }

    /* ---- Buttons ---- */
    #aq-auth-card button {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: none;
      background: #0ea5e9; color: white; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 4px;
    }
    #aq-auth-card button:hover { background: #0284c7; }
    #aq-auth-card button:disabled { opacity: .6; cursor: default; }
    #aq-auth-submit {
      margin-top: 20px !important; /* ยิ่งค่ามาก ยิ่งเลื่อนลงมากขึ้น */
    }
    #aq-auth-toggle {
      background: none !important; color: #38bdf8 !important; font-weight: 500 !important;
      margin-top: 12px; padding: 4px !important;
    }

    /* ---- Status message ---- */
    #aq-auth-msg { font-size: 13px; margin-top: 10px; min-height: 16px; }
    #aq-auth-msg.err { color: #f87171; }
    #aq-auth-msg.ok { color: #4ade80; }

    /* ---- Account badge (top-right, shown once logged in) ---- */
    #aq-account-badge {
      position: fixed; z-index: 9998;
      top: auto;
      bottom: 20px; /* จัดกึ่งกลางแนวตั้งในแถบ save-bar (padding 1rem บน-ล่าง) */
      left: 12px;
      right: auto;
      background: #1e293b; color: #cbd5e1;
      font-size: 12px; padding: 6px 10px; border-radius: 999px;
      display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.2);
}
    #aq-account-badge button {
      background: none; border: none; color: #38bdf8; font-size: 12px;
      cursor: pointer; padding: 0; font-weight: 600;
    }
    #aq-auth-card input::placeholder {
      color: #334155;
    }
  `;
  document.head.appendChild(style);

  let mode = 'signin'; // 'signin' | 'signup' | 'forgot'

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'aq-auth-overlay';
    overlay.innerHTML = `
      <div id="aq-auth-logo">
        <span>AQUA<b>TRACK</b></span>
      </div>
      </div> 
      <div id="aq-auth-card">
        <h1 id="aq-auth-title">เข้าสู่ระบบ</h1>
        <p class="sub" id="aq-auth-sub">ล็อกอินเพื่อซิงก์ข้อมูลตู้ปลาข้ามอุปกรณ์</p>
        <input id="aq-auth-email" type="email" placeholder="อีเมล" autocomplete="email" />
        <div id="aq-pass-wrap">
          <input id="aq-auth-password" type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" autocomplete="current-password" />
          <button id="aq-pass-toggle" type="button" title="แสดง/ซ่อนรหัสผ่าน" aria-label="แสดง/ซ่อนรหัสผ่าน">
            <svg id="aq-eye-icon" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <button id="aq-forgot-link" type="button">ลืมรหัสผ่าน?</button>
        <button id="aq-auth-submit">เข้าสู่ระบบ</button>
        <button id="aq-auth-toggle" type="button">ยังไม่มีบัญชี? สมัครสมาชิก</button>
        <div id="aq-auth-msg"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const title = overlay.querySelector('#aq-auth-title');
    const sub = overlay.querySelector('#aq-auth-sub');
    const emailEl = overlay.querySelector('#aq-auth-email');
    const passEl = overlay.querySelector('#aq-auth-password');
    const passWrap = overlay.querySelector('#aq-pass-wrap');
    const passToggle = overlay.querySelector('#aq-pass-toggle');
    const eyeIcon = overlay.querySelector('#aq-eye-icon');
    const forgotLink = overlay.querySelector('#aq-forgot-link');
    const submitBtn = overlay.querySelector('#aq-auth-submit');
    const toggleBtn = overlay.querySelector('#aq-auth-toggle');
    const msgEl = overlay.querySelector('#aq-auth-msg');

    const EYE_OPEN = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>';
    const EYE_CLOSED = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.06 21.06 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.06 21.06 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>';

    passToggle.addEventListener('click', () => {
      const showing = passEl.type === 'text';
      passEl.type = showing ? 'password' : 'text';
      eyeIcon.innerHTML = showing ? EYE_OPEN : EYE_CLOSED;
    });

    function setMode(next) {
      mode = next;
      msgEl.textContent = '';
      msgEl.className = '';

      if (mode === 'forgot') {
        title.textContent = 'ลืมรหัสผ่าน';
        sub.textContent = 'กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้';
        passWrap.style.display = 'none';
        forgotLink.style.display = 'none';
        submitBtn.textContent = 'ส่งลิงก์รีเซ็ตรหัสผ่าน';
        toggleBtn.textContent = 'กลับไปเข้าสู่ระบบ';
        return;
      }

      passWrap.style.display = '';
      forgotLink.style.display = mode === 'signin' ? 'block' : 'none';

      if (mode === 'signup') {
        title.textContent = 'สมัครสมาชิก';
        sub.textContent = 'สร้างบัญชีเพื่อเริ่มโลกใบใหม่';
        submitBtn.textContent = 'สมัครสมาชิก';
        toggleBtn.textContent = 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ';
        passEl.setAttribute('autocomplete', 'new-password');
      } else {
        title.textContent = 'เข้าสู่ระบบ';
        sub.textContent = 'ล็อกอินเข้าสู่โลกกว้าง';
        submitBtn.textContent = 'เข้าสู่ระบบ';
        toggleBtn.textContent = 'ยังไม่มีบัญชี? สมัครสมาชิก';
        passEl.setAttribute('autocomplete', 'current-password');
      }
    }

    toggleBtn.addEventListener('click', () => {
      if (mode === 'forgot') { setMode('signin'); return; }
      setMode(mode === 'signin' ? 'signup' : 'signin');
    });
    forgotLink.addEventListener('click', () => setMode('forgot'));

    async function submit() {
      const email = emailEl.value.trim();
      const password = passEl.value;
      msgEl.textContent = '';
      msgEl.className = '';

      if (mode === 'forgot') {
        if (!email) {
          msgEl.textContent = 'กรอกอีเมลก่อน';
          msgEl.className = 'err';
          return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังส่ง...';
        try {
          await AquariumAuth.resetPassword(email);
          msgEl.textContent = 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว กรุณาเช็คกล่องจดหมาย (รวมถึง spam)';
          msgEl.className = 'ok';
          submitBtn.textContent = 'ส่งอีกครั้ง';
          submitBtn.disabled = false;
        } catch (err) {
          msgEl.textContent = translateAuthError(err);
          msgEl.className = 'err';
          submitBtn.disabled = false;
          submitBtn.textContent = 'ส่งลิงก์รีเซ็ตรหัสผ่าน';
        }
        return;
      }

      if (!email || !password) {
        msgEl.textContent = 'กรอกอีเมลและรหัสผ่านให้ครบ';
        msgEl.className = 'err';
        return;
      }
      if (password.length < 6) {
        msgEl.textContent = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        msgEl.className = 'err';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = mode === 'signup' ? 'กำลังสมัคร...' : 'กำลังเข้าสู่ระบบ...';

      try {
        if (mode === 'signup') {
          const data = await AquariumAuth.signUp(email, password);
          if (!data.session) {
            // Email confirmation is required by the project's settings.
            msgEl.textContent = 'สมัครสำเร็จ! กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ';
            msgEl.className = 'ok';
            submitBtn.disabled = false;
            submitBtn.textContent = 'สมัครสมาชิก';
            return;
          }
          // Session came back immediately (email confirmation disabled) -
          // onAuthStateChange will fire and close this overlay.
        } else {
          await AquariumAuth.signIn(email, password);
        }
      } catch (err) {
        msgEl.textContent = translateAuthError(err);
        msgEl.className = 'err';
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'signup' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
      }
    }

    submitBtn.addEventListener('click', submit);
    [emailEl, passEl].forEach(el => el.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit();
    }));

    setMode('signin');
    return overlay;
  }

  function translateAuthError(err) {
    const m = (err && err.message) || '';
    if (/already registered/i.test(m)) return 'อีเมลนี้ถูกใช้สมัครแล้ว ลองเข้าสู่ระบบแทน';
    if (/invalid login credentials/i.test(m)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    if (/email not confirmed/i.test(m)) return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
    return m || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
  }

  function buildBadge(user) {
    const badge = document.createElement('div');
    badge.id = 'aq-account-badge';
    badge.innerHTML = `<span>${user.email}</span><button id="aq-account-logout">ออกจากระบบ</button>`;
    document.body.appendChild(badge);
    badge.querySelector('#aq-account-logout').addEventListener('click', async () => {
      await AquariumAuth.signOut();
      // Reload so the app re-initializes cleanly against local storage /
      // the next login, instead of leaving stale synced data on screen.
      location.reload();
    });
  }

  let firedOnce = false;
  let overlayEl = null;

  AquariumAuth.onChange((user) => {
    const existingBadge = document.getElementById('aq-account-badge');
    if (existingBadge) existingBadge.remove();

    if (user) {
      if (overlayEl) {
        // We were showing the login screen (meaning init() already ran once
        // against local/offline data, if 'ready' had fired while logged
        // out). Reload so app.js's init() runs fresh against this
        // authenticated session and pulls the real synced data, instead of
        // leaving the offline data rendered on screen.
        location.reload();
        return;
      }
      buildBadge(user);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (!firedOnce) { firedOnce = true; fireReady(); }
    } else {
      if (!overlayEl) overlayEl = buildOverlay();
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (!firedOnce) { firedOnce = true; fireReady(); }
      // Note: firing 'ready' even when logged out lets the app fall back
      // to local storage behind the overlay, so nothing hangs forever if
      // someone never logs in. Once they do log in, saveState()/loadState()
      // will start using Supabase automatically (see storage.js).
    }
  });
})();
