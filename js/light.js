/* ============================================================
   6. LIGHT CARD
   ============================================================ */
function lightCard(c) {
  const t = S.tanks[c];
  const dur = calcDur(t.light.on, t.light.off);
  const channels = ['W', 'R', 'G', 'B', 'UV'].map(ch => {
    const cls = {
      W: 'color-w',
      R: 'color-r',
      G: 'color-g',
      B: 'color-b',
      UV: 'color-uv'
    } [ch];
    const lbl = {
      W: 'White',
      R: 'Red',
      G: 'Green',
      B: 'Blue',
      UV: 'UV'
    } [ch];
    const pct = t.light[ch];
    return `<div class="channel">
      <div class="ch-header">
        <span class="ch-name ${cls}">${ch} — ${lbl}</span>
        <span class="ch-val ${cls}" id="cv-${ch}-${c}">${pct}<span style="font-size:13px">%</span></span>
      </div>
      <input type="range" min="0" max="100" step="1" value="${pct}"
        id="sl-${ch}-${c}" style="--pct:${pct}%;--track-color:var(--${ch.toLowerCase()})"
        oninput="upLight(${c},'${ch}',this.value)">
    </div>`;
  }).join('');

  return `
    <div class="card">
      <div class="card-header"><div class="card-icon">💡</div><div class="card-title">ไฟ — ตั้งค่าช่องแสง W / R / G / B / UV</div></div>
      <div class="light-bar-wrap">
        <div class="lb" id="lb-w-${c}" style="background:var(--w);width:${t.light.W}%"></div>
        <div class="lb" id="lb-r-${c}" style="background:var(--r);width:${t.light.R}%"></div>
        <div class="lb" id="lb-g-${c}" style="background:var(--g);width:${t.light.G}%"></div>
        <div class="lb" id="lb-b-${c}" style="background:var(--b);width:${t.light.B}%"></div>
        <div class="lb" id="lb-uv-${c}" style="background:var(--uv);width:${t.light.UV}%"></div>
      </div>
      <div class="light-channels">${channels}</div>
      <div class="time-row">
        <div class="time-group"><span class="time-label">เปิด</span>
          <input type="time" value="${t.light.on}" onchange="upTime(${c},'on',this.value)"></div>
        <span class="time-sep">→</span>
        <div class="time-group"><span class="time-label">ปิด</span>
          <input type="time" value="${t.light.off}" onchange="upTime(${c},'off',this.value)"></div>
        <span class="duration-badge" id="dur-${c}">${dur}</span>
      </div>
    </div>`;
}

function upLight(c, ch, val) {
  S.tanks[c].light[ch] = +val;
  const cv = document.getElementById(`cv-${ch}-${c}`);
  if (cv) cv.innerHTML = val + '<span style="font-size:13px">%</span>';
  const sl = document.getElementById(`sl-${ch}-${c}`);
  if (sl) sl.style.setProperty('--pct', val + '%');
  const lb = document.getElementById(`lb-${ch.toLowerCase()}-${c}`);
  if (lb) lb.style.width = val + '%';
  updateMiniView(c);
}

function upTime(c, k, v) {
  S.tanks[c].light[k] = v;
  const el = document.getElementById(`dur-${c}`);
  if (el) el.textContent = calcDur(S.tanks[c].light.on, S.tanks[c].light.off);
  updateMiniView(c);
}

