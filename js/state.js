/* ============================================================
   2. DATA MODEL
   ============================================================ */
const mkTank = (name) => ({
  name,
  fish: [],
  plants: [],
  temp: 26,
  light: {
    W: 60,
    R: 40,
    G: 20,
    B: 40,
    UV: 0,
    on: '10:00',
    off: '20:00'
  },
  filters: [{
    category: 'กรองหลัก',
    type: '',
    brand: '',
    model: '',
    media: '',
    interval: '1 สัปดาห์',
    lastClean: DEFAULT_DATE
  }],
  co2: {
    enabled: false,
    bpm: 4,
    on: '16:00',
    off: '11:00',
    dropChecker: 'เขียว (พอดี)',
    lastRefill: DEFAULT_DATE
  },
  calc: {
    length: 90,
    width: 45,
    height: 45,
    fillPct: 90,
    deductPct: 10,
    fertRatio: 1
  },
  fertilizer: []
});

const S = {
  cur: 0,
  // Running counter used to name new tanks ("Tank 02", "Tank 03", ...).
  // Kept separate from tanks.length so numbers stay unique even after
  // tanks in the middle of the list are deleted and re-added.
  tankSeq: 1,
  tanks: [
    Object.assign(mkTank('Tank 01'), {
      fish: [{
        species: 'ปลา',
        count: 1
      }],
      plants: [{
        species: 'ไม้น้ำ',
        count: 1
      }],
      temp: 27,
      calc: {
        length: 90,
        width: 45,
        height: 45,
        fillPct: 90,
        deductPct: 12,
        fertRatio: 5
      },
      light: {
        W: 100,
        R: 100,
        G: 100,
        B: 100,
        UV: 100,
        on: '16:00',
        off: '12:00'
      },
      filters: [{
        category: 'กรองหลัก',
        type: '',
        brand: '',
        model: '',
        media: '',
        interval: '1 สัปดาห์',
        lastClean: DEFAULT_DATE
      }],
      co2: {
        enabled: true,
        bpm: 4,
        on: '15:30',
        off: '11:30',
        dropChecker: 'เขียว (พอดี)',
        lastRefill: DEFAULT_DATE
      },
      fertilizer: [{
        day: 'จันทร์',
        name: 'ปุ๋ยน้ำ EI Macro',
        amount: 1,
        unit: 'ml'
      }]
    })
  ]
};

