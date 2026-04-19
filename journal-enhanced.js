// ══════════════════════════════════════════════════════════════════
//  JOURNAL ENHANCED v2.1
//  + Screenshot Integration
//  + Equity Curve Modal
//  + Mistake Tagging (fixed click)
//  + Compounding Calculator (Simple + Funded)
// ══════════════════════════════════════════════════════════════════

// ── STATE ─────────────────────────────────────────────────────────
let _pendingScreenshots = [];

// ── MISTAKE TAG SELECTOR ──────────────────────────────────────────
// Tidak pakai checkbox — pakai data-selected attribute agar tidak
// ada double-click issue dari label+input interaction
function initMistakeTagSelector() {
  document.querySelectorAll('.mistake-tag-opt').forEach(function(el) {
    el.setAttribute('data-selected', 'false');
    el.classList.remove('selected');
    el.style.cssText += ';cursor:pointer;-webkit-tap-highlight-color:transparent;';
    el.onclick = function() {
      var isSelected = this.getAttribute('data-selected') === 'true';
      this.setAttribute('data-selected', isSelected ? 'false' : 'true');
      this.classList.toggle('selected', !isSelected);
    };
  });
}

function getSelectedMistakeTags() {
  return [...document.querySelectorAll('.mistake-tag-opt[data-selected="true"]')]
    .map(function(el) { return el.getAttribute('data-tag'); })
    .filter(Boolean);
}

function clearMistakeTags() {
  document.querySelectorAll('.mistake-tag-opt').forEach(function(el) {
    el.setAttribute('data-selected', 'false');
    el.classList.remove('selected');
  });
}

// ── SCREENSHOT HANDLING ────────────────────────────────────────────
function handleScreenshotSelect(input) {
  processScreenshotFiles(Array.from(input.files || []));
  input.value = '';
}

function handleScreenshotDrop(event) {
  event.preventDefault();
  document.getElementById('screenshotDropZone').style.borderColor = 'var(--border)';
  var files = Array.from(event.dataTransfer.files || []).filter(function(f) { return f.type.startsWith('image/'); });
  processScreenshotFiles(files);
}

