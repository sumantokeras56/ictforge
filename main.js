
// Load saved API key on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const saved = _loadApiKey();
  if (saved) {
    const inp = document.getElementById('ps-ai-apikey');
    const cb  = document.getElementById('ps-ai-save-key');
    if (inp) inp.value = saved;
    if (cb)  cb.checked = true;
    window._psApiKey = saved;
  }
  // Also update Asia KZ card
  if (typeof updateAsiaKZCard === 'function') updateAsiaKZCard();
  // Init daily bias note autosave (journal-enhanced.js di-load setelah main.js,
  // guard dengan typeof agar tidak throw jika urutan berubah)
  if (typeof initDailyBiasNote === 'function') initDailyBiasNote();
});
console.log('[ICT Forge v2.0] Loaded. PineScript AI Error Fixer ready.');
// ── GLOBAL ERROR BOUNDARY (P1 Fix) ──────────────────────────────────
// Catch silent failures that could cause incorrect trading calculations
window.addEventListener('error', function(e) {
  console.error('[ICT Forge] Uncaught error:', e.message, 'at', e.filename, e.lineno);
  // Only show toast for trading-critical errors (not third-party/extension errors)
  if (e.filename && (e.filename.includes('main.js') || e.filename.includes('journal'))) {
    showToast('⚠️ Error terdeteksi — reload halaman jika ada data yang tidak tampil');
  }
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('[ICT Forge] Unhandled promise rejection:', e.reason);
});




// ── SIDEBAR STATE (deklarasi di atas — dipakai oleh showTab & toggleSidebar) ──
let _sidebarOpen = false;
const _isDesktop = () => window.innerWidth >= 900;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ── SECURITY: API Key obfuscation (XOR + base64) ─────────────────
// Prevents trivial localStorage scraping; not cryptographic, just obfuscation
const _OBFKEY = 'IctFrg2026';
function _obfEncode(str) {
  try {
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ _OBFKEY.charCodeAt(i % _OBFKEY.length));
    }
    return btoa(out);
  } catch(e) { return ''; }
}
function _obfDecode(enc) {
  try {
    const str = atob(enc);
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ _OBFKEY.charCodeAt(i % _OBFKEY.length));
    }
    return out;
  } catch(e) { return ''; }
}
function _saveApiKey(key) {
  try { localStorage.setItem('ict-ps-apikey', _obfEncode(key)); } catch(e) {}
}
function _loadApiKey() {
  try {
    const raw = localStorage.getItem('ict-ps-apikey');
    if (!raw) return '';
    // Support legacy plaintext keys (migrate on first read)
    try { atob(raw); } catch(e) { return raw; } // not base64 = legacy plaintext
    const decoded = _obfDecode(raw);
    // If decoded looks like a valid Anthropic key, return it
    if (decoded.startsWith('sk-ant-')) return decoded;
    // Otherwise treat as legacy and return raw (will be re-encoded on next save)
    return raw;
  } catch(e) { return ''; }
}

// ── XSS Protection: always use this for user-generated content in innerHTML ──
function sanitizeForHTML(str) {
  // Alias for escapeHtml — use this when inserting user data into innerHTML
  return escapeHtml(String(str || ''));
}

function safeJSONParse(str, fallback) {
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) return parsed;
    return fallback;
  } catch(e) { return fallback; }
}

// ── INSTRUMENT CONFIG ──────────────────────────────────────────────
const instruments = {
  forex: {
    name: 'Forex Standard (non-JPY)',
    desc: '1 lot = 100,000 units. Pip = 0.0001. Pip value ~$10/lot.',
    pipMultiplier: 10000,
    pipValueDefault: 10,
    unit: 'lot',
    chips: ['EURUSD','GBPUSD','AUDUSD','XAUUSD','GBPJPY (gunakan JPY)'],
    slLabel: 'SL Pips',
    tpLabel: 'TP Pips',
    sizeLabel: 'Lot Size',
    pipLabel: 'Pip Value (USD per lot per pip)'
  },
  jpyfx: {
    name: 'JPY Pairs (USDJPY, GBPJPY, dll)',
    desc: '1 lot = 100,000 units. Pip = 0.01. Pip value ~$7.6/lot (varies).',
    pipMultiplier: 100,
    pipValueDefault: 7.6,
    unit: 'lot',
    chips: ['USDJPY','GBPJPY','EURJPY','AUDJPY'],
    slLabel: 'SL Pips',
    tpLabel: 'TP Pips',
    sizeLabel: 'Lot Size',
    pipLabel: 'Pip Value (USD per lot per pip)'
  },
  nq: {
    name: 'NQ — E-mini Nasdaq-100 Futures',
    desc: 'Tick = 0.25 poin. Tick value = $5. Full contract = $20/poin.',
    pipMultiplier: 4, // 1 point = 4 ticks
    pipValueDefault: 5,
    tickSize: 1, // after ×4 multiplier, min unit = 1 tick
    unit: 'contract',
    chips: ['Tick: 0.25 poin','$5 per tick','$20 per poin','Micro MNQ = 1/10'],
    slLabel: 'SL Ticks',
    tpLabel: 'TP Ticks',
    sizeLabel: 'Contracts',
    pipLabel: 'Tick Value (USD per contract per tick = $5)'
  },
  es: {
    name: 'ES — E-mini S&P 500 Futures',
    desc: 'Tick = 0.25 poin. Tick value = $12.5. Full contract = $50/poin.',
    pipMultiplier: 4,
    pipValueDefault: 12.5,
    tickSize: 1,
    unit: 'contract',
    chips: ['Tick: 0.25 poin','$12.5 per tick','$50 per poin','Micro MES = 1/10'],
    slLabel: 'SL Ticks',
    tpLabel: 'TP Ticks',
    sizeLabel: 'Contracts',
    pipLabel: 'Tick Value (USD per contract per tick = $12.5)'
  },
  ym: {
    name: 'YM — E-mini Dow Jones Futures',
    desc: 'Tick = 1 poin. Tick value = $5. Full contract = $5/poin.',
    pipMultiplier: 1,
    pipValueDefault: 5,
    tickSize: 1,
    unit: 'contract',
    chips: ['Tick: 1 poin','$5 per tick','$5 per poin','Micro MYM = 1/10'],
    slLabel: 'SL Points',
    tpLabel: 'TP Points',
    sizeLabel: 'Contracts',
    pipLabel: 'Tick Value (USD per contract per tick = $5)'
  },
  custom: {
    name: 'Custom Instrument',
    desc: 'Masukkan pip/tick value secara manual sesuai instrumen.',
    pipMultiplier: 10000,
    pipValueDefault: 10,
    unit: 'lot',
    chips: ['Masukkan pip value manual'],
    slLabel: 'SL Distance',
    tpLabel: 'TP Distance',
    sizeLabel: 'Position Size',
    pipLabel: 'Tick/Pip Value (USD per unit)'
  }
};

let currentInstrument = 'forex';

function setInstrument(key, btn) {
  currentInstrument = key;
  document.querySelectorAll('.inst-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const inst = instruments[key];
  document.getElementById('instrName').textContent = inst.name;
  document.getElementById('instrDesc').textContent = inst.desc;
  document.getElementById('pipValue').value = inst.pipValueDefault;
  document.getElementById('pipValLabel').textContent = inst.pipLabel;
  document.getElementById('slLabel').textContent = inst.slLabel;
  document.getElementById('tpLabel').textContent = inst.tpLabel;
  document.getElementById('sizeLabel').textContent = inst.sizeLabel;
  // Update placeholder hints
  if (key === 'nq') { document.getElementById('entryPrice').placeholder = '17000.00'; document.getElementById('slPrice').placeholder = '16980.00'; document.getElementById('tpPrice').placeholder = '17040.00'; }
  else if (key === 'es') { document.getElementById('entryPrice').placeholder = '5300.00'; document.getElementById('slPrice').placeholder = '5290.00'; document.getElementById('tpPrice').placeholder = '5320.00'; }
  else if (key === 'ym') { document.getElementById('entryPrice').placeholder = '39500'; document.getElementById('slPrice').placeholder = '39400'; document.getElementById('tpPrice').placeholder = '39700'; }
  else { document.getElementById('entryPrice').placeholder = '1.08500'; document.getElementById('slPrice').placeholder = '1.08300'; document.getElementById('tpPrice').placeholder = '1.08900'; }

  const chips = document.getElementById('instrChips');
  chips.innerHTML = inst.chips.map(c => `<span class="pill pill-gold">${escapeHtml(c)}</span>`).join('');
  document.getElementById('instrInfo').classList.add('show');
  clearCalculator(); // V13: langsung di sini, tidak perlu override window.setInstrument
}

// ── CALCULATE ─────────────────────────────────────────────────────
function calculate() {
  const inst = instruments[currentInstrument];
  const balance = parseFloat(document.getElementById('balance').value) || 0;
  const riskPct = parseFloat(document.getElementById('riskPct').value) || 1;
  const entry = parseFloat(document.getElementById('entryPrice').value) || 0;
  const sl = parseFloat(document.getElementById('slPrice').value) || 0;
  const tp = parseFloat(document.getElementById('tpPrice').value) || 0;
  const tickVal = parseFloat(document.getElementById('pipValue').value) || inst.pipValueDefault;

  // Input validation — prevent silent failures
  if (!entry || !sl || !tp) { showToast('⚠️ Isi Entry, SL, dan TP terlebih dahulu'); return; }
  if (!balance || balance <= 0) { showToast('⚠️ Balance harus lebih dari 0'); return; }
  if (riskPct <= 0 || riskPct > 100) { showToast('⚠️ Risk % harus antara 0–100'); return; }
  if (entry === sl) { showToast('⚠️ Entry tidak boleh sama dengan SL (division by zero)'); return; }

  // ── Loading animation
  const calcBtn = document.querySelector('.calc-btn[onclick="calculate()"]');
  const resultEl = document.getElementById('calcResult');
  if (calcBtn) { calcBtn.disabled = true; calcBtn.textContent = '⏳ MENGHITUNG...'; }
  if (resultEl) resultEl.classList.remove('show');

  const calcLoadingSteps = [
    'VALIDASI INPUT...', 'HITUNG RISK AMOUNT...', 'HITUNG PIPS / TICKS...', 'KALKULASI LOT SIZE...', 'HITUNG RR RATIO...'
  ];
  let csi = 0;
  const cint = setInterval(() => {
    if (calcBtn && csi < calcLoadingSteps.length) calcBtn.textContent = '⏳ ' + calcLoadingSteps[csi++];
  }, 120);

  setTimeout(() => {
    clearInterval(cint);
    if (calcBtn) { calcBtn.disabled = false; calcBtn.textContent = 'HITUNG'; }
    try {
    const riskAmt = balance * (riskPct / 100);
    const slDiff = Math.abs(entry - sl);
    const tpDiff = Math.abs(tp - entry);

    let slUnits = Math.round(slDiff * inst.pipMultiplier * 100) / 100;
    let tpUnits = Math.round(tpDiff * inst.pipMultiplier * 100) / 100;

    if (inst.unit === 'contract' && inst.tickSize) {
      slUnits = Math.round(slUnits / inst.tickSize) * inst.tickSize;
      tpUnits = Math.round(tpUnits / inst.tickSize) * inst.tickSize;
      slUnits = Math.round(slUnits * 100) / 100;
      tpUnits = Math.round(tpUnits * 100) / 100;
    }

    if (slUnits <= 0) { showToast('⚠️ SL distance terlalu kecil — cek nilai entry dan SL'); return; }
    let posSize = riskAmt / (slUnits * tickVal);
    // Cap maximum position size — prevent unrealistic suggestions
    // Dynamic cap: for small accounts, cap is more conservative
    const MAX_POS = inst.unit === 'contract'
      ? Math.min(50, Math.max(1, Math.floor(balance / 5000)))   // ~1 contract per $5k
      : Math.min(100, Math.max(0.01, balance / 1000));          // ~0.001 lot per $1
    if (posSize > MAX_POS) {
      showToast('⚠️ Posisi terlalu besar (' + posSize.toFixed(2) + ') — dikap ke ' + MAX_POS.toFixed(inst.unit==="contract"?1:2) + ' ' + inst.unit);
      posSize = MAX_POS;
    }
    // Round to sensible precision
    if (inst.unit === 'contract') {
      posSize = Math.round(posSize * 10) / 10; // 1 decimal for contracts
    } else {
      posSize = Math.round(posSize * 100) / 100; // 2 decimals for lots, min 0.01
      posSize = Math.max(0.01, posSize);
    }
    const potProfit = posSize * tpUnits * tickVal;
    const rr = slUnits > 0 ? (tpUnits / slUnits) : 0;

    const unitLabel = inst.unit === 'contract' ? ' kontr.' : ' lot';
    const distLabel = inst.unit === 'contract' ? '' : ' pip';

    document.getElementById('riskAmount').textContent = '$' + riskAmt.toFixed(2);
    document.getElementById('slPips').textContent = slUnits.toFixed(inst.unit === 'contract' ? 2 : 0) + distLabel;
    document.getElementById('tpPips').textContent = tpUnits.toFixed(inst.unit === 'contract' ? 2 : 0) + distLabel;
    document.getElementById('lotSize').textContent = posSize.toFixed(2) + unitLabel;
    document.getElementById('potProfit').textContent = '$' + potProfit.toFixed(2);
    document.getElementById('rrRatio').textContent = '1:' + rr.toFixed(2);

    const rrEl = document.getElementById('rrRatio');
    const barFill = document.getElementById('rrBar');
    const verdict = document.getElementById('rrVerdict');
    const barPct = Math.min((rr / 5) * 100, 100);
    barFill.style.width = barPct + '%';

    if (rr >= 3) {
      rrEl.style.color = 'var(--green)';
      barFill.style.background = 'var(--green)';
      verdict.className = 'rr-verdict rr-good';
      verdict.textContent = '✓ Excellent Setup — RR ' + rr.toFixed(2) + ':1 sangat layak dieksekusi';
      showToast('✅ RR ' + rr.toFixed(2) + ':1 — Excellent setup!');
    } else if (rr >= 2) {
      rrEl.style.color = 'var(--gold-glow)';
      barFill.style.background = 'var(--gold)';
      verdict.className = 'rr-verdict rr-good';
      verdict.textContent = '✓ Valid ICT Setup — RR ' + rr.toFixed(2) + ':1 memenuhi minimum 1:2';
      showToast('✅ RR ' + rr.toFixed(2) + ':1 — Valid ICT setup');
    } else {
      rrEl.style.color = 'var(--red)';
      barFill.style.background = 'var(--red)';
      verdict.className = 'rr-verdict rr-bad';
      verdict.textContent = '✗ Di bawah minimum ICT — RR ' + rr.toFixed(2) + ':1 tidak direkomendasikan';
      showToast('⚠️ RR ' + rr.toFixed(2) + ':1 — Di bawah minimum');
    }
    document.getElementById('calcResult').classList.add('show');
    } catch(calcErr) {
      console.error('[ICT] Calculator error:', calcErr);
      showToast('❌ Error kalkulasi: ' + calcErr.message);
    }
  }, 700);
}

// ── HELP TOGGLE ───────────────────────────────────────────────────
function toggleHelp() {
  const toggle = document.getElementById('helpToggle');
  const content = document.getElementById('helpContent');
  toggle.classList.toggle('open');
  content.classList.toggle('show');
}

function saveChecklist() {
  const checked = [...document.querySelectorAll('.check-item.checked')].map(el => el.querySelector('.check-text').innerText.trim());
  localStorage.setItem('ict-checklist', JSON.stringify(checked));
}

function loadChecklist() {
  try {
    const saved = safeJSONParse(localStorage.getItem('ict-checklist'), []);
    document.querySelectorAll('.check-item').forEach(el => {
      const txt = el.querySelector('.check-text');
      if (txt && saved.includes(txt.innerText.trim())) el.classList.add('checked');
    });
    updateProgress();
  } catch(e) {}
}

// ── CHECKLIST ─────────────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  document.getElementById('tab-' + name).classList.add('active');
  if (el) { el.classList.add('active'); el.setAttribute('aria-selected','true'); }
  // v14.1.3: close sidebar on mobile after tab switch
  if (!_isDesktop() && _sidebarOpen) toggleSidebar();
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  el.setAttribute('aria-checked', el.classList.contains('checked') ? 'true' : 'false');
  updateProgress();
  saveChecklist();
}

function updateProgress() {
  const items = document.querySelectorAll('.check-item');
  const checked = document.querySelectorAll('.check-item.checked');
  const total = items.length;
  const done = checked.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressCount').textContent = done + ' / ' + total;

  const vm = document.getElementById('verdictMsg');
  if (done === total) {
    vm.style.color = 'var(--green)';
    vm.textContent = '✓ Semua checklist terpenuhi — Setup Valid untuk dieksekusi!';
  } else {
    const critical = document.querySelectorAll('.check-critical');
    const criticalChecked = document.querySelectorAll('.check-critical.checked');
    if (criticalChecked.length === critical.length && done >= 10) {
      vm.style.color = 'var(--gold)';
      vm.textContent = '⚡ Item kritis terpenuhi — Pertimbangkan entry dengan hati-hati';
    } else {
      vm.style.color = 'var(--text-muted)';
      vm.textContent = done + ' dari ' + total + ' item terpenuhi';
    }
  }
}

function resetChecklist() {
  document.querySelectorAll('.check-item').forEach(i => i.classList.remove('checked'));
  updateProgress();
  document.getElementById('verdictMsg').textContent = '';
  localStorage.removeItem('ict-checklist');
}

// ── LIVE CLOCK (UTC–4 = NY, UTC+0 = London, UTC+7 = WIB) ─────────
// V14: Timezone akurat via Intl.DateTimeFormat (otomatis EDT/EST)
const sessions = [
  { name: 'ASIA SESSION',  startH: 20, startM: 0,  endH: 3,  endM: 0,  color: 'var(--blue)',   pbC1:'#3a7bd5',pbC2:'#5B9BD5', kzId: null },
  { name: 'LONDON KZ',     startH: 3,  startM: 0,  endH: 8,  endM: 30, color: 'var(--gold)',   pbC1:'#8A6E30',pbC2:'#C9A84C', kzId: 'kz-london' },
  { name: 'NEW YORK KZ',   startH: 8,  startM: 30, endH: 16, endM: 0,  color: 'var(--green)',  pbC1:'#1a7a44',pbC2:'#2ECC71', kzId: 'kz-ny' },
  { name: 'NY PM SESSION', startH: 13, startM: 0,  endH: 16, endM: 0,  color: 'var(--purple)', pbC1:'#6a3a9f',pbC2:'#9B59B6', kzId: 'kz-nypm' }
];

// ── V14: FOMC SCHEDULE 2026 ───────────────────────────────────────
const FOMC_DATES_2026 = [
  '2026-01-28','2026-03-18','2026-05-06','2026-06-17',
  '2026-07-29','2026-09-16','2026-10-28','2026-12-09'
];

// ── V14.1.1: HIGH IMPACT NEWS ARRAY (Akurat 2026) ─────────────────
// Semua tanggal dalam format YYYY-MM-DD, waktu dalam NY timezone
// ⚠ P2 Fix: Data 2026 hardcoded — getNextFromArray() has fallback for dates past Dec 2026
// For 2027+, update this array or integrate a live economic calendar API
const HIGH_IMPACT_NEWS = [
  // ── NFP 2026 (First Friday each month, 08:30 NY) ──
  { name:'NFP', date:'2026-01-09', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-02-06', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-03-06', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-04-03', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-05-01', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-06-05', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-07-03', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-08-07', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-09-04', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-10-02', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-11-06', time:'08:30', currency:'USD', impact:'high' },
  { name:'NFP', date:'2026-12-04', time:'08:30', currency:'USD', impact:'high' },
  // ── CPI 2026 (~pertengahan bulan, 08:30 NY) ──
  { name:'CPI', date:'2026-01-14', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-02-12', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-03-12', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-04-14', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-05-13', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-06-12', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-07-15', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-08-13', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-09-15', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-10-14', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-11-13', time:'08:30', currency:'USD', impact:'high' },
  { name:'CPI', date:'2026-12-15', time:'08:30', currency:'USD', impact:'high' },
  // ── FOMC 2026 (14:00 NY) ──
  { name:'FOMC', date:'2026-01-28', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-03-18', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-05-06', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-06-17', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-07-29', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-09-16', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-10-28', time:'14:00', currency:'USD', impact:'high' },
  { name:'FOMC', date:'2026-12-09', time:'14:00', currency:'USD', impact:'high' },
];

// Helper: Get next event from HIGH_IMPACT_NEWS array for a given type
// Returns seconds until that event, or fallback if past all 2026 dates
function getNextFromArray(eventType, ny) {
  // v14.1.5: timezone-safe — semua perbandingan pakai UTC timestamp
  // "now" dalam NY = epoch ms saat ini
  const nowMs = Date.now();

  const filtered = HIGH_IMPACT_NEWS.filter(e => e.name === eventType);
  for (const ev of filtered) {
    const [h, m] = ev.time.split(':').map(Number);
    const [ey, emo, ed] = ev.date.split('-').map(Number);
    // Bangun event timestamp: tanggal NY midnight (UTC) + offset NY + jam event
    // Pakai Intl untuk cari UTC offset NY pada hari itu (akurat DST)
    // Trick: buat Date di UTC midnight, lalu cari selisih ke NY midnight
    const evUTCMidnight = Date.UTC(ey, emo - 1, ed); // UTC midnight
    // Tentukan offset NY pada hari itu (pakai formatter)
    const evDateObj = new Date(evUTCMidnight + 12 * 3600000); // noon UTC agar tidak ambigu DST
    const evNYParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(evDateObj);
    const evNYHour = parseInt(evNYParts.find(p => p.type === 'hour')?.value || '12');
    // Offset NY dari UTC noon: evNYHour - 12 (EDT=-4, EST=-5)
    const nyOffsetHours = evNYHour - 12; // negatif, e.g. -4 for EDT
    // NY midnight = UTC midnight - nyOffsetHours
    const evNYMidnightMs = evUTCMidnight + (-nyOffsetHours) * 3600000;
    const evMs = evNYMidnightMs + (h * 3600 + m * 60) * 1000;
    const diffSec = Math.round((evMs - nowMs) / 1000);
    if (diffSec > -300) return Math.max(0, diffSec); // masih relevan (300s grace)
  }
  // Fallback jika semua tanggal 2026 sudah lewat
  if (eventType === 'NFP') {
    let mo = ny.month, yr = ny.year;
    mo++; if (mo > 12) { mo = 1; yr++; }
    const day = getFirstFridayOfMonth(yr, mo);
    const evUTC = Date.UTC(yr, mo - 1, day);
    return Math.max(1, Math.round((evUTC + (4 * 3600 + 8 * 3600 + 30 * 60) * 1000 - nowMs) / 1000));
  }
  if (eventType === 'CPI') {
    let mo = ny.month, yr = ny.year;
    mo++; if (mo > 12) { mo = 1; yr++; }
    const evUTC = Date.UTC(yr, mo - 1, 14);
    return Math.max(1, Math.round((evUTC + (4 * 3600 + 8 * 3600 + 30 * 60) * 1000 - nowMs) / 1000));
  }
  if (eventType === 'FOMC') { return 42 * 86400; }
  return 7 * 86400;
}

// ── BROWSER NOTIFICATION SYSTEM (ICT Forge v1.0) ─────────────────
let _notifEnabled = false;
let _alertedSessions = new Set();
let _alertedEvents   = new Set();
let _cotReminderSent = false;

// Main toggle handler — called when user flips the switch
function handleNotifToggle(wantOn) {
  if (wantOn) {
    if (!('Notification' in window)) {
      showToast('⚠️ Browser Anda tidak mendukung notifikasi');
      const sw = document.getElementById('notifToggleSwitch');
      if (sw) sw.checked = false;
      return;
    }
    if (Notification.permission === 'granted') {
      _notifEnabled = true;
      localStorage.setItem('ict-notif', '1');
      updateNotifUI();
      showToast('✅ Notifikasi sesi aktif!');
    } else if (Notification.permission === 'denied') {
      showToast('❌ Izin notifikasi diblokir browser. Buka Pengaturan browser → izinkan notifikasi untuk halaman ini.');
      const sw = document.getElementById('notifToggleSwitch');
      if (sw) sw.checked = false;
      _notifEnabled = false;
      updateNotifUI();
    } else {
      // permission = 'default' — request it
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          _notifEnabled = true;
          localStorage.setItem('ict-notif', '1');
          updateNotifUI();
          showToast('✅ Notifikasi sesi diaktifkan!');
        } else {
          _notifEnabled = false;
          localStorage.setItem('ict-notif', '0');
          const sw = document.getElementById('notifToggleSwitch');
          if (sw) sw.checked = false;
          updateNotifUI();
          showToast('❌ Izin notifikasi ditolak. Cek pengaturan browser.');
        }
      });
    }
  } else {
    // User turned OFF
    _notifEnabled = false;
    localStorage.setItem('ict-notif', '0');
    updateNotifUI();
    showToast('🔕 Notifikasi sesi dimatikan');
  }
}

function sendTestNotification() {
  if (!_notifEnabled || Notification.permission !== 'granted') {
    showToast('⚠️ Aktifkan notifikasi terlebih dahulu');
    return;
  }
  _sendNotif(
    'ICT Forge — Test Notifikasi ✅',
    '🟢 Notifikasi berfungsi! Kamu akan dapat notif saat Kill Zone buka.',
    'ictforge-test'
  );
  showToast('✅ Test notifikasi berhasil dikirim!');
}

function updateNotifUI() {
  const badge = document.getElementById('notifStatusBadge');
  const sw    = document.getElementById('notifToggleSwitch');
  const testBtn = document.getElementById('notifTestBtn');
  if (badge) {
    badge.textContent = _notifEnabled ? '🔔 Notifikasi ON — Sesi trading aktif' : 'Notifikasi OFF';
    badge.style.background = _notifEnabled ? 'rgba(46,204,113,0.12)' : 'var(--dark4)';
    badge.style.color = _notifEnabled ? 'var(--green)' : 'var(--text-muted)';
    badge.style.border = _notifEnabled ? '1px solid rgba(46,204,113,0.25)' : 'none';
  }
  if (sw) sw.checked = _notifEnabled;
  if (testBtn) testBtn.style.display = _notifEnabled ? 'block' : 'none';
}

// Legacy function kept for backward compat
function requestNotificationPermission() {
  const sw = document.getElementById('notifToggleSwitch');
  if (sw) {
    sw.checked = true;
    handleNotifToggle(true);
  }
}

// ── HELPER: Kirim notifikasi via Service Worker (kompatibel HP/mobile)
// new Notification() tidak berfungsi di background pada mobile — harus via SW
function _sendNotif(title, body, tag) {
  if (!_notifEnabled || Notification.permission !== 'granted') return;
  // Coba via Service Worker dulu (paling kompatibel, termasuk HP Android)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: title,
      body:  body,
      tag:   tag || 'ictforge-notif'
    });
  } else {
    // Fallback: new Notification() untuk desktop/saat SW belum aktif
    try { new Notification(title, { body, tag, icon: '/ictforge/icon-192.png' }); } catch(e) {}
  }
}

function sendSessionNotif(sessionName, message) {
  if (!_notifEnabled || Notification.permission !== 'granted') return;
  _sendNotif('ICT Forge — ' + sessionName, message, 'sess-' + sessionName);
}

function sendNewsNotif(eventName, minLeft) {
  if (!_notifEnabled || Notification.permission !== 'granted') return;
  let msg;
  if (minLeft >= 15) {
    msg = '⏰ ' + eventName + ' dalam 15 menit — bersiap, hindari entry baru!';
  } else if (minLeft > 0) {
    msg = '⚠️ ' + eventName + ' dalam ' + minLeft + ' menit — JANGAN entry baru!';
  } else {
    msg = '🔴 ' + eventName + ' baru saja dirilis — tunggu settle 10-15 mnt';
  }
  _sendNotif('ICT — HIGH IMPACT NEWS ⚠️', msg, 'news-' + eventName + '-' + minLeft);
}

function inSession(h, m, s) {
  const t = h * 60 + m;
  const start = s.startH * 60 + s.startM;
  const end = s.endH * 60 + s.endM;
  if (s.startH > s.endH) { return t >= start || t < end; }
  return t >= start && t < end;
}

function pad(n) { return String(n).padStart(2, '0'); }

// Ambil waktu NY secara akurat (otomatis EDT/EST via Intl)
// Memoized formatter — avoids re-creating Intl objects on every tick
const _nyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false, day: '2-digit', month: '2-digit', year: 'numeric',
  weekday: 'short'
});
const _nyWeekdayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

function getNYTime(now) {
  try {
    const parts = _nyFormatter.formatToParts(now);
    const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0');
    const wdStr = parts.find(p => p.type === 'weekday')?.value || 'Sun';
    return {
      h: get('hour'), m: get('minute'), s: get('second'),
      day: get('day'), month: get('month'), year: get('year'),
      dayOfWeek: _nyWeekdayMap[wdStr] ?? 0
    };
  } catch(e) {
    // Fallback: use UTC offset approximation (Safari compatibility)
    console.warn('[ICT] Intl.DateTimeFormat failed, using fallback:', e);
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const nyOffset = -4; // EDT fallback
    const ny = new Date(utc + nyOffset * 3600000);
    return {
      h: ny.getHours(), m: ny.getMinutes(), s: ny.getSeconds(),
      day: ny.getDate(), month: ny.getMonth() + 1, year: ny.getFullYear(),
      dayOfWeek: ny.getDay()
    };
  }
}

// ── V14.1.5: MARKET OPEN/CLOSE HELPERS ─────────────────────────
// Market hours: Sunday 18:00 NY → Friday 17:00 NY
function isMarketOpen(ny) {
  const dow = ny.dayOfWeek; // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const nyNowSec = ny.h * 3600 + ny.m * 60 + ny.s;
  if (dow === 6) return false;                       // Sabtu: selalu tutup
  if (dow === 0) return nyNowSec >= 18 * 3600;      // Minggu: buka 18:00
  if (dow === 5) return nyNowSec < 17 * 3600;       // Jumat: tutup 17:00
  return true;                                       // Senin-Kamis: selalu buka
}

