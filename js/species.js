/* ============================================================
   5. FISH / PLANT LIST (shared logic, kind = 'fish' | 'plants')
   ============================================================ */
const KIND_META = {
  fish: {
    unit: FISH_UNIT,
    dotClass: '',
    icon: '🐟',
    title: 'ปลาในตู้',
    totalLabel: 'รวมปลา',
    addLabel: 'เพิ่มชนิดปลา',
    placeholder: 'ชนิดปลา / พันธุ์'
  },
  plants: {
    unit: PLANT_UNIT,
    dotClass: ' plant',
    icon: '🌿',
    title: 'พืชน้ำในตู้',
    totalLabel: 'รวมพืช',
    addLabel: 'เพิ่มชนิดพืช',
    placeholder: 'ชนิดพืชน้ำ'
  }
};

function buildSpeciesRows(c, kind) {
  const meta = KIND_META[kind];
  return S.tanks[c][kind].map((f, i) => `
    <div class="fish-row">
      <div class="row-dot${meta.dotClass}"></div>
      <input type="text" value="${x(f.species)}" placeholder="${meta.placeholder}"
        oninput="upSpecies(${c},'${kind}',${i},'species',this.value)">
      <div class="fish-count-wrap">
        <button class="count-btn" onclick="chCount(${c},'${kind}',${i},-1)">−</button>
        <span class="count-val" id="cc-${kind}-${c}-${i}">${f.count}</span>
        <button class="count-btn" onclick="chCount(${c},'${kind}',${i},1)">+</button>
        <span class="count-unit">${meta.unit}</span>
      </div>
      <button class="btn-remove" onclick="rmSpecies(${c},'${kind}',${i})">×</button>
    </div>`).join('');
}

function speciesTotal(c, kind) {
  return S.tanks[c][kind].reduce((s, f) => s + (+f.count || 0), 0);
}

function buildSpeciesTags(c, kind) {
  const meta = KIND_META[kind];
  const list = S.tanks[c][kind];
  const tags = list.filter(f => f.species).map(f => `<span class="fish-tag">${x(f.species)} × ${f.count}</span>`).join('');
  return `${tags}<span class="fish-tag total${meta.dotClass}">${meta.totalLabel} ${speciesTotal(c,kind)} ${meta.unit}</span>`;
}

function addSpecies(c, kind) {
  S.tanks[c][kind].push({
    species: '',
    count: 1
  });
  render();
  const rows = document.querySelectorAll(`#panel-${kind}-${c} .fish-row input[type=text]`);
  if (rows.length) rows[rows.length - 1].focus();
}

function rmSpecies(c, kind, i) {
  S.tanks[c][kind].splice(i, 1);
  render();
}

function upSpecies(c, kind, i, key, val) {
  S.tanks[c][kind][i][key] = val;
  rebuildTags(c, kind);
}

function chCount(c, kind, i, d) {
  const list = S.tanks[c][kind];
  list[i].count = Math.max(1, (list[i].count || 1) + d);
  const el = document.getElementById(`cc-${kind}-${c}-${i}`);
  if (el) el.textContent = list[i].count;
  rebuildTags(c, kind);
  updateMiniView(c);
}

function rebuildTags(c, kind) {
  const el = document.getElementById(`tags-${kind}-${c}`);
  if (!el) return;
  el.innerHTML = buildSpeciesTags(c, kind);
  updateMiniView(c);
}

function speciesCard(c, kind) {
  const meta = KIND_META[kind];
  const list = S.tanks[c][kind];
  const rows = buildSpeciesRows(c, kind);
  return `
    <div class="card" id="panel-${kind}-${c}">
      <div class="card-header"><div class="card-icon">${meta.icon}</div><div class="card-title">${meta.title}</div></div>
      <div class="fish-rows">${rows}</div>
      ${!list.length?`<div class="empty-hint">ยังไม่มีรายการ — กด “${meta.addLabel}” เพื่อเริ่มเพิ่ม</div>`:''}
      <button class="btn-add-item" onclick="addSpecies(${c},'${kind}')"><span style="font-size:16px;line-height:1">+</span> ${meta.addLabel}</button>
      ${list.length?`<div class="fish-tags" id="tags-${kind}-${c}">${buildSpeciesTags(c,kind)}</div>`:''}
    </div>`;
}

