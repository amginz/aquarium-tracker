/* ============================================================
   7c. WATER VOLUME / FERTILIZER DOSAGE CALCULATOR
   ============================================================ */
function calcWaterVolume(k) {
  const grossL = ((+k.length || 0) * (+k.width || 0) * (+k.height || 0)) / 1000;
  const net = grossL * ((+k.fillPct || 0) / 100) * (1 - ((+k.deductPct || 0) / 100));
  return Math.max(0, Math.round(net * 10) / 10);
}

function calcFertDose(k, vol) {
  return Math.max(0, Math.round((vol / 10) * (+k.fertRatio || 0) * 10) / 10);
}
const FILL_MIN = 50,
  FILL_MAX = 100;
const DEDUCT_MIN = 0,
  DEDUCT_MAX = 40;

function calcCard(c) {
  const k = S.tanks[c].calc;
  const vol = calcWaterVolume(k);
  const dose = calcFertDose(k, vol);
  return `
    <div class="card" id="panel-calc-${c}">
      <div class="card-header"><div class="card-icon">🧮</div><div class="card-title">คำนวณปริมาณน้ำ &amp; ปุ๋ยน้ำ</div></div>

      <div class="calc-sub-title">ขนาดตู้ (หน่วย: ซม.)</div>
      <div class="calc-grid">
        <div class="field"><label>ยาว</label>
          <input type="number" min="1" value="${k.length}" oninput="upCalc(${c},'length',+this.value)"></div>
        <div class="field"><label>กว้าง</label>
          <input type="number" min="1" value="${k.width}" oninput="upCalc(${c},'width',+this.value)"></div>
        <div class="field"><label>สูง</label>
          <input type="number" min="1" value="${k.height}" oninput="upCalc(${c},'height',+this.value)"></div>
      </div>

      <div class="channel">
        <div class="ch-header">
          <span class="ch-name">ระดับน้ำ (% ของความสูง)</span>
          <span class="ch-val" id="calc-fillpct-${c}">${k.fillPct}<span style="font-size:13px">%</span></span>
        </div>
        <input type="range" min="${FILL_MIN}" max="${FILL_MAX}" step="1" value="${k.fillPct}"
          id="sl-fill-${c}" style="--pct:${rangePct(k.fillPct,FILL_MIN,FILL_MAX)}%" oninput="upCalc(${c},'fillPct',+this.value)">
      </div>
      <div class="channel" style="margin-bottom:1.25rem">
        <div class="ch-header">
          <span class="ch-name">หักปริมาตรกรวด / ตกแต่ง</span>
          <span class="ch-val" id="calc-deductpct-${c}">${k.deductPct}<span style="font-size:13px">%</span></span>
        </div>
        <input type="range" min="${DEDUCT_MIN}" max="${DEDUCT_MAX}" step="1" value="${k.deductPct}"
          id="sl-deduct-${c}" style="--pct:${rangePct(k.deductPct,DEDUCT_MIN,DEDUCT_MAX)}%" oninput="upCalc(${c},'deductPct',+this.value)">
      </div>

      <div class="calc-result">
        <span class="lbl">ปริมาณน้ำสุทธิ</span>
        <span class="num" id="calc-vol-${c}">${vol}</span>
        <span class="unit">ลิตร</span>
      </div>

      <div class="calc-divider">
        <div class="calc-sub-title">คำนวณปุ๋ยน้ำจากปริมาณน้ำด้านบน</div>
        <div class="field" style="max-width:280px;margin-bottom:1rem">
          <label>อัตราส่วนปุ๋ย (ml ต่อน้ำ 10 ลิตร)</label>
          <input type="number" min="0" step="0.5" value="${k.fertRatio}" oninput="upCalc(${c},'fertRatio',+this.value)">
        </div>
        <div class="calc-result">
          <span class="lbl">ปริมาณที่ต้องใส่ครั้งนี้</span>
          <span class="num" id="calc-dose-${c}">${dose}</span>
          <span class="unit">ml</span>
        </div>
      </div>
    </div>`;
}

function upCalc(c, key, v) {
  const k = S.tanks[c].calc;
  k[key] = v;
  const vol = calcWaterVolume(k);
  const dose = calcFertDose(k, vol);
  const fp = document.getElementById(`calc-fillpct-${c}`);
  if (fp) fp.innerHTML = k.fillPct + '<span style="font-size:13px">%</span>';
  const dp = document.getElementById(`calc-deductpct-${c}`);
  if (dp) dp.innerHTML = k.deductPct + '<span style="font-size:13px">%</span>';
  const slF = document.getElementById(`sl-fill-${c}`);
  if (slF) slF.style.setProperty('--pct', rangePct(k.fillPct, FILL_MIN, FILL_MAX) + '%');
  const slD = document.getElementById(`sl-deduct-${c}`);
  if (slD) slD.style.setProperty('--pct', rangePct(k.deductPct, DEDUCT_MIN, DEDUCT_MAX) + '%');
  const vEl = document.getElementById(`calc-vol-${c}`);
  if (vEl) vEl.textContent = vol;
  const dEl = document.getElementById(`calc-dose-${c}`);
  if (dEl) dEl.textContent = dose;
  updateMiniView(c);
}