// Hitung detik ke market open berikutnya (Sunday 18:00 NY) — real timestamp
function secToNextMarketOpen(ny) {
  if (isMarketOpen(ny)) return 0;
  const nowMs = Date.now();
  const dow = ny.dayOfWeek;

  // Cari hari Minggu berikutnya
  let daysToSun = (7 - dow) % 7; // 0=Sun sudah
  if (dow === 0) daysToSun = 0;  // sudah Minggu tapi sebelum 18:00

  // Bangun timestamp Minggu 18:00 NY secara akurat
  const targetDateUTC = Date.UTC(ny.year, ny.month - 1, ny.day + daysToSun);
  const midObj = new Date(targetDateUTC + 12 * 3600000);
  const midParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: '2-digit', hour12: false
  }).formatToParts(midObj);
  const midNYH = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
  const nyOffset = midNYH - 12;
  const targetMs = targetDateUTC + (-nyOffset) * 3600000 + 18 * 3600000; // 18:00 NY
  return Math.max(0, Math.round((targetMs - nowMs) / 1000));
}

// Hitung detik ke market close (Friday 17:00 NY) — real timestamp
function secToMarketClose(ny) {
  if (!isMarketOpen(ny)) return 0;
  const nowMs = Date.now();
  const dow = ny.dayOfWeek;
  const daysToFri = (5 - dow + 7) % 7 || (dow === 5 ? 0 : 7);

  const targetDateUTC = Date.UTC(ny.year, ny.month - 1, ny.day + daysToFri);
  const midObj = new Date(targetDateUTC + 12 * 3600000);
  const midParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: '2-digit', hour12: false
  }).formatToParts(midObj);
  const midNYH = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
  const nyOffset = midNYH - 12;
  const targetMs = targetDateUTC + (-nyOffset) * 3600000 + 17 * 3600000; // 17:00 NY
  return Math.max(0, Math.round((targetMs - nowMs) / 1000));
}

// ── V14.1.5: getNextEventCountdown — real timestamp, timezone-safe ──
// Returns { days, hours, mins, secs, totalSecs }
function getNextEventCountdown(eventType, ny) {
  if (!ny) ny = getNYTime(new Date());
  const nowMs = Date.now();

  // Helper: detik ke event weekday berikutnya di NY (pakai real timestamp)
  function nextWeekdayNY(targetWday, hour, minute) {
    const nyNowSec = ny.h * 3600 + ny.m * 60 + ny.s;
    const targetSec = hour * 3600 + minute * 60;
    const today = ny.dayOfWeek;
    let daysAhead = (targetWday - today + 7) % 7;
    if (daysAhead === 0 && nyNowSec >= targetSec) daysAhead = 7;
    // Bangun timestamp event di NY secara akurat
    const nowNY = new Date(nowMs);
    // Temukan tanggal target: tambah daysAhead hari ke tanggal NY hari ini
    const targetDateUTC = Date.UTC(ny.year, ny.month - 1, ny.day + daysAhead);
    // Temukan offset NY pada hari target
    const midObj = new Date(targetDateUTC + 12 * 3600000);
    const midParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: '2-digit', hour12: false
    }).formatToParts(midObj);
    const midNYH = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
    const nyOffset = midNYH - 12; // e.g. EDT=-4, EST=-5
    const targetMs = targetDateUTC + (-nyOffset) * 3600000 + (hour * 3600 + minute * 60) * 1000;
    return Math.max(0, Math.round((targetMs - nowMs) / 1000));
  }

  if (eventType === 'NFP')     return secsToDHMS(getNextFromArray('NFP', ny));
  if (eventType === 'CPI')     return secsToDHMS(getNextFromArray('CPI', ny));
  if (eventType === 'FOMC')    return secsToDHMS(getNextFromArray('FOMC', ny));
  if (eventType === 'JOBLESS') return secsToDHMS(nextWeekdayNY(4, 8, 30));  // Kamis 08:30 NY
  if (eventType === 'COT')     return secsToDHMS(nextWeekdayNY(5, 15, 30)); // Jumat 15:30 NY

  return secsToDHMS(0);
}

function secsToDHMS(totalSecs) {
  totalSecs = Math.max(0, Math.floor(totalSecs));
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  return { days, hours, mins, secs, totalSecs };
}

function fmtCountdown(c, compact) {
  if (c.totalSecs <= 0) return compact ? '🔴 NOW' : '🔴 SEDANG BERLANGSUNG';
  if (compact) {
    if (c.days > 0) return `${c.days}h ${pad(c.hours)}j`;
    return `${pad(c.hours)}:${pad(c.mins)}:${pad(c.secs)}`;
  }
  if (c.days > 0) return `${c.days}h ${c.hours}j ${c.mins}m`;
  if (c.hours > 0) return `${c.hours}j ${c.mins}m ${c.secs}d`;
  return `${c.mins}m ${c.secs}d`;
}

// ── V14: UPDATE EVENT COUNTDOWN GRID ────────────────────────────
const eventDefs = [
  { id:'evt-nfp',   type:'NFP',     name:'Non-Farm Payrolls', label:'NFP', icon:'📊', schedule:'Jumat Pertama / Bln · 08:30 NY' },
  { id:'evt-cpi',   type:'CPI',     name:'CPI Report',        label:'CPI', icon:'💹', schedule:'~12 / Bln · 08:30 NY' },
  { id:'evt-fomc',  type:'FOMC',    name:'FOMC Rate Decision', label:'FOMC',icon:'🏦', schedule:'8× / Tahun · 14:00 NY' },
  { id:'evt-job',   type:'JOBLESS', name:'Initial Jobless Claims', label:'CLAIMS', icon:'📋', schedule:'Setiap Kamis · 08:30 NY' },
  { id:'evt-cot',   type:'COT',     name:'COT Report Release', label:'COT', icon:'📈', schedule:'Setiap Jumat · 15:30 NY' }
];

function renderEventCountdownGrid() {
  const grid = document.getElementById('eventCountdownGrid');
  if (!grid) return;
  grid.innerHTML = eventDefs.map(ev => `
    <div class="event-card" id="${ev.id}">
      <div class="event-card-badge badge-high">HIGH</div>
      <div class="event-card-label">${ev.label}</div>
      <div class="event-card-name">${ev.icon} ${ev.name}</div>
      <div class="event-card-countdown" id="${ev.id}-cd">--</div>
      <div class="event-card-sub">${ev.schedule}</div>
    </div>`).join('');
}

function updateEventCountdowns(ny) {
  eventDefs.forEach(ev => {
    const el = document.getElementById(ev.id + '-cd');
    const card = document.getElementById(ev.id);
    if (!el || !card) return;
    const c = getNextEventCountdown(ev.type, ny);
    el.textContent = fmtCountdown(c);
    // Style card by urgency
    card.classList.remove('imminent','today');
    if (c.totalSecs <= 3600)         card.classList.add('imminent'); // < 1 hour
    else if (c.days === 0)            card.classList.add('today');    // today

    // Notifikasi: 15 menit dan 5 menit sebelum event (v14.1.5)
    if (c.totalSecs > 0 && c.days === 0 && c.hours === 0) {
      const mins = c.mins;
      const evName = ev.label || ev.type || 'High Impact News';
      // 15 menit warning
      if (mins === 15) {
        const key15 = ev.type + '-15-' + ny.day + '-' + ny.month;
        if (!_alertedEvents.has(key15)) {
          _alertedEvents.add(key15);
          sendNewsNotif(evName, 15);
        }
      }
      // 5 menit warning
      if (mins <= 5 && mins > 0) {
        const key5 = ev.type + '-5-' + ny.day + '-' + ny.month;
        if (!_alertedEvents.has(key5)) {
          _alertedEvents.add(key5);
          sendNewsNotif(evName, mins);
        }
      }
    }
  });
}

// ── ASIA LIQUIDITY CHECK (COT-aware) ─────────────────────────────
function checkAsiaLiquidity() {
  // Check several instruments for high-conviction COT positioning
  const instrKeys = ['nq','es','eurusd','eur','gbp','jpy','gold'];
  let maxStrength = 0;
  let strongInstr = '';
  for (const k of instrKeys) {
    try {
      const d = localStorage.getItem('ict-cot-bias-' + k);
      if (d) {
        const parsed = JSON.parse(d);
        if (parsed && parsed.strength > maxStrength) {
          maxStrength = parsed.strength;
          strongInstr = parsed.symbol || k.toUpperCase();
        }
      }
    } catch(e) {}
  }
  // Day-of-week weighting (Tue/Thu historically more active for institutional flow)
  // Threshold >= 4 based on: strength 0-4 stars (from COT net position magnitude)
  // + day factor 0-2. Combined >= 4 means "elevated" conviction — P2 TODO: backtest validate
  const ny = getNYTime(new Date());
  const dayFactor = [0, 1, 2, 1, 2, 0, 0][ny.dayOfWeek] || 0; // Tue/Thu slightly more active
  if (maxStrength + dayFactor >= 4) {
    return { isLiquid: true, reason: `${strongInstr} net position kuat (${maxStrength}/4 ⭐)` };
  }
  return { isLiquid: false };
}

// ── V14.1.1: MARKET STATUS CARD — Simplified + Weekend Detection ──
function updateMarketStatusCard(ny, activeSession) {
  const card  = document.getElementById('marketStatusCard');
  const dot   = document.getElementById('statusDotBig');
  const label = document.getElementById('statusMainLabel');
  const reason= document.getElementById('statusReason');
  const sub   = document.getElementById('statusSub');
  const rec   = document.getElementById('statusRecommend');
  if (!card) return;

  let statusClass, labelText, reasonText, subText, recText, recClass;

  if (!isMarketOpen(ny)) {
    // Market tutup — hitung countdown ke Minggu 18:00 NY
    const totalSecToOpen = secToNextMarketOpen(ny);
    const h = Math.floor(totalSecToOpen / 3600);
    const m = Math.floor((totalSecToOpen % 3600) / 60);
    const s = totalSecToOpen % 60;
    const countdownStr = pad(h) + ':' + pad(m) + ':' + pad(s);
    const openDay = ny.dayOfWeek === 5 ? 'Minggu' : (ny.dayOfWeek === 6 ? 'Minggu' : 'Minggu');

    statusClass = 'weekend-closed';
    labelText   = '🔴 MARKET CLOSED';
    reasonText  = 'Pasar Forex tutup — buka kembali Minggu 18:00 NY (' + countdownStr + ' lagi)';
    subText     = 'Forex buka Minggu 18:00 NY, tutup Jumat 17:00 NY. Gunakan waktu ini untuk analisis HTF & journaling.';
    recText     = '🚫 JANGAN TRADE';
    recClass    = 'rec-avoid';
  } else {
    // ── Weekday: check news proximity first ──
    const newsWarning = checkNewsProximity(ny);

    if (newsWarning.isNear) {
      statusClass = 'news-risk';
      labelText   = '🔴 NEWS RISK';
      reasonText  = newsWarning.eventName + (newsWarning.minLeft > 0 ? ` — ${newsWarning.minLeft} menit lagi` : ' — baru dirilis');
      subText     = 'Hindari masuk posisi baru. Tunggu setelah release + 10-15 mnt settle.';
      recText     = '⚠️ AVOID TRADING NOW';
      recClass    = 'rec-avoid';
    } else if (activeSession) {
      if (activeSession.name === 'NEW YORK KZ' || activeSession.name === 'LONDON KZ') {
        statusClass = 'liquid';
        labelText   = '🟢 LIQUID';
        reasonText  = activeSession.name + ' aktif';
        subText     = 'Kill Zone aktif · Setup ICT valid · Volume & Spread optimal';
        recText     = '✅ RECOMMENDED TO TRADE';
        recClass    = 'rec-trade';
      } else if (activeSession.name === 'ASIA SESSION') {
        // Check if COT shows unusually strong positioning (Asia can be active on high COT weeks)
        const asiaKZLiquid = checkAsiaLiquidity();
        if (asiaKZLiquid.isLiquid) {
          statusClass = 'volatile';
          labelText   = '🟡 ASIA — ELEVATED';
          reasonText  = 'Asia Session — COT: ' + asiaKZLiquid.reason;
          subText     = 'Volume di atas rata-rata minggu ini · Setup berisiko tinggi · Konfirmasi wajib';
          recText     = '⚠️ TRADE WITH EXTREME CAUTION';
          recClass    = 'rec-caution';
        } else {
          statusClass = 'illiquid';
          labelText   = '🔴 ASIA — LOW VOLUME';
          reasonText  = 'Asia Session — Volume & Spread tidak optimal';
          subText     = 'Spread lebar · Noise tinggi · Tunggu London KZ (10:00 WIB)';
          recText     = '🚫 AVOID TRADING';
          recClass    = 'rec-avoid';
        }
      } else {
        statusClass = 'volatile';
        labelText   = '🟡 VOLATILE';
        reasonText  = activeSession.name;
        subText     = 'Perhatikan volume dan spread sebelum entry';
        recText     = '⚠️ TRADE WITH CAUTION';
        recClass    = 'rec-caution';
      }
    } else {
      const nyTotalMin = ny.h * 60 + ny.m;
      const isPreNY = nyTotalMin >= 7 * 60 && nyTotalMin < 8 * 60 + 30;
      if (isPreNY) {
        statusClass = 'volatile';
        labelText   = '🟡 PRE-MARKET';
        reasonText  = 'Pre-NY — Menunggu NY Open (08:30)';
        subText     = 'Bias HTF bisa dibaca. Jangan entry sebelum Kill Zone buka.';
        recText     = '⏳ WAIT FOR KILL ZONE';
        recClass    = 'rec-caution';
      } else {
        statusClass = 'illiquid';
        labelText   = '🔴 OFF HOURS';
        reasonText  = 'Di luar semua Kill Zone aktif';
        subText     = 'Pasar tidak liquid · Tidak ada setup ICT valid di luar Kill Zone';
        recText     = '🚫 AVOID TRADING';
        recClass    = 'rec-avoid';
      }
    }
  }

  // Remove pulse animation (simplified — hanya tambah jika news-risk)
  card.className = 'market-status-card ' + statusClass;
  if (label)  label.textContent  = labelText;
  if (reason) reason.textContent = reasonText;
  if (sub)    sub.textContent    = subText;
  if (rec) {
    rec.textContent  = recText;
    rec.className    = 'status-recommend ' + recClass;
  }
}

// ── V14.1.1: NEWS PROXIMITY CHECK — uses HIGH_IMPACT_NEWS + Jobless ─
function checkNewsProximity(ny) {
  const nyMin = ny.h * 60 + ny.m;
  const todayStr = `${ny.year}-${String(ny.month).padStart(2,'0')}-${String(ny.day).padStart(2,'0')}`;

  const newsWindows = [];

  // Check HIGH_IMPACT_NEWS for today's events
  HIGH_IMPACT_NEWS.forEach(ev => {
    if (ev.date === todayStr) {
      const [h, m] = ev.time.split(':').map(Number);
      newsWindows.push({ name: `${ev.name} ${ev.currency}`, h, m });
    }
  });

  // Jobless Claims every Thursday (not in array — weekly recurring)
  if (ny.dayOfWeek === 4) {
    // Only add if not already in array (avoid duplicate)
    const alreadyHasJobless = newsWindows.some(nw => nw.name.includes('Jobless'));
    if (!alreadyHasJobless) {
      newsWindows.push({ name: 'Initial Jobless Claims', h: 8, m: 30 });
    }
  }

  // COT release every Friday 15:30 — low market impact, skip

  for (const nw of newsWindows) {
    const targetMin = nw.h * 60 + nw.m;
    const diff = targetMin - nyMin;
    if (diff >= 0 && diff <= 20) {
      return { isNear: true, eventName: nw.name, minLeft: diff };
    }
    if (diff < 0 && diff >= -10) {
      return { isNear: true, eventName: nw.name + ' (baru rilis)', minLeft: 0 };
    }
  }
  return { isNear: false };
}

function getFirstFridayOfMonth(year, month) {
  for (let d = 1; d <= 7; d++) {
    if (new Date(year, month - 1, d).getDay() === 5) return d;
  }
  return 1;
}

// ── V14.1.1: SESSION PROGRESS BAR — Fixed + Weekend Support ──────
function updateSessionProgressBar(ny, activeSession) {
  const fill   = document.getElementById('progBarFill');
  const name   = document.getElementById('progSessionName');
  const timeEl = document.getElementById('progSessionTime');
  const start  = document.getElementById('progBarStart');
  const endEl  = document.getElementById('progBarEnd');
  const pct    = document.getElementById('progBarPct');
  if (!fill) return;

  const nyTotalSec = ny.h * 3600 + ny.m * 60 + ny.s;
  // ── Market closed: countdown to Sunday 18:00 NY open ───────────
  if (!isMarketOpen(ny)) {
    const totalSecToOpen = secToNextMarketOpen(ny);
    // Progress across the 47h weekend (Fri 17:00 → Sun 18:00 = 49h = 176400s)
    const weekendTotal = 49 * 3600;
    const elapsed = Math.max(0, weekendTotal - totalSecToOpen);
    const pctVal  = Math.min(100, (elapsed / weekendTotal) * 100);
    const h = Math.floor(totalSecToOpen / 3600);
    const m = Math.floor((totalSecToOpen % 3600) / 60);
    const s = totalSecToOpen % 60;

    fill.style.width = pctVal.toFixed(1) + '%';
    fill.style.setProperty('--pb-c1', '#5A3A6E');
    fill.style.setProperty('--pb-c2', '#7E4A99');
    if (name)   name.textContent   = '🔴 MARKET CLOSED';
    if (timeEl) timeEl.textContent = 'Buka dalam ' + pad(h) + ':' + pad(m) + ':' + pad(s);
    if (start)  start.textContent  = 'Jumat 17:00 NY';
    if (endEl)  endEl.textContent  = 'Minggu 18:00 NY';
    if (pct)    pct.textContent    = pctVal.toFixed(0) + '%';
    return;
  }

  // ── Active session ─────────────────────────────────────────────
  if (activeSession) {
    const sSec = activeSession.startH * 3600 + activeSession.startM * 60;
    const eSec = activeSession.endH   * 3600 + activeSession.endM   * 60;
    let dur, prog;

    if (activeSession.startH > activeSession.endH) {
      // Overnight session (Asia: starts 20:00, ends 03:00)
      const totalDur = (86400 - sSec) + eSec;
      prog = nyTotalSec >= sSec ? nyTotalSec - sSec : (86400 - sSec) + nyTotalSec;
      dur  = totalDur;
    } else {
      dur  = eSec - sSec;
      prog = Math.max(0, nyTotalSec - sSec);
    }

    const pctVal = Math.min(100, Math.max(0, (prog / dur) * 100));
    const remSec = Math.max(0, dur - prog);
    const remH = Math.floor(remSec / 3600), remM = Math.floor((remSec % 3600) / 60), remS = remSec % 60;

    fill.style.width = pctVal.toFixed(1) + '%';
    fill.style.setProperty('--pb-c1', activeSession.pbC1);
    fill.style.setProperty('--pb-c2', activeSession.pbC2);
    if (name)   name.textContent  = '🟢 ' + activeSession.name + ' AKTIF';
    if (timeEl) timeEl.textContent = `sisa ${pad(remH)}:${pad(remM)}:${pad(remS)}`;
    if (start)  start.textContent  = `${pad(activeSession.startH)}:${pad(activeSession.startM)} NY`;
    if (endEl)  endEl.textContent  = `${pad(activeSession.endH)}:${pad(activeSession.endM)} NY`;
    if (pct)    pct.textContent    = pctVal.toFixed(0) + '%';
    return;
  }

  // ── Off hours: countdown to next session ──────────────────────
  const next = getNextSessionInfo(nyTotalSec, ny);
  if (!next) return;

  // Use fixed gapSec based on actual inter-session gap for accuracy
  const remSec = next.remSec;
  // Progress: show as "filling up" toward the next session open
  // Gap window = remSec + some reference window (cap at 8h for sanity)
  const refWindow = Math.min(next.gapSec, 8 * 3600);
  const elapsed   = Math.max(0, refWindow - remSec);
  const pctVal    = Math.min(100, Math.max(0, (elapsed / refWindow) * 100));

  const h = Math.floor(remSec / 3600), m = Math.floor((remSec % 3600) / 60), s = remSec % 60;

  fill.style.width = pctVal.toFixed(1) + '%';
  fill.style.setProperty('--pb-c1', next.session.pbC1);
  fill.style.setProperty('--pb-c2', next.session.pbC2);
  if (name)   name.textContent  = '⏳ Menunggu ' + next.session.name;
  if (timeEl) timeEl.textContent = `buka dalam ${pad(h)}:${pad(m)}:${pad(s)}`;
  if (start)  start.textContent  = 'sekarang';
  if (endEl)  endEl.textContent  = `${pad(next.session.startH)}:${pad(next.session.startM)} NY`;
  if (pct)    pct.textContent    = pctVal.toFixed(0) + '% menuju buka';
}

function getNextSessionInfo(nyTotalSec, ny) {
  // v14.1.5: pakai real timestamp untuk akurasi lintas hari
  if (!ny) ny = getNYTime(new Date());
  const nowMs = Date.now();

  function nyTargetMs(daysOffset, hour, minute) {
    const targetDateUTC = Date.UTC(ny.year, ny.month - 1, ny.day + daysOffset);
    const midObj = new Date(targetDateUTC + 12 * 3600000);
    const midParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: '2-digit', hour12: false
    }).formatToParts(midObj);
    const midNYH = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
    const nyOffset = midNYH - 12;
    return targetDateUTC + (-nyOffset) * 3600000 + (hour * 3600 + minute * 60) * 1000;
  }

  const tradeSessions = [sessions[0], sessions[1], sessions[2], sessions[3]];
  let best = null, bestRemMs = Infinity;

  for (const s of tradeSessions) {
    let tMs = nyTargetMs(0, s.startH, s.startM);
    if (tMs <= nowMs) tMs = nyTargetMs(1, s.startH, s.startM);
    const remMs = tMs - nowMs;
    if (remMs < bestRemMs) { bestRemMs = remMs; best = s; }
  }

  if (!best) return null;
  return { session: best, remSec: Math.round(bestRemMs / 1000), gapSec: 7200 };
}

// ── V14: KILL ZONE LIVE HIGHLIGHT ───────────────────────────────
function updateKillZoneHighlight(ny) {
  const kzIds = ['kz-london','kz-ny','kz-nypm','kz-asia','kz-london-sb','kz-ny-sb'];
  kzIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('kz-live');
    const liveBadge = el.querySelector('.kz-live-badge');
    if (liveBadge) liveBadge.remove();
  });

  // Map session → possible kz card ids
  const sessionKZMap = {
    'LONDON KZ':     ['kz-london','kz-london-sb'],
    'NEW YORK KZ':   ['kz-ny','kz-ny-sb'],
    'NY PM SESSION': ['kz-nypm'],
    'ASIA SESSION':  ['kz-asia']
  };

  for (const s of sessions) {
    if (inSession(ny.h, ny.m, s)) {
      const ids = sessionKZMap[s.name] || [];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('kz-live');
        if (!el.querySelector('.kz-live-badge')) {
          const badge = document.createElement('div');
          badge.className = 'kz-live-badge';
          badge.textContent = '● LIVE';
          el.querySelector('.kz-body')?.appendChild(badge);
        }
      });
      // Notification: session start alert (once per session open)
      // Notifikasi sesi — dedup via localStorage + memory Set (v14.1.5)
      const alertKey = 'sess-' + s.name + '-' + ny.day + '-' + ny.month + '-' + ny.year;
      if (!_alertedSessions.has(alertKey) && ny.m === s.startM && ny.h === s.startH) {
        // Double-check via localStorage to avoid duplicate on page reload
        if (!localStorage.getItem('ict-notif-' + alertKey)) {
          _alertedSessions.add(alertKey);
          localStorage.setItem('ict-notif-' + alertKey, '1');
          // Auto-cleanup old keys (keep last 20 entries only)
          const lsKeys = Object.keys(localStorage).filter(k => k.startsWith('ict-notif-sess-'));
          if (lsKeys.length > 20) lsKeys.slice(0, lsKeys.length - 20).forEach(k => localStorage.removeItem(k));
          sendSessionNotif(s.name, '🟢 ' + s.name + ' baru dibuka! Periksa setup ICT Anda.');
        } else {
          _alertedSessions.add(alertKey); // sync memory with localStorage
        }
      }
    }
  }
}

function updateClock() {
  const now = new Date();

  // Semua jam pakai Intl.DateTimeFormat — akurat, otomatis DST, tidak bergantung timezone user
  function getTZ(tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(now);
    const g = t => parseInt(parts.find(p => p.type === t)?.value || '0');
    return { h: g('hour'), m: g('minute'), s: g('second') };
  }

  const ny  = getNYTime(now);                    // NY (America/New_York)
  const lon = getTZ('Europe/London');            // London (auto DST)
  const wib = getTZ('Asia/Jakarta');             // WIB (UTC+7, fixed)

  const elNY  = document.getElementById('clock-ny');
  const elLon = document.getElementById('clock-lon');
  const elWib = document.getElementById('clock-wib');
  if (elNY)  elNY.textContent  = pad(ny.h)  + ':' + pad(ny.m)  + ':' + pad(ny.s);
  if (elLon) elLon.textContent = pad(lon.h) + ':' + pad(lon.m) + ':' + pad(lon.s);
  if (elWib) elWib.textContent = pad(wib.h) + ':' + pad(wib.m) + ':' + pad(wib.s);

  // Update NY date
  const dateEl = document.getElementById('date-ny');
  if (dateEl) {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateEl.textContent = `${days[ny.dayOfWeek]} ${months[ny.month - 1]} ${ny.day}`;
  }

  // Session detection (v14.1.5: use isMarketOpen)
  let activeSession = null;
  const marketOpen = isMarketOpen(ny);
  if (marketOpen) {
    for (const s of sessions) {
      if (inSession(ny.h, ny.m, s)) { activeSession = s; break; }
    }
  }
  const sessionEl = document.getElementById('session-label');
  if (sessionEl) {
    if (!marketOpen) {
      sessionEl.textContent = 'CLOSED';
      sessionEl.style.color = 'var(--red)';
    } else if (activeSession) {
      sessionEl.textContent = activeSession.name;
      sessionEl.style.color = activeSession.color;
    } else {
      sessionEl.textContent = 'OFF HOURS';
      sessionEl.style.color = 'var(--text-muted)';
    }
  }

  // WIB market open countdown (v14.1.5)
  updateWIBMarketCountdown(ny);

  // COT countdown
  const cotCountdownEl = document.getElementById('cot-countdown');
  if (cotCountdownEl) cotCountdownEl.textContent = getCOTCountdown(ny);

  // COT status panel (update once per minute)
  if (!updateClock._lastStatusMin || updateClock._lastStatusMin !== ny.m) {
    updateCOTStatusPanel(ny);
    updateClock._lastStatusMin = ny.m;
  }

  // V14: Session progress bar
  updateSessionProgressBar(ny, activeSession);

  // V14: Market status card (update every 5s via tick flag)
  updateMarketStatusCard(ny, activeSession);

  // V14: Event countdowns (every second)
  updateEventCountdowns(ny);

  // V14: Kill Zone highlight (every second) — skip on weekend
  if (marketOpen) updateKillZoneHighlight(ny);

  // ── Market session countdowns — always run (v14.1.5 fix)
  updateMarketCountdownsInner(ny);
}

// Market countdowns — v14.1.5: semua pakai real UTC timestamp
function updateMarketCountdownsInner(ny) {
  const targets = [
    { element: 'countdownLondon',  targetHour: 3,  targetMin: 0  },
    { element: 'countdownNY',      targetHour: 8,  targetMin: 30 },
    { element: 'countdownNYClose', targetHour: 16, targetMin: 0  },
    { element: 'countdownTokyo',   targetHour: 19, targetMin: 0  }
  ];

  const nowMs = Date.now();

  // Helper: bangun timestamp NY untuk jam tertentu di tanggal offset dari hari ini NY
  function nyTargetMs(daysOffset, hour, minute) {
    const targetDateUTC = Date.UTC(ny.year, ny.month - 1, ny.day + daysOffset);
    const midObj = new Date(targetDateUTC + 12 * 3600000);
    const midParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour: '2-digit', hour12: false
    }).formatToParts(midObj);
    const midNYH = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
    const nyOffset = midNYH - 12; // EDT=-4, EST=-5
    return targetDateUTC + (-nyOffset) * 3600000 + (hour * 3600 + minute * 60) * 1000;
  }

  targets.forEach(t => {
    let tMs = nyTargetMs(0, t.targetHour, t.targetMin); // coba hari ini NY
    if (tMs <= nowMs) tMs = nyTargetMs(1, t.targetHour, t.targetMin); // besok
    // Jika masih di weekend (market tutup) dan target sudah hari depan tapi
    // market belum buka, tambah hari lagi sampai setelah market open
    // (Market tidak buka sebelum Sun 18:00, jadi London/NY Senin pagi sudah benar)
    const diffSec = Math.round((tMs - nowMs) / 1000);
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    const el = document.getElementById(t.element);
    if (el) el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
  });
}

// ── V14.1.5: WIB MARKET COUNTDOWN — real UTC timestamp ───────────
// WIB open: Senin 05:00 WIB = Minggu 22:00 UTC = Minggu 18:00 NY (EDT)
// WIB close: Sabtu 04:00 WIB = Jumat 21:00 UTC = Jumat 17:00 NY (EDT)
function updateWIBMarketCountdown(ny) {
  const el   = document.getElementById('wib-market-status');
  const cdEl = document.getElementById('wib-market-countdown');
  if (!el && !cdEl) return;

  // ny is passed from updateClock to avoid redundant Intl calls
  if (!ny) ny = getNYTime(new Date());
  const wibOpen = isMarketOpen(ny);

  let label, countdown;
  if (wibOpen) {
    // Hitung ke market close via real timestamp
    const secClose = secToMarketClose(ny);
    const ch = Math.floor(secClose / 3600);
    const cm = Math.floor((secClose % 3600) / 60);
    const cs = secClose % 60;
    label    = '🟢 PASAR BUKA';
    countdown = 'Tutup dalam ' + pad(ch) + ':' + pad(cm) + ':' + pad(cs);
  } else {
    const secOpen = secToNextMarketOpen(ny);
    const ch = Math.floor(secOpen / 3600);
    const cm = Math.floor((secOpen % 3600) / 60);
    const cs = secOpen % 60;
    label    = '🔴 PASAR TUTUP';
    countdown = 'Buka dalam ' + pad(ch) + ':' + pad(cm) + ':' + pad(cs);
  }

  if (el)   el.textContent  = label;
  if (cdEl) cdEl.textContent = countdown;
}

// ── MASTER TIMER — robust, self-healing (v14.1.5) ────────────────
let _masterTimer = null;
let _lastTickTime = 0;
const TICK_INTERVAL = 1000;

function safeUpdateClock() {
  try { updateClock(); } catch(e) { console.warn('[ICT] Clock error:', e); }
}

