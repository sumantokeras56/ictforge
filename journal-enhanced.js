// ══════════════════════════════════════════════════════════════════
//  JOURNAL ENHANCED v2.0
//  + Screenshot Integration
//  + Equity Curve Modal
//  + Mistake Tagging
//  + Compounding Calculator (Simple + Funded)
// ══════════════════════════════════════════════════════════════════

// ── STATE ─────────────────────────────────────────────────────────
let _pendingScreenshots = []; // [{dataUrl, name}] before save

// ── MISTAKE TAG SELECTOR INIT ─────────────────────────────────────
function initMistakeTagSelector() {
  document.querySelectorAll('.mistake-tag-opt').forEach(label => {
    label.addEventListener('click', () => {
      label.classList.toggle('selected');
      const cb = label.querySelector('input[type=checkbox]');
      if (cb) cb.checked = label.classList.contains('selected');
    });
  });
}

function getSelectedMistakeTags() {
  return [...document.querySelectorAll('.mistake-tag-opt.selected')]
    .map(l => l.getAttribute('data-tag'))
    .filter(Boolean);
}

function clearMistakeTags() {
  document.querySelectorAll('.mistake-tag-opt').forEach(l => {
    l.classList.remove('selected');
    const cb = l.querySelector('input[type=checkbox]');
    if (cb) cb.checked = false;
  });
}

// ── SCREENSHOT HANDLING ────────────────────────────────────────────
function handleScreenshotSelect(input) {
  const files = Array.from(input.files || []);
  processScreenshotFiles(files);
  input.value = '';
}

