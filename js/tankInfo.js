/* ============================================================
   4. TANK INFO PANEL (compact summary + editable temperature)
   ============================================================ */
function isTimeRangeOn(on, off) {
  if (!on || !off) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = on.split(':').map(Number), [fh, fm] = off.split(':').map(Number);
  const oM = oh * 60 + om,
    fM = fh * 60 + fm;
  return oM <= fM ? (cur >= oM && cur < fM) : (cur >= oM || cur < fM);
}

function tankInfoCard(c) {
  return `
    <div class="card no-pad" id="tankinfo-${c}">
      <div class="card-header"><div class="card-icon">🌊</div><div class="card-title">ข้อมูลตู้ (ย่อ)</div><span class="card-sub">${x(S.tanks[c].name)}</span></div>
      <div class="tankinfo-wrap">${buildTankInfoBody(c)}</div>
    </div>`;
}

function buildTankInfoBody(c) {
  const t = S.tanks[c];
  const totalFish = t.fish.reduce((s, f) => s + (+f.count || 0), 0);
  const totalPlants = t.plants.reduce((s, p) => s + (+p.count || 0), 0);
  const lightOn = isTimeRangeOn(t.light.on, t.light.off);
  const co2On = t.co2.enabled && isTimeRangeOn(t.co2.on, t.co2.off);
  const nd = earliestNextClean(c);
  const tempWarn = t.temp < 22 || t.temp > 30;
  const vol = calcWaterVolume(t.calc);
  return `
    <div class="tankinfo-top">
      <div class="temp-control">
        <span class="temp-label">🌡️ อุณหภูมิน้ำ</span>
        <div class="temp-val-wrap">
          <button class="temp-btn" onclick="upTemp(${c},-0.5)">−</button>
          <span class="temp-val${tempWarn?' temp-warn':''}" id="temp-val-${c}">${t.temp}<span>°C</span></span>
          <button class="temp-btn" onclick="upTemp(${c},0.5)">+</button>
        </div>
      </div>
    </div>
    <div class="mv-stats" id="mv-stats-${c}">
      <span class="mv-stat">💧 <b>${vol}</b> ลิตร</span>
      <span class="mv-stat">🐟 <b>${totalFish}</b> ${FISH_UNIT}</span>
      <span class="mv-stat">🌿 <b>${totalPlants}</b> ${PLANT_UNIT}</span>
      <span class="mv-stat${lightOn?' on':''}">💡 ไฟ<b>${lightOn?'เปิดอยู่':'ปิดอยู่'}</b></span>
      <span class="mv-stat${co2On?' on':''}">💨 CO2<b>${t.co2.enabled?(co2On?'เปิดอยู่':'ปิดอยู่'):'ปิดใช้งาน'}</b></span>
      ${nd?`<span class="mv-stat">🔄 ล้างกรองถัดไป <b>${nd}</b></span>`:''}
    </div>`;
}

function upTemp(c, d) {
  const t = S.tanks[c];
  t.temp = Math.max(TEMP_MIN, Math.min(TEMP_MAX, Math.round(((+t.temp || 26) + d) * 10) / 10));
  updateMiniView(c);
}

function updateMiniView(c) {
  const wrap = document.getElementById(`tankinfo-${c}`);
  if (!wrap) return;
  const body = wrap.querySelector('.tankinfo-wrap');
  if (body) body.innerHTML = buildTankInfoBody(c);
}