function startMasterTimer() {
  if (_masterTimer) { clearInterval(_masterTimer); _masterTimer = null; }
  safeUpdateClock();
  _lastTickTime = Date.now();
  _masterTimer = setInterval(() => {
    _lastTickTime = Date.now();
    safeUpdateClock();
  }, TICK_INTERVAL);
}
startMasterTimer();

// Saat tab aktif kembali: restart timer (browser throttles inactive tabs)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Tab became visible — restart to avoid stale clock
    startMasterTimer();
  }
  // Tidak stop saat hidden — biar notifikasi tetap jalan
});

// Watchdog: jika tick lebih dari 3 detik terlambat, restart
setInterval(() => {
  if (_lastTickTime && Date.now() - _lastTickTime > 3000) {
    console.warn('[ICT] Timer drift detected — restarting');
    startMasterTimer();
  }
}, 5000);

// ==================== COT ANALYZER (COPY-PASTE VERSION) ====================
const cotInstruments = [
  { name:'E-MINI S&P 500',      symbol:'ES',   target:'5500',  support:'5300',  searchTerms: ['E-MINI S&P 500', 'S&P 500', 'E-MINI S&P'] },
  { name:'NASDAQ-100',          symbol:'NQ',   target:'19800', support:'19000', searchTerms: ['NASDAQ-100', 'NASDAQ 100', 'NASDAQ'] },
  { name:'EURO FX',             symbol:'EUR',  target:'1.0950',support:'1.0700',searchTerms: ['EURO FX', 'EURO', 'EUR'] },
  { name:'BRITISH POUND',       symbol:'GBP',  target:'1.2750',support:'1.2450',searchTerms: ['BRITISH POUND', 'POUND', 'GBP'] },
  { name:'JAPANESE YEN',        symbol:'JPY',  target:'145',   support:'150',   searchTerms: ['JAPANESE YEN', 'YEN', 'JPY'] },
  { name:'AUSTRALIAN DOLLAR',   symbol:'AUD',  target:'0.6650',support:'0.6450',searchTerms: ['AUSTRALIAN DOLLAR', 'AUD', 'AUSTRALIAN'] },
  { name:'CANADIAN DOLLAR',     symbol:'CAD',  target:'0.7350',support:'0.7150',searchTerms: ['CANADIAN DOLLAR', 'CAD', 'CANADIAN'] },
  { name:'SWISS FRANC',         symbol:'CHF',  target:'1.1250',support:'1.0950',searchTerms: ['SWISS FRANC', 'SWISS', 'CHF'] },
  { name:'NEW ZEALAND DOLLAR',  symbol:'NZD',  target:'0.6050',support:'0.5850',searchTerms: ['NEW ZEALAND DOLLAR', 'NZ DOLLAR', 'NZD', 'NEW ZEALAND'] }
];

// ── COT SIMPLE EXPLANATION (Bahasa Awam) ──────────────────────────
function getSimpleExplanation(symbol, isBullish, netCommercial, target, support) {
  const absNet = Math.abs(netCommercial).toLocaleString();
  if (isBullish) {
    return `📈 <strong style="color:var(--green)">${symbol} diprediksi NAIK minggu depan.</strong><br>
            Bank dan hedge fund (pemain besar) sedang mengumpulkan posisi beli sebesar <strong>${absNet} kontrak</strong>.
            Artinya, mereka yakin harga akan naik. Target terdekat: <strong>${target}</strong>.<br>
            Harga diperkirakan tidak akan turun di bawah <strong>${support}</strong>.<br><br>
            📌 <em>Tips ICT:</em> Cari momen beli saat harga koreksi turun (di area Discount) dan masuk saat Kill Zone (NY Open atau London Open).`;
  } else {
    return `📉 <strong style="color:var(--red)">${symbol} diprediksi TURUN minggu depan.</strong><br>
            Bank dan hedge fund (pemain besar) sedang mengambil posisi jual sebesar <strong>${absNet} kontrak</strong>.
            Artinya, mereka yakin harga akan turun. Target terdekat: <strong>${support}</strong>.<br>
            Harga diperkirakan tidak akan naik di atas <strong>${target}</strong>.<br><br>
            📌 <em>Tips ICT:</em> Cari momen jual saat harga koreksi naik (di area Premium) dan masuk saat Kill Zone (NY Open atau London Open).`;
  }
}

function toggleExplanation(id) {
  const el = document.getElementById(id);
  if (el) {
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    const btn = el.previousElementSibling;
    if (btn) btn.textContent = isHidden ? '📖 Sembunyikan Penjelasan' : '📖 Baca Penjelasan (Bahasa Awam)';
  }
}

function displayCOTResults(results, totalRows) {
  const container = document.getElementById('cotResults');
  const found = results.filter(r => r.data);

  if (!found.length) {
    container.innerHTML = '<div style="background:rgba(231,76,60,0.1);padding:20px;border-radius:8px;color:var(--red);text-align:center;">⚠ Tidak ada instrumen yang cocok ditemukan di CSV.<br><span style="font-size:12px;color:var(--text-muted);">File berisi ' + totalRows + ' baris. Pastikan menggunakan fut_disagg.csv dari CFTC.</span></div>';
    return;
  }

  let html = `<div>
    <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--gold-dim);text-transform:uppercase;margin-bottom:16px;">
      📈 HASIL ANALISIS COT — ${found.length} / ${results.length} INSTRUMEN DITEMUKAN
      <span style="color:var(--text-muted);font-size:10px;margin-left:12px;">(dari ${totalRows.toLocaleString()} total baris data)</span>
    </div>`;

  for (const r of results) {
    if (!r.data) {
      html += `<div class="cot-result-card" style="opacity:0.45;">
        <div class="cot-instr-title">${escapeHtml(r.symbol)} — ${escapeHtml(r.name)}</div>
        <div style="color:var(--text-muted);padding:4px 0;font-size:13px;">⚠ Tidak ditemukan di CSV</div>
      </div>`;
      continue;
    }

    const d = r.data;
    const isBullish   = d.netCommercial > 0;
    const absNet      = Math.abs(d.netCommercial);
    const stars       = absNet > 100000 ? '⭐⭐⭐⭐' : absNet > 50000 ? '⭐⭐⭐' : absNet > 20000 ? '⭐⭐' : '⭐';
    const sentiment   = (isBullish ? 'BULLISH ' : 'BEARISH ') + stars;
    const sentClass   = isBullish ? 'sentiment-bullish' : 'sentiment-bearish';
    const maxPos      = Math.max(d.commLong, d.commShort, 1);
    const longPct     = Math.min((d.commLong / maxPos) * 50, 50);
    const shortPct    = Math.min((d.commShort / maxPos) * 50, 50);
    const contraSpec  = (d.netNonCommercial > 0 && !isBullish) || (d.netNonCommercial < 0 && isBullish);
    const safeSymbol  = escapeHtml(r.symbol);
    const safeName    = escapeHtml(r.name);
    const safeTarget  = escapeHtml(r.target);
    const safeSupport = escapeHtml(r.support);
    const safeDate    = escapeHtml(d.date);
    const expectation = isBullish
      ? `Commercial net LONG <strong style="color:var(--green)">+${absNet.toLocaleString()}</strong> contracts. Smart Money akumulasi posisi beli → Bias <span style="color:var(--green)">Bullish</span> untuk ${safeSymbol}. Target area: ${safeTarget}. Support: ${safeSupport}.`
      : `Commercial net SHORT <strong style="color:var(--red)">-${absNet.toLocaleString()}</strong> contracts. Smart Money distribusi / hedging → Bias <span style="color:var(--red)">Bearish</span> untuk ${safeSymbol}. Target area: ${safeSupport}. Resistance: ${safeTarget}.`;

    html += `
    <div class="cot-result-card">
      <div class="cot-instr-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span>${safeSymbol} — ${safeName}</span>
        <span class="cot-sentiment ${sentClass}">📊 ${sentiment}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div>
          <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">🏦 Commercial (Bank/Hedge Fund)</div>
          <div style="font-size:13px;color:var(--text-dim);">Long: <strong style="color:var(--green)">${d.commLong.toLocaleString()}</strong> &nbsp;|&nbsp; Short: <strong style="color:var(--red)">${d.commShort.toLocaleString()}</strong></div>
          <div class="cot-net-bar">
            <div class="cot-net-fill-long" style="width:${longPct}%;"></div>
            <div class="cot-net-fill-short" style="width:${shortPct}%;"></div>
          </div>
          <div style="font-size:14px;"><strong style="color:${isBullish?'var(--green)':'var(--red)'}">Net: ${isBullish?'+':'-'}${absNet.toLocaleString()} ${isBullish?'LONG':'SHORT'}</strong></div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">🐂 Non-Commercial (Spekulan)</div>
          <div style="font-size:13px;color:var(--text-dim);">Long: <strong>${d.nonCommLong.toLocaleString()}</strong> &nbsp;|&nbsp; Short: <strong>${d.nonCommShort.toLocaleString()}</strong></div>
          <div style="margin-top:8px;font-size:13px;"><strong style="color:${d.netNonCommercial>0?'var(--green)':'var(--red)'}">Net: ${d.netNonCommercial>0?'+':''}${d.netNonCommercial.toLocaleString()}</strong></div>
          <div style="font-size:11px;margin-top:4px;color:${contraSpec?'var(--orange)':'var(--text-muted)'};">
            ${contraSpec ? '⚠ Spekulan contra Smart Money' : '✓ Spekulan searah Smart Money'}
          </div>
        </div>
      </div>
      <div style="padding:12px;background:var(--dark4);border-radius:6px;border-left:3px solid ${isBullish?'var(--green)':'var(--red)'};">
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--gold-dim);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">🔮 ICT Bias & Ekspektasi</div>
        <p style="font-size:13px;color:var(--text-dim);line-height:1.6;">${expectation}</p>
        <div style="margin-top:8px;font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;">Periode data COT: ${safeDate}</div>
      </div>
      <div style="margin-top:12px;">
        <button class="action-btn" onclick="toggleExplanation('exp-${safeSymbol}')" style="font-size:10px;padding:4px 10px;">📖 Baca Penjelasan (Bahasa Awam)</button>
        <div id="exp-${safeSymbol}" style="display:none;margin-top:10px;padding:14px;background:var(--dark4);border-radius:6px;font-size:13px;color:var(--text-dim);line-height:1.8;border-left:3px solid ${isBullish?'var(--green)':'var(--red)'};">
          ${getSimpleExplanation(safeSymbol, isBullish, d.netCommercial, safeTarget, safeSupport)}
        </div>
      </div>
    </div>`;
  }

  html += `<div style="margin-top:16px;padding:14px 18px;background:rgba(201,168,76,0.08);border-radius:6px;border:1px solid var(--border);font-size:12px;color:var(--text-muted);">
    ⚠ <strong style="color:var(--gold)">Disclaimer:</strong> COT report memiliki lag ~3 hari (rilis Jumat untuk posisi Selasa). Gunakan sebagai <em>konfirmasi bias HTF</em>, bukan sinyal entry tunggal. Selalu kombinasikan dengan analisis ICT: AMD Cycle, PD Arrays, dan Kill Zone.
  </div></div>`;

  container.innerHTML = html;
  
  // Auto-save COT bias data for Daily Bias Helper
  try { extractAndSaveCOTBias(results); } catch(e) {}
  _cotParsing = false; // Release race condition lock
}

// ── INSTRUMENT MATCH HELPER (searchTerms-aware) ───────────────────
function matchInstrument(key, inst) {
  const keyUpper = key.toUpperCase();
  const nameUpper = (inst.name || '').toUpperCase();
  if (keyUpper.includes(nameUpper)) return true;
  if (inst.searchTerms && inst.searchTerms.some(term => keyUpper.includes(term.toUpperCase()))) return true;
  return false;
}

// ── COT PARSER: Monospace Text (format CFTC legacy copy-paste) ────
// Handles the classic "Commitments of Traders" fixed-width report text
let _cotParsing = false; // Race condition guard

function parseMonospaceTextCOT(text) {
  const lines = text.split(/\r?\n/);
  const parsedInstruments = {};
  let currentName = null;

  // Extract report date from header (e.g. "April 07, 2026" or "APRIL 07, 2026")
  const dateMatch = text.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i
  );
  const reportDate = dateMatch ? dateMatch[0] : 'N/A';

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── Detect instrument name block ──────────────────────────────
    // CFTC monospace: instrument name is on its own line (or with exchange), often ALL CAPS
    // Common patterns:
    //   "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE"
    //   "NASDAQ-100 STOCK INDEX - CHICAGO MERCANTILE EXCHANGE"
    //   "GOLD - COMMODITY EXCHANGE INC."
    const knownExchanges = [
      'CHICAGO MERCANTILE EXCHANGE', 'CHICAGO BOARD OF TRADE',
      'COMMODITY EXCHANGE INC', 'NEW YORK MERCANTILE EXCHANGE',
      'ICE FUTURES U.S.'
    ];
    const isInstrumentLine = knownExchanges.some(ex => trimmed.toUpperCase().includes(ex));
    if (isInstrumentLine) {
      // Strip the exchange name to get clean instrument name
      let name = trimmed.toUpperCase();
      knownExchanges.forEach(ex => { name = name.replace(ex, '').replace(/-\s*$/, '').trim(); });
      if (name.length > 3) currentName = name;
      continue;
    }

    // Some formats have instrument name on line before "Code-XXXXX"
    if (/Code-\d+/i.test(trimmed) && currentName === null) {
      // Try the line above
      const prevLine = (lines[i - 1] || '').trim().toUpperCase();
      if (prevLine.length > 5 && !/^\d/.test(prevLine)) currentName = prevLine;
      continue;
    }

    // ── Detect the "All" data row (positions for all trader categories) ───
    // Format: "All    123,456  234,567  12,345  456,789  345,678  ..."
    if (currentName && /^All\b/i.test(trimmed)) {
      // Extract all numbers from the line
      const nums = [];
      // Use matchAll to avoid stateful regex issues
      const numMatches = trimmed.matchAll(/[\d,]+/g);
      for (const match of numMatches) {
        const n = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(n) && n > 0) nums.push(n);
      }

      // CFTC monospace "All" row column order (Disaggregated / Legacy):
      // OI | NComm_Long | NComm_Short | NComm_Spread | Comm_Long | Comm_Short | Total_Long | Total_Short | NonRep_Long | NonRep_Short
      if (nums.length >= 6) {
        const nonCommLong  = nums[1] || 0;
        const nonCommShort = nums[2] || 0;
        const commLong     = nums[4] || 0;
        const commShort    = nums[5] || 0;

        if (commLong > 0 || commShort > 0) {
          parsedInstruments[currentName] = { commLong, commShort, nonCommLong, nonCommShort, date: reportDate };
        }
      }
      currentName = null; // reset — ready for next instrument
      continue;
    }

    // Also handle "Old" / "Other" sub-rows: skip them, we only want "All"
    if (/^(?:Old|Other)\b/i.test(trimmed)) continue;
  }

  const totalRows = Object.keys(parsedInstruments).length;
  if (totalRows === 0) {
    throw new Error(
      'Tidak ada data berhasil di-parse dari format teks monospace. ' +
      'Tips: Pastikan Anda copy-paste seluruh halaman laporan CFTC (bukan hanya sebagian). ' +
      'Atau gunakan format CSV dari fut_disagg.zip.'
    );
  }

  const data = cotInstruments.map(inst => {
    const matchKey = Object.keys(parsedInstruments).find(k => matchInstrument(k, inst));
    if (!matchKey) return { ...inst, data: null };
    const d = parsedInstruments[matchKey];
    return {
      ...inst,
      data: {
        commLong: d.commLong, commShort: d.commShort,
        netCommercial: d.commLong - d.commShort,
        nonCommLong: d.nonCommLong, nonCommShort: d.nonCommShort,
        netNonCommercial: d.nonCommLong - d.nonCommShort,
        date: d.date
      }
    };
  });

  return { data, totalRows };
}

// ── COT COUNTDOWN (V14: pakai ny object dari Intl, akurat EDT/EST, format D:H:M:S) ─
function getCOTCountdown(ny) {
  if (!ny) ny = getNYTime(new Date());
  const c = getNextEventCountdown('COT', ny);
  if (c.totalSecs <= 0) return '🔴 LIVE';
  if (c.days > 0) return `${c.days}d ${pad(c.hours)}h`;
  return `${pad(c.hours)}:${pad(c.mins)}:${pad(c.secs)}`;
}

// ── COT STATUS PANEL (V14: pakai getNextEventCountdown untuk presisi) ─
function updateCOTStatusPanel(ny) {
  const statusText = document.getElementById('cotStatusText');
  const statusDetail = document.getElementById('cotStatusDetail');
  if (!statusText || !statusDetail) return;

  if (!ny) ny = getNYTime(new Date());
  const day = ny.dayOfWeek;
  const h = ny.h, m = ny.m;

  const isFriday = day === 5;
  const isReleasedToday = isFriday && (h > 15 || (h === 15 && m >= 30));
  const isReleaseTime = isFriday && h === 15 && m >= 25 && m <= 45;

  let statusMsg, detailMsg, detailClass;

  if (isReleaseTime) {
    statusMsg = '🔴 COT sedang dirilis sekarang!';
    detailMsg = 'CFTC sedang merilis data COT minggu ini. Refresh halaman CFTC dan paste segera untuk bias mingguan terbaru.';
    detailClass = 'critical';
  } else if (isReleasedToday) {
    statusMsg = '✅ COT minggu ini sudah dirilis';
    detailMsg = 'Data COT hari Selasa sudah tersedia sejak tadi. Download fut_disagg.csv dari CFTC dan analisis sekarang untuk bias minggu depan.';
    detailClass = 'good';
  } else if (isFriday) {
    const c = getNextEventCountdown('COT', ny);
    statusMsg = `⏳ COT rilis hari ini — ${fmtCountdown(c)} lagi (15:30 NY)`;
    detailMsg = 'Siapkan halaman CFTC. Setelah rilis, download fut_disagg.csv dan paste di sini untuk analisis bias.';
    detailClass = 'warning';
  } else {
    const c = getNextEventCountdown('COT', ny);
    statusMsg = `📅 COT rilis berikutnya: ${fmtCountdown(c)} lagi (Jumat 15:30 NY)`;
    detailMsg = 'Data yang tersedia adalah posisi hari Selasa minggu lalu. Tetap valid untuk bias HTF — lag 3 hari wajar.';
    detailClass = 'good';
  }

  statusText.textContent = statusMsg;
  statusDetail.textContent = detailMsg;
  statusDetail.className = `status-update ${detailClass}`;
}




function clearCalculator() {
  document.getElementById('entryPrice').value = '';
  document.getElementById('slPrice').value = '';
  document.getElementById('tpPrice').value = '';
  document.getElementById('calcResult').classList.remove('show');
  document.getElementById('riskAmount').textContent = '—';
  document.getElementById('slPips').textContent = '—';
  document.getElementById('tpPips').textContent = '—';
  document.getElementById('lotSize').textContent = '—';
  document.getElementById('potProfit').textContent = '—';
  document.getElementById('rrRatio').textContent = '—';
  document.getElementById('rrBar').style.width = '0%';
  const verdict = document.getElementById('rrVerdict');
  verdict.className = 'rr-verdict';
  verdict.textContent = '';
}

// V13: setInstrument sudah include clearCalculator langsung (tidak perlu override)

function loadFromURL() {
  const p = new URLSearchParams(location.search);
  if (!p.has('inst') && !p.has('entry')) return;

  const key = p.get('inst');
  if (key && instruments[key]) {
    const btn = [...document.querySelectorAll('.inst-btn')].find(b => b.getAttribute('onclick')?.includes(`'${key}'`));
    if (btn) setInstrument(key, btn); // V13: pakai setInstrument langsung
  }
  if (p.get('bal'))   document.getElementById('balance').value = p.get('bal');
  if (p.get('risk'))  document.getElementById('riskPct').value = p.get('risk');
  if (p.get('entry')) document.getElementById('entryPrice').value = p.get('entry');
  if (p.get('sl'))    document.getElementById('slPrice').value = p.get('sl');
  if (p.get('tp'))    document.getElementById('tpPrice').value = p.get('tp');
  if (p.get('pip'))   document.getElementById('pipValue').value = p.get('pip');

  if (p.get('entry') && p.get('sl') && p.get('tp')) {
    setTimeout(() => {
      showTab('calculator', document.querySelector('.nav-tab:nth-child(11)'));
      calculate();
    }, 150);
  }
}

