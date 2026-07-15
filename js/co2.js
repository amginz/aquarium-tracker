/* ============================================================
   7b. CO2 CARD
   ============================================================ */
function co2Card(c) {
  const t = S.tanks[c].co2;
  const dur = calcDur(t.on, t.off);
  const dcOpts = CO2_DROP_COLORS.map(v => `<option${t.dropChecker===v?' selected':''}>${v}</option>`).join('');
  return `
    <div class="card" id="panel-co2-${c}">
      <div class="card-header"><div class="card-icon">💨</div><div class="card-title">ระบบ CO2</div></div>
      <div class="co2-toggle-row">
        <span class="co2-toggle-label">เปิดใช้งานระบบ CO2</span>
        <label class="switch">
          <input type="checkbox" ${t.enabled?'checked':''} onchange="toggleCo2(${c},this.checked)">
          <span class="switch-track"></span>
        </label>
      </div>
      <div class="co2-body${t.enabled?'':' disabled'}" id="co2-body-${c}">
        <div class="bpm-row">
          <button class="count-btn" onclick="chCo2Bpm(${c},-1)">−</button>
          <span class="bpm-val" id="bpm-val-${c}">${t.bpm} <span>ฟอง/วินาที</span></span>
          <button class="count-btn" onclick="chCo2Bpm(${c},1)">+</button>
        </div>
        <div class="time-row" style="margin-bottom:1rem">
          <div class="time-group"><span class="time-label">เปิด</span>
            <input type="time" value="${t.on}" onchange="upCo2(${c},'on',this.value)"></div>
          <span class="time-sep">→</span>
          <div class="time-group"><span class="time-label">ปิด</span>
            <input type="time" value="${t.off}" onchange="upCo2(${c},'off',this.value)"></div>
          <span class="duration-badge" id="co2dur-${c}">${dur}</span>
        </div>
        <div class="filter-grid">
          <div class="field"><label>สี Drop Checker</label>
            <select onchange="upCo2(${c},'dropChecker',this.value)">${dcOpts}</select></div>
          <div class="field"><label>เติมแก๊สล่าสุด</label>
            <input type="date" value="${fmtDate(t.lastRefill)}" onchange="upCo2(${c},'lastRefill',this.value)"
              onclick="safeShowPicker(this)"></div>
        </div>
      </div>
    </div>`;
}

function toggleCo2(c, checked) {
  S.tanks[c].co2.enabled = checked;
  const body = document.getElementById(`co2-body-${c}`);
  if (body) body.classList.toggle('disabled', !checked);
  updateMiniView(c);
}

function chCo2Bpm(c, d) {
  const t = S.tanks[c].co2;
  t.bpm = Math.max(0, (+t.bpm || 0) + d);
  const el = document.getElementById(`bpm-val-${c}`);
  if (el) el.innerHTML = `${t.bpm} <span>ฟอง/วินาที</span>`;
}

function upCo2(c, k, v) {
  S.tanks[c].co2[k] = v;
  if (k === 'on' || k === 'off') {
    const el = document.getElementById(`co2dur-${c}`);
    if (el) el.textContent = calcDur(S.tanks[c].co2.on, S.tanks[c].co2.off);
  }
  updateMiniView(c);
}

