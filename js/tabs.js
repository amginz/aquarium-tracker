/* ============================================================
   3. TAB BAR
   ============================================================ */
let editingTab = null; // index of tank currently being renamed, or null

function renderTabs() {
  const tabsHtml = S.tanks.map((t, i) => tabButton(t, i)).join('');
  const addBtn = `
    <button class="btn-add-tank" onclick="addTank()">
      <span style="font-size:15px;line-height:1">+</span> เพิ่มตู้
    </button>`;

  document.getElementById('tabs-bar').innerHTML = tabsHtml + addBtn;

  if (editingTab !== null) {
    const input = document.querySelector('#tabs-bar .tab-name-input');
    if (input) {
      input.focus();
      input.select();
    }
  }
}

function tabButton(t, i) {
  const isActive = S.cur === i;
  const isEditing = editingTab === i;
  const width = Math.max(52, t.name.length * 8.5);

  const nameHtml = isEditing ?
    `<input class="tab-name-input" value="${x(t.name)}" title="ชื่อตู้"
         onblur="commitTankName(${i},this.value)"
         onkeydown="if(event.key==='Enter')this.blur(); if(event.key==='Escape'){editingTab=null;renderTabs();}"
         onclick="event.stopPropagation()"
         style="width:${width}px">` :
    `<span class="tab-name">${x(t.name)}</span>`;

  const closeBtn = S.tanks.length > 1 ?
    `<span class="tab-close" onclick="event.stopPropagation();deleteTank(${i})" title="ลบตู้">×</span>` :
    '';

  return `
    <button class="tank-tab${isActive ? ' active' : ''}" onclick="switchTank(${i})">
      ${nameHtml}
      <span class="tab-edit" onclick="event.stopPropagation();editTankName(${i})" title="เปลี่ยนชื่อตู้">✏️</span>
      ${closeBtn}
    </button>`;
}

function switchTank(i) {
  S.cur = i;
  // BUGFIX: previously editingTab wasn't cleared here, so switching away
  // from a tab mid-rename could leave a stray rename <input> visible on
  // a tab that was no longer active.
  editingTab = null;
  renderTabs();
  render();
}

function editTankName(i) {
  const switchingTank = S.cur !== i;
  S.cur = i;
  editingTab = i;
  renderTabs();
  if (switchingTank) render();
}

function commitTankName(i, val) {
  editingTab = null;
  renameTank(i, val);
}

function addTank() {
  // BUGFIX: naming used to be based on S.tanks.length + 1, which produced
  // duplicate tab names once a tank in the middle of the list was deleted
  // (e.g. delete "Tank 02" from [01,02,03] -> length 2 -> next add became
  // "Tank 03", colliding with the existing one). A dedicated counter that
  // only ever increments avoids that.
  const n = S.tankSeq++;
  S.tanks.push(mkTank('Tank ' + String(n).padStart(2, '0')));
  S.cur = S.tanks.length - 1;
  renderTabs();
  render();
}

function deleteTank(i) {
  if (S.tanks.length <= 1) return;
  if (!confirm(`ลบ "${S.tanks[i].name}" ออก?`)) return;
  S.tanks.splice(i, 1);
  if (S.cur >= S.tanks.length) S.cur = S.tanks.length - 1;
  if (editingTab !== null) editingTab = null;
  renderTabs();
  render();
}

function renameTank(i, val) {
  S.tanks[i].name = val.trim() || S.tanks[i].name;
  renderTabs();
  if (i === S.cur) {
    const sub = document.querySelector(`#tankinfo-${i} .card-sub`);
    if (sub) sub.textContent = S.tanks[i].name;
  }
}