// ── EXPORT CHECKLIST PDF (DIPERBAIKI) ─────────────────────────────
function exportChecklist() {
  const items = document.querySelectorAll('.check-item');
  const total = items.length;
  const done = document.querySelectorAll('.check-item.checked').length;
  const date = new Date();
  const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const pct = Math.round((done / total) * 100);

  let rows = '';
  items.forEach(item => {
    const checked = item.classList.contains('checked');
    const text = item.querySelector('.check-text')?.innerText || '';
    const note = item.querySelector('.check-note')?.innerText || '';
    const critical = item.classList.contains('check-critical');
    rows += `<tr style="background:${checked ? '#f0f0f0' : 'transparent'}">
      <td style="padding:8px 12px;border-bottom:1px solid #ddd;width:28px;text-align:center;font-size:16px;">${checked ? '✓' : '☐'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ddd;">
        <span style="color:${checked ? '#888' : (critical ? '#B8860B' : '#111')};${checked ? 'text-decoration:line-through;' : ''}">${text}</span>
        ${note ? `<div style="font-size:11px;color:#666;margin-top:3px;">${note}</div>` : ''}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #ddd;width:80px;text-align:center;">${critical ? '<span style="background:#f0e6d2;color:#B8860B;font-size:10px;padding:2px 6px;border-radius:2px;">KRITIS</span>' : ''}</td>
    </tr>`;
  });

  const badgeHtml = done === total
    ? '<span style="background:#2ECC71;color:white;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;">✓ LENGKAP — Siap Eksekusi</span>'
    : pct >= 70
      ? '<span style="background:#C9A84C;color:#111;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;">⚡ Sebagian Besar Terpenuhi</span>'
      : '<span style="background:#E74C3C;color:white;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:bold;">⚠ Perlu Review Ulang</span>';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ICT Checklist Export</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#fff; color:#111; font-family:'Courier New',monospace; padding:40px; max-width:900px; margin:0 auto; line-height:1.5; }
  h1 { font-size:28px; letter-spacing:4px; color:#C9A84C; border-bottom:2px solid #C9A84C; display:inline-block; padding-bottom:4px; margin-bottom:4px; }
  .sub { font-size:12px; color:#555; letter-spacing:2px; text-transform:uppercase; margin:8px 0 24px; }
  .meta-info { background:#f5f5f5; padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; }
  .progress-section { background:#f9f9f9; padding:12px 16px; border-radius:6px; margin-bottom:24px; border:1px solid #eee; }
  .progress-bar-bg { background:#e0e0e0; height:8px; border-radius:4px; overflow:hidden; margin-top:8px; }
  .progress-bar-fill { background:#C9A84C; width:${pct}%; height:100%; border-radius:4px; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; padding:10px 12px; background:#f0f0f0; font-size:11px; letter-spacing:1px; text-transform:uppercase; border-bottom:1px solid #ddd; }
  .footer { margin-top:32px; font-size:11px; color:#888; border-top:1px solid #ddd; padding-top:16px; text-align:center; }
  @media print {
    body { padding:20px; }
    .meta-info, .progress-bar-fill, .badge-complete, .badge-partial {
      -webkit-print-color-adjust:exact; print-color-adjust:exact;
    }
  }
</style>
</head><body>
  <h1>ICT TRADE CHECKLIST</h1>
  <div class="sub">ICT Forge — 8AM Strategy &amp; Universal Confluence</div>
  <div class="meta-info">
    <span>📅 ${formattedDate}</span>
    <span>⏰ ${formattedTime}</span>
    <span>📋 ${done}/${total} item terpenuhi (${pct}%)</span>
    <span>${badgeHtml}</span>
  </div>
  <div class="progress-section">
    <div style="font-size:12px;font-weight:bold;">Progress Checklist: ${done}/${total} (${pct}%)</div>
    <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
  </div>
  <table>
    <thead><tr><th style="width:40px;"></th><th>Item Checklist</th><th style="width:80px;">Prioritas</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <strong>ICT FORGE — TRADE CHECKLIST</strong><br>
    Generated from ICT Forge v1.0 · ${formattedDate} ${formattedTime}<br>
    Pastikan semua item kritis (KRITIS) tercentang sebelum mengeksekusi trade.
  </div>
</body></html>`;

  // V13: Ganti document.write() dengan Blob URL (tidak deprecated)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) { alert('Pop-up diblokir browser. Izinkan pop-up untuk domain ini.'); URL.revokeObjectURL(url); return; }
  // Cleanup URL setelah window terbuka
  setTimeout(() => { URL.revokeObjectURL(url); win.print(); }, 600);
}

// ── DARK/LIGHT MODE ───────────────────────────────────────────────
// ── BACK TO TOP ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.style.opacity = window.scrollY > 300 ? '1' : '0';
});

// ── GLOSSARY TOOLTIPS (V13: cegah nested replacement) ────────────
function initTooltips() {
  const glossaryTerms = {
    'FVG': 'Fair Value Gap — celah harga yang ditinggalkan oleh displacement candle',
    'OB': 'Order Block — candle terakhir berlawanan sebelum displacement impulsif',
    'BOS': 'Break of Structure — konfirmasi trend berlanjut saat HH/LL baru ditembus',
    'CHoCH': 'Change of Character — sinyal awal perubahan trend, belum konfirmasi reversal',
    'MSS': 'Market Structure Shift — konfirmasi reversal dengan displacement candle',
    'AMD': 'Accumulation-Manipulation-Distribution — tiga fase siklus harian institusional',
    'HTF': 'Higher Time Frame — timeframe lebih besar (Daily, Weekly, Monthly)',
    'LTF': 'Lower Time Frame — timeframe lebih kecil (5M, 15M, 1H untuk eksekusi)',
    'PDH': 'Previous Day High — high hari sebelumnya, level likuiditas utama',
    'PDL': 'Previous Day Low — low hari sebelumnya, level likuiditas utama',
    'SMT': 'Smart Money Technique — divergence antara dua instrumen terkorelasi',
    'OTE': 'Optimal Trade Entry — zona Fibonacci 62%–79% untuk entry presisi',
    'IPDA': 'Interbank Price Delivery Algorithm — konsep algoritma pengiriman harga antarbank',
    'SSL': 'Sell Side Liquidity — stop loss buyer yang terkumpul di bawah swing lows',
    'BSL': 'Buy Side Liquidity — stop loss seller yang terkumpul di atas swing highs',
    'MMXM': 'Market Maker Model — pola 4 fase: konsolidasi, false break, retrace, distribusi',
    'EQL': 'Equal Lows — dua atau lebih low yang berada di level yang sama, target likuiditas',
    'EQH': 'Equal Highs — dua atau lebih high di level yang sama, target likuiditas'
  };

  document.querySelectorAll('.card p, .card ul li, .tl-content p, .step-text').forEach(el => {
    // V13: skip jika elemen sudah mengandung glossary-term (cegah double wrap)
    if (el.querySelector('.glossary-term')) return;
    let html = el.innerHTML;
    Object.entries(glossaryTerms).forEach(([term, def]) => {
      // Skip jika term sudah di dalam tag HTML atau sudah dibungkus glossary-term
      const re = new RegExp(`\\b(${term})\\b(?![^<]*>)(?![^<]*glossary)`, 'g');
      const safedef = escapeHtml(def);
      html = html.replace(re, `<span class="glossary-term" tabindex="0" aria-label="${safedef}">$1<span class="glossary-tip">${safedef}</span></span>`);
    });
    el.innerHTML = html;
  });
}

// ── EXPORT COT RESULTS TO PDF ─────────────────────────────────────
function exportCOTResults() {
  const resultsDiv = document.getElementById('cotResults');
  if (!resultsDiv || !resultsDiv.innerHTML.trim() || resultsDiv.innerHTML.includes('Tidak ada instrumen')) {
    showToast('⚠️ Tidak ada hasil COT untuk diekspor');
    return;
  }

  const date = new Date();
  const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const clone = resultsDiv.cloneNode(true);
  clone.querySelectorAll('button, .action-btn, .calc-btn').forEach(el => el.remove());

  const cards = clone.querySelectorAll('.cot-result-card');
  let cardsHtml = '';
  cards.forEach(card => { cardsHtml += card.outerHTML; });

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>COT Analysis Report</title>
<style>
  body { background: #0A0A0B; color: #E8E6DF; font-family: monospace; padding: 40px; max-width: 1000px; margin: 0 auto; }
  h1 { color: #C9A84C; border-bottom: 2px solid #C9A84C; display: inline-block; }
  .meta-info { background: #18181D; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; border: 1px solid rgba(201,168,76,0.3); }
  .cot-result-card { background: #111114; border: 1px solid rgba(201,168,76,0.2); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .cot-instr-title { color: #F0D07A; border-bottom: 1px solid rgba(201,168,76,0.3); padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; }
  .sentiment-bullish { background: rgba(46,204,113,0.2); color: #2ECC71; border: 1px solid #2ECC71; display: inline-block; padding: 4px 12px; border-radius: 20px; }
  .sentiment-bearish { background: rgba(231,76,60,0.2); color: #E74C3C; border: 1px solid #E74C3C; display: inline-block; padding: 4px 12px; border-radius: 20px; }
  .cot-net-bar { height: 24px; background: #222228; border-radius: 4px; overflow: hidden; margin: 12px 0; }
  .cot-net-fill-long { background: #2ECC71; height: 100%; float: left; }
  .cot-net-fill-short { background: #E74C3C; height: 100%; float: right; }
  .footer { margin-top: 32px; font-size: 11px; color: #5A5856; border-top: 1px solid rgba(201,168,76,0.3); padding-top: 16px; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head><body>
  <h1>COT REPORT ANALYSIS</h1>
  <div class="meta-info">
    <span>📅 ${formattedDate}</span>
    <span>⏰ ${formattedTime}</span>
    <span>📊 ${cards.length} Instrumen</span>
    <span>🔬 Rizky Saputra · ICT SMC Researcher</span>
  </div>
  ${cardsHtml}
  <div class="footer">
    Report by Rizky Saputra · ICT Masterclass<br>
    Data Source: CFTC Commitment of Traders Report
  </div>
</body></html>`;

  // V13: Blob URL, bukan document.write()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) { alert('Pop-up diblokir browser. Izinkan pop-up.'); URL.revokeObjectURL(url); return; }
  setTimeout(() => { URL.revokeObjectURL(url); win.print(); }, 600);
}

// ==================== TRADING JOURNAL (localStorage) ====================
let journalEntries = [];

function loadJournal() {
  journalEntries = safeJSONParse(localStorage.getItem('ict-journal'), []);
  renderJournal();
}

function saveJournal() {
  localStorage.setItem('ict-journal', JSON.stringify(journalEntries));
  renderJournal();
}


// ── renderJournal, addJournalEntry, drawEquityCurve ───────────────
// OVERRIDDEN by journal-enhanced.js (v2.0)
// Stub functions below kept for backward compatibility ONLY — 
// they will be replaced at runtime by journal-enhanced.js definitions.

function renderJournal() {
  const tbody = document.getElementById('journalBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const stats = { total:0, wins:0, totalRR:0, pfNum:0, pfDen:0 };
  journalEntries.slice().reverse().forEach((entry, idx) => {
    const originalIdx = journalEntries.length - 1 - idx;
    const row = tbody.insertRow();
    const date = new Date(entry.date).toLocaleDateString('id-ID');
    const sideIcon = entry.side === 'long' ? '📈' : '📉';
    const resultClass = entry.result === 'win' ? 'style="color:var(--green);"' : entry.result === 'loss' ? 'style="color:var(--red);"' : '';
    const resultText = entry.result === 'win' ? '✅ WIN' : entry.result === 'loss' ? '❌ LOSS' : '⏳ Pending';
    const tagsHtml = (entry.tags||[]).length ? (entry.tags||[]).map(t=>`<span class="mistake-badge ${t==='PERFECT'?'perfect':''}">${t}</span>`).join(' ') : '';
    row.innerHTML = `
      <td style="font-size:11px;">${escapeHtml(date)}</td>
      <td><strong>${escapeHtml(String(entry.symbol).toUpperCase())}</strong></td>
      <td>${sideIcon} ${escapeHtml(String(entry.side).toUpperCase())}</td>
      <td>${escapeHtml(String(entry.entry))}</td>
      <td>${escapeHtml(String(entry.sl))}</td>
      <td>${escapeHtml(String(entry.tp))}</td>
      <td>1:${escapeHtml(String(entry.rr))}</td>
      <td ${resultClass}>${resultText}</td>
      <td>${tagsHtml}</td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(entry.note||'-')}</td>
      <td><button class="action-btn" onclick="deleteJournalEntry(${originalIdx})" style="padding:4px 8px;font-size:10px;">🗑</button></td>`;
    stats.total++;
    if (entry.result === 'win') stats.wins++;
    if (entry.result === 'win' || entry.result === 'loss') {
      stats.totalRR += entry.rr;
      if (entry.result === 'win') stats.pfNum += entry.rr;
      else stats.pfDen += entry.rr;
    }
  });
  const winRate = stats.total > 0 ? ((stats.wins/stats.total)*100).toFixed(1) : 0;
  const avgRR = stats.total > 0 ? (stats.totalRR/stats.total).toFixed(2) : 0;
  const pf = stats.pfDen > 0 ? (stats.pfNum/stats.pfDen).toFixed(2) : stats.pfNum > 0 ? '∞' : '0';
  ['statTotal','statWinRate','statProfitFactor','statAvgRR'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = [stats.total, winRate+'%', pf, avgRR][i];
  });
  requestAnimationFrame(drawEquityCurve);
  if (typeof renderMistakeTagSummary === 'function') renderMistakeTagSummary();
}

function addJournalEntry() {
  const symbol = document.getElementById('journalSymbol')?.value.trim();
  const side = document.getElementById('journalSide')?.value;
  const entry = parseFloat(document.getElementById('journalEntry')?.value);
  const sl = parseFloat(document.getElementById('journalSL')?.value);
  const tp = parseFloat(document.getElementById('journalTP')?.value);
  const rr = parseFloat(document.getElementById('journalRr')?.value);
  const result = document.getElementById('journalResult')?.value;
  const note = document.getElementById('journalNote')?.value.trim();
  if (!symbol) { showToast('⚠️ Isi Symbol terlebih dahulu'); return; }
  if (isNaN(entry) || isNaN(sl) || isNaN(tp)) { showToast('⚠️ Isi Entry, SL, TP dengan angka valid'); return; }
  if (isNaN(rr) || rr <= 0) { showToast('⚠️ Isi R:R dengan angka positif'); return; }
  const tags = typeof getSelectedMistakeTags === 'function' ? getSelectedMistakeTags() : [];
  const screenshots = typeof _pendingScreenshots !== 'undefined' ? _pendingScreenshots.map(s => s.dataUrl) : [];
  journalEntries.unshift({ date: new Date().toISOString(), symbol, side, entry, sl, tp, rr, result, note: note||'', tags, screenshots });
  saveJournal();
  ['journalSymbol','journalEntry','journalSL','journalTP','journalRr','journalNote'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  if (document.getElementById('journalResult')) document.getElementById('journalResult').value = 'pending';
  if (typeof clearMistakeTags === 'function') clearMistakeTags();
  if (typeof _pendingScreenshots !== 'undefined') { _pendingScreenshots = []; }
  if (typeof renderScreenshotPreviews === 'function') renderScreenshotPreviews();
  showToast('✅ Trade berhasil ditambahkan!');
}

function deleteJournalEntry(index) {
  journalEntries.splice(index, 1);
  saveJournal();
}

function clearJournal() {
  if (confirm('Hapus SEMUA data trading journal? Tindakan ini tidak bisa dibatalkan.')) {
    journalEntries = [];
    saveJournal();
  }
}

function exportJournalCSV() {
  if (journalEntries.length === 0) { showToast('⚠️ Tidak ada data journal untuk diekspor'); return; }
  // V13: Proper CSV escaping — wrap field dalam tanda kutip, escape internal quotes
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  let csv = 'Tanggal,Symbol,Side,Entry,SL,TP,R:R,Result,Catatan\n';
  journalEntries.forEach(e => {
    csv += [
      csvEscape(new Date(e.date).toLocaleDateString('id-ID')),
      csvEscape(e.symbol),
      csvEscape(e.side),
      csvEscape(e.entry),
      csvEscape(e.sl),
      csvEscape(e.tp),
      csvEscape(e.rr),
      csvEscape(e.result),
      csvEscape(e.note)
    ].join(',') + '\n';
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM untuk Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ict_journal_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJournalPDF() {
  const tbody = document.getElementById('journalBody');
  if (!tbody || tbody.children.length === 0) {
    showToast('⚠️ Tidak ada data journal untuk diekspor');
    return;
  }

  const date = new Date();
  const formattedDate = date.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  const formattedTime = date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  const stats = {
    total:        document.getElementById('statTotal')?.textContent        || '0',
    winRate:      document.getElementById('statWinRate')?.textContent      || '0%',
    profitFactor: document.getElementById('statProfitFactor')?.textContent || '0',
    avgRR:        document.getElementById('statAvgRR')?.textContent        || '0'
  };

  let rows = '';
  for (let i = 0; i < tbody.children.length; i++) {
    const row = tbody.children[i];
    const cells = row.querySelectorAll('td');
    if (cells.length >= 9) {
      const result = cells[7].textContent.trim();
      const isWin  = result.toUpperCase().includes('WIN') || result.toUpperCase().includes('TP');
      rows += `<tr style="background:${isWin ? 'rgba(46,204,113,0.07)' : 'rgba(231,76,60,0.07)'};">
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);font-size:12px;">${cells[0].textContent}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);"><strong style="color:#F0D07A;">${cells[1].textContent}</strong></td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);color:${cells[2].textContent.toUpperCase().includes('BUY')?'#2ECC71':'#E74C3C'};">${cells[2].textContent}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);">${cells[3].textContent}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);">${cells[4].textContent}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);">${cells[5].textContent}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);"><strong>${cells[6].textContent}</strong></td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);"><strong style="color:${isWin?'#2ECC71':'#E74C3C'};">${result}</strong></td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(201,168,76,0.15);font-size:11px;color:#9A9890;">${cells[8].textContent}</td>
      </tr>`;
    }
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>ICT Trading Journal Export</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0A0B; color:#E8E6DF; font-family:'Courier New',monospace; padding:40px; max-width:1200px; margin:0 auto; }
  h1 { color:#C9A84C; letter-spacing:4px; border-bottom:2px solid #C9A84C; display:inline-block; padding-bottom:4px; margin-bottom:6px; font-size:26px; }
  .sub { font-size:12px; color:#5A5856; letter-spacing:2px; text-transform:uppercase; margin-bottom:20px; }
  .meta { background:#111114; padding:12px 16px; border-radius:6px; margin-bottom:16px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; border:1px solid rgba(201,168,76,0.3); font-size:13px; }
  .stats { background:#18181D; padding:14px 16px; border-radius:6px; margin-bottom:20px; display:flex; gap:24px; flex-wrap:wrap; border:1px solid rgba(201,168,76,0.2); }
  .stat-item { font-size:13px; }
  .stat-item strong { color:#C9A84C; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; padding:10px; background:#222228; color:#C9A84C; border-bottom:1px solid rgba(201,168,76,0.5); font-size:11px; letter-spacing:1px; text-transform:uppercase; }
  .footer { margin-top:28px; font-size:11px; color:#5A5856; border-top:1px solid rgba(201,168,76,0.2); padding-top:14px; text-align:center; line-height:1.8; }
  .watermark { color:#8A6E30; font-size:10px; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head><body>
  <h1>ICT TRADING JOURNAL</h1>
  <div class="sub">ICT Masterclass — Personal Trade Log</div>
  <div class="meta">
    <span>📅 ${formattedDate}</span>
    <span>⏰ ${formattedTime}</span>
    <span>🔬 Rizky Saputra · ICT SMC Researcher</span>
  </div>
  <div class="stats">
    <div class="stat-item">📊 Total Trades: <strong>${stats.total}</strong></div>
    <div class="stat-item">✅ Win Rate: <strong>${stats.winRate}</strong></div>
    <div class="stat-item">💰 Profit Factor: <strong>${stats.profitFactor}</strong></div>
    <div class="stat-item">📈 Avg R:R: <strong>${stats.avgRR}</strong></div>
  </div>
  <table>
    <thead><tr>
      <th>Tanggal</th><th>Symbol</th><th>Side</th><th>Entry</th>
      <th>SL</th><th>TP</th><th>R:R</th><th>Result</th><th>Catatan</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <strong style="color:#C9A84C;">ICT FORGE — TRADING JOURNAL</strong><br>
    Generated by ICT Forge v1.0 · ${formattedDate} ${formattedTime}<br>
    <span class="watermark">© Rizky Saputra · ICT Forge v1.0 · Data disimpan secara lokal di browser Anda</span>
  </div>
</body></html>`;

  // V13: Blob URL, bukan document.write()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) { alert('Pop-up diblokir browser. Izinkan pop-up untuk domain ini.'); URL.revokeObjectURL(url); return; }
  setTimeout(() => { URL.revokeObjectURL(url); win.print(); }, 600);
}

// ── BACKUP JOURNAL → JSON ──────────────────────────────────────────
function backupJournal() {
  if (journalEntries.length === 0) {
    showToast('⚠️ Tidak ada data untuk dibackup');
    return;
  }
  const payload = {
    version:   '1.0',
    app:       'ICT Forge',
    exported:  new Date().toISOString(),
    count:     journalEntries.length,
    entries:   journalEntries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ICT_Journal_Backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Backup berhasil — ' + journalEntries.length + ' trade disimpan!');
}

// ── RESTORE JOURNAL ← JSON ─────────────────────────────────────────
function restoreJournal(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let data = JSON.parse(e.target.result);
      // Support both raw array dan format {entries:[...]}
      if (data && data.entries && Array.isArray(data.entries)) data = data.entries;
      if (!Array.isArray(data)) throw new Error('Format tidak valid');
      if (data.length === 0) { showToast('⚠️ File backup kosong'); return; }

      const action = confirm(
        `📂 Ditemukan ${data.length} trade di file backup.\n\n` +
        `✅ OK     → Gabungkan dengan data yang ada (${journalEntries.length} trade)\n` +
        `❌ Cancel → Timpa semua data lama dengan data backup ini`
      );
      if (action) {
        // Merge — deduplikasi berdasarkan date+symbol+entry
        const existingKeys = new Set(journalEntries.map(j => j.date + j.symbol + j.entry));
        const newEntries   = data.filter(j => !existingKeys.has(j.date + j.symbol + j.entry));
        journalEntries = [...journalEntries, ...newEntries];
        showToast('✅ Merge selesai — ' + newEntries.length + ' trade baru ditambahkan!');
      } else {
        journalEntries = data;
        showToast('✅ Restore selesai — ' + data.length + ' trade dipulihkan!');
      }
      saveJournal();
    } catch (err) {
      showToast('❌ Gagal restore: file rusak atau format salah');
    }
  };
  reader.readAsText(file);
  input.value = ''; // reset agar bisa upload file sama lagi
}

// ── EQUITY CURVE CHART (Canvas API) ───────────────────────────────

// drawEquityCurve — delegates to journal-enhanced.js helper
function drawEquityCurve() {
  if (typeof drawEquityCurveOnCanvas === 'function') {
    drawEquityCurveOnCanvas(document.getElementById('equityCanvas'), 160);
  }
}

// ── DAILY BIAS NOTE (autosave) ─────────────────────────────────────
function initDailyBiasNote() {
  const el      = document.getElementById('dailyBiasNote');
  const savedEl = document.getElementById('dailyNoteSaved');
  if (!el) return;
  el.value = localStorage.getItem('ict-daily-note') || '';
  let saveTimer;
  el.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem('ict-daily-note', el.value);
      // Tampilkan indikator "Tersimpan" lalu fade out
      if (savedEl) {
        savedEl.style.opacity = '1';
        setTimeout(() => { savedEl.style.opacity = '0'; }, 1500);
      }
    }, 400);
  });
}


// ==================== ECONOMIC CALENDAR (Static Data) ====================
const economicEvents = [
  { time: '08:30 NY', currency: 'USD', event: 'Non-Farm Payrolls (NFP)', impact: 'high', day: 'Jumat pertama setiap bulan' },
  { time: '08:30 NY', currency: 'USD', event: 'CPI (Consumer Price Index)', impact: 'high', day: 'Bulanan (pertengahan bulan)' },
  { time: '14:00 NY', currency: 'USD', event: 'FOMC Rate Decision', impact: 'high', day: '8x/tahun' },
  { time: '08:30 NY', currency: 'USD', event: 'Initial Jobless Claims', impact: 'high', day: 'Setiap Kamis' },
  { time: '10:00 NY', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high', day: 'Bulanan' },
  { time: '04:00 NY', currency: 'EUR', event: 'German CPI / ECB Press Conference', impact: 'high', day: 'Bulanan' },
  { time: '04:30 NY', currency: 'GBP', event: 'BOE Rate Decision', impact: 'high', day: '8x/tahun' },
  { time: '19:00 NY', currency: 'JPY', event: 'Tokyo CPI / BOJ Policy', impact: 'high', day: 'Bulanan' },
  { time: '20:30 NY', currency: 'CAD', event: 'BOC Rate Decision', impact: 'high', day: '8x/tahun' },
  { time: '21:30 NY', currency: 'AUD', event: 'RBA Rate Decision', impact: 'high', day: '8x/tahun' }
];

function renderEconomicCalendar() {
  const container = document.getElementById('econEventsList');
  if (!container) return;
  container.innerHTML = economicEvents.map(e => `
    <div class="econ-event">
      <div class="econ-time">⏰ ${e.time}</div>
      <div class="econ-currency">${e.currency}</div>
      <div style="flex:1;"><strong>${e.event}</strong><br><span style="font-size:10px;color:var(--text-muted);">${e.day}</span></div>
      <div class="econ-impact ${e.impact}">🔴 HIGH IMPACT</div>
    </div>
  `).join('');
}

// ── EXTRACT COT FROM TXT (Hanya format monospace CFTC) ────────────
function extractCOTFromTXT() {
  // P1 Fix: Race condition guard — prevent concurrent parses from multiple rapid uploads
  if (_cotParsing) {
    showToast('⚠️ Parsing COT sedang berjalan, harap tunggu...');
    return;
  }
  const fileInput = document.getElementById('cotTxtInput');
  if (!fileInput.files || !fileInput.files[0]) {
    showToast('⚠️ Pilih file TXT terlebih dahulu');
    return;
  }

  const file = fileInput.files[0];

  if (file.size === 0) {
    showToast('❌ File kosong (0 byte). Pastikan file tidak rusak.');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast('❌ File terlalu besar (maks 20MB)');
    return;
  }

  // ── Loading UI
  const loadingEl  = document.getElementById('cotLoading');
  const resultsEl  = document.getElementById('cotResults');
  const loadTextEl = document.getElementById('cotLoadingText');
  const loadBarEl  = document.getElementById('cotLoadingBar');

  loadingEl.style.display = 'block';
  resultsEl.innerHTML = '';

  const cotSteps = [
    { pct: 10, msg: '📂 MEMBACA FILE TXT...' },
    { pct: 28, msg: '🔍 VALIDASI FORMAT COT...' },
    { pct: 48, msg: '📊 PARSING POSISI COMMERCIAL...' },
    { pct: 65, msg: '📈 PARSING NON-COMMERCIAL...' },
    { pct: 80, msg: '🧮 MENGHITUNG NET POSITION...' },
    { pct: 92, msg: '🎨 RENDER HASIL...' },
  ];
  let csi = 0;
  function advCOT() {
    if (csi < cotSteps.length) {
      const s = cotSteps[csi++];
      if (loadTextEl) loadTextEl.textContent = s.msg;
      if (loadBarEl)  loadBarEl.style.width  = s.pct + '%';
    }
  }
  advCOT();
  const cotInt = setInterval(advCOT, 220);

  const reader = new FileReader();
  reader.onload = function(e) {
    clearInterval(cotInt);
    if (loadBarEl) loadBarEl.style.width = '100%';
    if (loadTextEl) loadTextEl.textContent = '✅ SELESAI — MERENDER HASIL...';

    setTimeout(() => {
      try {
        const text = e.target.result;
        if (!text.trim()) throw new Error('File kosong atau tidak berisi teks.');
        if (!text.includes('Commitments of Traders') && !text.includes('Non-Commercial') && !text.includes('Commercial')) {
          throw new Error('File tidak mengandung data COT. Pastikan copy dari halaman CFTC Legacy Report (Long Format).');
        }
        const results = parseMonospaceTextCOT(text);
        displayCOTResults(results.data, results.totalRows);
        showToast('✅ COT data berhasil dianalisis — ' + (results.data?.length || 0) + ' instrumen ditemukan');
      } catch (err) {
        resultsEl.innerHTML = `
          <div style="background:rgba(231,76,60,0.1);padding:20px;border-radius:8px;border:1px solid rgba(231,76,60,0.3);color:var(--red);text-align:center;">
            ❌ <strong>Error:</strong> ${err.message}<br>
            <span style="font-size:12px;color:var(--text-muted);margin-top:8px;display:block;">
              Tips: Pastikan file TXT berisi laporan COT dari CFTC Legacy Report (Long Format).
            </span>
          </div>`;
        showToast('❌ Error parsing COT — ' + err.message.substring(0, 50));
      } finally {
        loadingEl.style.display = 'none';
      }
    }, 300);
  };

  reader.onerror = function() {
    clearInterval(cotInt);
    resultsEl.innerHTML = `
      <div style="background:rgba(231,76,60,0.1);padding:20px;border-radius:8px;color:var(--red);text-align:center;">
        ❌ Gagal membaca file. Pastikan file tidak rusak.
      </div>`;
    loadingEl.style.display = 'none';
    showToast('❌ Gagal membaca file');
  };

  reader.readAsText(file, 'UTF-8');
}

// ── DYNAMIC ASIA KZ UPDATE (COT-aware) ───────────────────────────
function updateAsiaKZCard() {
  const badge = document.getElementById('asia-kz-badge');
  const desc  = document.getElementById('asia-kz-desc');
  const note  = document.getElementById('asia-kz-cot-note');
  if (!badge || !desc) return;
  const liq = checkAsiaLiquidity();
  if (liq.isLiquid) {
    badge.style.background = 'rgba(230,126,34,0.15)';
    badge.style.color = 'var(--orange)';
    badge.style.border = '1px solid rgba(230,126,34,0.3)';
    badge.textContent = '⚡ ELEVATED ACTIVITY (COT)';
    desc.textContent = 'Sesi Asia dengan aktivitas di atas rata-rata minggu ini berdasarkan data COT. Institusi menunjukkan posisi yang kuat — volatilitas Asia mungkin lebih tinggi dari biasanya.';
    if (note) { note.style.display = 'block'; note.textContent = 'Berdasarkan COT: ' + liq.reason; }
  } else {
    badge.style.background = 'rgba(91,155,213,0.15)';
    badge.style.color = 'var(--blue)';
    badge.style.border = '1px solid rgba(91,155,213,0.3)';
    badge.textContent = 'ACCUMULATION PHASE';
    desc.textContent = 'Pembentukan range harian (Asian Range). ICT menyebut fase ini sebagai Accumulation. Sering membentuk high/low yang nantinya di-sweep saat London open.';
    if (note) note.style.display = 'none';
  }
}

// ── INIT ──────────────────────────────────────────────────────────
// setInstrument butuh DOM dari tab Calculator yang lazy-loaded.
// Dipanggil di sini hanya jika elemen sudah ada (non-lazy fallback).
// Untuk lazy-load, dipanggil oleh _onTabLoaded('calculator') di index.html.
if (document.getElementById('instrName')) {
  setInstrument('forex', document.querySelector('.inst-btn.active'));
}
document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
const firstTab = document.getElementById('tab-foundational');
if (firstTab) firstTab.classList.add('active');

loadChecklist();
loadFromURL();
loadJournal();
renderEconomicCalendar();
renderEventCountdownGrid();
initTooltips();
setTimeout(updateAsiaKZCard, 500);

// ══════════════════════════════════════════════════════════════════
// V14.1.2 — SIDEBAR, MODALS, LANGUAGE, TOAST
// ══════════════════════════════════════════════════════════════════

// ── TRANSLATIONS ─────────────────────────────────────────────────

// ── SIDEBAR TOGGLE ────────────────────────────────────────────────
// (deklarasi dipindah ke atas file — lihat bagian awal main.js)


function toggleSidebar() {
  _sidebarOpen = !_sidebarOpen;
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (_sidebarOpen) {
    sb.classList.add('open');
    if (!_isDesktop()) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.add('sidebar-open-desktop');
    }
  } else {
    sb.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    document.body.classList.remove('sidebar-open-desktop');
  }
}

// Auto-open on desktop
if (_isDesktop()) {
  _sidebarOpen = true;
  document.getElementById('sidebar').classList.add('open');
  document.body.classList.add('sidebar-open-desktop');
}

window.addEventListener('resize', () => {
  if (_isDesktop() && _sidebarOpen) {
    document.getElementById('sidebar-overlay').classList.remove('show');
    document.body.style.overflow = '';
    document.body.classList.add('sidebar-open-desktop');
  } else if (!_isDesktop()) {
    document.body.classList.remove('sidebar-open-desktop');
  }
});

// ── MODAL SYSTEM ──────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  document.body.style.overflow = 'hidden';
  // Populate special modals
  if (id === 'modalFAQ') renderFAQ();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  // Only restore scroll if no other modals are open
  if (!document.querySelector('.modal-overlay.show')) {
    document.body.style.overflow = '';
  }
}

function closeModalOutside(event, id) {
  if (event.target.id === id) closeModal(id);
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    if (!document.querySelector('.modal-overlay.show')) document.body.style.overflow = '';
  }
});

// ── TOAST NOTIFICATION ────────────────────────────────────────────
function showToast(msg, duration) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.remove('show'), duration || 2800);
}

// ── QUICK TRADE SAVE ──────────────────────────────────────────────
function quickTradeSave() {
  const symbol = document.getElementById('qt-symbol')?.value.trim();
  const side   = document.getElementById('qt-side')?.value;
  const entry  = parseFloat(document.getElementById('qt-entry')?.value);
  const sl     = parseFloat(document.getElementById('qt-sl')?.value);
  const tp     = parseFloat(document.getElementById('qt-tp')?.value);
  const rr     = parseFloat(document.getElementById('qt-rr')?.value);
  const result = document.getElementById('qt-result')?.value;
  const note   = document.getElementById('qt-note')?.value.trim() || '';

  if (!symbol || isNaN(entry) || isNaN(sl) || isNaN(tp) || isNaN(rr) || rr <= 0) {
    showToast('❌ Isi semua field wajib');
    return;
  }

  journalEntries.unshift({
    date: new Date().toISOString(),
    symbol, side, entry, sl, tp, rr, result, note
  });
  saveJournal();

  // Clear form
  ['qt-symbol','qt-entry','qt-sl','qt-tp','qt-rr','qt-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const qtResult = document.getElementById('qt-result');
  if (qtResult) qtResult.value = 'pending';

  closeModal('modalQuickTrade');
  showToast('✅ Trade tersimpan!');
}

// ── DAILY BIAS HELPER (ICT Forge v1.0 — COT-aware + Multi-instrument) ───
// Stored COT data keyed by instrument
let _cotBiasData = {};

function getCOTStoredData(instrument) {
  try {
    const stored = localStorage.getItem('ict-cot-bias-' + instrument);
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  return null;
}

function saveCOTBiasData(instrument, data) {
  try {
    localStorage.setItem('ict-cot-bias-' + instrument, JSON.stringify(data));
  } catch(e) {}
}

// When COT results are displayed, auto-save bias data
function extractAndSaveCOTBias(resultsData) {
  if (!resultsData || !Array.isArray(resultsData)) return;
  resultsData.forEach(r => {
    if (!r.data) return;
    const d = r.data;
    const isBullish = d.netCommercial > 0;
    const absNet = Math.abs(d.netCommercial);
    const strength = absNet > 100000 ? 4 : absNet > 50000 ? 3 : absNet > 20000 ? 2 : 1;
    saveCOTBiasData(r.symbol.toLowerCase().replace(/[^a-z0-9]/g,''), {
      symbol: r.symbol,
      isBullish,
      netCommercial: d.netCommercial,
      strength,
      date: d.date,
      savedAt: Date.now()
    });
  });
}

function showDailyBiasModal() {
  openModal('modalDailyBias');
  renderDailyBiasContent();
}

function renderDailyBiasContent(selectedInstrument) {
  const container = document.getElementById('biasContent');
  if (!container) return;

  const ny = getNYTime(new Date());
  const marketOpenNow = isMarketOpen(ny);
  let activeSession = null;
  if (marketOpenNow) {
    for (const s of sessions) {
      if (inSession(ny.h, ny.m, s)) { activeSession = s; break; }
    }
  }
  const newsProx = checkNewsProximity(ny);
  
  // Instrument options
  const instruments_bias = [
    { key:'nq',     label:'NQ (Nasdaq-100)',  cotKeys:['nq','nasdaq'] },
    { key:'es',     label:'ES (S&P 500)',      cotKeys:['es','sp500','s&p'] },
    { key:'eurusd', label:'EUR/USD',           cotKeys:['eurusd','eur'] },
    { key:'gbpusd', label:'GBP/USD',           cotKeys:['gbpusd','gbp'] },
    { key:'usdjpy', label:'USD/JPY',           cotKeys:['usdjpy','jpy'] },
    { key:'audusd', label:'AUD/USD',           cotKeys:['audusd','aud'] },
    { key:'gold',   label:'XAUUSD (Gold)',     cotKeys:['gold','xauusd'] },
    { key:'crude',  label:'Crude Oil (CL)',    cotKeys:['crude','cl','oil'] },
  ];

  const selKey = selectedInstrument || localStorage.getItem('ict-bias-instrument') || 'nq';
  if (selectedInstrument) localStorage.setItem('ict-bias-instrument', selectedInstrument);

  // Instrument selector HTML
  const instrSelector = `<div style="margin-bottom:14px;">
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:8px;">Pilih Instrumen</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${instruments_bias.map(i => `<button onclick="renderDailyBiasContent('${i.key}')" style="padding:5px 10px;border-radius:4px;border:1px solid ${i.key===selKey?'var(--gold)':'var(--border)'};background:${i.key===selKey?'rgba(201,168,76,0.15)':'var(--dark4)'};color:${i.key===selKey?'var(--gold)':'var(--text-muted)'};font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;transition:all 0.15s;">${i.label}</button>`).join('')}
    </div>
  </div>`;

  // Find COT data for selected instrument
  const instCfg = instruments_bias.find(i => i.key === selKey);
  let cotData = null;
  if (instCfg) {
    for (const k of instCfg.cotKeys) {
      const d = getCOTStoredData(k);
      if (d) { cotData = d; break; }
    }
    // Also check localStorage directly with display name
    if (!cotData) {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('ict-cot-bias-'));
      for (const lk of allKeys) {
        try {
          const d = JSON.parse(localStorage.getItem(lk));
          if (d && instCfg.cotKeys.some(ck => lk.includes(ck))) { cotData = d; break; }
        } catch(e) {}
      }
    }
  }

  // COT data age warning
  let cotAgeHTML = '';
  let cotBiasInfo = '';
  if (cotData) {
    const ageMs = Date.now() - (cotData.savedAt || 0);
    const ageDays = Math.floor(ageMs / 86400000);
    const ageColor = ageDays > 7 ? 'var(--orange)' : ageDays > 3 ? 'var(--gold)' : 'var(--green)';
    const strengthBars = '█'.repeat(cotData.strength) + '░'.repeat(4 - cotData.strength);
    cotAgeHTML = `<div style="background:var(--dark4);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:'DM Mono',monospace;font-size:11px;">
      <span style="color:var(--gold-dim);">COT DATA:</span>
      <span style="color:${cotData.isBullish?'var(--green)':'var(--red)'};margin-left:8px;font-weight:600;">${cotData.isBullish?'NET LONG ▲':'NET SHORT ▼'}</span>
      <span style="color:${ageColor};margin-left:8px;">${ageDays > 0 ? ageDays+'d lalu' : 'hari ini'}</span>
      <span style="color:var(--gold);margin-left:8px;" title="Kekuatan posisi Commercial">${strengthBars}</span>
      <span style="color:var(--text-muted);font-size:10px;margin-left:8px;">${cotData.date || ''}</span>
    </div>`;
    cotBiasInfo = cotData.isBullish ? 'BULLISH' : 'BEARISH';
  } else {
    cotAgeHTML = `<div style="background:rgba(230,126,34,0.08);border:1px solid rgba(230,126,34,0.3);border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--orange);">
      ⚠️ Data COT belum tersedia untuk <strong>${instCfg?.label||selKey}</strong>.<br>
      <span style="font-size:11px;color:var(--text-muted);">Upload laporan COT di tab <strong style="color:var(--gold)">COT Analyzer</strong> agar bias akurat. Saat ini bias hanya berdasarkan sesi & waktu.</span>
    </div>`;
  }

  // ── SMART BIAS ALGORITHM ──────────────────────────────────────────
  // Based on: Market open status + Session + News proximity + COT data + Day of week
  let biasType, biasClass, emoji, reason, recText, confidence;

  const nyDow = ny.dayOfWeek; // 0=Sun,1=Mon,...5=Fri,6=Sat
  const nyMin = ny.h * 60 + ny.m;

  if (!marketOpenNow) {
    biasType = 'TUNGGU'; biasClass = 'wait'; emoji = '⏳';
    const secOpen = secToNextMarketOpen(ny);
    const bh = Math.floor(secOpen/3600), bm = Math.floor((secOpen%3600)/60);
    reason = 'Market tutup. Buka Minggu 18:00 NY / Senin 05:00 WIB (' + pad(bh) + ':' + pad(bm) + ' lagi).';
    recText = '📋 Review chart HTF & persiapkan rencana trading mingguan.';
    confidence = 0;
  } else if (newsProx.isNear) {
    biasType = 'HINDARI'; biasClass = 'wait'; emoji = '⚠️';
    reason = newsProx.eventName + (newsProx.minLeft > 0 ? ` dalam ${newsProx.minLeft} menit` : ' baru dirilis') + ' — Volatilitas tinggi.';
    recText = '⏳ Tunggu 10–15 menit setelah rilis news sebelum entry.';
    confidence = 0;
  } else if (!activeSession || activeSession.name === 'ASIA SESSION') {
    // Asia session — use COT to determine if Asia is liquid this week
    // COT data dapat mengubah dinamika: jika net position sangat kuat, Asia bisa lebih aktif
    const asiaLiquid = cotData && cotData.strength >= 3 && (Math.abs(cotData.netCommercial||0) > 80000);
    if (!activeSession) {
      biasType = 'TUNGGU'; biasClass = 'wait'; emoji = '🕐';
      reason = 'Di luar semua Kill Zone. Tunggu London KZ (03:00 NY / 10:00 WIB) atau NY KZ (08:30 NY / 15:30 WIB).';
      recText = '🚫 Tidak ada setup ICT valid di luar Kill Zone.';
      confidence = 0;
    } else if (asiaLiquid) {
      // COT shows very strong positioning — Asia might be active
      biasType = cotBiasInfo || 'WASPADA'; biasClass = cotData?.isBullish ? 'bullish' : 'bearish'; emoji = '🌙';
      reason = `Asia Session aktif. COT menunjukkan posisi Commercial sangat kuat (${cotData.strength}/4 bintang) — volatilitas Asia di atas rata-rata minggu ini.`;
      recText = `⚠️ Setup berisiko tinggi. Jika ada konfirmasi HTF ${cotData.isBullish?'bullish':'bearish'}, bisa pertimbangkan setup konservatif.`;
      confidence = 35;
    } else {
      biasType = 'ILLIQUID'; biasClass = 'wait'; emoji = '🌙';
      reason = 'Asia Session — Volume rendah, spread lebar. COT tidak menunjukkan aktivitas institusi yang menonjol di sesi ini.';
      recText = '🚫 Hindari trading. Tunggu London Kill Zone (10:00 WIB).';
      confidence = 0;
    }
  } else {
    // Active Kill Zone — use COT + session + day for smart bias
    const isMonday = nyDow === 1;
    const isFriday = nyDow === 5;
    const isNYKZ = activeSession.name === 'NEW YORK KZ';
    const isLondonKZ = activeSession.name === 'LONDON KZ';

    if (cotData) {
      // We have COT — use it as primary bias
      const cotBull = cotData.isBullish;
      // Friday near close — institutions may square positions
      if (isFriday && nyMin >= 14*60) {
        biasType = 'WASPADA'; biasClass = 'wait'; emoji = '⚠️';
        reason = `Jumat sore — Institusi cenderung menutup posisi menjelang weekend. COT: ${cotBull?'NET LONG':'NET SHORT'} untuk ${instCfg?.label}.`;
        recText = '⚠️ Trade ukuran kecil saja jika ada setup. Waspadai reversal tiba-tiba.';
        confidence = 40;
      } else if (isMonday && nyMin < 12*60) {
        // Monday opening — continuation of COT bias likely
        biasType = cotBull ? 'BULLISH' : 'BEARISH';
        biasClass = cotBull ? 'bullish' : 'bearish';
        emoji = cotBull ? '📈' : '📉';
        reason = `Senin ${isLondonKZ?'London KZ':'NY KZ'} — Awal pekan, institusi biasanya melanjutkan posisi COT. Commercial: ${cotBull?'NET LONG ▲':'NET SHORT ▼'} (${cotData.strength}/4 ⭐).`;
        recText = `✅ Cari setup ${cotBull?'BUY di Discount Zone':'SELL di Premium Zone'} + konfirmasi MSS/FVG di LTF.`;
        confidence = 65 + (cotData.strength * 5);
      } else {
        biasType = cotBull ? 'BULLISH' : 'BEARISH';
        biasClass = cotBull ? 'bullish' : 'bearish';
        emoji = cotBull ? '📈' : '📉';
        const sesName = isLondonKZ ? 'London Kill Zone' : 'NY Kill Zone';
        reason = `${sesName} aktif. COT Commercial: ${cotBull?'NET LONG':'NET SHORT'} — Smart Money bias ${cotBull?'Bullish':'Bearish'} untuk ${instCfg?.label} (${cotData.strength}/4 ⭐).`;
        recText = `✅ Prioritaskan setup ${cotBull?'BUY':'SELL'} searah COT. Konfirmasi dengan: AMD Cycle + PD Array HTF + MSS LTF.`;
        confidence = 55 + (cotData.strength * 8);
      }
    } else {
      // No COT — use session + day algorithm
      const midWeek = nyDow >= 2 && nyDow <= 4;
      if (isLondonKZ) {
        biasType = 'PERHATIKAN'; biasClass = 'wait'; emoji = '👀';
        reason = `London KZ aktif. Tanpa data COT, bias tidak bisa dikonfirmasi. Upload COT untuk akurasi lebih baik.`;
        recText = '📊 Identifikasi PDH/PDL, cari sweep + MSS. Tanpa COT, gunakan struktur HTF sebagai panduan.';
        confidence = 30;
      } else {
        biasType = 'PERHATIKAN'; biasClass = 'wait'; emoji = '👀';
        reason = 'NY KZ aktif. Data COT belum diupload — bias berdasarkan sesi saja.';
        recText = '📊 Upload COT terbaru untuk bias akurat. Sementara itu, fokus pada struktur HTF dan AMD cycle.';
        confidence = 25;
      }
    }
  }

  // Confidence bar
  const confColor = confidence >= 70 ? 'var(--green)' : confidence >= 45 ? 'var(--gold)' : 'var(--orange)';
  const confBar = confidence > 0 ? `
    <div style="margin-top:10px;">
      <div style="display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);margin-bottom:4px;">
        <span>Confidence Bias</span><span style="color:${confColor};">${confidence}%</span>
      </div>
      <div style="height:4px;background:var(--dark4);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${confidence}%;background:${confColor};border-radius:2px;transition:width 0.4s;"></div>
      </div>
    </div>` : '';

  // Current time display
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const timeStr = `${pad(ny.h)}:${pad(ny.m)} NY · ${days[ny.dayOfWeek]} ${months[ny.month-1]} ${ny.day}`;

  // Next event countdown
  const nextNFP  = getNextEventCountdown('NFP', ny);
  const nextFOMC = getNextEventCountdown('FOMC', ny);
  const nextJobless = getNextEventCountdown('JOBLESS', ny);

  const evtRows = [
    { n: 'NFP',     c: nextNFP },
    { n: 'FOMC',    c: nextFOMC },
    { n: 'Jobless', c: nextJobless }
  ].map(e => {
    const d = e.c.days > 0 ? `${e.c.days}d ${pad(e.c.hours)}h` : `${pad(e.c.hours)}:${pad(e.c.mins)}:${pad(e.c.secs)}`;
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;font-family:'DM Mono',monospace;">
      <span style="color:var(--text-muted);">${e.n}</span>
      <span style="color:var(--gold);">${d}</span>
    </div>`;
  }).join('');

  container.innerHTML = `
    ${instrSelector}
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);text-align:center;margin-bottom:10px;">${timeStr}</div>
    ${cotAgeHTML}
    <div class="bias-result-box ${biasClass} bias-${biasClass}">
      <div class="bias-label">${emoji} ${biasType}</div>
      <div class="bias-detail">${reason}</div>
      ${confBar}
    </div>
    <div style="background:var(--dark4);border-radius:6px;padding:12px 14px;font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">${recText}</div>
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:8px;">Countdown Events</div>
    ${evtRows}
    <div style="margin-top:12px;font-size:11px;color:var(--text-muted);font-family:'DM Mono',monospace;">
      ⚠️ Bias berdasarkan waktu + data COT yang diupload. ICT Forge tidak bisa akses harga real-time — selalu konfirmasi dengan chart HTF Anda.
    </div>`;
}

// ── FAQ RENDER ────────────────────────────────────────────────────
const _faqs = [
  ['Apa itu FVG?', 'Fair Value Gap adalah celah (gap) antara 3 candle berurutan yang terbentuk akibat displacement/imbalance. Harga cenderung kembali mengisi FVG sebelum melanjutkan arah utama. ICT menyebutnya sebagai zona "discount" atau "premium" bergantung konteks.'],
  ['Apa itu Order Block?', 'Order Block adalah candle terakhir yang berlawanan arah sebelum terjadi displacement signifikan. Contoh: candle bearish terakhir sebelum rally besar ke atas = bullish OB. Ini mewakili zona order institusi yang belum tereksekusi.'],
  ['Apa itu AMD Cycle?', 'Accumulation → Manipulation → Distribution. Tiga fase pergerakan institusional dalam setiap sesi. Asia = Accumulation (range sempit), London = Manipulation (false break), New York = Distribution (trending menuju target).'],
  ['Kapan waktu terbaik trading?', 'London Kill Zone (03:00–08:30 NY) dan New York Kill Zone (08:30–16:00 NY). ICT menyebut ini sebagai "optimal trade entry" windows. Hindari trading di luar Kill Zone — noise lebih tinggi, setup kurang valid.'],
  ['Apa itu COT Report?', 'Commitment of Traders — laporan mingguan dari CFTC yang menunjukkan posisi institusi (Commercial), spekulan (Non-Commercial), dan retail. Dirilis setiap Jumat 15:30 NY untuk posisi hari Selasa. Digunakan untuk konfirmasi bias HTF.'],
  ['Cara pakai COT Analyzer?', 'Buka halaman CFTC Legacy Report di browser, copy-paste seluruh teks halaman, lalu paste ke kolom di tab COT Analyzer. Sistem akan mem-parse data dan menampilkan Net Position Commercial vs Non-Commercial untuk setiap instrumen utama.'],
];

function renderFAQ() {
  const container = document.getElementById('faqList');
  if (!container) return;
  const faqs = _faqs;

  container.innerHTML = faqs.map((item, i) => `
    <div class="faq-item" id="faq-item-${i}">
      <button class="faq-q" onclick="toggleFAQ(${i})">
        <span>${item[0]}</span>
        <span class="faq-q-arrow">▼</span>
      </button>
      <div class="faq-a">${item[1]}</div>
    </div>`).join('');
}

function toggleFAQ(idx) {
  const item = document.getElementById(`faq-item-${idx}`);
  if (!item) return;
  item.classList.toggle('open');
}

// ── NAVIGATION HELPERS ────────────────────────────────────────────
function goToTab(tabName) {
  // Find the tab button and click it
  const tabEl = document.querySelector(`.nav-tab[onclick*="showTab('${tabName}'"]`);
  if (tabEl) {
    showTab(tabName, tabEl);
    tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  // Close sidebar on mobile after navigation
  if (!_isDesktop() && _sidebarOpen) toggleSidebar();
  // Scroll to top of content
  setTimeout(() => {
    const section = document.getElementById('tab-' + tabName);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function scrollToFooter() {
  const footer = document.querySelector('.footer');
  if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  if (!_isDesktop() && _sidebarOpen) toggleSidebar();
}

// ── UPDATED TOGGLE FUNCTIONS (sidebar-aware) ──────────────────────
// Override toggleTheme to also sync sidebar toggle

// Patch: we redefine toggleTheme to keep sidebar toggle in sync
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('ict-theme', isLight ? 'light' : 'dark');
  // Sync sidebar toggle
  const sbToggle = document.getElementById('themeToggleSB');
  if (sbToggle) sbToggle.checked = isLight;
}

// Override toggleAudioAlert to sync sidebar toggle
// toggleAudioAlert removed in v14.1.5 — replaced by Browser Notifications

// ── LOAD PERSISTED STATE (v14.1.2) ────────────────────────────────
// Theme
if (localStorage.getItem('ict-theme') === 'light') {
  document.body.classList.add('light-mode');
  const sbToggle = document.getElementById('themeToggleSB');
  if (sbToggle) sbToggle.checked = true;
}

// Notification state restore (ICT Forge v1.0)
(function() {
  const savedNotif = localStorage.getItem('ict-notif');
  if (savedNotif === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    _notifEnabled = true;
  } else if (savedNotif === '1' && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    // Permission was revoked by user — reset
    localStorage.setItem('ict-notif', '0');
    _notifEnabled = false;
  }
  updateNotifUI();
})();

// COT Monday morning reminder (05:00 WIB = 22:00 NY Sunday = 23:00 UTC Sun)
function checkCOTReminder() {
  const now = new Date();
  const wibParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false
  }).formatToParts(now);
  const wDay = wibParts.find(p=>p.type==='weekday')?.value;
  const wH   = parseInt(wibParts.find(p=>p.type==='hour')?.value||'0');
  const wM   = parseInt(wibParts.find(p=>p.type==='minute')?.value||'0');
  // Monday 05:00-05:05 WIB
  if (wDay === 'Mon' && wH === 5 && wM < 5 && _notifEnabled) {
    const cotKey = 'ict-cot-reminder-' + now.toISOString().substring(0,10);
    if (!localStorage.getItem(cotKey)) {
      localStorage.setItem(cotKey, '1');
      sendSessionNotif('📊 COT Data Reminder', '📅 Pasar buka minggu ini! Input data COT terbaru di tab "COT Analyzer" agar Daily Bias Helper akurat untuk minggu ini.');
    }
  }
}
setInterval(checkCOTReminder, 60000);

// Audio
// Audio persist removed in v14.1.5


// Language

// ══════════════════════════════════════════════════════════════════════
// ⚡ PINESCRIPT v6 OFFLINE GENERATOR ENGINE — v1.0
// 100% Offline · No API · No Internet Required
// Keyword-based intelligent code assembly engine
// ══════════════════════════════════════════════════════════════════════

let _psCurrentMode = 'modify';
let _psLastCode = '';

function setPSMode(mode, btn) {
  _psCurrentMode = mode;
  document.querySelectorAll('.ps-mode-btn').forEach(b => b.classList.remove('ps-mode-active'));
  if (btn) btn.classList.add('ps-mode-active');
  document.querySelectorAll('.ps-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById('ps-panel-' + mode);
  if (panel) panel.style.display = 'block';
  clearPSOutput(true);
}

// ── PINESCRIPT v6 ERROR CHECKER ──────────────────────────────────────
function psCheckErrors(code) {
  const errors   = [];
  const warnings = [];
  const infos    = [];
  const lines    = code.split('\n');

  // ── Version check
  const verMatch = code.match(/\/\/@version=(\d+)/);
  if (!verMatch) {
    errors.push({ line: 1, msg: 'Missing version declaration — tambahkan //@version=6 di baris pertama' });
  } else if (parseInt(verMatch[1]) < 6) {
    warnings.push({ line: 1, msg: `Version //@version=${verMatch[1]} terdeteksi — disarankan upgrade ke //@version=6` });
  }

  // ── indicator() / strategy() declaration
  const hasIndicator = /\bindicator\s*\(/.test(code);
  const hasStrategy  = /\bstrategy\s*\(/.test(code);
  const hasStudy     = /\bstudy\s*\(/.test(code);
  if (!hasIndicator && !hasStrategy && !hasStudy) {
    errors.push({ line: 2, msg: 'Tidak ada deklarasi indicator() atau strategy() — wajib ada salah satu' });
  }
  if (hasStudy) {
    warnings.push({ msg: 'study() sudah deprecated di v6 — ganti dengan indicator()' });
  }

  // ── Deprecated syntax checks
  const deprecatedMap = [
    { rx: /(?<![a-zA-Z_.])sma\s*\(/g,       fix: 'ta.sma(' },
    { rx: /(?<![a-zA-Z_.])ema\s*\(/g,       fix: 'ta.ema(' },
    { rx: /(?<![a-zA-Z_.])rsi\s*\(/g,       fix: 'ta.rsi(' },
    { rx: /(?<![a-zA-Z_.])macd\s*\(/g,      fix: 'ta.macd(' },
    { rx: /(?<![a-zA-Z_.])bb\s*\(/g,        fix: 'ta.bb(' },
    { rx: /(?<![a-zA-Z_.])atr\s*\(/g,       fix: 'ta.atr(' },
    { rx: /(?<![a-zA-Z_.])crossover\s*\(/g,  fix: 'ta.crossover(' },
    { rx: /(?<![a-zA-Z_.])crossunder\s*\(/g, fix: 'ta.crossunder(' },
    { rx: /(?<![a-zA-Z_.])highest\s*\(/g,   fix: 'ta.highest(' },
    { rx: /(?<![a-zA-Z_.])lowest\s*\(/g,    fix: 'ta.lowest(' },
    { rx: /(?<![a-zA-Z_.])stoch\s*\(/g,     fix: 'ta.stoch(' },
    { rx: /(?<![a-zA-Z_.])vwap\s*\(/g,      fix: 'ta.vwap(' },
    { rx: /(?<![a-zA-Z_.])pivothigh\s*\(/g, fix: 'ta.pivothigh(' },
    { rx: /(?<![a-zA-Z_.])pivotlow\s*\(/g,  fix: 'ta.pivotlow(' },
  ];
  deprecatedMap.forEach(({ rx, fix }) => {
    lines.forEach((ln, i) => {
      if (rx.test(ln) && !ln.trim().startsWith('//')) {
        warnings.push({ line: i + 1, msg: `Baris ${i+1}: Gunakan ${fix} bukan fungsi tanpa prefix ta.` });
      }
      rx.lastIndex = 0;
    });
  });

  // ── security() deprecated
  lines.forEach((ln, i) => {
    if (/(?<![a-zA-Z_.])security\s*\(/.test(ln) && !ln.trim().startsWith('//')) {
      warnings.push({ line: i+1, msg: `Baris ${i+1}: security() sudah deprecated — gunakan request.security()` });
    }
  });

  // ── na comparison old style
  lines.forEach((ln, i) => {
    if (/\w+\s*==\s*na\b/.test(ln) && !ln.trim().startsWith('//')) {
      warnings.push({ line: i+1, msg: `Baris ${i+1}: '== na' sudah deprecated — gunakan na(variable)` });
    }
    if (/\w+\s*!=\s*na\b/.test(ln) && !ln.trim().startsWith('//')) {
      warnings.push({ line: i+1, msg: `Baris ${i+1}: '!= na' sudah deprecated — gunakan not na(variable)` });
    }
  });

  // ── input() old style
  lines.forEach((ln, i) => {
    if (/(?<![a-zA-Z_.])input\s*\(/.test(ln) && !/input\.(int|float|bool|string|source|color|timeframe|symbol|session|text_area|price|time_range|enum)\s*\(/.test(ln) && !ln.trim().startsWith('//')) {
      warnings.push({ line: i+1, msg: `Baris ${i+1}: input() lama — gunakan input.int(), input.float(), input.bool(), dll sesuai tipe data` });
    }
  });

  // ── Unmatched brackets check
  const openParen  = (code.match(/\(/g) || []).length;
  const closeParen = (code.match(/\)/g) || []).length;
  if (openParen !== closeParen) {
    errors.push({ msg: `Bracket tidak seimbang: ${openParen} '(' vs ${closeParen} ')' — periksa tanda kurung` });
  }
  const openBracket  = (code.match(/\[/g) || []).length;
  const closeBracket = (code.match(/\]/g) || []).length;
  if (openBracket !== closeBracket) {
    errors.push({ msg: `Square bracket tidak seimbang: ${openBracket} '[' vs ${closeBracket} ']'` });
  }

  // ── Missing plots / strategy entries
  if (hasIndicator && !hasStrategy) {
    const hasPlot = /\bplot\s*\(|\bplotshape\s*\(|\bbgcolor\s*\(|\blabel\.new\s*\(|\bbox\.new\s*\(|\bline\.new\s*\(/.test(code);
    if (!hasPlot) {
      warnings.push({ msg: 'Tidak ada plot(), plotshape(), atau visual output lainnya — indikator tidak akan menampilkan apapun di chart' });
    }
  }
  if (hasStrategy) {
    const hasEntry = /strategy\.entry\s*\(/.test(code);
    const hasClose = /strategy\.close\s*\(/.test(code);
    if (!hasEntry) {
      warnings.push({ msg: 'Strategy tidak memiliki strategy.entry() — tidak ada order yang akan dieksekusi' });
    }
    if (!hasClose && hasEntry) {
      infos.push({ msg: 'Tidak ada strategy.close() — posisi hanya akan ditutup oleh strategy.entry() berlawanan atau expired' });
    }
  }

  // ── barstate.isconfirmed vs isrealtime
  if (/barstate\.islast\b/.test(code) && /barstate\.isrealtime\b/.test(code)) {
    infos.push({ msg: 'Menggunakan barstate.islast dan isrealtime bersamaan — pastikan logika tidak bertentangan' });
  }

  // ── request.security lookahead
  if (/lookahead\s*=\s*barmerge\.lookahead_on/.test(code)) {
    warnings.push({ msg: 'barmerge.lookahead_on terdeteksi — hati-hati: ini dapat menyebabkan repainting pada live trading' });
  }

  // ── max_bars_back needed
  if (/\[\d{3,}\]/.test(code)) {
    warnings.push({ msg: 'Ditemukan akses bar index besar (mis: [500]) — mungkin perlu max_bars_back() atau max_bars_back parameter di indicator()' });
  }

  // ── Summary
  infos.push({ msg: `Total baris: ${lines.length} | Total karakter: ${code.length}` });
  if (errors.length === 0 && warnings.length === 0) {
    infos.push({ msg: '✅ Tidak ada error atau warning serius yang terdeteksi secara statis' });
  }

  return { errors, warnings, infos };
}

function renderCheckerResult(result) {
  const { errors, warnings, infos } = result;
  let html = '';

  if (errors.length > 0) {
    html += `<div style="margin-bottom:14px;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--red);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <span style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);padding:2px 8px;border-radius:3px;">❌ ${errors.length} ERROR</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${errors.map(e => `<div style="background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.25);border-radius:4px;padding:10px 14px;font-family:'DM Mono',monospace;font-size:12px;color:#ff8080;">${e.line ? `[L${e.line}] ` : ''}${escapeHtml(e.msg)}</div>`).join('')}
      </div>
    </div>`;
  }

  if (warnings.length > 0) {
    html += `<div style="margin-bottom:14px;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--orange);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <span style="background:rgba(230,126,34,0.15);border:1px solid rgba(230,126,34,0.4);padding:2px 8px;border-radius:3px;">⚠️ ${warnings.length} WARNING</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${warnings.map(w => `<div style="background:rgba(230,126,34,0.07);border:1px solid rgba(230,126,34,0.2);border-radius:4px;padding:10px 14px;font-family:'DM Mono',monospace;font-size:12px;color:#ffa060;">${w.line ? `[L${w.line}] ` : ''}${escapeHtml(w.msg)}</div>`).join('')}
      </div>
    </div>`;
  }

  if (infos.length > 0) {
    html += `<div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--cyan);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <span style="background:rgba(26,188,156,0.12);border:1px solid rgba(26,188,156,0.3);padding:2px 8px;border-radius:3px;">ℹ️ ${infos.length} INFO</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${infos.map(i => `<div style="background:rgba(26,188,156,0.06);border:1px solid rgba(26,188,156,0.15);border-radius:4px;padding:10px 14px;font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim);">${escapeHtml(i.msg)}</div>`).join('')}
      </div>
    </div>`;
  }

  return html;
}

// ── KEYWORD DETECTOR ─────────────────────────────────────────────────
function psDetect(text) {
  const t = text.toLowerCase();
  return {
    // Concepts
    ema:        /\bema\b|exponential moving avg/i.test(t),
    sma:        /\bsma\b|simple moving avg/i.test(t),
    rsi:        /\brsi\b|relative strength/i.test(t),
    macd:       /\bmacd\b/i.test(t),
    bb:         /bollinger|band/i.test(t),
    atr:        /\batr\b|average true range/i.test(t),
    vwap:       /\bvwap\b/i.test(t),
    stoch:      /stoch/i.test(t),
    ob:         /order.?block|ob\b/i.test(t),
    fvg:        /fvg|fair.?value.?gap/i.test(t),
    bos:        /\bbos\b|break.?of.?structure/i.test(t),
    choch:      /choch|change.?of.?character/i.test(t),
    mss:        /\bmss\b|market.?structure.?shift/i.test(t),
    liq:        /liquidit|sweep|bsl|ssl/i.test(t),
    kz:         /kill.?zone|london|new.?york|tokyo|session/i.test(t),
    amd:        /\bamd\b|accumulation|manipulation|distribution/i.test(t),
    fib:        /fib|fibonacci|retracement/i.test(t),
    sr:         /support|resistance|\bs.?r\b/i.test(t),
    pivot:      /pivot/i.test(t),
    volume:     /volume/i.test(t),
    candle:     /candle|doji|engulf|hammer|pin.?bar/i.test(t),
    trend:      /trend|uptrend|downtrend/i.test(t),
    divergence: /divergence|divergen/i.test(t),
    // Actions
    alert:      /alert|notif/i.test(t),
    strategy:   /strateg|backtest|entry|exit|long|short|position/i.test(t),
    table:      /tabel|table|dashboard|panel/i.test(t),
    label:      /label|text|teks/i.test(t),
    box:        /box|kotak|rect/i.test(t),
    line:       /\bline\b|garis/i.test(t),
    color:      /color|warna|hijau|merah|green|red/i.test(t),
    htf:        /htf|higher.?time|multi.?time/i.test(t),
    tp:         /\btp\b|take.?profit/i.test(t),
    sl:         /\bsl\b|stop.?loss/i.test(t),
    rr:         /\brr\b|risk.?reward/i.test(t),
  };
}

// ── BLOCK LIBRARY ─────────────────────────────────────────────────────
const PSB = {

header(title, type, overlay) {
  const ov = overlay ? 'true' : 'false';
  if (type === 'strategy') {
    return `//@version=6
// ─────────────────────────────────────────────────
// ${title}
// Generated by ICT Forge v2.0 PineScript Engine
// ⚠ Review and test before live trading
// ─────────────────────────────────────────────────
strategy("${title}", overlay=${ov}, default_qty_type=strategy.percent_of_equity, default_qty_value=1)
`;
  }
  return `//@version=6
// ─────────────────────────────────────────────────
// ${title}
// Generated by ICT Forge v2.0 PineScript Engine
// ⚠ Review and test before live trading
// ─────────────────────────────────────────────────
indicator("${title}", overlay=${ov}, max_boxes_count=500, max_labels_count=500, max_lines_count=500)
`;
},

inputs: {
  ema: `
// ── EMA Inputs ──────────────────────────────────
emaLen1  = input.int(20,  "EMA Fast Length",  minval=1)
emaLen2  = input.int(50,  "EMA Slow Length",  minval=1)
emaLen3  = input.int(200, "EMA Trend Length", minval=1)
emaSource = input.source(close, "EMA Source")`,

  sma: `
// ── SMA Inputs ──────────────────────────────────
smaLen1  = input.int(20,  "SMA Fast Length", minval=1)
smaLen2  = input.int(50,  "SMA Slow Length", minval=1)
smaSource = input.source(close, "SMA Source")`,

  rsi: `
// ── RSI Inputs ───────────────────────────────────
rsiLen  = input.int(14,  "RSI Length",      minval=2)
rsiOB   = input.int(70,  "RSI Overbought",  minval=50, maxval=100)
rsiOS   = input.int(30,  "RSI Oversold",    minval=0,  maxval=50)
rsiSrc  = input.source(close, "RSI Source")`,

  macd: `
// ── MACD Inputs ──────────────────────────────────
macdFast   = input.int(12, "MACD Fast",   minval=1)
macdSlow   = input.int(26, "MACD Slow",   minval=1)
macdSignal = input.int(9,  "MACD Signal", minval=1)`,

  bb: `
// ── Bollinger Bands Inputs ───────────────────────
bbLen  = input.int(20,  "BB Length", minval=1)
bbMult = input.float(2.0,"BB StdDev", minval=0.1, step=0.1)`,

  atr: `
// ── ATR Inputs ───────────────────────────────────
atrLen = input.int(14, "ATR Length", minval=1)`,

  ob: `
// ── Order Block Inputs ───────────────────────────
obLookback    = input.int(5,   "OB Lookback Bars",  minval=1, maxval=50)
obShowBull    = input.bool(true, "Show Bullish OB")
obShowBear    = input.bool(true, "Show Bearish OB")
obBullColor   = input.color(color.new(color.green, 80),  "Bull OB Color")
obBearColor   = input.color(color.new(color.red,   80),  "Bear OB Color")`,

  fvg: `
// ── FVG Inputs ───────────────────────────────────
fvgShow    = input.bool(true, "Show FVG")
fvgBullCol = input.color(color.new(color.teal,  80), "Bull FVG Color")
fvgBearCol = input.color(color.new(color.orange,80), "Bear FVG Color")`,

  sl_tp: `
// ── Risk Management Inputs ───────────────────────
rrRatio   = input.float(2.0, "Risk:Reward Ratio", minval=0.1, step=0.1)
riskPct   = input.float(1.0, "Risk % of Account",  minval=0.1, step=0.1)
atrSlMult = input.float(1.5, "ATR SL Multiplier",  minval=0.1, step=0.1)`,

  kz: `
// ── Kill Zone Inputs ─────────────────────────────
// All times in NY timezone (UTC-4 / UTC-5)
londonKZ_Sess  = input.string("0300-0830", "London Kill Zone (HHMM-HHMM)")
nyKZ_Sess      = input.string("0830-1100", "NY Kill Zone (HHMM-HHMM)")
asiaKZ_Sess    = input.string("1900-0000", "Asia Session (HHMM-HHMM)")`,

  htf: `
// ── HTF Inputs ───────────────────────────────────
htfTF = input.timeframe("D", "Higher Timeframe")`,
},

calcs: {
  ema: `
// ── EMA Calculations ─────────────────────────────
ema1 = ta.ema(emaSource, emaLen1)
ema2 = ta.ema(emaSource, emaLen2)
ema3 = ta.ema(emaSource, emaLen3)
emaBullAlign = ema1 > ema2 and ema2 > ema3
emaBearAlign = ema1 < ema2 and ema2 < ema3`,

  sma: `
// ── SMA Calculations ─────────────────────────────
sma1 = ta.sma(smaSource, smaLen1)
sma2 = ta.sma(smaSource, smaLen2)
smaCross_Bull = ta.crossover(sma1,  sma2)
smaCross_Bear = ta.crossunder(sma1, sma2)`,

  rsi: `
// ── RSI Calculations ─────────────────────────────
rsiVal   = ta.rsi(rsiSrc, rsiLen)
rsiOBzon = rsiVal >= rsiOB
rsiOSzon = rsiVal <= rsiOS
rsiBull  = ta.crossover(rsiVal,  rsiOS)
rsiBear  = ta.crossunder(rsiVal, rsiOB)`,

  macd: `
// ── MACD Calculations ────────────────────────────
[macdLine, signalLine, histLine] = ta.macd(close, macdFast, macdSlow, macdSignal)
macdBull = ta.crossover(macdLine,  signalLine)
macdBear = ta.crossunder(macdLine, signalLine)
macdBullMom = macdLine > signalLine
macdBearMom = macdLine < signalLine`,

  bb: `
// ── Bollinger Bands Calculations ─────────────────
[bbMid, bbUpper, bbLower] = ta.bb(close, bbLen, bbMult)
bbSqueeze = (bbUpper - bbLower) / bbMid < 0.02
bbBullBounce = low <= bbLower and close > bbLower
bbBearBounce = high >= bbUpper and close < bbUpper`,

  atr: `
// ── ATR Calculation ──────────────────────────────
atrVal = ta.atr(atrLen)`,

  ob: `
// ── Order Block Detection ────────────────────────
// Bullish OB: last bearish candle before bullish displacement
var float obBullTop   = na
var float obBullBot   = na
var float obBearTop   = na
var float obBearBot   = na
var box   obBullBox   = na
var box   obBearBox   = na

// Displacement detection (strong momentum candle)
bullDisplace = close > high[1] and (close - open) > ta.atr(14) * 0.7
bearDisplace = close < low[1]  and (open - close) > ta.atr(14) * 0.7

// Identify last opposing candle before displacement
if bullDisplace and obShowBull
    for i = 1 to obLookback
        if close[i] < open[i]  // bearish candle = potential bull OB
            obBullTop := high[i]
            obBullBot := low[i]
            if not na(obBullBox)
                box.delete(obBullBox)
            obBullBox := box.new(bar_index[i], obBullTop, bar_index, obBullBot,
                         border_color=color.green, bgcolor=obBullColor,
                         border_width=1, extend=extend.right)
            break

if bearDisplace and obShowBear
    for i = 1 to obLookback
        if close[i] > open[i]  // bullish candle = potential bear OB
            obBearTop := high[i]
            obBearBot := low[i]
            if not na(obBearBox)
                box.delete(obBearBox)
            obBearBox := box.new(bar_index[i], obBearTop, bar_index, obBearBot,
                         border_color=color.red, bgcolor=obBearColor,
                         border_width=1, extend=extend.right)
            break

// OB Mitigation signal
obBullMitig = not na(obBullTop) and close >= obBullBot and close <= obBullTop
obBearMitig = not na(obBearTop) and close >= obBearBot and close <= obBearTop`,

  fvg: `
// ── Fair Value Gap (FVG) Detection ───────────────
// Bullish FVG: candle[2].high < candle[0].low (gap between c2 and c0)
bullFVG = fvgShow and low  > high[2] and (open[1] < close[1])  // displacement middle candle
bearFVG = fvgShow and high < low[2]  and (open[1] > close[1])

var box fvgBullBox = na
var box fvgBearBox = na

if bullFVG
    if not na(fvgBullBox)
        box.delete(fvgBullBox)
    fvgBullBox := box.new(bar_index[2], low, bar_index, high[2],
                  bgcolor=fvgBullCol, border_color=color.new(color.teal,60),
                  extend=extend.right)

if bearFVG
    if not na(fvgBearBox)
        box.delete(fvgBearBox)
    fvgBearBox := box.new(bar_index[2], high, bar_index, low[2],
                  bgcolor=fvgBearCol, border_color=color.new(color.orange,60),
                  extend=extend.right)`,

  bos: `
// ── BOS / CHoCH Detection ────────────────────────
swingLen = 5
swingHigh = ta.pivothigh(high, swingLen, swingLen)
swingLow  = ta.pivotlow(low,   swingLen, swingLen)

var float lastSwingHigh = na
var float lastSwingLow  = na

if not na(swingHigh)
    lastSwingHigh := swingHigh
if not na(swingLow)
    lastSwingLow  := swingLow

// BOS: price breaks structure with close beyond last swing
bosBull = not na(lastSwingHigh) and close > lastSwingHigh and close[1] <= lastSwingHigh
bosBear = not na(lastSwingLow)  and close < lastSwingLow  and close[1] >= lastSwingLow`,

  liq: `
// ── Liquidity Sweep Detection ─────────────────────
swingHighLiq = ta.pivothigh(high, 10, 10)
swingLowLiq  = ta.pivotlow(low,   10, 10)

var float lastHighLiq = na
var float lastLowLiq  = na
if not na(swingHighLiq)
    lastHighLiq := swingHighLiq
if not na(swingLowLiq)
    lastLowLiq  := swingLowLiq

// BSL Sweep: price wicks above swing high then closes below
bslSweep = not na(lastHighLiq) and high > lastHighLiq and close < lastHighLiq
// SSL Sweep: price wicks below swing low then closes above
sslSweep = not na(lastLowLiq)  and low  < lastLowLiq  and close > lastLowLiq`,

  kz: `
// ── Kill Zone Sessions ────────────────────────────
inLondonKZ = not na(time(timeframe.period, londonKZ_Sess, "America/New_York"))
inNYKZ     = not na(time(timeframe.period, nyKZ_Sess,     "America/New_York"))
inAsiaKZ   = not na(time(timeframe.period, asiaKZ_Sess,   "America/New_York"))
inAnyKZ    = inLondonKZ or inNYKZ`,

  vwap: `
// ── VWAP Calculation ─────────────────────────────
vwapVal = ta.vwap(hlc3)
aboveVWAP = close > vwapVal
belowVWAP = close < vwapVal`,

  fib: `
// ── Fibonacci Levels ─────────────────────────────
fibLen = input.int(50, "Fibonacci Lookback", minval=10)
fibHigh = ta.highest(high, fibLen)
fibLow  = ta.lowest(low,   fibLen)
fibRange = fibHigh - fibLow
fib236 = fibHigh - fibRange * 0.236
fib382 = fibHigh - fibRange * 0.382
fib500 = fibHigh - fibRange * 0.500
fib618 = fibHigh - fibRange * 0.618
fib786 = fibHigh - fibRange * 0.786`,

  htf: `
// ── Higher Timeframe Data ─────────────────────────
htfClose  = request.security(syminfo.tickerid, htfTF, close)
htfHigh   = request.security(syminfo.tickerid, htfTF, high)
htfLow    = request.security(syminfo.tickerid, htfTF, low)
htfBias   = request.security(syminfo.tickerid, htfTF, close > open)`,
},

plots: {
  ema: `
// ── EMA Plots ────────────────────────────────────
plot(ema1, "EMA Fast",  color=color.new(color.yellow, 0),  linewidth=1)
plot(ema2, "EMA Slow",  color=color.new(color.orange, 0),  linewidth=2)
plot(ema3, "EMA Trend", color=color.new(color.white,  30), linewidth=2)`,

  sma: `
// ── SMA Plots ────────────────────────────────────
plot(sma1, "SMA Fast", color=color.new(color.aqua,  0), linewidth=1)
plot(sma2, "SMA Slow", color=color.new(color.purple,0), linewidth=2)`,

  rsi_sep: `
// ── RSI Plot (Separate pane) ──────────────────────
plot(rsiVal,   "RSI",    color=color.new(color.yellow,0), linewidth=2)
hline(rsiOB,  "OB",    color=color.new(color.red,  40), linestyle=hline.style_dashed)
hline(rsiOS,  "OS",    color=color.new(color.green,40), linestyle=hline.style_dashed)
hline(50,     "Mid",   color=color.new(color.gray,  60), linestyle=hline.style_dotted)
bgcolor(rsiOBzon ? color.new(color.red,90)   : na, title="OB Zone")
bgcolor(rsiOSzon ? color.new(color.green,90) : na, title="OS Zone")`,

  macd_sep: `
// ── MACD Plots (Separate pane) ───────────────────
plot(macdLine,   "MACD",   color=color.new(color.blue,  0), linewidth=2)
plot(signalLine, "Signal", color=color.new(color.orange,0), linewidth=1)
plot(histLine,   "Hist",   style=plot.style_histogram,
     color = histLine >= 0 ? color.new(color.green,20) : color.new(color.red,20))
hline(0, "Zero", color=color.gray)`,

  bb: `
// ── Bollinger Bands Plots ────────────────────────
bbUpperPlot = plot(bbUpper, "BB Upper", color=color.new(color.blue,40))
bbMidPlot   = plot(bbMid,   "BB Mid",   color=color.new(color.gray,40))
bbLowerPlot = plot(bbLower, "BB Lower", color=color.new(color.blue,40))
fill(bbUpperPlot, bbLowerPlot, color=color.new(color.blue, 92))`,

  vwap: `
// ── VWAP Plot ────────────────────────────────────
plot(vwapVal, "VWAP", color=color.new(color.purple,0), linewidth=2, style=plot.style_stepline)`,

  fib: `
// ── Fibonacci Plots ──────────────────────────────
plot(fib236, "Fib 23.6%", color=color.new(color.yellow,40),  linewidth=1, style=plot.style_linebr)
plot(fib382, "Fib 38.2%", color=color.new(color.orange,20),  linewidth=1, style=plot.style_linebr)
plot(fib500, "Fib 50.0%", color=color.new(color.white, 40),  linewidth=2, style=plot.style_linebr)
plot(fib618, "Fib 61.8%", color=color.new(color.green, 20),  linewidth=1, style=plot.style_linebr)
plot(fib786, "Fib 78.6%", color=color.new(color.teal,  40),  linewidth=1, style=plot.style_linebr)`,

  kz_bg: `
// ── Kill Zone Background ─────────────────────────
bgcolor(inLondonKZ ? color.new(color.blue,  92) : na, title="London KZ")
bgcolor(inNYKZ     ? color.new(color.green, 92) : na, title="NY KZ")
bgcolor(inAsiaKZ   ? color.new(color.orange,94) : na, title="Asia KZ")`,

  bos: `
// ── BOS/CHoCH Labels ─────────────────────────────
if bosBull
    label.new(bar_index, low, "BOS ▲", style=label.style_label_up,
              color=color.green, textcolor=color.white, size=size.small)
if bosBear
    label.new(bar_index, high, "BOS ▼", style=label.style_label_down,
              color=color.red, textcolor=color.white, size=size.small)`,

  liq: `
// ── Liquidity Sweep Labels ───────────────────────
if bslSweep
    label.new(bar_index, low, "BSL ⚡", style=label.style_label_up,
              color=color.new(color.green,20), textcolor=color.white, size=size.small)
if sslSweep
    label.new(bar_index, high, "SSL ⚡", style=label.style_label_down,
              color=color.new(color.red,20),   textcolor=color.white, size=size.small)`,
},

alerts: {
  ema: `
// ── EMA Alerts ───────────────────────────────────
alertcondition(ta.crossover(ema1,  ema2), "EMA Bull Cross", "EMA Fast crossed ABOVE Slow — Bullish")
alertcondition(ta.crossunder(ema1, ema2), "EMA Bear Cross", "EMA Fast crossed BELOW Slow — Bearish")`,

  rsi: `
// ── RSI Alerts ───────────────────────────────────
alertcondition(rsiBull, "RSI Oversold Cross", "RSI crossed above Oversold — Potential Long")
alertcondition(rsiBear, "RSI Overbought Cross", "RSI crossed below Overbought — Potential Short")`,

  macd: `
// ── MACD Alerts ──────────────────────────────────
alertcondition(macdBull, "MACD Bull Cross", "MACD crossed above Signal — Bullish")
alertcondition(macdBear, "MACD Bear Cross", "MACD crossed below Signal — Bearish")`,

  ob: `
// ── Order Block Alerts ───────────────────────────
alertcondition(obBullMitig, "Bull OB Mitigation", "Price entering Bullish Order Block zone")
alertcondition(obBearMitig, "Bear OB Mitigation", "Price entering Bearish Order Block zone")`,

  fvg: `
// ── FVG Alerts ───────────────────────────────────
alertcondition(bullFVG, "Bull FVG Formed", "Bullish Fair Value Gap detected")
alertcondition(bearFVG, "Bear FVG Formed", "Bearish Fair Value Gap detected")`,

  bos: `
// ── BOS Alerts ───────────────────────────────────
alertcondition(bosBull, "BOS Bullish", "Bullish Break of Structure confirmed")
alertcondition(bosBear, "BOS Bearish", "Bearish Break of Structure confirmed")`,

  liq: `
// ── Liquidity Sweep Alerts ───────────────────────
alertcondition(bslSweep, "BSL Swept", "Buy-Side Liquidity Swept — Watch for reversal")
alertcondition(sslSweep, "SSL Swept", "Sell-Side Liquidity Swept — Watch for reversal")`,
},

strategy: {
  ema_basic: `
// ── Strategy: EMA Crossover ──────────────────────
longCond  = ta.crossover(ema1,  ema2) and emaBullAlign
shortCond = ta.crossunder(ema1, ema2) and emaBearAlign

if longCond
    strategy.entry("Long",  strategy.long)
if shortCond
    strategy.entry("Short", strategy.short)

// ATR-based SL/TP
if strategy.position_size > 0
    strategy.exit("Long Exit",  "Long",  loss=atrVal*atrSlMult/syminfo.mintick,
                  profit=atrVal*atrSlMult*rrRatio/syminfo.mintick)
if strategy.position_size < 0
    strategy.exit("Short Exit", "Short", loss=atrVal*atrSlMult/syminfo.mintick,
                  profit=atrVal*atrSlMult*rrRatio/syminfo.mintick)`,

  rsi_basic: `
// ── Strategy: RSI Mean Reversion ─────────────────
longCond  = rsiBull
shortCond = rsiBear

if longCond
    strategy.entry("Long",  strategy.long)
if shortCond
    strategy.entry("Short", strategy.short)

if strategy.position_size > 0
    strategy.exit("Long Exit",  "Long",  loss=atrVal*atrSlMult/syminfo.mintick,
                  profit=atrVal*atrSlMult*rrRatio/syminfo.mintick)
if strategy.position_size < 0
    strategy.exit("Short Exit", "Short", loss=atrVal*atrSlMult/syminfo.mintick,
                  profit=atrVal*atrSlMult*rrRatio/syminfo.mintick)`,

  ob_basic: `
// ── Strategy: Order Block Entry ───────────────────
// Entry at OB mitigation with ATR-based SL/TP
if obBullMitig and strategy.position_size == 0
    slPrice = obBullBot - atrVal * atrSlMult
    tpPrice = close + (close - slPrice) * rrRatio
    strategy.entry("OB Long", strategy.long)
    strategy.exit("OB Long Exit", "OB Long", stop=slPrice, limit=tpPrice)

if obBearMitig and strategy.position_size == 0
    slPrice = obBearTop + atrVal * atrSlMult
    tpPrice = close - (slPrice - close) * rrRatio
    strategy.entry("OB Short", strategy.short)
    strategy.exit("OB Short Exit", "OB Short", stop=slPrice, limit=tpPrice)`,
}

}; // end PSB

// ── TITLE BUILDER ──────────────────────────────────────────────────────
function psBuildTitle(d, features) {
  if (!d || d.length < 3) {
    let parts = [];
    if (features.ob)  parts.push("OB");
    if (features.fvg) parts.push("FVG");
    if (features.bos) parts.push("BOS");
    if (features.rsi) parts.push("RSI");
    if (features.ema) parts.push("EMA");
    if (features.macd)parts.push("MACD");
    if (features.liq) parts.push("Liq");
    if (features.kz)  parts.push("KZ");
    return (parts.length ? parts.join("+") : "Custom") + " Indicator";
  }
  // Extract first meaningful phrase
  const clean = d.replace(/buat|buat|create|generate|indikator|indicator|script|pinescript/gi,'').trim();
  return clean.split(/[,\n.]/)[0].substring(0,40).trim() || "Custom Script";
}

// ── MAIN GENERATOR ─────────────────────────────────────────────────────
function generatePineScript() {
  const mode = _psCurrentMode;
  let output = '';
  let inputEmpty = false;

  if (mode === 'modify') {
    const code = (document.getElementById('ps-modify-code')?.value || '').trim();
    if (!code) { inputEmpty = true; }
    else output = psModify();
  } else if (mode === 'merge') {
    const c1 = (document.getElementById('ps-merge-code1')?.value || '').trim();
    const c2 = (document.getElementById('ps-merge-code2')?.value || '').trim();
    if (!c1 && !c2) { inputEmpty = true; }
    else output = psMerge();
  } else if (mode === 'convert') {
    const code = (document.getElementById('ps-convert-code')?.value || '').trim();
    if (!code) { inputEmpty = true; }
    else output = psConvert();
  }

  if (inputEmpty) {
    showToast('⚠️ Paste kode PineScript terlebih dahulu!');
    return;
  }
  if (!output) {
    showToast('⚠️ Gagal memproses — cek input kamu');
    return;
  }

  const btn      = document.getElementById('ps-generate-btn');
  const loadEl   = document.getElementById('ps-loading');
  const outWrap  = document.getElementById('ps-output-wrap');
  const statusEl = document.getElementById('ps-status-text');
  const loadText = document.getElementById('ps-loading-text');
  const loadSub  = document.getElementById('ps-loading-sub');
  const progBar  = document.getElementById('ps-progress-bar');
  const aiResultEl  = document.getElementById('ps-ai-result');
  const checkerEl   = document.getElementById('ps-checker-result');

  // ── Hide previous results, show loading
  btn.disabled = true;
  loadEl.style.display = 'block';
  outWrap.style.display = 'none';
  if (aiResultEl)  aiResultEl.style.display = 'none';
  if (checkerEl)   checkerEl.style.display  = 'none';
  if (progBar)     progBar.style.width = '0%';

  // ── Animated loading messages
  const modeSteps = {
    modify:  [
      { pct: 15, label: 'MEMBACA SCRIPT LAMA...', sub: 'Parsing version & syntax' },
      { pct: 35, label: 'MENDETEKSI DEPRECATED...', sub: 'study() → indicator() · na checks' },
      { pct: 58, label: 'MENERAPKAN MODIFIKASI...', sub: 'Applying instructions...' },
      { pct: 78, label: 'MODERNISASI SYNTAX v6...', sub: 'ta. prefix · request.security()' },
      { pct: 90, label: 'RUNNING STATIC CHECKER...', sub: 'Bracket balance · missing plots' },
      { pct: 99, label: 'FINALISASI OUTPUT...', sub: 'Formatting code...' },
    ],
    merge:   [
      { pct: 15, label: 'PARSING SCRIPT 1...', sub: 'Stripping headers...' },
      { pct: 30, label: 'PARSING SCRIPT 2...', sub: 'Extracting variables...' },
      { pct: 50, label: 'MENDETEKSI KONFLIK...', sub: 'Variable collision check' },
      { pct: 68, label: 'RENAME DUPLICATE VARS...', sub: 'Appending _b suffix...' },
      { pct: 82, label: 'MERGING LOGIC...', sub: 'Building unified header...' },
      { pct: 93, label: 'RUNNING STATIC CHECKER...', sub: 'Syntax validation...' },
    ],
    convert: [
      { pct: 12, label: 'MENDETEKSI VERSI...', sub: 'v4 / v5 detection...' },
      { pct: 30, label: 'UPGRADE //@version=6...', sub: 'study() → indicator()' },
      { pct: 50, label: 'MODERNISASI NA CHECKS...', sub: '== na → na() function' },
      { pct: 65, label: 'UPGRADE TA. PREFIX...', sub: 'sma → ta.sma · rsi → ta.rsi' },
      { pct: 80, label: 'MODERNISASI INPUT()...', sub: 'input.int / input.float / input.bool' },
      { pct: 93, label: 'RUNNING STATIC CHECKER...', sub: 'Final validation...' },
    ],
  };

  const steps = modeSteps[mode] || [{ pct: 50, label: 'MEMPROSES...', sub: '' }];
  let si = 0;
  function advanceStep() {
    if (si < steps.length) {
      const s = steps[si++];
      if (loadText) loadText.textContent = s.label;
      if (loadSub)  loadSub.textContent  = s.sub;
      if (progBar)  progBar.style.width  = s.pct + '%';
    }
  }
  advanceStep();
  const stepInterval = setInterval(() => advanceStep(), 280);

  const totalDelay = steps.length * 280 + 200;

  setTimeout(() => {
    clearInterval(stepInterval);
    if (progBar) progBar.style.width = '100%';

    // ── Store & render code
    _psLastCode = output;
    document.getElementById('ps-output-code').textContent = output;

    // ── Static Checker
    const checkerResult = psCheckErrors(output);
    if (checkerEl) {
      checkerEl.innerHTML = `<div style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:14px;">🔍 STATIC SYNTAX CHECKER</div>` + renderCheckerResult(checkerResult);
      checkerEl.style.display = 'block';
    }

    // ── Show output
    loadEl.style.display = 'none';
    outWrap.style.display = 'block';
    btn.disabled = false;

    // ── Status message
    const errCount  = checkerResult.errors.length;
    const warnCount = checkerResult.warnings.length;
    if (errCount > 0) {
      statusEl.textContent = `⚠️ ${errCount} error ditemukan`;
      statusEl.style.color = 'var(--red)';
      showToast(`⚠️ ${errCount} error terdeteksi — periksa static checker!`);
    } else if (warnCount > 0) {
      statusEl.textContent = `✅ Selesai — ${warnCount} warning`;
      statusEl.style.color = 'var(--orange)';
      showToast('✅ Diproses — ada beberapa warning');
    } else {
      statusEl.textContent = '✅ Clean — tidak ada error!';
      statusEl.style.color = 'var(--green)';
      showToast('✅ PineScript v6 berhasil diproses!');
    }

    setTimeout(() => outWrap.scrollIntoView({ behavior:'smooth', block:'start' }), 150);

    // ── Trigger Claude AI analysis (async, non-blocking)
    // AI analysis moved to AI Error Fixer tab

  }, totalDelay);
}

// ── MODE: MODIFY ───────────────────────────────────────────────────────
function psModify() {
  let code  = (document.getElementById('ps-modify-code')?.value || '').trim();
  const instr = (document.getElementById('ps-modify-instruction')?.value || '').trim();
  if (!code) return '';

  const i = instr.toLowerCase();

  // 1. Upgrade version
  code = code.replace(/\/\/@version=\d/g, '//@version=6');
  // study() → indicator()
  code = code.replace(/\bstudy\s*\(/g, 'indicator(');
  // na comparisons
  code = code.replace(/(\w+)\s*==\s*na\b/g, 'na($1)');
  code = code.replace(/(\w+)\s*!=\s*na\b/g, 'not na($1)');
  // security() - modernize
  code = code.replace(/security\s*\(/g, 'request.security(');
  // sma() → ta.sma() etc
  const taFuncs = ['sma','ema','rsi','macd','bb','atr','stoch','cci','roc',
                   'crossover','crossunder','highest','lowest','pivothigh','pivotlow'];
  taFuncs.forEach(fn => {
    const rx = new RegExp(`(?<!ta\\.)(?<!request\\.security\\(syminfo\\.tickerid,\\s*"[^"]*",\\s*)\\b${fn}\\s*\\(`, 'g');
    code = code.replace(rx, `ta.${fn}(`);
  });
  // input() → input.int() / input.float() based on context
  code = code.replace(/\binput\s*\((\d+),/g, 'input.int($1,');
  code = code.replace(/\binput\s*\((\d+\.\d+),/g, 'input.float($1,');

  // Add alert if requested
  if (i.includes('alert') && !code.includes('alertcondition')) {
    code += `\n\n// ── Added Alert ─────────────────────────────────\n// alertcondition(YOUR_CONDITION, "Alert Name", "Alert Message")\n`;
  }

  // Add version comment header
  const header = `//@version=6\n// Modified by ICT Forge v2.0 PineScript Engine\n// Changes: version upgrade, syntax modernization${instr ? ', ' + instr.substring(0,60) : ''}\n// ⚠ Review and test before live trading\n\n`;
  if (!code.startsWith('//@version=6')) {
    code = header + code.replace(/^\/\/@version=\d\n?/, '');
  }

  return code;
}

// ── MODE: MERGE ────────────────────────────────────────────────────────
function psMerge() {
  let c1   = (document.getElementById('ps-merge-code1')?.value || '').trim();
  let c2   = (document.getElementById('ps-merge-code2')?.value || '').trim();
  const note = (document.getElementById('ps-merge-note')?.value || '').trim();
  if (!c1 && !c2) return '';

  // Upgrade both
  [c1, c2] = [c1, c2].map(c => {
    c = c.replace(/\/\/@version=\d\n?/g, '');
    c = c.replace(/\bstudy\s*\(/g, 'indicator(');
    c = c.replace(/\bindicator\s*\([^)]*\)\n?/g, '');
    c = c.replace(/\bstrategy\s*\([^)]*\)\n?/g, '');
    return c.trim();
  });

  // Rename duplicate variable names in c2 — safe word-boundary regex
  const varNames1 = (c1.match(/^(?:var\s+\w+\s+)?(\w+)\s*(?::?=)/gm) || [])
    .map(v => v.replace(/^(?:var\s+\w+\s+)?/, '').split(/\s*:?=/)[0].trim())
    .filter(v => v && v.length > 1 && /^[a-zA-Z_]/.test(v));
  const uniqueVars = [...new Set(varNames1)];
  uniqueVars.forEach(v => {
    if (c2.match(new RegExp(`(?<![a-zA-Z0-9_])${v}(?![a-zA-Z0-9_])`))) {
      const rx = new RegExp(`(?<![a-zA-Z0-9_])${v}(?![a-zA-Z0-9_])`, 'g');
      c2 = c2.replace(rx, v + '_b');
    }
  });

  const title = note ? note.substring(0,40) : 'Merged Script';
  return `//@version=6
// ─────────────────────────────────────────────────
// ${title}
// Merged by ICT Forge v2.0 PineScript Engine
${note ? '// Note: ' + note + '\n' : ''}// ⚠ Review and test before live trading
// ─────────────────────────────────────────────────
indicator("${title}", overlay=true, max_boxes_count=500, max_labels_count=500)

// ════ SCRIPT 1 ═══════════════════════════════════
${c1}

// ════ SCRIPT 2 ═══════════════════════════════════
${c2}
`;
}

// ── MODE: CONVERT ──────────────────────────────────────────────────────
function psConvert() {
  let code = (document.getElementById('ps-convert-code')?.value || '').trim();
  if (!code) return '';

  // Detect original version
  const origVer = (code.match(/\/\/@version=(\d)/) || ['','?'])[1];

  // Core conversions
  code = code.replace(/\/\/@version=\d/g, '//@version=6');
  code = code.replace(/\bstudy\s*\(/g, 'indicator(');
  code = code.replace(/(\w+)\s*==\s*na\b/g, 'na($1)');
  code = code.replace(/(\w+)\s*!=\s*na\b/g, 'not na($1)');
  code = code.replace(/\bsecurity\s*\(/g, 'request.security(');

  // Add ta. prefix to built-in functions
  const taFns = ['sma','ema','rsi','macd','bb','atr','stoch','cci','roc','mom','vwap',
                 'crossover','crossunder','highest','lowest','highestbars','lowestbars',
                 'pivothigh','pivotlow','valuewhen','barssince','rising','falling'];
  taFns.forEach(fn => {
    const rx = new RegExp(`(?<![a-zA-Z_.])${fn}\\s*\\(`, 'g');
    code = code.replace(rx, `ta.${fn}(`);
  });

  // input() modernization
  code = code.replace(/\binput\.bool\b/g, 'input.bool');
  code = code.replace(/(?<!\w)input\s*\((\d+),/g, 'input.int($1,');
  code = code.replace(/(?<!\w)input\s*\((\d+\.\d+),/g, 'input.float($1,');
  code = code.replace(/(?<!\w)input\s*\("([^"]+)",/g, 'input.string("$1",');

  // color.new modernization — only wrap bare color.red/green/blue not already inside color.new()
  code = code.replace(/color\.new\s*\(\s*color\.(red|green|blue)/g, '§COLORNEW§.$1');
  code = code.replace(/(?<!§COLORNEW§\.)color\.red\b/g,    'color.new(color.red,   0)');
  code = code.replace(/(?<!§COLORNEW§\.)color\.green\b/g,  'color.new(color.green, 0)');
  code = code.replace(/(?<!§COLORNEW§\.)color\.blue\b/g,   'color.new(color.blue,  0)');
  code = code.replace(/§COLORNEW§\./g, 'color.new(color.');

  // linestyle
  code = code.replace(/line\.style_solid/g,   'line.style_solid');
  code = code.replace(/label\.style_none/g,    'label.style_none');

  // Add header
  const headerComment = `//@version=6\n// Converted from v${origVer} → v6 by ICT Forge v2.0\n// Changes: version tag, na checks, ta. prefix, security→request.security\n// ⚠ Review and test before live trading\n\n`;
  code = headerComment + code.replace(/^\/\/@version=6\n?/, '');

  return code;
}

// ── OFFLINE PS FUNCTIONS (ICT Forge v1.0) ────────────────────────

// Helper to show output in panel
function showPSPanelOutput(panelId, outputHtml) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = outputHtml;
}

function copyFromPre(preId) {
  const pre = document.getElementById(preId);
  if (!pre) return;
  const text = pre.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Kode berhasil di-copy!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Kode di-copy!');
  }
}

function outputCodeBlock(panelOutId, code, title, notes) {
  const html = `
    <div style="margin-bottom:12px;">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:8px;">✅ ${escapeHtml(title)}</div>
      ${notes ? `<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:5px;padding:10px 14px;font-size:12px;color:var(--text-dim);margin-bottom:10px;">${escapeHtml(notes)}</div>` : ''}
      <div style="position:relative;background:var(--dark4);border:1px solid var(--border);border-radius:6px;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--dark3);border-bottom:1px solid var(--border);">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);">Pine Script v6</span>
          <button onclick="copyFromPre('ps-out-${panelOutId.replace('-out','')}')" style="background:var(--gold);color:var(--dark);border:none;padding:4px 12px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-radius:3px;cursor:pointer;">📋 Copy</button>
        </div>
        <pre id="ps-out-${panelOutId.replace('-out','')}" style="padding:16px;font-family:'DM Mono',monospace;font-size:11.5px;color:var(--text-dim);overflow-x:auto;max-height:500px;overflow-y:auto;line-height:1.65;margin:0;white-space:pre;">${escapeHtml(code)}</pre>
      </div>
    </div>`;
  showPSPanelOutput(panelOutId, html);
}

// ── OFFLINE MODIFY ────────────────────────────────────────────────
function runPSModify() {
  const code  = document.getElementById('ps-modify-code')?.value.trim();
  const instr = document.getElementById('ps-modify-instr')?.value.trim();
  if (!code) { showToast('⚠️ Paste kode PineScript terlebih dahulu'); return; }

  let result = code;
  const notes = [];

  // Auto-upgrade version
  if (!/\/\/@version=6/.test(result)) {
    result = result.replace(/\/\/@version=\d+/, '//@version=6');
    if (!/\/\/@version=/.test(result)) result = '//@version=6\n' + result;
    notes.push('✓ Version di-upgrade ke //@version=6');
  }

  // study() → indicator()
  if (/study\s*\(/.test(result)) {
    result = result.replace(/study\s*\(/g, 'indicator(');
    notes.push('✓ study() → indicator()');
  }

  // ta. prefix for common functions
  const taMap = [
    [/(?<![a-zA-Z_.])sma\s*\(/g, 'ta.sma('],
    [/(?<![a-zA-Z_.])ema\s*\(/g, 'ta.ema('],
    [/(?<![a-zA-Z_.])rsi\s*\(/g, 'ta.rsi('],
    [/(?<![a-zA-Z_.])atr\s*\(/g, 'ta.atr('],
    [/(?<![a-zA-Z_.])macd\s*\(/g, 'ta.macd('],
    [/(?<![a-zA-Z_.])crossover\s*\(/g, 'ta.crossover('],
    [/(?<![a-zA-Z_.])crossunder\s*\(/g, 'ta.crossunder('],
    [/(?<![a-zA-Z_.])highest\s*\(/g, 'ta.highest('],
    [/(?<![a-zA-Z_.])lowest\s*\(/g, 'ta.lowest('],
    [/(?<![a-zA-Z_.])stoch\s*\(/g, 'ta.stoch('],
    [/(?<![a-zA-Z_.])vwap\s*\(/g, 'ta.vwap('],
    [/(?<![a-zA-Z_.])pivothigh\s*\(/g, 'ta.pivothigh('],
    [/(?<![a-zA-Z_.])pivotlow\s*\(/g, 'ta.pivotlow('],
    [/(?<![a-zA-Z_.])bb\s*\(/g, 'ta.bb('],
  ];
  taMap.forEach(([rx, fix]) => {
    const before = result;
    result = result.replace(rx, fix);
    if (result !== before) notes.push(`✓ ${fix.replace('ta.','')} → ${fix}`);
  });

  // == na → na()
  if (/\w+\s*==\s*na/.test(result)) {
    result = result.replace(/(\w+)\s*==\s*na/g, 'na($1)');
    notes.push('✓ == na → na(variable)');
  }
  if (/\w+\s*!=\s*na/.test(result)) {
    result = result.replace(/(\w+)\s*!=\s*na/g, 'not na($1)');
    notes.push('✓ != na → not na(variable)');
  }

  // security() → request.security()
  if (/(?<![a-zA-Z_.])security\s*\(/.test(result)) {
    result = result.replace(/(?<![a-zA-Z_.])security\s*\(/g, 'request.security(');
    notes.push('✓ security() → request.security()');
  }

  // Apply instruction keywords
  if (instr) {
    const instrL = instr.toLowerCase();
    if ((instrL.includes('alert') || instrL.includes('notif')) && !/alert\s*\(/.test(result)) {
      result += '\n\n// ── Alert (dari instruksi) ──────────────\nalertcondition(barstate.isconfirmed, "ICT Signal", "Signal triggered")';
      notes.push('✓ Alert condition ditambahkan');
    }
    if ((instrL.includes('bgcolor') || instrL.includes('background')) && !/bgcolor\s*\(/.test(result)) {
      result += '\n\n// ── Background Color ────────────────────\nbgcolor(barstate.isconfirmed ? color.new(color.green, 92) : na, title="Bar BG")';
      notes.push('✓ bgcolor() ditambahkan');
    }
  }

  // Run static checker
  const check = psCheckErrors(result);
  const errCount = check.errors.length;
  const warnCount = check.warnings.length;
  const statusNote = errCount > 0 ? `⚠️ ${errCount} error, ${warnCount} warning ditemukan — lihat detail checker` :
                     warnCount > 0 ? `✅ 0 error, ${warnCount} warning ringan` : '✅ Tidak ada error terdeteksi';
  notes.push(statusNote);

  const notesHtml = notes.map(n => `<span style="display:block;font-size:12px;color:var(--text-dim);">• ${n}</span>`).join('');
  const checkerHtml = renderCheckerResult(check);
  const outHtml = `
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:10px;">✅ MODIFIKASI SELESAI (OFFLINE)</div>
    <div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:5px;padding:12px 14px;margin-bottom:12px;">${notesHtml}</div>
    <div style="position:relative;background:var(--dark4);border:1px solid var(--border);border-radius:6px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--dark3);border-bottom:1px solid var(--border);">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);">Pine Script v6 · Modified</span>
        <button onclick="copyFromPre('ps-out-modify')" style="background:var(--gold);color:var(--dark);border:none;padding:4px 12px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-radius:3px;cursor:pointer;">📋 Copy</button>
      </div>
      <pre id="ps-out-modify" style="padding:16px;font-family:'DM Mono',monospace;font-size:11.5px;color:var(--text-dim);overflow-x:auto;max-height:500px;overflow-y:auto;line-height:1.65;margin:0;white-space:pre;"></pre>
    </div>
    ${checkerHtml ? `<div style="margin-top:16px;"><div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:10px;">🔍 STATIC CHECKER</div>${checkerHtml}</div>` : ''}
  `;
  showPSPanelOutput('ps-modify-out', outHtml);
  const pre = document.getElementById('ps-out-modify');
  if (pre) pre.textContent = result;
  showToast('✅ Modifikasi offline selesai!');
}

// ── OFFLINE MERGE ─────────────────────────────────────────────────
function runPSMerge() {
  const codeA = document.getElementById('ps-merge-a')?.value.trim();
  const codeB = document.getElementById('ps-merge-b')?.value.trim();
  if (!codeA || !codeB) { showToast('⚠️ Isi kedua textarea terlebih dahulu'); return; }

  const linesA = codeA.split('\n');
  const linesB = codeB.split('\n');

  // Collect inputs from both scripts
  const inputsA = linesA.filter(l => /^\s*\w+\s*=\s*input\./.test(l));
  const inputsB = linesB.filter(l => /^\s*\w+\s*=\s*input\./.test(l));
  const nonInputA = linesA.filter(l => !/^\s*\w+\s*=\s*input\./.test(l) && !/\/\/@version/.test(l) && !/(indicator|strategy|study)\s*\(/.test(l));
  const nonInputB = linesB.filter(l => !/^\s*\w+\s*=\s*input\./.test(l) && !/\/\/@version/.test(l) && !/(indicator|strategy|study)\s*\(/.test(l));

  // Deduplicate variable names from script B that clash with A
  const varNamesA = new Set(inputsA.map(l => l.match(/^\s*(\w+)\s*=/)?.[1]).filter(Boolean));
  const deduped = inputsB.map(l => {
    const varName = l.match(/^\s*(\w+)\s*=/)?.[1];
    if (varName && varNamesA.has(varName)) {
      return l.replace(/^\s*(\w+)(\s*=)/, (m,v,e) => v + '_b' + e);
    }
    return l;
  });

  const merged = `//@version=6
// ─────────────────────────────────────────────────
// Merged Script — ICT Forge v1.0 Merge Engine
// Script A + Script B combined
// ─────────────────────────────────────────────────
indicator("Merged Script", overlay=true)

// ── Inputs from Script A ──────────────────────────
${inputsA.join('\n')}

// ── Inputs from Script B (deduped) ───────────────
${deduped.join('\n')}

// ── Logic from Script A ──────────────────────────
${nonInputA.join('\n')}

// ── Logic from Script B ──────────────────────────
${nonInputB.join('\n')}`;

  const check = psCheckErrors(merged);
  const checkerHtml = renderCheckerResult(check);
  const outHtml = `
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:10px;">✅ MERGE SELESAI (OFFLINE)</div>
    <div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:5px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--text-dim);">
      • ${inputsA.length} inputs dari Script A<br>
      • ${inputsB.length} inputs dari Script B (${deduped.filter((l,i)=>l!==inputsB[i]).length} variabel di-rename untuk menghindari konflik)<br>
      • Total logika: ${nonInputA.length + nonInputB.length} baris<br>
      ⚠️ Review manual disarankan — terutama untuk logika yang bergantung satu sama lain.
    </div>
    <div style="position:relative;background:var(--dark4);border:1px solid var(--border);border-radius:6px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--dark3);border-bottom:1px solid var(--border);">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);">Pine Script v6 · Merged</span>
        <button onclick="copyFromPre('ps-out-merge')" style="background:var(--gold);color:var(--dark);border:none;padding:4px 12px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-radius:3px;cursor:pointer;">📋 Copy</button>
      </div>
      <pre id="ps-out-merge" style="padding:16px;font-family:'DM Mono',monospace;font-size:11.5px;color:var(--text-dim);overflow-x:auto;max-height:500px;overflow-y:auto;line-height:1.65;margin:0;white-space:pre;"></pre>
    </div>
    ${checkerHtml ? `<div style="margin-top:16px;"><div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:10px;">🔍 STATIC CHECKER</div>${checkerHtml}</div>` : ''}
  `;
  showPSPanelOutput('ps-merge-out', outHtml);
  const pre = document.getElementById('ps-out-merge');
  if (pre) pre.textContent = merged;
  showToast('✅ Merge selesai!');
}

// ── OFFLINE CONVERT ───────────────────────────────────────────────
function runPSConvert() {
  const code = document.getElementById('ps-convert-code')?.value.trim();
  if (!code) { showToast('⚠️ Paste kode v4/v5 terlebih dahulu'); return; }

  let result = code;
  const changes = [];

  // Version
  if (!/\/\/@version=6/.test(result)) {
    result = result.replace(/\/\/@version=\d+/, '//@version=6');
    if (!/\/\/@version=/.test(result)) result = '//@version=6\n' + result;
    changes.push('Version → //@version=6');
  }
  if (/study\s*\(/.test(result)) { result = result.replace(/study\s*\(/g, 'indicator('); changes.push('study() → indicator()'); }

  const convMap = [
    [/(?<![a-zA-Z_.])sma\s*\(/g, 'ta.sma(', 'sma()'],
    [/(?<![a-zA-Z_.])ema\s*\(/g, 'ta.ema(', 'ema()'],
    [/(?<![a-zA-Z_.])rsi\s*\(/g, 'ta.rsi(', 'rsi()'],
    [/(?<![a-zA-Z_.])atr\s*\(/g, 'ta.atr(', 'atr()'],
    [/(?<![a-zA-Z_.])macd\s*\(/g, 'ta.macd(', 'macd()'],
    [/(?<![a-zA-Z_.])bb\s*\(/g, 'ta.bb(', 'bb()'],
    [/(?<![a-zA-Z_.])stoch\s*\(/g, 'ta.stoch(', 'stoch()'],
    [/(?<![a-zA-Z_.])vwap\s*\(/g, 'ta.vwap(', 'vwap()'],
    [/(?<![a-zA-Z_.])crossover\s*\(/g, 'ta.crossover(', 'crossover()'],
    [/(?<![a-zA-Z_.])crossunder\s*\(/g, 'ta.crossunder(', 'crossunder()'],
    [/(?<![a-zA-Z_.])highest\s*\(/g, 'ta.highest(', 'highest()'],
    [/(?<![a-zA-Z_.])lowest\s*\(/g, 'ta.lowest(', 'lowest()'],
    [/(?<![a-zA-Z_.])pivothigh\s*\(/g, 'ta.pivothigh(', 'pivothigh()'],
    [/(?<![a-zA-Z_.])pivotlow\s*\(/g, 'ta.pivotlow(', 'pivotlow()'],
    [/(?<![a-zA-Z_.])security\s*\(/g, 'request.security(', 'security()'],
  ];
  convMap.forEach(([rx, fix, label]) => {
    const before = result; result = result.replace(rx, fix);
    if (result !== before) changes.push(`${label} → ${fix}`);
  });

  if (/(\w+)\s*==\s*na/.test(result)) { result = result.replace(/(\w+)\s*==\s*na/g, 'na($1)'); changes.push('== na → na()'); }
  if (/(\w+)\s*!=\s*na/.test(result)) { result = result.replace(/(\w+)\s*!=\s*na/g, 'not na($1)'); changes.push('!= na → not na()'); }
  if (/input\s*\(/.test(result) && !/input\.(int|float|bool|string|source|color)/.test(result)) {
    result = result.replace(/input\s*\(\s*(\d+)/g, 'input.int($1').replace(/input\s*\(\s*(true|false)/g, 'input.bool($1').replace(/input\s*\(\s*"([^"]+)"\s*,\s*type\s*=\s*input\.string/g, 'input.string("$1"');
    changes.push('input() → input.int/float/bool (basic)');
  }

  const check = psCheckErrors(result);
  const checkerHtml = renderCheckerResult(check);
  const changesList = changes.map(c => `• ${c}`).join('<br>');
  const outHtml = `
    <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:10px;">✅ CONVERT SELESAI (OFFLINE)</div>
    <div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:5px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--text-dim);">${changes.length > 0 ? changesList : 'Tidak ada konversi yang diperlukan — kode sudah v6 compliant'}</div>
    <div style="position:relative;background:var(--dark4);border:1px solid var(--border);border-radius:6px;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--dark3);border-bottom:1px solid var(--border);">
        <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-muted);">Pine Script v6 · Converted</span>
        <button onclick="copyFromPre('ps-out-convert')" style="background:var(--gold);color:var(--dark);border:none;padding:4px 12px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;border-radius:3px;cursor:pointer;">📋 Copy</button>
      </div>
      <pre id="ps-out-convert" style="padding:16px;font-family:'DM Mono',monospace;font-size:11.5px;color:var(--text-dim);overflow-x:auto;max-height:500px;overflow-y:auto;line-height:1.65;margin:0;white-space:pre;"></pre>
    </div>
    ${checkerHtml ? `<div style="margin-top:16px;"><div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:10px;">🔍 STATIC CHECKER</div>${checkerHtml}</div>` : ''}
  `;
  showPSPanelOutput('ps-convert-out', outHtml);
  const pre = document.getElementById('ps-out-convert');
  if (pre) pre.textContent = result;
  showToast('✅ Convert ke v6 selesai!');
}

// ── AI ERROR FIXER (Claude API) ───────────────────────────────────
function syncAPIKey(val) {
  // Sync to session memory only — localStorage only if checkbox checked
  window._psApiKey = val;
}

function handleSaveAPIKey(save) {
  const key = document.getElementById('ps-ai-apikey')?.value.trim();
  if (save && key) {
    _saveApiKey(key);
    showToast('🔐 API key disimpan di browser');
  } else if (!save) {
    localStorage.removeItem('ict-ps-apikey');
    showToast('🗑 API key dihapus dari penyimpanan lokal');
  }
}

function toggleAPIKeyVis() {
  const inp = document.getElementById('ps-ai-apikey');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function copyAIResult() {
  const el = document.getElementById('ps-ai-result-text');
  if (!el) return;
  const text = el.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Hasil di-copy!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('📋 Hasil di-copy!');
  }
}

// ── AI PROVIDER TOGGLE ──────────────────────────────────────────
window._psAIProvider = localStorage.getItem('ict-ai-provider') || 'claude';

window.setAIProvider = function(provider) {
  window._psAIProvider = provider;
  localStorage.setItem('ict-ai-provider', provider);
  const isClaude = provider === 'claude';
  // Badge
  const badge = document.getElementById('ps-ai-provider-badge');
  if (badge) badge.textContent = isClaude ? 'CLAUDE API' : 'GROQ API';
  // Buttons
  const btnC = document.getElementById('ps-ai-btn-claude');
  const btnG = document.getElementById('ps-ai-btn-groq');
  if (btnC) {
    btnC.style.background = isClaude ? 'rgba(155,89,182,0.2)' : 'var(--dark4)';
    btnC.style.borderColor = isClaude ? 'var(--purple)' : 'var(--border)';
    btnC.style.color = isClaude ? 'var(--purple)' : 'var(--text-muted)';
  }
  if (btnG) {
    btnG.style.background = !isClaude ? 'rgba(46,204,113,0.15)' : 'var(--dark4)';
    btnG.style.borderColor = !isClaude ? 'var(--green)' : 'var(--border)';
    btnG.style.color = !isClaude ? 'var(--green)' : 'var(--text-muted)';
  }
  // Label & link
  const lbl = document.getElementById('ps-ai-key-label');
  const lnk = document.getElementById('ps-ai-key-link');
  const inp = document.getElementById('ps-ai-apikey');
  if (lbl) lbl.textContent = isClaude ? 'Claude API Key' : 'Groq API Key';
  if (lnk) { lnk.href = isClaude ? 'https://console.anthropic.com/account/keys' : 'https://console.groq.com'; }
  if (inp) inp.placeholder = isClaude ? 'sk-ant-api03-...' : 'gsk_...';
  // Notes
  const nC = document.getElementById('ps-ai-note-claude');
  const nG = document.getElementById('ps-ai-note-groq');
  if (nC) nC.style.display = isClaude ? 'block' : 'none';
  if (nG) nG.style.display = !isClaude ? 'block' : 'none';
  // Load saved key for this provider
  const savedKey = localStorage.getItem(isClaude ? 'ict-ps-claude-key' : 'ict-ps-groq-key') || '';
  if (inp && savedKey) { inp.value = savedKey; window._psApiKey = savedKey; }
  else if (inp) { inp.value = ''; }
};

async function runAIErrorFixer() {
  const apiKey = document.getElementById('ps-ai-apikey')?.value.trim() || window._psApiKey || _loadApiKey() || '';
  const code   = document.getElementById('ps-ai-code')?.value.trim();
  const desc   = document.getElementById('ps-ai-desc')?.value.trim() || '';
  const valEl  = document.getElementById('ps-ai-validation');
  const resultEl = document.getElementById('ps-ai-result');
  const textEl   = document.getElementById('ps-ai-result-text');
  const loadEl   = document.getElementById('ps-ai-loading');

  // Validation
  if (!apiKey) {
    if (valEl) { valEl.style.display = 'block'; valEl.innerHTML = '⚠️ <strong>WAJIB: Masukkan Claude API Key terlebih dahulu.</strong> Dapatkan di <a href="https://console.anthropic.com/account/keys" target="_blank" style="color:var(--gold);">console.anthropic.com</a>'; }
    return;
  }
  if (!code) {
    if (valEl) { valEl.style.display = 'block'; valEl.textContent = '📝 Tempelkan kode PineScript yang error terlebih dahulu.'; }
    return;
  }
  if (valEl) valEl.style.display = 'none';

  // Show loading
  if (loadEl) loadEl.style.display = 'block';
  if (resultEl) resultEl.style.display = 'none';

  const prompt = `Anda adalah expert PineScript v6. Perbaiki kode berikut:

KODE:
\`\`\`pinescript
${code}
\`\`\`

Deskripsi masalah: ${desc || 'Tidak ada deskripsi — perbaiki semua error yang ada'}

Berikan:
1. Kode yang sudah diperbaiki (lengkap)
2. Penjelasan singkat apa yang diperbaiki

Format output harus persis:
## Kode Hasil Perbaikan
\`\`\`pinescript
[kode lengkap di sini]
\`\`\`

## Penjelasan Perbaikan
[penjelasan dalam Bahasa Indonesia]`;

  const provider = window._psAIProvider || localStorage.getItem('ict-ai-provider') || 'claude';
  const isGroq = provider === 'groq';

  try {
    let responseText;

    if (isGroq) {
      // ── GROQ API (Free) ──────────────────────────────────────
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4096,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (loadEl) loadEl.style.display = 'none';
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        if (resultEl) resultEl.style.display = 'block';
        if (textEl) textEl.textContent = '❌ Groq API Error: ' + errMsg +
          (res.status === 401 ? '\n\n→ Periksa API key Groq kamu (harus mulai dengan gsk_).' :
           res.status === 429 ? '\n\n→ Rate limit — tunggu beberapa detik lalu coba lagi.' : '');
        return;
      }
      const dataG = await res.json();
      responseText = dataG.choices?.[0]?.message?.content || '(Tidak ada respons)';

    } else {
      // ── CLAUDE API ───────────────────────────────────────────
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (loadEl) loadEl.style.display = 'none';
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        if (resultEl) resultEl.style.display = 'block';
        if (textEl) textEl.textContent = '❌ Claude API Error: ' + errMsg +
          (res.status === 401 ? '\n\n→ Periksa API key — mungkin salah atau sudah kadaluarsa.' :
           res.status === 429 ? '\n\n→ Rate limit — coba lagi dalam beberapa detik.' : '');
        return;
      }
      const dataC = await res.json();
      responseText = dataC.content?.map(c => c.type === 'text' ? c.text : '').join('') || '(Tidak ada respons)';
    }

    if (resultEl) resultEl.style.display = 'block';
    if (textEl) textEl.textContent = responseText;

    // Save API key per-provider
    const saveCb = document.getElementById('ps-ai-save-key');
    if (saveCb?.checked) {
      const keyName = isGroq ? 'ict-ps-groq-key' : 'ict-ps-claude-key';
      localStorage.setItem(keyName, apiKey);
      _saveApiKey(apiKey);
    }
    showToast('✅ AI berhasil menganalisis kode!');

  } catch(e) {
    if (loadEl) loadEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'block';
    if (textEl) textEl.textContent = '❌ Gagal koneksi ke ' + (isGroq ? 'Groq' : 'Claude') + ' API: ' + e.message +
      '\n\nKemungkinan: CORS error di browser lokal, atau koneksi internet terputus.\n\nCoba buka halaman ini dari GitHub Pages, bukan file lokal.';
  }
}

// Load saved API key on page load — respects provider selection
function loadSavedAPIKey() {
  const provider = localStorage.getItem('ict-ai-provider') || 'claude';
  window._psAIProvider = provider;
  const keyName = provider === 'groq' ? 'ict-ps-groq-key' : 'ict-ps-claude-key';
  const saved = localStorage.getItem(keyName) || _loadApiKey();
  if (saved) {
    const inp = document.getElementById('ps-ai-apikey');
    const cb  = document.getElementById('ps-ai-save-key');
    if (inp) inp.value = saved;
    if (cb)  cb.checked = true;
    window._psApiKey = saved;
  }
  // Apply provider UI state
  if (typeof window.setAIProvider === 'function') {
    window.setAIProvider(provider);
    // Restore key after setAIProvider (it may clear input)
    if (saved) {
      const inp = document.getElementById('ps-ai-apikey');
      if (inp) inp.value = saved;
      window._psApiKey = saved;
    }
  }
}

// ── OUTPUT HELPERS ─────────────────────────────────────────────────────
function clearPSOutput(silent) {
  _psLastCode = '';
  // Clear old output elements (backward compat)
  ['ps-output-wrap','ps-checker-result','ps-ai-result'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  });
  const code = document.getElementById('ps-output-code');
  if (code) code.textContent = '';
  const statusEl = document.getElementById('ps-status-text');
  if (statusEl) { statusEl.textContent = ''; }
  const progBar = document.getElementById('ps-progress-bar');
  if (progBar) progBar.style.width = '0%';
  // Clear new panel outputs
  ['ps-modify-out','ps-merge-out','ps-convert-out'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  });
  const aiRes = document.getElementById('ps-ai-result');
  if (aiRes) aiRes.style.display = 'none';
  if (!silent) showToast('🗑 Output di-clear');
}

function copyPSCode() {
  if (!_psLastCode) { showToast('⚠️ Tidak ada kode untuk di-copy'); return; }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(_psLastCode).then(() => showToast('📋 Kode berhasil di-copy!')).catch(() => _psCopyFallback());
  } else {
    _psCopyFallback();
  }
}

function _psCopyFallback() {
  const ta = document.createElement('textarea');
  ta.value = _psLastCode;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select(); document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('📋 Kode berhasil di-copy!');
}

function downloadPSCode() {
  if (!_psLastCode) { showToast('⚠️ Tidak ada kode untuk di-download'); return; }
  const blob = new Blob([_psLastCode], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'pinescript_v6_' + Date.now() + '.pine';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('⬇ File .pine berhasil di-download!');
}

// ══════════════════════════════════════════════════════════════════════
// 📦 INDIKATOR SIAP PAKAI — CODE INJECTION
// ══════════════════════════════════════════════════════════════════════

function copyIndicator(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const code = el.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code)
      .then(() => showToast('📋 Kode indikator berhasil di-copy!'))
      .catch(() => _indCopyFallback(code));
  } else {
    _indCopyFallback(code);
  }
}
function _indCopyFallback(code) {
  const ta = document.createElement('textarea');
  ta.value = code;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select(); document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('📋 Kode indikator berhasil di-copy!');
}

// ── SESSION DASHBOARD PRO v10 CODE ─────────────────────────────────
const _IND_SESSION = `//@version=6
// ─────────────────────────────────────────────────────────────────
// Session Dashboard Pro v10 [MC+ML 9:30]
// TTrades Daily Bias · Monte Carlo PDH/PDL · NY 9:30 Engine
// VWAP Weekly · Kill Zone Boxes · S/R High Probability
// ⚠ Gunakan di timeframe M1–H1. Timezone: America/New_York
// ─────────────────────────────────────────────────────────────────
indicator("Session Dashboard Pro v10 [MC+ML 9:30]", overlay=true, max_lines_count=500, max_labels_count=500, max_boxes_count=500)

// ═══ INPUT GROUPS ═══════════════════════════════════════════════
var string GRP_SESS = "⏰ Session Settings"
var string GRP_BIAS = "📊 Bias & VWAP Weekly"
var string GRP_OPEN = "🕯 Opening Candles"
var string GRP_MC   = "🎲 Monte Carlo PDH/PDL"
var string GRP_SR   = "📐 S/R High Probability"
var string GRP_930  = "🚀 NY 9:30 Open Analysis"
var string GRP_VIS  = "🎨 Visual"

// ── SESSION ──────────────────────────────────────────────────────
use_chart_tz     = input.bool(true, "Auto: Gunakan Timezone Chart TV", group=GRP_SESS)
manual_tz        = input.string("America/New_York", "Timezone Manual", group=GRP_SESS,
     options=["America/New_York","America/Chicago","Europe/London","Europe/Berlin","Asia/Tokyo","Asia/Singapore","Asia/Jakarta","UTC"])
show_killzone_bg = input.bool(true, "Tampilkan Killzone Background", group=GRP_SESS)
kz_asia_col  = input.color(color.new(color.purple, 88), "Warna Asia",   group=GRP_SESS)
kz_lon_col   = input.color(color.new(color.blue,   85), "Warna London", group=GRP_SESS)
kz_ny_col    = input.color(color.new(color.green,  85), "Warna NY AM",  group=GRP_SESS)
kz_nypm_col  = input.color(color.new(color.teal,   88), "Warna NY PM",  group=GRP_SESS)

// ── BIAS & VWAP ──────────────────────────────────────────────────
ema_fast    = input.int(20,  "EMA Fast",  minval=5,  group=GRP_BIAS)
ema_slow    = input.int(50,  "EMA Slow",  minval=10, group=GRP_BIAS)
ema_trend   = input.int(200, "EMA Trend", minval=50, group=GRP_BIAS)
show_vwap_w = input.bool(true, "Plot VWAP Weekly", group=GRP_BIAS)
show_vwap_d = input.bool(true, "Plot VWAP Daily",  group=GRP_BIAS)
bias_reason = input.bool(true, "Tampilkan Label Alasan Bias", group=GRP_BIAS)

// ── OPENING CANDLES ──────────────────────────────────────────────
show_0830   = input.bool(true, "Show 08:30 Open (NY)",  group=GRP_OPEN)
show_0930   = input.bool(true, "Show 09:30 Open (NY)",  group=GRP_OPEN)
show_0200   = input.bool(true, "Show 02:00 Open (LON)", group=GRP_OPEN)
open_extend = input.int(30,   "Extend Bars",             group=GRP_OPEN, minval=1)

// ── MONTE CARLO ──────────────────────────────────────────────────
adx_len        = input.int(14,    "ADX Length",            group=GRP_MC)
adx_threshold  = input.int(25,    "ADX Trend Threshold",   group=GRP_MC)
bb_len         = input.int(20,    "BB Length",             group=GRP_MC)
bb_mult        = input.float(2.0, "BB Multiplier",         group=GRP_MC, step=0.1)
atr_zscore_len = input.int(20,    "ATR Z-Score Lookback",  group=GRP_MC, minval=5)
proj_atr_mult  = input.float(1.5, "ATR Target Multiplier", group=GRP_MC, step=0.1)
show_proj_line = input.bool(true, "Plot Garis Target ATR", group=GRP_MC)
mc_noise_sigma = input.float(0.18,"MC Noise Sigma",        group=GRP_MC, minval=0.05, maxval=0.5, step=0.01)

// ── S/R ──────────────────────────────────────────────────────────
sr_left      = input.int(20,   "Pivot Left Bars",    group=GRP_SR, minval=5)
sr_right     = input.int(20,   "Pivot Right Bars",   group=GRP_SR, minval=5)
sr_min_touch = input.int(2,    "Min Sentuhan",       group=GRP_SR, minval=1)
sr_max       = input.int(5,    "Max S/R Lines",      group=GRP_SR, minval=1, maxval=10)
sr_zone_pct  = input.float(0.1,"Zone Cluster % ATR", group=GRP_SR, minval=0.01, step=0.01)
sr_show_zone = input.bool(true,"Tampilkan Zone Box",  group=GRP_SR)

// ── NY 9:30 OPEN ANALYSIS ────────────────────────────────────────
show_930_analysis = input.bool(true,  "Tampilkan Analisa Candle 9:30", group=GRP_930)
ema9_len          = input.int(9,      "EMA Cepat (default 9)",         group=GRP_930, minval=3, maxval=50)
ema21_len         = input.int(21,     "EMA Lambat (default 21)",        group=GRP_930, minval=5, maxval=100)
manip_atr_mult    = input.float(0.3,  "Threshold Manipulasi (× ATR)",  group=GRP_930, minval=0.05, maxval=1.0, step=0.05)
impulse_atr_mult  = input.float(0.6,  "Threshold Impulse (× ATR)",     group=GRP_930, minval=0.2,  maxval=3.0, step=0.05)

// ── VISUAL ───────────────────────────────────────────────────────
tbl_pos      = input.string("Top Right", "Posisi Tabel",
     options=["Top Right","Top Left","Bottom Right","Bottom Left"], group=GRP_VIS)
bull_color   = input.color(color.teal, "Warna Bull", inline="CLR", group=GRP_VIS)
bear_color   = input.color(color.red,  "Warna Bear", inline="CLR", group=GRP_VIS)
before_color = input.color(color.blue, "Warna PDH/PDL (sebelum hit)", inline="RAID", group=GRP_VIS)
after_color  = input.color(color.red,  "Warna PDH/PDL (setelah hit)", inline="RAID", group=GRP_VIS)
stop_ext     = input.bool(false, "Stop Extend Setelah Hit", group=GRP_VIS)

// ═══ TIMEZONE & SESSION ═════════════════════════════════════════
active_tz = use_chart_tz ? syminfo.timezone : manual_tz
utc_h  = hour(time, "UTC")
new_day  = timeframe.change("D")
new_week = timeframe.change("W")

in_asia   = utc_h >= 20 or utc_h < 0
in_london = utc_h >= 2  and utc_h < 5
in_ny     = utc_h >= 7  and utc_h < 12
in_nypm   = utc_h >= 13 and utc_h < 16

// ═══ KILLZONE BOXES ════════════════════════════════════════════
var box kz_box_asia   = na
var box kz_box_london = na
var box kz_box_ny     = na
var box kz_box_nypm   = na

_atr_kz  = ta.atr(14)
KZ_TOP   = high + _atr_kz * 500
KZ_BOT   = low  - _atr_kz * 500

if show_killzone_bg
    if in_asia and not in_asia[1]
        kz_box_asia := box.new(bar_index, KZ_TOP, bar_index, KZ_BOT, bgcolor=kz_asia_col, border_color=color.new(color.purple,95), extend=extend.both)
    if not na(kz_box_asia) and in_asia
        box.set_right(kz_box_asia, bar_index)
        box.set_top(kz_box_asia, KZ_TOP)
        box.set_bottom(kz_box_asia, KZ_BOT)

    if in_london and not in_london[1]
        kz_box_london := box.new(bar_index, KZ_TOP, bar_index, KZ_BOT, bgcolor=kz_lon_col, border_color=color.new(color.blue,95), extend=extend.both)
    if not na(kz_box_london) and in_london
        box.set_right(kz_box_london, bar_index)
        box.set_top(kz_box_london, KZ_TOP)
        box.set_bottom(kz_box_london, KZ_BOT)

    if in_ny and not in_ny[1]
        kz_box_ny := box.new(bar_index, KZ_TOP, bar_index, KZ_BOT, bgcolor=kz_ny_col, border_color=color.new(color.green,95), extend=extend.both)
    if not na(kz_box_ny) and in_ny
        box.set_right(kz_box_ny, bar_index)
        box.set_top(kz_box_ny, KZ_TOP)
        box.set_bottom(kz_box_ny, KZ_BOT)

    if in_nypm and not in_nypm[1]
        kz_box_nypm := box.new(bar_index, KZ_TOP, bar_index, KZ_BOT, bgcolor=kz_nypm_col, border_color=color.new(color.teal,95), extend=extend.both)
    if not na(kz_box_nypm) and in_nypm
        box.set_right(kz_box_nypm, bar_index)
        box.set_top(kz_box_nypm, KZ_TOP)
        box.set_bottom(kz_box_nypm, KZ_BOT)

// ═══ EMA ════════════════════════════════════════════════════════
ema_f = ta.ema(close, ema_fast)
ema_s = ta.ema(close, ema_slow)
ema_t = ta.ema(close, ema_trend)
ema_aligned_bull = ema_f > ema_s and ema_s > ema_t
ema_aligned_bear = ema_f < ema_s and ema_s < ema_t
ema9  = ta.ema(close, ema9_len)
ema21 = ta.ema(close, ema21_len)

// ═══ VWAP ════════════════════════════════════════════════════════
daily_vwap        = request.security(syminfo.tickerid, "D", ta.vwap(hlc3))
weekly_vwap       = request.security(syminfo.tickerid, "W", ta.vwap(hlc3))
weekly_vwap_prev  = request.security(syminfo.tickerid, "W", ta.vwap(hlc3)[1])
weekly_atr        = request.security(syminfo.tickerid, "W", ta.atr(14))
vwap_w_slope_bull = weekly_vwap > weekly_vwap_prev

// ═══ ADX ════════════════════════════════════════════════════════
[diplus, diminus, adx_val] = ta.dmi(adx_len, adx_len)
adx_trending = adx_val > adx_threshold

// ═══ BB & ATR ════════════════════════════════════════════════════
[bb_mid, bb_upper, bb_lower] = ta.bb(close, bb_len, bb_mult)
atr_val   = ta.atr(14)
atr_sma   = ta.sma(atr_val, atr_zscore_len)
atr_std   = ta.stdev(atr_val, atr_zscore_len)
atr_zscore = atr_std > 0 ? (atr_val - atr_sma) / atr_std : 0.0

// ═══ PDH / PDL ════════════════════════════════════════════════════
pdh = request.security(syminfo.tickerid, "D", high[1],  lookahead=barmerge.lookahead_on)
pdl = request.security(syminfo.tickerid, "D", low[1],   lookahead=barmerge.lookahead_on)
pdc = request.security(syminfo.tickerid, "D", close[1], lookahead=barmerge.lookahead_on)
pdo = request.security(syminfo.tickerid, "D", open[1],  lookahead=barmerge.lookahead_on)
p_up = pdc >= pdo

// ═══ TTRADES DAILY BIAS (6-Condition Priority) ════════════════
// Logic asli TTrades TFO dipertahankan exact
handle_bias() =>
    int   bias_dir    = 0
    string bias_why   = "No Bias"
    if close > pdh
        bias_dir := 1
        bias_why := "Close > PDH → Bullish"
    else if close < pdl
        bias_dir := -1
        bias_why := "Close < PDL → Bearish"
    else if high > pdh and low > pdl and close <= pdh and close >= pdl
        bias_dir := -1
        bias_why := "Failed Close Above PDH → Bearish"
    else if low < pdl and high < pdh and close >= pdl and close <= pdh
        bias_dir := 1
        bias_why := "Failed Close Below PDL → Bullish"
    else if high <= pdh and low >= pdl
        bias_dir := p_up ? 1 : -1
        bias_why := "Inside Bar → " + (p_up ? "Bullish (p_up)" : "Bearish (p_down)")
    else
        bias_dir := 0
        bias_why := "Outside Bar Close Inside → No Bias"
    [bias_dir, bias_why]

[bias_val, bias_txt] = handle_bias()

// ═══ NY 9:30 ANALYSIS ════════════════════════════════════════════
lh_active = hour(time, active_tz)
lm_active = minute(time, active_tz)
is_930    = lh_active == 9 and lm_active == 30
candle_range_930 = high - low

var float thresh_manip  = na
var float thresh_impulse = na
if is_930
    thresh_manip   := atr_val * manip_atr_mult
    thresh_impulse := atr_val * impulse_atr_mult

candle_type_930 =
     candle_range_930 < thresh_manip  ? "MANIP / False Move 🎣" :
     candle_range_930 >= thresh_impulse ? "IMPULSE — Direct Run 🚀" :
     "NEUTRAL — Wait Reaction ⏳"
c930_col =
     candle_range_930 < thresh_manip  ? color.new(color.orange, 0) :
     candle_range_930 >= thresh_impulse ? color.new(color.lime,   0) :
     color.new(color.gray, 0)

if show_930_analysis and is_930
    label.new(bar_index, high, candle_type_930 + "\\nEMA9: " + str.tostring(math.round(ema9,1)) + " | EMA21: " + str.tostring(math.round(ema21,1)),
              style=label.style_label_down, color=c930_col, textcolor=color.white, size=size.small)

// ═══ OPENING CANDLE LINES ════════════════════════════════════════
var line line_0830 = na
var line line_0930 = na
var line line_0200 = na

if show_0830 and lh_active == 8 and lm_active == 30 and barstate.isconfirmed
    if not na(line_0830)
        line.delete(line_0830)
    line_0830 := line.new(bar_index, open, bar_index + open_extend, open,
                 color=color.new(color.yellow, 20), width=1, style=line.style_dashed, extend=extend.right)

if show_0930 and lh_active == 9 and lm_active == 30 and barstate.isconfirmed
    if not na(line_0930)
        line.delete(line_0930)
    line_0930 := line.new(bar_index, open, bar_index + open_extend, open,
                 color=color.new(color.aqua, 20), width=2, style=line.style_solid, extend=extend.right)

if show_0200 and lh_active == 2 and lm_active == 0 and barstate.isconfirmed
    if not na(line_0200)
        line.delete(line_0200)
    line_0200 := line.new(bar_index, open, bar_index + open_extend, open,
                 color=color.new(color.blue, 20), width=1, style=line.style_dashed, extend=extend.right)

// ═══ PDH/PDL LINES ══════════════════════════════════════════════
var line pdh_line = na
var line pdl_line = na
var bool pdh_hit  = false
var bool pdl_hit  = false

if new_day
    pdh_hit := false
    pdl_hit := false
    if not na(pdh_line)
        line.delete(pdh_line)
    if not na(pdl_line)
        line.delete(pdl_line)
    pdh_line := line.new(bar_index, pdh, bar_index + 1, pdh,
                color=before_color, width=1, style=line.style_dotted, extend=extend.right)
    pdl_line := line.new(bar_index, pdl, bar_index + 1, pdl,
                color=before_color, width=1, style=line.style_dotted, extend=extend.right)

if not na(pdh_line) and high >= pdh and not pdh_hit
    pdh_hit := true
    line.set_color(pdh_line, after_color)
    if stop_ext
        line.set_extend(pdh_line, extend.none)

if not na(pdl_line) and low <= pdl and not pdl_hit
    pdl_hit := true
    line.set_color(pdl_line, after_color)
    if stop_ext
        line.set_extend(pdl_line, extend.none)

// ═══ VWAP PLOTS ══════════════════════════════════════════════════
plot(show_vwap_w ? weekly_vwap : na, "VWAP Weekly",
     color = vwap_w_slope_bull ? color.new(color.lime, 10) : color.new(color.red, 10),
     linewidth=2, style=plot.style_stepline)
plot(show_vwap_d ? daily_vwap : na, "VWAP Daily",
     color=color.new(color.yellow, 30), linewidth=1, style=plot.style_stepline)

// ═══ ATR TARGET LINES ════════════════════════════════════════════
var line proj_up_line   = na
var line proj_down_line = na

if new_day and show_proj_line
    if not na(proj_up_line)
        line.delete(proj_up_line)
    if not na(proj_down_line)
        line.delete(proj_down_line)
    proj_target = atr_val * proj_atr_mult
    proj_up_line   := line.new(bar_index, close + proj_target, bar_index + 1, close + proj_target,
                      color=color.new(color.lime,   40), width=1, style=line.style_dotted, extend=extend.right)
    proj_down_line := line.new(bar_index, close - proj_target, bar_index + 1, close - proj_target,
                      color=color.new(color.orange, 40), width=1, style=line.style_dotted, extend=extend.right)

// ═══ BIAS LABEL ══════════════════════════════════════════════════
if bias_reason and new_day and barstate.isconfirmed
    bias_col = bias_val == 1 ? color.new(color.lime, 20) : bias_val == -1 ? color.new(color.red, 20) : color.new(color.gray, 40)
    bias_sym = bias_val == 1 ? "▲ BULL" : bias_val == -1 ? "▼ BEAR" : "◆ FLAT"
    label.new(bar_index, bias_val == 1 ? low * 0.9997 : high * 1.0003, bias_sym + "\\n" + bias_txt,
              style = bias_val == 1 ? label.style_label_up : label.style_label_down,
              color=bias_col, textcolor=color.white, size=size.small)

// ═══ SESSION DASHBOARD TABLE ═════════════════════════════════════
tbl_position = tbl_pos == "Top Right" ? position.top_right : tbl_pos == "Top Left" ? position.top_left : tbl_pos == "Bottom Right" ? position.bottom_right : position.bottom_left
var table tbl = table.new(tbl_position, 2, 9, bgcolor=color.new(color.black, 15), border_width=1, border_color=color.new(color.gray,70))

sess_label = in_ny and in_london ? "NY/LDN Overlap 🔥" : in_ny ? "New York 🗽" : in_nypm ? "NY PM 🌆" : in_london ? "London 🇬🇧" : in_asia ? "Asia 🌏" : "Off Hours 💤"
bias_str   = bias_val == 1 ? "▲ BULLISH" : bias_val == -1 ? "▼ BEARISH" : "◆ FLAT"
bias_col2  = bias_val == 1 ? color.new(color.lime, 0) : bias_val == -1 ? color.new(color.red, 0) : color.new(color.gray, 0)
adx_str    = adx_trending ? "TRENDING (" + str.tostring(math.round(adx_val, 1)) + ")" : "RANGING (" + str.tostring(math.round(adx_val, 1)) + ")"

bgH = color.new(color.black, 75)
bgD = color.new(color.black, 85)
cMut = color.new(color.gray, 20)
szS  = size.small
szT  = size.tiny

table.cell(tbl, 0, 0, "  SESSION DASHBOARD",  bgcolor=bgH, text_color=color.new(color.yellow, 0), text_size=szS)
table.cell(tbl, 1, 0, "v10",                   bgcolor=bgH, text_color=color.new(color.gray, 30),  text_size=szT)
table.cell(tbl, 0, 1, "  SESSION",             bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 1, sess_label,              bgcolor=bgD, text_color=color.white, text_size=szT)
table.cell(tbl, 0, 2, "  BIAS HARIAN",         bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 2, bias_str,                bgcolor=bgD, text_color=bias_col2, text_size=szS)
table.cell(tbl, 0, 3, "  BIAS REASON",         bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 3, bias_txt,                bgcolor=bgD, text_color=color.new(color.silver, 0), text_size=szT)
table.cell(tbl, 0, 4, "  BIAS WEEKLY",         bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 4, vwap_w_slope_bull ? "▲ BULL (VWAP W↑)" : "▼ BEAR (VWAP W↓)",
           bgcolor=bgD, text_color=vwap_w_slope_bull ? color.new(color.lime,0) : color.new(color.red,0), text_size=szT)
table.cell(tbl, 0, 5, "  MARKET MODE",         bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 5, adx_str,                 bgcolor=bgD, text_color=adx_trending ? color.new(color.yellow,0) : color.new(color.gray,20), text_size=szT)
table.cell(tbl, 0, 6, "  PDH HIT",             bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 6, pdh_hit ? "✅ HIT" : "⏳ Waiting " + str.tostring(math.round(pdh - close, 1)),
           bgcolor=bgD, text_color=pdh_hit ? color.new(color.lime,0) : color.new(color.gray,20), text_size=szT)
table.cell(tbl, 0, 7, "  PDL HIT",             bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 7, pdl_hit ? "✅ HIT" : "⏳ Waiting " + str.tostring(math.round(close - pdl, 1)),
           bgcolor=bgD, text_color=pdl_hit ? color.new(color.lime,0) : color.new(color.gray,20), text_size=szT)
table.cell(tbl, 0, 8, "  ATR Z-SCORE",         bgcolor=bgD, text_color=cMut, text_size=szT)
table.cell(tbl, 1, 8, str.tostring(math.round(atr_zscore, 2)) + (atr_zscore > 1.5 ? " ⚠ HIGH VOL" : " Normal"),
           bgcolor=bgD, text_color=atr_zscore > 1.5 ? color.new(color.orange,0) : color.new(color.silver,0), text_size=szT)

// ═══ ALERTS ══════════════════════════════════════════════════════
alertcondition(new_day and bias_val ==  1, "Daily Bias: BULLISH", "TTrades Bias: BULLISH — " + bias_txt)
alertcondition(new_day and bias_val == -1, "Daily Bias: BEARISH", "TTrades Bias: BEARISH — " + bias_txt)
alertcondition(high >= pdh and not pdh_hit[1], "PDH Hit", "Price hit Previous Day High!")
alertcondition(low  <= pdl and not pdl_hit[1], "PDL Hit", "Price hit Previous Day Low!")
alertcondition(is_930 and show_930_analysis, "NY 9:30 Open", "NY 9:30 Open — " + candle_type_930)`;

// ── QUANTUM VEIL TREND ENGINE CODE ─────────────────────────────
const _IND_QVTE = `//@version=6
// ─────────────────────────────────────────────────────────────────
// Quantum Veil Trend Engine
// EMA 9/21 Ribbon · 12-Feature ML Composite · Continuation % 
// Logistic Probability Score · Smart Alerts
// ⚠ Gunakan di M5–H4. Cocok sebagai konfirmator bias ICT.
// ─────────────────────────────────────────────────────────────────
indicator("Quantum Veil Trend Engine", overlay=true, max_lines_count=500, max_labels_count=500)

// ── INPUTS ───────────────────────────────────────────────────────
i_fast   = input.int(9,  "EMA Fast",       minval=1)
i_slow   = input.int(21, "EMA Slow",       minval=1)
i_lb     = input.int(50, "Lookback ML",    minval=20, maxval=200)
i_fwd    = input.int(20, "Candles Forward",minval=10, maxval=30)
i_pos    = input.string("Top Right", "Table Position", options=["Top Right","Top Left","Bottom Right","Bottom Left"])
i_ribbon = input.bool(true, "Show Ribbon")
i_lbl    = input.bool(true, "Show Cross Labels")

// ── EMA ──────────────────────────────────────────────────────────
ema9  = ta.ema(close, i_fast)
ema21 = ta.ema(close, i_slow)
bull  = ema9 > ema21

// ── PLOTS ────────────────────────────────────────────────────────
colFast = bull ? color.new(#00e676, 0)  : color.new(#ff1744, 0)
colSlow = bull ? color.new(#00c853, 20) : color.new(#d50000, 20)
colFill = i_ribbon ? (bull ? color.new(#00e676, 72) : color.new(#ff1744, 72)) : color.new(color.white, 100)

p9  = plot(ema9,  "EMA Fast", color=colFast, linewidth=2)
p21 = plot(ema21, "EMA Slow", color=colSlow, linewidth=2)
fill(p9, p21, color=colFill, title="Ribbon")

// ── CROSSOVER LABELS ─────────────────────────────────────────────
xUp   = ta.crossover(ema9,  ema21)
xDown = ta.crossunder(ema9, ema21)

if i_lbl and xUp
    label.new(bar_index, low * 0.9985, "▲ BULL", style=label.style_label_up,
              color=color.new(#00e676, 10), textcolor=color.white, size=size.small)
if i_lbl and xDown
    label.new(bar_index, high * 1.0015, "▼ BEAR", style=label.style_label_down,
              color=color.new(#ff1744, 10), textcolor=color.white, size=size.small)

// ── 12 ML FEATURES ──────────────────────────────────────────────
// F1: EMA separation
f1 = math.max(math.min((ema9 - ema21) / ema21 * 200.0, 1.0), -1.0)
// F2: EMA fast slope
f2 = math.max(math.min((ema9  - ema9[3])  / ema9[3]  * 300.0, 1.0), -1.0)
// F3: EMA slow slope
f3 = math.max(math.min((ema21 - ema21[3]) / ema21[3] * 300.0, 1.0), -1.0)
// F4: RSI divergence
rsi = ta.rsi(close, 14)
f4  = (rsi - 50.0) / 50.0
// F5: MACD histogram normalized
[ml, sl_macd, hl] = ta.macd(close, 12, 26, 9)
atr14 = ta.atr(14)
f5 = math.max(math.min(hl / (atr14 + 0.0001), 1.0), -1.0)
// F6: ATR regime
atrR  = atr14 / close
atrMu = ta.sma(atrR, i_lb)
f6 = atrR > atrMu * 1.3 ? -0.3 : atrR < atrMu * 0.7 ? 0.2 : 0.0
// F7: Bollinger %B
[bbm, bbu, bbl] = ta.bb(close, 20, 2)
bbRng  = bbu - bbl
bbPctB = bbRng > 0.0 ? (close - bbl) / bbRng : 0.5
f7 = (bbPctB - 0.5) * 2.0
// F8: HV ratio
ret  = (close - close[1]) / close[1]
hvL  = ta.stdev(ret, i_lb)
hvS  = ta.stdev(ret, 10)
volReg = hvL > 0.0 ? hvS / hvL : 1.0
f8 = math.max(math.min((1.0 - volReg) * 0.6, 0.5), -0.5)
// F9: OBV slope
obvVal = ta.obv
obvMu  = ta.sma(obvVal, i_lb)
obvS   = ta.sma(obvVal, 5)
f9 = math.max(math.min((obvS - obvMu) / (math.abs(obvMu) + 1.0) * 0.5, 1.0), -1.0)
// F10: Candle body ratio
body   = math.abs(close - open)
rng    = high - low
bRatio = rng > 0.0 ? body / rng : 0.5
f10    = close > open ? (bRatio - 0.5) : -(bRatio - 0.5)
// F11: HH/LL count
hhC = 0
llC = 0
for i = 1 to 20
    if high > high[i]
        hhC += 1
    if low < low[i]
        llC += 1
f11 = math.max(math.min((hhC - llC) / 10.0, 1.0), -1.0)
// F12: Price vs VWAP
vwapV = ta.vwap(hlc3)
f12   = math.max(math.min((close - vwapV) / vwapV * 50.0, 1.0), -1.0)

// ── WEIGHTED COMPOSITE SCORE ─────────────────────────────────────
score = (0.18 * f1) + (0.12 * f2) + (0.08 * f3) + (0.10 * f4) + (0.10 * f5) +
        (0.05 * f6) + (0.08 * f7) + (0.05 * f8) + (0.08 * f9) + (0.06 * f10) +
        (0.10 * f11) + (0.10 * f12)

// ── LOGISTIC PROBABILITY ─────────────────────────────────────────
pBull  = 1.0 / (1.0 + math.exp(-score * 5.0))
pBear  = 1.0 - pBull
contP  = bull ? pBull : pBear
pCont  = math.round(contP * 100.0)
pRev   = 100 - pCont
sDis   = math.round(score * 100.0) / 100.0

// ── DISPLAY STRINGS ──────────────────────────────────────────────
trendLbl = bull ? "UPTREND  ▲" : "DOWNTREND ▼"
trendCol = bull ? color.new(#00e676, 0) : color.new(#ff1744, 0)
trendBg  = bull ? color.new(#003020, 30) : color.new(#300010, 30)

rsiStr   = str.tostring(math.round(rsi, 1))
rsiCol   = rsi > 70.0 ? color.new(#ff6060, 0) : rsi < 30.0 ? color.new(#60c0ff, 0) : color.new(#c0c0e0, 0)
scoreStr = str.tostring(sDis)
scoreCol = sDis > 0.0 ? color.new(#00c853, 0) : color.new(#ff5252, 0)

bar5(v) =>
    b = math.round(v / 20)
    b >= 5 ? "█████" : b >= 4 ? "████░" : b >= 3 ? "███░░" : b >= 2 ? "██░░░" : b >= 1 ? "█░░░░" : "░░░░░"

contBar  = bar5(pCont) + "  " + str.tostring(pCont) + "%"
revBar   = bar5(pRev)  + "  " + str.tostring(pRev)  + "%"
contCol  = pCont >= 65 ? color.new(#00e676, 0) : pCont >= 45 ? color.new(#ffab00, 0) : color.new(#ff1744, 0)
revCol   = pRev  >= 65 ? color.new(#ff1744, 0) : pRev  >= 45 ? color.new(#ffab00, 0) : color.new(#00e676, 0)
confStr  = pCont >= 75 ? "HIGH   ●●●" : pCont >= 55 ? "MEDIUM ●●○" : "LOW    ●○○"
confCol  = pCont >= 75 ? color.new(#00e676, 10) : pCont >= 55 ? color.new(#ffab00, 10) : color.new(#ff1744, 10)
predStr  = pCont >= 65 ? (bull ? "LANJUT NAIK  ✔" : "LANJUT TURUN ✔") : pCont >= 45 ? "SIDEWAYS / WASPADA" : (bull ? "POTENSI REVERSAL ↓" : "POTENSI REVERSAL ↑")
predCol  = pCont >= 65 ? trendCol : color.new(#ffab00, 0)
predBg   = pCont >= 65 ? trendBg  : color.new(#202020, 30)
volW     = atrR > atrMu * 1.5 ? "⚠ VOLATILITAS TINGGI" : "Normal"
volWCol  = atrR > atrMu * 1.5 ? color.new(#ff6d00, 0) : color.new(#60e060, 0)

// ── TABLE ────────────────────────────────────────────────────────
tPos = i_pos == "Top Right" ? position.top_right : i_pos == "Top Left" ? position.top_left : i_pos == "Bottom Right" ? position.bottom_right : position.bottom_left
var table tb = table.new(tPos, 2, 14, bgcolor=color.new(#0a0a0f, 8), border_width=1,
     border_color=color.new(#303040, 50), frame_width=1, frame_color=color.new(#505070, 60))

bgD  = color.new(#0a0a0f, 85)
bgH  = color.new(#1a1a2e, 90)
cMut = color.new(#9090b0, 0)
cDim = color.new(#303050, 0)
cTxt = color.new(#c0c0e0, 0)
cWht = color.new(#ffffff, 0)
szS  = size.small
szT  = size.tiny

tc(r, c, s, bg, fc, sz) => table.cell(tb, c, r, s, bgcolor=bg, text_color=fc, text_size=sz, text_halign=c == 0 ? text.align_left : text.align_center)

tc(0,  0, "  AI TREND PREDICTOR", bgH,  color.new(#e0e0ff, 0), szS)
tc(0,  1, "v6.0",                 bgH,  color.new(#7070a0, 0), szT)
tc(1,  0, "──────────────────",   bgD,  cDim,     szT)
tc(1,  1, "──────────",           bgD,  cDim,     szT)
tc(2,  0, "  TREND",              bgD,  cMut,     szT)
tc(2,  1, trendLbl,               trendBg, trendCol, szS)
tc(3,  0, "  EMA Fast / Slow",    bgD,  cMut,     szT)
tc(3,  1, str.tostring(math.round(ema9,2)) + " / " + str.tostring(math.round(ema21,2)), bgD, cTxt, szT)
tc(4,  0, "  RSI (14)",           bgD,  cMut,     szT)
tc(4,  1, rsiStr,                 bgD,  rsiCol,   szT)
tc(5,  0, "──────────────────",   bgD,  cDim,     szT)
tc(5,  1, "──────────",           bgD,  cDim,     szT)
tc(6,  0, "  PREDIKSI KE DEPAN",  bgD,  cMut,     szT)
tc(6,  1, str.tostring(i_fwd) + " bar", bgD, cMut, szT)
tc(7,  0, "  Lanjut Trend",       bgD,  cMut,     szT)
tc(7,  1, contBar,                bgD,  contCol,  szT)
tc(8,  0, "  Potensi Reversal",   bgD,  cMut,     szT)
tc(8,  1, revBar,                 bgD,  revCol,   szT)
tc(9,  0, "  Composite Score",    bgD,  cMut,     szT)
tc(9,  1, scoreStr,               bgD,  scoreCol, szT)
tc(10, 0, "  Kepercayaan AI",     bgD,  cMut,     szT)
tc(10, 1, confStr,                confCol, cWht,  szT)
tc(11, 0, "──────────────────",   bgD,  cDim,     szT)
tc(11, 1, "──────────",           bgD,  cDim,     szT)
tc(12, 0, "  SINYAL",             predBg, cMut,   szT)
tc(12, 1, predStr,                predBg, predCol, szS)
tc(13, 0, "  Volatilitas",        bgD,  cMut,     szT)
tc(13, 1, volW,                   bgD,  volWCol,  szT)

// ── CANDLE BG ON CROSS ───────────────────────────────────────────
bgcolor(xUp   ? color.new(#00e676, 90) : na, title="Bull Cross BG")
bgcolor(xDown ? color.new(#ff1744, 90) : na, title="Bear Cross BG")

// ── ALERTS ───────────────────────────────────────────────────────
alertcondition(xUp   and pCont >= 65, "Bull Cross + AI Confirm",    "EMA Bull Cross — AI konfirmasi lanjut naik")
alertcondition(xDown and pCont >= 65, "Bear Cross + AI Confirm",    "EMA Bear Cross — AI konfirmasi lanjut turun")
alertcondition(xUp   and pRev  >= 65, "Bull Cross + Reversal Risk", "EMA Bull Cross — risiko reversal tinggi!")
alertcondition(xDown and pRev  >= 65, "Bear Cross + Reversal Risk", "EMA Bear Cross — risiko reversal tinggi!")`;

// ── INJECT CODE INTO PRE ELEMENTS ──────────────────────────────
window.injectIndicatorCodes = function() {
  const sessEl = document.getElementById('ind-session-code');
  const qvteEl = document.getElementById('ind-qvte-code');
  if (sessEl) sessEl.textContent = _IND_SESSION;
  if (qvteEl) qvteEl.textContent = _IND_QVTE;
};
// Run immediately if elements exist, also called again by tab lazy loader
window.injectIndicatorCodes();



(function initPWA() {

  // ── 1. POINT MANIFEST ke file manifest.json ─────────────────
  try {
    const link = document.getElementById('pwa-manifest-link');
    if (link) link.href = './manifest.json';
  } catch (e) {
    console.warn('[PWA] Manifest link failed:', e);
  }

  // ── 2. REGISTER SERVICE WORKER dari file sw.js ──────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
      .catch(err => console.warn('[PWA] SW registration failed:', err));
  }

  // ── 3. INSTALL PROMPT (Android Chrome "Add to Home Screen") ─
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;

    // Tampilkan tombol install jika belum installed
    const btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.style.display = 'flex';
      btn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choice => {
          console.log('[PWA] Install choice:', choice.outcome);
          deferredPrompt = null;
          btn.style.display = 'none';
        });
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] ICT Forge installed!');
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
    deferredPrompt = null;
  });

})();

