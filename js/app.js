/* ============================================================
   MAIN RENDER + APP INIT
   ============================================================ */
function render() {
  const c = S.cur;
  document.getElementById('main-content').innerHTML = `
    ${tankInfoCard(c)}

    ${speciesCard(c,'fish')}
    ${speciesCard(c,'plants')}
    ${lightCard(c)}
    ${filterCard(c)}
    ${co2Card(c)}
    ${fertCard(c)}
    ${calcCard(c)}

    <div class="save-bar">
      ${S.tanks.length>1?`
        <div class="del-tank-row">
        <button class="btn-del-tank" onclick="deleteTank(${c})">— ลบตู้นี้ออก</button>`:''}
        <button class="btn-save" id="btn-save-${c}" onclick="save(${c})">บันทึก</button>
  `;
}

function save(c) {
  const btn = document.getElementById(`btn-save-${c}`);
  const originalText = 'บันทึก';
  saveState().then(ok => {
    if (!btn) return;
    btn.textContent = ok ? 'บันทึกแล้ว ✓' : 'บันทึกไม่สำเร็จ ✕';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2200);
  });
}

let lastTickMinute = null;

function tick() {
  const now = new Date();
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
  }
  // "เปิดอยู่/ปิดอยู่" ของไฟและ CO2 ขึ้นกับเวลาปัจจุบัน — รีเฟรชทุกครั้งที่ขึ้นนาทีใหม่
  const minute = now.getHours() * 60 + now.getMinutes();
  if (minute !== lastTickMinute) {
    lastTickMinute = minute;
    updateMiniView(S.cur);
  }
}
setInterval(tick, 1000);
tick();

(async function init() {
  await loadState();
  renderTabs();
  render();
})();