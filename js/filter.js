/* ============================================================
   7. FILTER CARD (supports multiple filters + pre-filters)
   ============================================================ */
function filterRow(c, i, f) {
  const catOpts = FILTER_CATEGORIES.map(v => `<option${f.category===v?' selected':''}>${v}</option>`).join('');
  const ftypes = FILTER_TYPES.map(v => `<option${f.type===v?' selected':''}>${v}</option>`).join('');
  const ivals = CLEAN_INTERVALS.map(v => `<option${f.interval===v?' selected':''}>${v}</option>`).join('');
  const nd = f.lastClean ? nxtClean(f.lastClean, f.interval) : '';

  return `
    <div class="filter-item">
      <div class="filter-item-head">
        <select class="filter-cat-select${f.category==='พรีฟิลเตอร์'?' pre':''}"
          onchange="upFilter(${c},${i},'category',this.value)">${catOpts}</select>
        ${S.tanks[c].filters.length>1?`<button class="btn-remove" style="margin-left:auto" onclick="rmFilter(${c},${i})">×</button>`:''}
      </div>
      <div class="filter-grid">
        <div class="field"><label>ประเภทกรอง</label>
          <select onchange="upFilter(${c},${i},'type',this.value)">${ftypes}</select></div>
        <div class="field"><label>ยี่ห้อ</label>
          <input type="text" value="${x(f.brand)}" placeholder="เช่น Netlea, Eheim, ADA, Jeneca, Sobo"
            oninput="upFilter(${c},${i},'brand',this.value)"></div>
        <div class="field"><label>รุ่น / ขนาด(ลิตร/ชม.)</label>
          <input type="text" value="${x(f.model)}" placeholder="เช่น 1,000"
            oninput="upFilter(${c},${i},'model',this.value)"></div>
        <div class="field"><label>วัสดุกรอง</label>
          <input type="text" value="${x(f.media)}" placeholder="เช่น ฟองน้ำ, ชีวภาพ, ใยหยาบ"
            oninput="upFilter(${c},${i},'media',this.value)"></div>
        <div class="field"><label>รอบทำความสะอาด</label>
          <select onchange="upFilter(${c},${i},'interval',this.value)">${ivals}</select></div>
        <div class="field"><label>ล้างกรองล่าสุด</label>
          <input type="date" value="${f.lastClean}"
            onchange="upFilter(${c},${i},'lastClean',this.value)"
            onclick="safeShowPicker(this)"></div>
      </div>
      <div id="nxt-${c}-${i}">${nd?`<div class="next-clean">📅 นัดล้างครั้งถัดไป: <strong>${nd}</strong></div>`:''}</div>
    </div>`;
}

function filterCard(c) {
  const t = S.tanks[c];
  const rows = t.filters.map((f, i) => filterRow(c, i, f)).join('');
  return `
    <div class="card" id="panel-filter-${c}">
      <div class="card-header"><div class="card-icon">🔄</div><div class="card-title">ระบบกรอง</div></div>
      <div class="filter-list">${rows}</div>
      <button class="btn-add-item" onclick="addFilter(${c})"><span style="font-size:16px;line-height:1">+</span> เพิ่มกรอง / พรีฟิลเตอร์</button>
    </div>`;
}

function addFilter(c) {
  S.tanks[c].filters.push({
    category: 'พรีฟิลเตอร์',
    type: '',
    brand: '',
    model: '',
    media: '',
    interval: '1 สัปดาห์',
    lastClean: DEFAULT_DATE
  });
  render();
}

function rmFilter(c, i) {
  if (S.tanks[c].filters.length <= 1) return;
  S.tanks[c].filters.splice(i, 1);
  render();
}

function upFilter(c, i, k, v) {
  const f = S.tanks[c].filters[i];
  f[k] = v;
  if (k === 'category') {
    render();
    return;
  }
  const el = document.getElementById(`nxt-${c}-${i}`);
  if (el) {
    const nd = f.lastClean ? nxtClean(f.lastClean, f.interval) : '';
    el.innerHTML = nd ? `<div class="next-clean">📅 นัดล้างครั้งถัดไป: <strong>${nd}</strong></div>` : '';
  }
  updateMiniView(c);
}

function nxtClean(d, iv) {
  const dt = parseDateInput(d);
  dt.setDate(dt.getDate() + (CLEAN_INTERVAL_DAYS[iv] || 14));
  return dt.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function earliestNextClean(c) {
  const dates = S.tanks[c].filters.filter(f => f.lastClean).map(f => {
    const dt = parseDateInput(f.lastClean);
    dt.setDate(dt.getDate() + (CLEAN_INTERVAL_DAYS[f.interval] || 14));
    return dt;
  });
  if (!dates.length) return '';
  const min = new Date(Math.min(...dates));
  return min.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