function handleScreenshotDrop(event) {
  event.preventDefault();
  document.getElementById('screenshotDropZone').style.borderColor = 'var(--border)';
  const files = Array.from(event.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
  processScreenshotFiles(files);
}

function processScreenshotFiles(files) {
  const MAX_SIZE = 2 * 1024 * 1024;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) { showToast('⚠️ Hanya file gambar yang diizinkan'); return; }
    if (file.size > MAX_SIZE) { showToast('⚠️ ' + file.name + ' terlalu besar (maks 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      _pendingScreenshots.push({ dataUrl: e.target.result, name: file.name });
      renderScreenshotPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderScreenshotPreviews() {
  const row = document.getElementById('screenshotPreviewRow');
  if (!row) return;
  row.innerHTML = _pendingScreenshots.map((ss, i) => `
    <div class="screenshot-thumb" onclick="viewScreenshot('${i}','pending')">
      <img src="${ss.dataUrl}" alt="screenshot ${i+1}"/>
      <button class="del-thumb" onclick="event.stopPropagation();removePendingScreenshot(${i})">✕</button>
    </div>
  `).join('');
}

function removePendingScreenshot(i) {
  _pendingScreenshots.splice(i, 1);
  renderScreenshotPreviews();
}

function viewScreenshot(idx, source, entryIdx) {
  let url;
  if (source === 'pending') {
    url = _pendingScreenshots[idx]?.dataUrl;
  } else {
    const entry = journalEntries[entryIdx];
    url = entry?.screenshots?.[idx];
  }
  if (!url) return;
  const modal = document.getElementById('screenshotModal');
  const img   = document.getElementById('screenshotModalImg');
  if (modal && img) {
    img.src = url;
    modal.style.display = 'flex';
  }
}

function closeScreenshotModal() {
  const modal = document.getElementById('screenshotModal');
  if (modal) modal.style.display = 'none';
}

// ── OVERRIDE: addJournalEntry with screenshots + mistake tags ─────
function addJournalEntry() {
  const symbol = document.getElementById('journalSymbol')?.value.trim();
  const side   = document.getElementById('journalSide')?.value;
  const entry  = parseFloat(document.getElementById('journalEntry')?.value);
  const sl     = parseFloat(document.getElementById('journalSL')?.value);
  const tp     = parseFloat(document.getElementById('journalTP')?.value);
  const rr     = parseFloat(document.getElementById('journalRr')?.value);
  const result = document.getElementById('journalResult')?.value;
  const note   = document.getElementById('journalNote')?.value.trim();

  if (!symbol) { showToast('⚠️ Isi Symbol terlebih dahulu'); return; }
  if (isNaN(entry) || isNaN(sl) || isNaN(tp)) { showToast('⚠️ Isi Entry, SL, TP dengan angka valid'); return; }
  if (isNaN(rr) || rr <= 0) { showToast('⚠️ Isi R:R dengan angka positif'); return; }

  const tags       = getSelectedMistakeTags();
  const screenshots = _pendingScreenshots.map(s => s.dataUrl);

  journalEntries.unshift({
    date: new Date().toISOString(),
    symbol, side, entry, sl, tp, rr, result,
    note: note || '',
    tags,
    screenshots
  });

  saveJournal();

  // Reset form
  ['journalSymbol','journalEntry','journalSL','journalTP','journalRr','journalNote'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  if (document.getElementById('journalResult')) document.getElementById('journalResult').value = 'pending';
  clearMistakeTags();
  _pendingScreenshots = [];
  renderScreenshotPreviews();
  showToast('✅ Trade berhasil ditambahkan!');
}

// ── OVERRIDE: renderJournal with tags + screenshots ───────────────
function renderJournal() {
  const tbody = document.getElementById('journalBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const stats = { total:0, wins:0, totalRR:0, pfNum:0, pfDen:0 };

  journalEntries.slice().reverse().forEach((entry, idx) => {
    const originalIdx = journalEntries.length - 1 - idx;
    const row = tbody.insertRow();
    const date = new Date(entry.date).toLocaleDateString('id-ID');
    const sideIcon   = entry.side === 'long' ? '📈' : '📉';
    const resultCls  = entry.result === 'win'  ? 'style="color:var(--green);"'
                     : entry.result === 'loss' ? 'style="color:var(--red);"' : '';
    const resultText = entry.result === 'win'  ? '✅ WIN'
                     : entry.result === 'loss' ? '❌ LOSS' : '⏳ Pending';

    // Tags HTML
    const tagsHtml = (entry.tags || []).length
      ? (entry.tags || []).map(t =>
          `<span class="mistake-badge ${t === 'PERFECT' ? 'perfect' : ''}">${t}</span>`
        ).join(' ')
      : '<span style="color:var(--text-muted);font-size:10px;">—</span>';

    // Screenshots thumbnails
    const ssHtml = (entry.screenshots || []).length
      ? `<div style="display:flex;gap:4px;flex-wrap:wrap;">` +
        (entry.screenshots || []).map((_, si) =>
          `<div class="screenshot-thumb" style="width:36px;height:36px;" onclick="viewScreenshot(${si},'entry',${originalIdx})">
            <img src="${entry.screenshots[si]}" alt="ss"/>
          </div>`
        ).join('') + `</div>`
      : '';

    row.innerHTML = `
      <td style="font-size:11px;">${escapeHtml(date)}</td>
      <td><strong>${escapeHtml(String(entry.symbol).toUpperCase())}</strong></td>
      <td>${sideIcon} ${escapeHtml(String(entry.side).toUpperCase())}</td>
      <td>${escapeHtml(String(entry.entry))}</td>
      <td>${escapeHtml(String(entry.sl))}</td>
      <td>${escapeHtml(String(entry.tp))}</td>
      <td>1:${escapeHtml(String(entry.rr))}</td>
      <td ${resultCls}>${resultText}</td>
      <td style="min-width:80px;">${tagsHtml}${ssHtml ? '<br>'+ssHtml : ''}</td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;font-size:11px;">${escapeHtml(entry.note || '-')}</td>
      <td><button class="action-btn" onclick="deleteJournalEntry(${originalIdx})" style="padding:4px 8px;font-size:10px;">🗑</button></td>
    `;

    stats.total++;
    if (entry.result === 'win') stats.wins++;
    if (entry.result === 'win' || entry.result === 'loss') {
      stats.totalRR += entry.rr;
      if (entry.result === 'win')  stats.pfNum += entry.rr;
      else                         stats.pfDen += entry.rr;
    }
  });

  const winRate     = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  const avgRR       = stats.total > 0 ? (stats.totalRR / stats.total).toFixed(2) : 0;
  const profitFactor = stats.pfDen > 0 ? (stats.pfNum / stats.pfDen).toFixed(2)
                     : stats.pfNum > 0 ? '∞' : '0';

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('statTotal', stats.total);
  s('statWinRate', winRate + '%');
  s('statProfitFactor', profitFactor);
  s('statAvgRR', avgRR);

  requestAnimationFrame(drawEquityCurve);
  renderMistakeTagSummary();
}

// ── MISTAKE TAG SUMMARY ───────────────────────────────────────────
function renderMistakeTagSummary() {
  const container = document.getElementById('mistakeTagSummary');
  if (!container) return;

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const tagCount = {};
  journalEntries.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;
    (e.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
  });

  const entries = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:11px;font-family:\'DM Mono\',monospace;">Belum ada data mistake tag bulan ini</span>';
    return;
  }

  const tagLabels = {
    FOMO:'😱 FOMO', REVENGE:'🔥 Revenge', OVERLEV:'⚠️ Over-Leverage',
    LATE:'⏰ Late Entry', NOPA:'📋 No Plan', MOVED_SL:'🚫 Moved SL',
    EARLY_EXIT:'🏃 Early Exit', NEWS:'📰 News', TILT:'🤯 Tilt', PERFECT:'✅ Perfect'
  };

  container.innerHTML = entries.map(([tag, count]) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;
      background:${tag === 'PERFECT' ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)'};
      border:1px solid ${tag === 'PERFECT' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.2)'};
      border-radius:8px;padding:8px 14px;min-width:80px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:11px;
        color:${tag === 'PERFECT' ? 'var(--green)' : '#e74c3c'};">
        ${tagLabels[tag] || tag}
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:18px;font-weight:700;
        color:${tag === 'PERFECT' ? 'var(--green)' : '#e74c3c'};">${count}×</div>
    </div>
  `).join('');
}

// ── EQUITY MODAL ──────────────────────────────────────────────────
function openEquityModal() {
  const modal = document.getElementById('equityModal');
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Render large canvas
  setTimeout(() => {
    drawEquityCurveOnCanvas(document.getElementById('equityModalCanvas'), 300);
    renderEquityModalStats();
    renderEquityTradeList();
  }, 50);
}

function closeEquityModal() {
  const modal = document.getElementById('equityModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderEquityModalStats() {
  const container = document.getElementById('equityModalStats');
  if (!container) return;

  const sorted = [...journalEntries]
    .filter(t => t.result === 'win' || t.result === 'loss')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sorted.length) { container.innerHTML = ''; return; }

  let balance = 0, peak = 0, maxDD = 0, wins = 0;
  let streak = 0, maxStreak = 0, curStreak = 0, lastResult = null;

  sorted.forEach(t => {
    const change = t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    balance += change;
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;
    if (t.result === 'win') wins++;

    if (t.result === lastResult) {
      curStreak++;
    } else {
      curStreak = 1;
      lastResult = t.result;
    }
    if (t.result === 'win' && curStreak > maxStreak) maxStreak = curStreak;
  });

  const stats = [
    { label: 'Total R Gained', value: (balance >= 0 ? '+' : '') + balance.toFixed(2) + 'R', color: balance >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Peak Equity', value: '+' + peak.toFixed(2) + 'R', color: 'var(--gold)' },
    { label: 'Max Drawdown', value: '-' + maxDD.toFixed(2) + 'R', color: '#e74c3c' },
    { label: 'Best Win Streak', value: maxStreak + ' trades', color: 'var(--blue)' },
    { label: 'Total Trades', value: sorted.length, color: 'var(--text)' },
    { label: 'Win Rate', value: ((wins / sorted.length) * 100).toFixed(1) + '%', color: wins / sorted.length >= 0.5 ? 'var(--green)' : '#e74c3c' },
  ];

  container.innerHTML = stats.map(s => `
    <div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:12px;">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">${s.label}</div>
      <div style="font-family:'DM Mono',monospace;font-size:16px;font-weight:700;color:${s.color};">${s.value}</div>
    </div>
  `).join('');
}

function renderEquityTradeList() {
  const container = document.getElementById('equityTradeList');
  if (!container) return;

  const sorted = [...journalEntries]
    .filter(t => t.result === 'win' || t.result === 'loss')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sorted.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-family:\'DM Mono\',monospace;font-size:11px;text-align:center;padding:12px;">Belum ada trade</div>';
    return;
  }

  let running = 0;
  container.innerHTML = sorted.map((t, i) => {
    const change = t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    running += change;
    const date = new Date(t.date).toLocaleDateString('id-ID', { day:'2-digit', month:'short' });
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:6px 8px;
        border-bottom:1px solid rgba(255,255,255,0.04);font-family:'DM Mono',monospace;">
        <span style="font-size:10px;color:var(--text-muted);min-width:30px;">#${i+1}</span>
        <span style="font-size:10px;color:var(--text-muted);min-width:60px;">${date}</span>
        <span style="font-size:11px;font-weight:700;min-width:60px;">${escapeHtml(String(t.symbol).toUpperCase())}</span>
        <span style="font-size:11px;min-width:50px;color:${t.result === 'win' ? 'var(--green)' : 'var(--red)'}">
          ${t.result === 'win' ? '+' + parseFloat(t.rr).toFixed(2) + 'R' : '−1R'}
        </span>
        <span style="font-size:11px;font-weight:700;color:${running >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${running >= 0 ? '+' : ''}${running.toFixed(2)}R
        </span>
      </div>
    `;
  }).join('');
}

// ── EQUITY CURVE DRAW HELPER ───────────────────────────────────────
// (Replaces original drawEquityCurve — now supports both canvases)
function drawEquityCurveOnCanvas(canvas, height) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = height || 160;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const sorted = [...journalEntries]
    .filter(t => t.result === 'win' || t.result === 'loss')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length < 1) {
    ctx.fillStyle = 'rgba(201,168,76,0.25)';
    ctx.font = '12px DM Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada trade WIN/LOSS', W / 2, H / 2);
    return;
  }

  let balance = 0;
  const points = [0];
  sorted.forEach(t => {
    balance += t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    points.push(parseFloat(balance.toFixed(2)));
  });

  const maxVal = Math.max(...points, 1);
  const minVal = Math.min(...points, -1);
  const range  = maxVal - minVal || 1;
  const pad    = { top:16, bottom:24, left:36, right:12 };
  const plotW  = W - pad.left - pad.right;
  const plotH  = H - pad.top - pad.bottom;

  const xOf = i => pad.left + (i / (points.length - 1)) * plotW;
  const yOf = v => pad.top + plotH - ((v - minVal) / range) * plotH;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [-1, 0, 1].forEach(tier => {
    const gy = yOf(tier * Math.ceil(maxVal / 2));
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
  });

  // Zero line
  const zeroY = yOf(0);
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(W - pad.right, zeroY); ctx.stroke();
  ctx.setLineDash([]);

  // Fill gradient
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, 'rgba(201,168,76,0.20)');
  grad.addColorStop(1, 'rgba(201,168,76,0.00)');
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(points[0]));
  points.forEach((v, i) => { if (i > 0) ctx.lineTo(xOf(i), yOf(v)); });
  ctx.lineTo(xOf(points.length - 1), H - pad.bottom);
  ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  points.forEach((v, i) => { i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)); });
  ctx.stroke();

  // Last point
  const lastX  = xOf(points.length - 1);
  const lastY  = yOf(points[points.length - 1]);
  const lastVal = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = lastVal >= 0 ? '#2ECC71' : '#E74C3C';
  ctx.fill();

  // Labels
  ctx.fillStyle = 'rgba(201,168,76,0.6)';
  ctx.font      = '9px DM Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(maxVal.toFixed(1) + 'R', pad.left - 4, pad.top + 8);
  ctx.fillText('0R', pad.left - 4, zeroY + 4);
  ctx.fillText(minVal.toFixed(1) + 'R', pad.left - 4, H - pad.bottom);

  ctx.fillStyle = lastVal >= 0 ? 'rgba(46,204,113,0.9)' : 'rgba(231,76,60,0.9)';
  ctx.textAlign = 'left';
  ctx.font      = '10px DM Mono, monospace';
  ctx.fillText((lastVal >= 0 ? '+' : '') + lastVal.toFixed(2) + 'R', lastX + 6, lastY + 4);

  // Update mini equity stats
  const eqStats = document.getElementById('equityStats');
  if (eqStats) {
    eqStats.textContent = `${sorted.length} trades · ${lastVal >= 0 ? '+' : ''}${lastVal.toFixed(2)}R total`;
    eqStats.style.color = lastVal >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

// Override the existing drawEquityCurve to use the new helper
function drawEquityCurve() {
  drawEquityCurveOnCanvas(document.getElementById('equityCanvas'), 160);
}

// ══════════════════════════════════════════════════════════════════
//  COMPOUNDING CALCULATOR
// ══════════════════════════════════════════════════════════════════

function switchCompTab(tab) {
  const isSimple = tab === 'simple';
  document.getElementById('compPanelSimple').style.display = isSimple ? '' : 'none';
  document.getElementById('compPanelFunded').style.display = isSimple ? 'none' : '';

  const btnS = document.getElementById('compTabSimple');
  const btnF = document.getElementById('compTabFunded');
  if (btnS) {
    btnS.style.background    = isSimple ? 'var(--gold)' : 'var(--dark3)';
    btnS.style.color         = isSimple ? '#000' : 'var(--text-muted)';
    btnS.style.fontWeight    = isSimple ? '700' : '400';
  }
  if (btnF) {
    btnF.style.background    = !isSimple ? 'var(--gold)' : 'var(--dark3)';
    btnF.style.color         = !isSimple ? '#000' : 'var(--text-muted)';
    btnF.style.fontWeight    = !isSimple ? '700' : '400';
  }
}

// ── SIMPLE COMPOUNDING ────────────────────────────────────────────
function runCompounding() {
  const initial    = parseFloat(document.getElementById('compInitial')?.value) || 10000;
  const gainPct    = parseFloat(document.getElementById('compGainPct')?.value) || 5;
  const periods    = parseInt(document.getElementById('compPeriods')?.value) || 12;
  const periodType = document.getElementById('compPeriodType')?.value || 'monthly';

  if (initial <= 0 || gainPct <= 0 || periods <= 0) {
    showToast('⚠️ Isi semua field dengan nilai positif'); return;
  }

  const multiplier = 1 + gainPct / 100;
  const dataPoints = [initial];
  for (let i = 1; i <= periods; i++) {
    dataPoints.push(dataPoints[i - 1] * multiplier);
  }

  const finalVal   = dataPoints[periods];
  const totalGain  = finalVal - initial;
  const totalGainPct = (totalGain / initial) * 100;
  const periodLabel = periodType === 'weekly' ? 'minggu' : 'bulan';

  const fmtUSD = v => '$' + v.toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const resultEl = document.getElementById('compSimpleResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">
      <div class="comp-stat-grid">
        <div class="comp-stat-item">
          <div class="comp-stat-label">Modal Awal</div>
          <div class="comp-stat-value">${fmtUSD(initial)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Modal Akhir</div>
          <div class="comp-stat-value" style="color:var(--green);">${fmtUSD(finalVal)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Total Profit</div>
          <div class="comp-stat-value" style="color:var(--green);">+${fmtUSD(totalGain)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Total Return</div>
          <div class="comp-stat-value" style="color:var(--green);">+${totalGainPct.toFixed(1)}%</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Durasi</div>
          <div class="comp-stat-value">${periods} ${periodLabel}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Gain / Periode</div>
          <div class="comp-stat-value">${gainPct}%</div>
        </div>
      </div>

      <!-- Milestones -->
      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--gold-dim);margin-bottom:8px;">MILESTONE</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${[2,5,10].map(x => {
            const target = initial * x;
            const p = Math.ceil(Math.log(x) / Math.log(multiplier));
            if (p > periods * 3) return '';
            const pLabel = periodType === 'weekly' ? 'mgg' : 'bln';
            return `<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);
              border-radius:6px;padding:6px 10px;font-family:'DM Mono',monospace;font-size:11px;">
              <span style="color:var(--gold);">${x}× modal</span>
              <span style="color:var(--text-muted);"> — ${p} ${pLabel}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // Draw compounding chart
  drawCompoundingChart(dataPoints, periodType);
}

function drawCompoundingChart(dataPoints, periodType) {
  const canvas = document.getElementById('compCanvas');
  if (!canvas) return;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = 180;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad    = { top:20, bottom:28, left:60, right:16 };
  const plotW  = W - pad.left - pad.right;
  const plotH  = H - pad.top - pad.bottom;
  const n      = dataPoints.length;
  const maxVal = Math.max(...dataPoints);
  const minVal = Math.min(...dataPoints);
  const range  = maxVal - minVal || 1;

  const xOf = i => pad.left + (i / (n - 1)) * plotW;
  const yOf = v => pad.top + plotH - ((v - minVal) / range) * plotH;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, 'rgba(46,204,113,0.25)');
  grad.addColorStop(1, 'rgba(46,204,113,0.02)');
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(dataPoints[0]));
  dataPoints.forEach((v, i) => { if (i > 0) ctx.lineTo(xOf(i), yOf(v)); });
  ctx.lineTo(xOf(n - 1), H - pad.bottom);
  ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#2ECC71';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  dataPoints.forEach((v, i) => { i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)); });
  ctx.stroke();

  // Y labels
  const fmtK = v => v >= 1000 ? '$' + (v/1000).toFixed(0) + 'K' : '$' + v.toFixed(0);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px DM Mono, monospace';
  ctx.textAlign = 'right';
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    const v = minVal + t * range;
    const y = yOf(v);
    ctx.fillText(fmtK(v), pad.left - 4, y + 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
  });

  // X labels (show start/mid/end)
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px DM Mono, monospace';
  ctx.textAlign = 'center';
  const pLabel = periodType === 'weekly' ? 'Mgg' : 'Bln';
  [0, Math.floor((n-1)/2), n-1].forEach(i => {
    ctx.fillText(pLabel + ' ' + i, xOf(i), H - pad.bottom + 14);
  });
}

// ── FUNDED CALCULATOR ─────────────────────────────────────────────
function runFundedCalculator() {
  const accountSize    = parseFloat(document.getElementById('fundedAccountSize')?.value) || 50000;
  const profitSplit    = parseFloat(document.getElementById('fundedProfitSplit')?.value) || 90;
  const profitTarget   = parseFloat(document.getElementById('fundedProfitTarget')?.value) || 10;
  const monthlyGain    = parseFloat(document.getElementById('fundedMonthlyGain')?.value) || 5;

  // Consistency rules
  const useMaxDD       = document.getElementById('ruleMaxDD')?.checked;
  const maxDDPct       = parseFloat(document.getElementById('ruleMaxDDPct')?.value) || 5;
  const useMaxOverall  = document.getElementById('ruleMaxOverall')?.checked;
  const maxOverallPct  = parseFloat(document.getElementById('ruleMaxOverallPct')?.value) || 10;
  const useConsistency = document.getElementById('ruleConsistency')?.checked;
  const consistencyPct = parseFloat(document.getElementById('ruleConsistencyPct')?.value) || 30;

  const fmtUSD = v => '$' + v.toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:2 });

  // Calculations
  const targetAmount    = accountSize * (profitTarget / 100);
  const monthsToTarget  = Math.ceil(profitTarget / monthlyGain);
  const monthlyProfit   = accountSize * (monthlyGain / 100);
  const payoutAmount    = targetAmount * (profitSplit / 100);
  const annualPayout    = payoutAmount * (12 / monthsToTarget);

  // Consistency rule checks
  const maxDailyLoss    = accountSize * (maxDDPct / 100);
  const maxOverallLoss  = accountSize * (maxOverallPct / 100);
  const consistencyMax  = monthlyProfit * (consistencyPct / 100); // max 1 day can contribute

  // Safe daily gain needed (assuming 20 trading days/month)
  const dailyGainNeeded = monthlyProfit / 20;

  // Rule validations
  const warnings = [];
  const checks   = [];

  if (useMaxDD) {
    if (dailyGainNeeded < maxDailyLoss) {
      checks.push(`✅ Daily loss limit ${fmtUSD(maxDailyLoss)} — aman dengan gain harian ${fmtUSD(dailyGainNeeded)}`);
    } else {
      warnings.push(`⚠️ Max daily loss ${fmtUSD(maxDailyLoss)} terlalu kecil relatif terhadap risiko harian kamu`);
    }
  }
  if (useMaxOverall) {
    if (maxOverallLoss >= accountSize * 0.08) {
      checks.push(`✅ Overall drawdown limit ${fmtUSD(maxOverallLoss)} (${maxOverallPct}%) — wajar`);
    } else {
      warnings.push(`⚠️ Overall drawdown ${maxOverallPct}% sangat ketat — hati-hati dengan losing streak`);
    }
  }
  if (useConsistency) {
    checks.push(`✅ Consistency rule: 1 hari max ${fmtUSD(consistencyMax)} (${consistencyPct}% dari target bulan)`);
    if (dailyGainNeeded > consistencyMax) {
      warnings.push(`⚠️ Gain harian rata-rata ${fmtUSD(dailyGainNeeded)} melebihi batas konsistensi ${fmtUSD(consistencyMax)}`);
    }
  }

  const resultEl = document.getElementById('compFundedResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--gold-dim);margin-bottom:12px;">
        📊 FUNDED ACCOUNT PROJECTION — ${fmtUSD(accountSize)}
      </div>
      <div class="comp-stat-grid">
        <div class="comp-stat-item">
          <div class="comp-stat-label">Target Profit</div>
          <div class="comp-stat-value">${fmtUSD(targetAmount)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Payout (${profitSplit}%)</div>
          <div class="comp-stat-value" style="color:var(--green);">${fmtUSD(payoutAmount)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Waktu ke Payout</div>
          <div class="comp-stat-value">${monthsToTarget} bulan</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Gain Bulanan</div>
          <div class="comp-stat-value">${fmtUSD(monthlyProfit)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Gain Harian (avg)</div>
          <div class="comp-stat-value">${fmtUSD(dailyGainNeeded)}</div>
        </div>
        <div class="comp-stat-item">
          <div class="comp-stat-label">Proyeksi Annual</div>
          <div class="comp-stat-value" style="color:var(--green);">~${fmtUSD(annualPayout)}</div>
        </div>
      </div>

      <!-- Rule Checks -->
      ${checks.map(c => `<div class="rule-ok">${c}</div>`).join('')}
      ${warnings.map(w => `<div class="rule-warning">${w}</div>`).join('')}

      <!-- Scaling Plan -->
      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
        <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--gold-dim);margin-bottom:8px;">
          📈 SCALING PLAN (jika konsisten ${monthlyGain}%/bulan)
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${[1, 3, 6, 12].map(mo => {
            const bal = accountSize * Math.pow(1 + monthlyGain/100, mo);
            const totalPayout = accountSize * (profitTarget/100) * (profitSplit/100) * Math.floor(mo / monthsToTarget);
            return `
              <div style="display:flex;align-items:center;gap:10px;font-family:'DM Mono',monospace;font-size:11px;
                background:var(--dark4);border-radius:4px;padding:6px 10px;">
                <span style="color:var(--text-muted);min-width:50px;">${mo} bln</span>
                <span style="color:var(--text);min-width:110px;">Ekuitas: <strong style="color:var(--gold);">${fmtUSD(bal)}</strong></span>
                <span style="color:var(--green);">Payout: ${totalPayout > 0 ? fmtUSD(totalPayout) : '—'}</span>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  showToast('✅ Funded plan berhasil dihitung!');
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initMistakeTagSelector();
});

// Also init if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initMistakeTagSelector();
}
