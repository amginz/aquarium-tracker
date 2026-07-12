/* ============================================================
   8. FERTILIZER SCHEDULE CARD (adjustable)
   ============================================================ */
function fertRow(c, f, i) {
  const dayOpts = FERT_DAYS.map(d => `<option${f.day===d?' selected':''}>${d}</option>`).join('');
  const unitOpts = FERT_UNITS.map(u => `<option${f.unit===u?' selected':''}>${u}</option>`).join('');
  return `
    <div class="fert-row">
      <select class="fert-day" onchange="upFert(${c},${i},'day',this.value)">${dayOpts}</select>
      <input type="text" class="fert-name" value="${x(f.name)}" placeholder="ชื่อปุ๋ย / สูตร"
        oninput="upFert(${c},${i},'name',this.value)">
      <div class="fert-amt-wrap">
        <button class="count-btn" onclick="chFertAmt(${c},${i},-0.5)">−</button>
        <input type="number" class="fert-amt" step="0.5" min="0" value="${f.amount}"
          id="fa-${c}-${i}" oninput="upFert(${c},${i},'amount',+this.value)">
        <button class="count-btn" onclick="chFertAmt(${c},${i},0.5)">+</button>
        <select class="fert-unit" onchange="upFert(${c},${i},'unit',this.value)">${unitOpts}</select>
      </div>
      <button class="btn-remove" onclick="rmFert(${c},${i})">×</button>
    </div>`;
}

function fertWeeklyTotal(c) {
  return S.tanks[c].fertilizer.reduce((s, f) => s + (f.day === 'ทุกวัน' ? 7 : 1), 0);
}

function fertCard(c) {
  const t = S.tanks[c];
  const rows = t.fertilizer.map((f, i) => fertRow(c, f, i)).join('');
  return `
    <div class="card" id="panel-fert-${c}">
      <div class="card-header"><div class="card-icon">🧪</div><div class="card-title">ตารางการใส่ปุ๋ย</div></div>
      <div class="fert-rows">${rows}</div>
      ${!t.fertilizer.length?`<div class="empty-hint">ยังไม่มีตารางใส่ปุ๋ย — กด “เพิ่มรายการปุ๋ย” เพื่อเริ่มตั้งค่า</div>`:''}
      <button class="btn-add-item" onclick="addFert(${c})"><span style="font-size:16px;line-height:1">+</span> เพิ่มรายการปุ๋ย</button>
      ${t.fertilizer.length?`<div class="fert-summary" id="fert-summary-${c}"><span class="fish-tag total">รวม ${fertWeeklyTotal(c)} ครั้ง/สัปดาห์</span></div>`:''}
    </div>`;
}

function addFert(c) {
  S.tanks[c].fertilizer.push({
    day: 'จันทร์',
    name: '',
    amount: 5,
    unit: 'ml'
  });
  render();
  const rows = document.querySelectorAll(`#panel-fert-${c} .fert-name`);
  if (rows.length) rows[rows.length - 1].focus();
}

function rmFert(c, i) {
  S.tanks[c].fertilizer.splice(i, 1);
  render();
}

function upFert(c, i, k, v) {
  S.tanks[c].fertilizer[i][k] = v;
  if (k === 'day') {
    const el = document.getElementById(`fert-summary-${c}`);
    if (el) el.innerHTML = `<span class="fish-tag total">รวม ${fertWeeklyTotal(c)} ครั้ง/สัปดาห์</span>`;
  }
}

function chFertAmt(c, i, d) {
  const f = S.tanks[c].fertilizer[i];
  f.amount = Math.max(0, Math.round(((+f.amount || 0) + d) * 10) / 10);
  const el = document.getElementById(`fa-${c}-${i}`);
  if (el) el.value = f.amount;
}

