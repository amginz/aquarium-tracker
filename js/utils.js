/* ============================================================
   UTILS
   Small helpers shared by every render module. Keep this file
   free of any dependency on app state (S) so it stays reusable.
   ============================================================ */

// Escape a string for safe insertion into an HTML attribute/text context.
function x(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// เรียก showPicker() แบบปลอดภัย — บาง environment (เช่น iframe cross-origin)
// จะ throw SecurityError ถ้าเรียกตรงๆ เลยดักไว้เฉยๆ แล้วปล่อยให้คลิกเปิดปฏิทินแบบ native ตามปกติแทน
function safeShowPicker(el) {
  try {
    el.showPicker && el.showPicker();
  } catch (err) {
    // เพิกเฉย — เบราว์เซอร์จะยังเปิดปฏิทินให้เองจากการคลิกช่องตามปกติ
  }
}

// input[type=date] gives "YYYY-MM-DD". new Date("YYYY-MM-DD") parses that as UTC
// midnight, which can land on the *previous* local day in timezones behind UTC.
// Parsing the parts manually keeps it anchored to local midnight instead.
function parseDateInput(d) {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

// Duration between two "HH:MM" times, wrapping past midnight (e.g. 22:00 -> 06:00).
function calcDur(on, off) {
  if (!on || !off) return '';
  const [oh, om] = on.split(':').map(Number), [fh, fm] = off.split(':').map(Number);
  let m = (fh * 60 + fm) - (oh * 60 + om);
  if (m < 0) m += 1440;
  return Math.floor(m / 60) + 'h ' + (m % 60 ? m % 60 + 'm' : '');
}

// คำนวณตำแหน่ง % บน track ของ slider จากค่า value เทียบกับ min/max ของมัน
// (ป้องกันแถบสีเลื่อนไม่ตรงกับหัว slider เมื่อ min ไม่ใช่ 0)
function rangePct(value, min, max) {
  return ((value - min) / (max - min)) * 100;
}

// แปลงวันที่จาก "YYYY-MM-DD" (ค่า input date) เป็น "DD/MM/YYYY" แบบเดียวกันทุกจุด
function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