function processScreenshotFiles(files) {
  var MAX_SIZE = 2 * 1024 * 1024;
  files.forEach(function(file) {
    if (!file.type.startsWith('image/')) { showToast('⚠️ Hanya file gambar yang diizinkan'); return; }
    if (file.size > MAX_SIZE) { showToast('⚠️ ' + file.name + ' terlalu besar (maks 2MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      _pendingScreenshots.push({ dataUrl: e.target.result, name: file.name });
      renderScreenshotPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderScreenshotPreviews() {
  var row = document.getElementById('screenshotPreviewRow');
  if (!row) return;
  row.innerHTML = _pendingScreenshots.map(function(ss, i) {
    return '<div class="screenshot-thumb" onclick="viewScreenshot(' + i + ',\'pending\')">' +
      '<img src="' + ss.dataUrl + '" alt="ss"/>' +
      '<button class="del-thumb" onclick="event.stopPropagation();removePendingScreenshot(' + i + ')">✕</button>' +
      '</div>';
  }).join('');
}

function removePendingScreenshot(i) {
  _pendingScreenshots.splice(i, 1);
  renderScreenshotPreviews();
}

function viewScreenshot(idx, source, entryIdx) {
  var url;
  if (source === 'pending') {
    url = _pendingScreenshots[idx] && _pendingScreenshots[idx].dataUrl;
  } else {
    var entry = journalEntries[entryIdx];
    url = entry && entry.screenshots && entry.screenshots[idx];
  }
  if (!url) return;
  var modal = document.getElementById('screenshotModal');
  var img   = document.getElementById('screenshotModalImg');
  if (modal && img) { img.src = url; modal.style.display = 'flex'; }
}

function closeScreenshotModal() {
  var modal = document.getElementById('screenshotModal');
  if (modal) modal.style.display = 'none';
}

// ── addJournalEntry (override) ────────────────────────────────────
function addJournalEntry() {
  var symbol = document.getElementById('journalSymbol') && document.getElementById('journalSymbol').value.trim();
  var side   = document.getElementById('journalSide') && document.getElementById('journalSide').value;
  var entry  = parseFloat(document.getElementById('journalEntry') && document.getElementById('journalEntry').value);
  var sl     = parseFloat(document.getElementById('journalSL') && document.getElementById('journalSL').value);
  var tp     = parseFloat(document.getElementById('journalTP') && document.getElementById('journalTP').value);
  var rr     = parseFloat(document.getElementById('journalRr') && document.getElementById('journalRr').value);
  var result = document.getElementById('journalResult') && document.getElementById('journalResult').value;
  var note   = document.getElementById('journalNote') && document.getElementById('journalNote').value.trim();

  if (!symbol) { showToast('⚠️ Isi Symbol terlebih dahulu'); return; }
  if (isNaN(entry) || isNaN(sl) || isNaN(tp)) { showToast('⚠️ Isi Entry, SL, TP dengan angka valid'); return; }
  if (isNaN(rr) || rr <= 0) { showToast('⚠️ Isi R:R dengan angka positif'); return; }

  var tags        = getSelectedMistakeTags();
  var screenshots = _pendingScreenshots.map(function(s) { return s.dataUrl; });

  journalEntries.unshift({
    date: new Date().toISOString(),
    symbol: symbol, side: side, entry: entry, sl: sl, tp: tp, rr: rr,
    result: result, note: note || '', tags: tags, screenshots: screenshots
  });

  saveJournal();
  ['journalSymbol','journalEntry','journalSL','journalTP','journalRr','journalNote'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  if (document.getElementById('journalResult')) document.getElementById('journalResult').value = 'pending';
  clearMistakeTags();
  _pendingScreenshots = [];
  renderScreenshotPreviews();
  showToast('✅ Trade berhasil ditambahkan!');
}

// ── renderJournal (override) ──────────────────────────────────────
function renderJournal() {
  var tbody = document.getElementById('journalBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var stats = { total:0, wins:0, totalRR:0, pfNum:0, pfDen:0 };

  journalEntries.slice().reverse().forEach(function(entry, idx) {
    var originalIdx = journalEntries.length - 1 - idx;
    var row = tbody.insertRow();
    var date = new Date(entry.date).toLocaleDateString('id-ID');
    var sideIcon   = entry.side === 'long' ? '📈' : '📉';
    var resultCls  = entry.result === 'win' ? 'style="color:var(--green);"' : entry.result === 'loss' ? 'style="color:var(--red);"' : '';
    var resultText = entry.result === 'win' ? '✅ WIN' : entry.result === 'loss' ? '❌ LOSS' : '⏳ Pending';

    var tagsHtml = (entry.tags || []).length
      ? (entry.tags || []).map(function(t) {
          return '<span class="mistake-badge ' + (t === 'PERFECT' ? 'perfect' : '') + '">' + t + '</span>';
        }).join(' ')
      : '<span style="color:var(--text-muted);font-size:10px;">—</span>';

    var ssHtml = (entry.screenshots || []).length
      ? '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">' +
        (entry.screenshots || []).map(function(_, si) {
          return '<div class="screenshot-thumb" style="width:32px;height:32px;" onclick="viewScreenshot(' + si + ',\'entry\',' + originalIdx + ')">' +
            '<img src="' + entry.screenshots[si] + '" alt="ss"/></div>';
        }).join('') + '</div>'
      : '';

    row.innerHTML =
      '<td style="font-size:11px;">' + escapeHtml(date) + '</td>' +
      '<td><strong>' + escapeHtml(String(entry.symbol).toUpperCase()) + '</strong></td>' +
      '<td>' + sideIcon + ' ' + escapeHtml(String(entry.side).toUpperCase()) + '</td>' +
      '<td>' + escapeHtml(String(entry.entry)) + '</td>' +
      '<td>' + escapeHtml(String(entry.sl)) + '</td>' +
      '<td>' + escapeHtml(String(entry.tp)) + '</td>' +
      '<td>1:' + escapeHtml(String(entry.rr)) + '</td>' +
      '<td ' + resultCls + '>' + resultText + '</td>' +
      '<td style="min-width:80px;">' + tagsHtml + ssHtml + '</td>' +
      '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + escapeHtml(entry.note || '-') + '</td>' +
      '<td><button class="action-btn" onclick="deleteJournalEntry(' + originalIdx + ')" style="padding:4px 8px;font-size:10px;">🗑</button></td>';

    stats.total++;
    if (entry.result === 'win') stats.wins++;
    if (entry.result === 'win' || entry.result === 'loss') {
      stats.totalRR += entry.rr;
      if (entry.result === 'win') stats.pfNum += entry.rr;
      else stats.pfDen += entry.rr;
    }
  });

  var winRate     = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  var avgRR       = stats.total > 0 ? (stats.totalRR / stats.total).toFixed(2) : 0;
  var profitFactor = stats.pfDen > 0 ? (stats.pfNum / stats.pfDen).toFixed(2) : stats.pfNum > 0 ? '∞' : '0';

  function s(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  s('statTotal', stats.total);
  s('statWinRate', winRate + '%');
  s('statProfitFactor', profitFactor);
  s('statAvgRR', avgRR);

  requestAnimationFrame(drawEquityCurve);
  renderMistakeTagSummary();
}

// ── MISTAKE TAG SUMMARY ───────────────────────────────────────────
function renderMistakeTagSummary() {
  var container = document.getElementById('mistakeTagSummary');
  if (!container) return;
  var now = new Date(), month = now.getMonth(), year = now.getFullYear();
  var tagCount = {};
  journalEntries.forEach(function(e) {
    var d = new Date(e.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;
    (e.tags || []).forEach(function(t) { tagCount[t] = (tagCount[t] || 0) + 1; });
  });
  var entries = Object.entries(tagCount).sort(function(a, b) { return b[1] - a[1]; });
  if (!entries.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:11px;font-family:\'DM Mono\',monospace;">Belum ada data mistake tag bulan ini</span>';
    return;
  }
  var tagLabels = { FOMO:'😱 FOMO', REVENGE:'🔥 Revenge', OVERLEV:'⚠️ Over-Leverage', LATE:'⏰ Late Entry', NOPA:'📋 No Plan', MOVED_SL:'🚫 Moved SL', EARLY_EXIT:'🏃 Early Exit', NEWS:'📰 News', TILT:'🤯 Tilt', PERFECT:'✅ Perfect' };
  container.innerHTML = entries.map(function(item) {
    var tag = item[0], count = item[1];
    var isPerfect = tag === 'PERFECT';
    var clr = isPerfect ? 'var(--green)' : '#e74c3c';
    var bg  = isPerfect ? 'rgba(46,204,113,0.08)' : 'rgba(231,76,60,0.08)';
    var bdr = isPerfect ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.2)';
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;background:' + bg + ';border:1px solid ' + bdr + ';border-radius:8px;padding:8px 14px;min-width:80px;text-align:center;">' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:' + clr + ';">' + (tagLabels[tag] || tag) + '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:18px;font-weight:700;color:' + clr + ';">' + count + '×</div>' +
      '</div>';
  }).join('');
}

// ── EQUITY MODAL ──────────────────────────────────────────────────
function openEquityModal() {
  var modal = document.getElementById('equityModal');
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  setTimeout(function() {
    drawEquityCurveOnCanvas(document.getElementById('equityModalCanvas'), 300);
    renderEquityModalStats();
    renderEquityTradeList();
  }, 50);
}

function closeEquityModal() {
  var modal = document.getElementById('equityModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderEquityModalStats() {
  var container = document.getElementById('equityModalStats');
  if (!container) return;
  var sorted = journalEntries.filter(function(t) { return t.result === 'win' || t.result === 'loss'; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  if (!sorted.length) { container.innerHTML = ''; return; }
  var balance = 0, peak = 0, maxDD = 0, wins = 0, curStreak = 0, maxStreak = 0, lastResult = null;
  sorted.forEach(function(t) {
    var change = t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    balance += change;
    if (balance > peak) peak = balance;
    var dd = peak - balance;
    if (dd > maxDD) maxDD = dd;
    if (t.result === 'win') wins++;
    if (t.result === lastResult) { curStreak++; } else { curStreak = 1; lastResult = t.result; }
    if (t.result === 'win' && curStreak > maxStreak) maxStreak = curStreak;
  });
  var stats = [
    { label:'Total R Gained', value:(balance >= 0 ? '+' : '') + balance.toFixed(2) + 'R', color: balance >= 0 ? 'var(--green)' : 'var(--red)' },
    { label:'Peak Equity', value:'+' + peak.toFixed(2) + 'R', color:'var(--gold)' },
    { label:'Max Drawdown', value:'-' + maxDD.toFixed(2) + 'R', color:'#e74c3c' },
    { label:'Best Win Streak', value:maxStreak + ' trades', color:'var(--blue)' },
    { label:'Total Trades', value:sorted.length, color:'var(--text)' },
    { label:'Win Rate', value:((wins / sorted.length) * 100).toFixed(1) + '%', color: wins / sorted.length >= 0.5 ? 'var(--green)' : '#e74c3c' }
  ];
  container.innerHTML = stats.map(function(s) {
    return '<div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:12px;">' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">' + s.label + '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:16px;font-weight:700;color:' + s.color + ';">' + s.value + '</div></div>';
  }).join('');
}

function renderEquityTradeList() {
  var container = document.getElementById('equityTradeList');
  if (!container) return;
  var sorted = journalEntries.filter(function(t) { return t.result === 'win' || t.result === 'loss'; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  if (!sorted.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-family:\'DM Mono\',monospace;font-size:11px;text-align:center;padding:12px;">Belum ada trade</div>';
    return;
  }
  var running = 0;
  container.innerHTML = sorted.map(function(t, i) {
    var change = t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    running += change;
    var date = new Date(t.date).toLocaleDateString('id-ID', { day:'2-digit', month:'short' });
    return '<div style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.04);font-family:\'DM Mono\',monospace;">' +
      '<span style="font-size:10px;color:var(--text-muted);min-width:30px;">#' + (i+1) + '</span>' +
      '<span style="font-size:10px;color:var(--text-muted);min-width:60px;">' + date + '</span>' +
      '<span style="font-size:11px;font-weight:700;min-width:60px;">' + escapeHtml(String(t.symbol).toUpperCase()) + '</span>' +
      '<span style="font-size:11px;min-width:50px;color:' + (t.result === 'win' ? 'var(--green)' : 'var(--red)') + '">' +
        (t.result === 'win' ? '+' + parseFloat(t.rr).toFixed(2) + 'R' : '−1R') + '</span>' +
      '<span style="font-size:11px;font-weight:700;color:' + (running >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
        (running >= 0 ? '+' : '') + running.toFixed(2) + 'R</span></div>';
  }).join('');
}

// ── EQUITY CURVE ──────────────────────────────────────────────────
function drawEquityCurveOnCanvas(canvas, height) {
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W   = canvas.offsetWidth;
  var H   = height || 160;
  canvas.width  = W * dpr; canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  var sorted = journalEntries.filter(function(t) { return t.result === 'win' || t.result === 'loss'; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  if (!sorted.length) {
    ctx.fillStyle = 'rgba(201,168,76,0.25)';
    ctx.font = '12px DM Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada trade WIN/LOSS', W / 2, H / 2);
    return;
  }

  var balance = 0, points = [0];
  sorted.forEach(function(t) {
    balance += t.result === 'win' ? parseFloat(t.rr || 1) : -1;
    points.push(parseFloat(balance.toFixed(2)));
  });

  var maxVal = Math.max.apply(null, points.concat([1]));
  var minVal = Math.min.apply(null, points.concat([-1]));
  var range  = maxVal - minVal || 1;
  var pad    = { top:16, bottom:24, left:36, right:12 };
  var plotW  = W - pad.left - pad.right;
  var plotH  = H - pad.top - pad.bottom;
  var n      = points.length;

  function xOf(i) { return pad.left + (i / (n - 1)) * plotW; }
  function yOf(v) { return pad.top + plotH - ((v - minVal) / range) * plotH; }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  [-1,0,1].forEach(function(tier) {
    var gy = yOf(tier * Math.ceil(maxVal / 2));
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
  });

  var zeroY = yOf(0);
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(pad.left, zeroY); ctx.lineTo(W - pad.right, zeroY); ctx.stroke();
  ctx.setLineDash([]);

  var grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, 'rgba(201,168,76,0.20)'); grad.addColorStop(1, 'rgba(201,168,76,0.00)');
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(points[0]));
  points.forEach(function(v, i) { if (i > 0) ctx.lineTo(xOf(i), yOf(v)); });
  ctx.lineTo(xOf(n-1), H - pad.bottom); ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(function(v, i) { i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v)); });
  ctx.stroke();

  var lastX = xOf(n-1), lastY = yOf(points[n-1]), lastVal = points[n-1];
  ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI*2);
  ctx.fillStyle = lastVal >= 0 ? '#2ECC71' : '#E74C3C'; ctx.fill();

  ctx.fillStyle = 'rgba(201,168,76,0.6)'; ctx.font = '9px DM Mono, monospace'; ctx.textAlign = 'right';
  ctx.fillText(maxVal.toFixed(1) + 'R', pad.left-4, pad.top+8);
  ctx.fillText('0R', pad.left-4, zeroY+4);
  ctx.fillText(minVal.toFixed(1) + 'R', pad.left-4, H-pad.bottom);

  ctx.fillStyle = lastVal >= 0 ? 'rgba(46,204,113,0.9)' : 'rgba(231,76,60,0.9)';
  ctx.textAlign = 'left'; ctx.font = '10px DM Mono, monospace';
  ctx.fillText((lastVal >= 0 ? '+' : '') + lastVal.toFixed(2) + 'R', lastX+6, lastY+4);

  var eqStats = document.getElementById('equityStats');
  if (eqStats) {
    eqStats.textContent = sorted.length + ' trades · ' + (lastVal >= 0 ? '+' : '') + lastVal.toFixed(2) + 'R total';
    eqStats.style.color = lastVal >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

function drawEquityCurve() {
  drawEquityCurveOnCanvas(document.getElementById('equityCanvas'), 160);
}

// ── JOURNAL TAB SWITCHER (Trades / Tools) ─────────────────────────
function switchJournalTab(tab) {
  var isTradesTab = tab === 'trades';
  var panelTrades = document.getElementById('jPanelTrades');
  var panelTools  = document.getElementById('jPanelTools');
  var btnTrades   = document.getElementById('jTabTrades');
  var btnTools    = document.getElementById('jTabTools');

  if (!panelTrades || !panelTools) return;

  panelTrades.style.display = isTradesTab ? '' : 'none';
  panelTools.style.display  = isTradesTab ? 'none' : '';

  if (btnTrades) {
    btnTrades.style.background  = isTradesTab ? 'var(--gold)' : 'var(--dark3)';
    btnTrades.style.color       = isTradesTab ? '#000' : 'var(--text-muted)';
    btnTrades.style.fontWeight  = isTradesTab ? '700' : '400';
  }
  if (btnTools) {
    btnTools.style.background   = !isTradesTab ? 'var(--gold)' : 'var(--dark3)';
    btnTools.style.color        = !isTradesTab ? '#000' : 'var(--text-muted)';
    btnTools.style.fontWeight   = !isTradesTab ? '700' : '400';
  }

  // Save last active tab to localStorage
  try { localStorage.setItem('ictforge_journal_tab', tab); } catch(e) {}
}

// ── COMPOUNDING ───────────────────────────────────────────────────
function switchCompTab(tab) {
  var isSimple = tab === 'simple';
  document.getElementById('compPanelSimple').style.display = isSimple ? '' : 'none';
  document.getElementById('compPanelFunded').style.display = isSimple ? 'none' : '';
  var btnS = document.getElementById('compTabSimple');
  var btnF = document.getElementById('compTabFunded');
  if (btnS) { btnS.style.background = isSimple ? 'var(--gold)' : 'var(--dark3)'; btnS.style.color = isSimple ? '#000' : 'var(--text-muted)'; btnS.style.fontWeight = isSimple ? '700' : '400'; }
  if (btnF) { btnF.style.background = !isSimple ? 'var(--gold)' : 'var(--dark3)'; btnF.style.color = !isSimple ? '#000' : 'var(--text-muted)'; btnF.style.fontWeight = !isSimple ? '700' : '400'; }
}

function runCompounding() {
  var initial    = parseFloat(document.getElementById('compInitial').value) || 10000;
  var gainPct    = parseFloat(document.getElementById('compGainPct').value) || 5;
  var periods    = parseInt(document.getElementById('compPeriods').value) || 12;
  var periodType = document.getElementById('compPeriodType').value || 'monthly';
  if (initial <= 0 || gainPct <= 0 || periods <= 0) { showToast('⚠️ Isi semua field dengan nilai positif'); return; }

  var multiplier = 1 + gainPct / 100;
  var dataPoints = [initial];
  for (var i = 1; i <= periods; i++) dataPoints.push(dataPoints[i-1] * multiplier);

  var finalVal      = dataPoints[periods];
  var totalGain     = finalVal - initial;
  var totalGainPct  = (totalGain / initial) * 100;
  var periodLabel   = periodType === 'weekly' ? 'minggu' : 'bulan';

  function fmtUSD(v) { return '$' + v.toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:2 }); }

  var milestones = [2,5,10].map(function(x) {
    var p = Math.ceil(Math.log(x) / Math.log(multiplier));
    if (p > periods * 3) return '';
    return '<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);border-radius:6px;padding:6px 10px;font-family:\'DM Mono\',monospace;font-size:11px;">' +
      '<span style="color:var(--gold);">' + x + '× modal</span>' +
      '<span style="color:var(--text-muted);"> — ' + p + ' ' + (periodType === 'weekly' ? 'mgg' : 'bln') + '</span></div>';
  }).join('');

  var resultEl = document.getElementById('compSimpleResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML =
    '<div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">' +
    '<div class="comp-stat-grid">' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Modal Awal</div><div class="comp-stat-value">' + fmtUSD(initial) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Modal Akhir</div><div class="comp-stat-value" style="color:var(--green);">' + fmtUSD(finalVal) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Total Profit</div><div class="comp-stat-value" style="color:var(--green);">+' + fmtUSD(totalGain) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Total Return</div><div class="comp-stat-value" style="color:var(--green);">+' + totalGainPct.toFixed(1) + '%</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Durasi</div><div class="comp-stat-value">' + periods + ' ' + periodLabel + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Gain / Periode</div><div class="comp-stat-value">' + gainPct + '%</div></div>' +
    '</div>' +
    (milestones ? '<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;"><div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:1px;color:var(--gold-dim);margin-bottom:8px;">MILESTONE</div><div style="display:flex;flex-wrap:wrap;gap:8px;">' + milestones + '</div></div>' : '') +
    '</div>';

  drawCompoundingChart(dataPoints, periodType);
}

function drawCompoundingChart(dataPoints, periodType) {
  var canvas = document.getElementById('compCanvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var W = canvas.offsetWidth, H = 180;
  canvas.width = W*dpr; canvas.height = H*dpr; canvas.style.height = H+'px';
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, W, H);
  var pad = { top:20, bottom:28, left:60, right:16 };
  var plotW = W-pad.left-pad.right, plotH = H-pad.top-pad.bottom, n = dataPoints.length;
  var maxVal = Math.max.apply(null, dataPoints), minVal = Math.min.apply(null, dataPoints), range = maxVal-minVal||1;
  function xOf(i) { return pad.left + (i/(n-1))*plotW; }
  function yOf(v) { return pad.top + plotH - ((v-minVal)/range)*plotH; }
  var grad = ctx.createLinearGradient(0,pad.top,0,H-pad.bottom);
  grad.addColorStop(0,'rgba(46,204,113,0.25)'); grad.addColorStop(1,'rgba(46,204,113,0.02)');
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(dataPoints[0]));
  dataPoints.forEach(function(v,i) { if(i>0) ctx.lineTo(xOf(i),yOf(v)); });
  ctx.lineTo(xOf(n-1),H-pad.bottom); ctx.lineTo(xOf(0),H-pad.bottom);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.strokeStyle='#2ECC71'; ctx.lineWidth=2.5; ctx.lineJoin='round';
  ctx.beginPath();
  dataPoints.forEach(function(v,i) { i===0?ctx.moveTo(xOf(i),yOf(v)):ctx.lineTo(xOf(i),yOf(v)); });
  ctx.stroke();
  function fmtK(v) { return v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v.toFixed(0); }
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px DM Mono, monospace'; ctx.textAlign='right';
  [0,0.25,0.5,0.75,1].forEach(function(t) {
    var v=minVal+t*range, y=yOf(v);
    ctx.fillText(fmtK(v),pad.left-4,y+3);
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke();
  });
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.textAlign='center';
  var pLabel = periodType==='weekly'?'Mgg':'Bln';
  [0,Math.floor((n-1)/2),n-1].forEach(function(i) { ctx.fillText(pLabel+' '+i, xOf(i), H-pad.bottom+14); });
}

function runFundedCalculator() {
  var accountSize   = parseFloat(document.getElementById('fundedAccountSize').value) || 50000;
  var profitSplit   = parseFloat(document.getElementById('fundedProfitSplit').value) || 90;
  var profitTarget  = parseFloat(document.getElementById('fundedProfitTarget').value) || 10;
  var monthlyGain   = parseFloat(document.getElementById('fundedMonthlyGain').value) || 5;
  var useMaxDD      = document.getElementById('ruleMaxDD').checked;
  var maxDDPct      = parseFloat(document.getElementById('ruleMaxDDPct').value) || 5;
  var useMaxOverall = document.getElementById('ruleMaxOverall').checked;
  var maxOverallPct = parseFloat(document.getElementById('ruleMaxOverallPct').value) || 10;
  var useConsistency= document.getElementById('ruleConsistency').checked;
  var consistencyPct= parseFloat(document.getElementById('ruleConsistencyPct').value) || 30;

  function fmtUSD(v) { return '$'+v.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}); }

  var targetAmount   = accountSize * (profitTarget/100);
  var monthsToTarget = Math.ceil(profitTarget/monthlyGain);
  var monthlyProfit  = accountSize * (monthlyGain/100);
  var payoutAmount   = targetAmount * (profitSplit/100);
  var annualPayout   = payoutAmount * (12/monthsToTarget);
  var maxDailyLoss   = accountSize * (maxDDPct/100);
  var maxOverallLoss = accountSize * (maxOverallPct/100);
  var consistencyMax = monthlyProfit * (consistencyPct/100);
  var dailyGainNeeded= monthlyProfit/20;

  var warnings=[], checks=[];
  if (useMaxDD) {
    if (dailyGainNeeded < maxDailyLoss) checks.push('✅ Daily loss limit ' + fmtUSD(maxDailyLoss) + ' — aman dengan gain harian ' + fmtUSD(dailyGainNeeded));
    else warnings.push('⚠️ Max daily loss ' + fmtUSD(maxDailyLoss) + ' terlalu kecil relatif terhadap risiko harian');
  }
  if (useMaxOverall) {
    if (maxOverallLoss >= accountSize*0.08) checks.push('✅ Overall drawdown limit ' + fmtUSD(maxOverallLoss) + ' (' + maxOverallPct + '%) — wajar');
    else warnings.push('⚠️ Overall drawdown ' + maxOverallPct + '% sangat ketat — hati-hati dengan losing streak');
  }
  if (useConsistency) {
    checks.push('✅ Consistency rule: 1 hari max ' + fmtUSD(consistencyMax) + ' (' + consistencyPct + '% dari target bulan)');
    if (dailyGainNeeded > consistencyMax) warnings.push('⚠️ Gain harian rata-rata ' + fmtUSD(dailyGainNeeded) + ' melebihi batas konsistensi ' + fmtUSD(consistencyMax));
  }

  var scaling = [1,3,6,12].map(function(mo) {
    var bal = accountSize * Math.pow(1+monthlyGain/100, mo);
    var totalPayout = accountSize*(profitTarget/100)*(profitSplit/100)*Math.floor(mo/monthsToTarget);
    return '<div style="display:flex;align-items:center;gap:10px;font-family:\'DM Mono\',monospace;font-size:11px;background:var(--dark4);border-radius:4px;padding:6px 10px;">' +
      '<span style="color:var(--text-muted);min-width:50px;">' + mo + ' bln</span>' +
      '<span style="color:var(--text);min-width:110px;">Ekuitas: <strong style="color:var(--gold);">' + fmtUSD(bal) + '</strong></span>' +
      '<span style="color:var(--green);">Payout: ' + (totalPayout > 0 ? fmtUSD(totalPayout) : '—') + '</span></div>';
  }).join('');

  var resultEl = document.getElementById('compFundedResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML =
    '<div style="background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:10px;">' +
    '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;color:var(--gold-dim);margin-bottom:12px;">📊 FUNDED ACCOUNT PROJECTION — ' + fmtUSD(accountSize) + '</div>' +
    '<div class="comp-stat-grid">' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Target Profit</div><div class="comp-stat-value">' + fmtUSD(targetAmount) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Payout (' + profitSplit + '%)</div><div class="comp-stat-value" style="color:var(--green);">' + fmtUSD(payoutAmount) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Waktu ke Payout</div><div class="comp-stat-value">' + monthsToTarget + ' bulan</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Gain Bulanan</div><div class="comp-stat-value">' + fmtUSD(monthlyProfit) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Gain Harian (avg)</div><div class="comp-stat-value">' + fmtUSD(dailyGainNeeded) + '</div></div>' +
    '<div class="comp-stat-item"><div class="comp-stat-label">Proyeksi Annual</div><div class="comp-stat-value" style="color:var(--green);">~' + fmtUSD(annualPayout) + '</div></div>' +
    '</div>' +
    checks.map(function(c) { return '<div class="rule-ok">'+c+'</div>'; }).join('') +
    warnings.map(function(w) { return '<div class="rule-warning">'+w+'</div>'; }).join('') +
    '<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">' +
    '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:1px;color:var(--gold-dim);margin-bottom:8px;">📈 SCALING PLAN (jika konsisten ' + monthlyGain + '%/bulan)</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;">' + scaling + '</div></div></div>';

  showToast('✅ Funded plan berhasil dihitung!');
}

// ── INIT ──────────────────────────────────────────────────────────
function _initJournalEnhanced() {
  initMistakeTagSelector();

  // Restore last active journal tab
  try {
    var lastTab = localStorage.getItem('ictforge_journal_tab') || 'trades';
    switchJournalTab(lastTab);
  } catch(e) {
    switchJournalTab('trades');
  }

  console.log('[Journal Enhanced v2.2] Loaded — tab switcher + mistake tags');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initJournalEnhanced);
} else {
  _initJournalEnhanced();
}
