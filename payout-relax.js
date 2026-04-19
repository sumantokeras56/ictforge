// ══════════════════════════════════════════════════════════════════
//  PAYOUT BOARD + RELAKSASI & FOKUS
//  ICT Forge v2.1
//  1. Papan Payout — progress motivator
//  2. Focus Music — Lo-Fi / Binaural / Rain / White Noise
//  3. Wake Lock — layar tetap hidup
//  4. Box Breathing — muncul otomatis setelah LOSS
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
//  1. PAPAN PAYOUT
// ══════════════════════════════════════════════════════════════════

var _payoutTargets = [];
var _payoutSelectedEmoji = '🎯';
var _payoutEditOpen = false;

function initPayoutBoard() {
  _payoutTargets = safeJSONParse(localStorage.getItem('ict-payout-targets'), []);
  initPayoutEmojiPicker();
  renderPayoutCards();
}

function initPayoutEmojiPicker() {
  document.querySelectorAll('.payout-emoji-opt').forEach(function(el) {
    el.onclick = function() {
      document.querySelectorAll('.payout-emoji-opt').forEach(function(e) { e.classList.remove('selected'); });
      this.classList.add('selected');
      _payoutSelectedEmoji = this.getAttribute('data-emoji');
    };
  });
  // Select first by default
  var first = document.querySelector('.payout-emoji-opt');
  if (first) { first.classList.add('selected'); _payoutSelectedEmoji = first.getAttribute('data-emoji'); }
}

function togglePayoutEdit() {
  _payoutEditOpen = !_payoutEditOpen;
  var panel = document.getElementById('payoutEditPanel');
  var btn   = document.getElementById('payoutEditBtn');
  if (panel) panel.style.display = _payoutEditOpen ? 'block' : 'none';
  if (btn)   btn.textContent = _payoutEditOpen ? '✕ Tutup' : '✏️ Edit Target';
}

function savePayoutTarget() {
  var name    = (document.getElementById('payoutTargetName')?.value || '').trim();
  var value   = parseFloat(document.getElementById('payoutTargetValue')?.value);
  var account = parseFloat(document.getElementById('payoutAccountSize')?.value);
  var split   = parseFloat(document.getElementById('payoutSplit')?.value) || 90;

  if (!name)        { showToast('⚠️ Isi nama target'); return; }
  if (isNaN(value) || value <= 0) { showToast('⚠️ Isi nilai target'); return; }
  if (isNaN(account) || account <= 0) { showToast('⚠️ Isi modal akun'); return; }

  var target = {
    id:       Date.now(),
    name:     name,
    value:    value,
    account:  account,
    split:    split,
    emoji:    _payoutSelectedEmoji,
    created:  new Date().toISOString()
  };

  _payoutTargets.push(target);
  localStorage.setItem('ict-payout-targets', JSON.stringify(_payoutTargets));

  // Reset form
  ['payoutTargetName','payoutTargetValue','payoutAccountSize'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  togglePayoutEdit();
  renderPayoutCards();
  showToast('🎯 Target berhasil disimpan!');
}

function deletePayoutTarget(id) {
  _payoutTargets = _payoutTargets.filter(function(t) { return t.id !== id; });
  localStorage.setItem('ict-payout-targets', JSON.stringify(_payoutTargets));
  renderPayoutCards();
}

function getPayoutProgress(target) {
  // Calculate total payout earned from journal entries
  var totalR = 0;
  if (typeof journalEntries !== 'undefined') {
    journalEntries.forEach(function(e) {
      if (e.result === 'win')  totalR += parseFloat(e.rr || 1);
      if (e.result === 'loss') totalR -= 1;
    });
  }
  // Convert R to $ (rough: 1R = 1% of account * split)
  var rValueUSD  = target.account * 0.01 * (target.split / 100);
  var earnedUSD  = Math.max(0, totalR * rValueUSD);
  var pct        = Math.min(100, (earnedUSD / target.value) * 100);
  return { earned: earnedUSD, pct: pct, totalR: totalR };
}

function renderPayoutCards() {
  var container = document.getElementById('payoutCards');
  if (!container) return;

  if (!_payoutTargets.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-family:\'DM Mono\',monospace;font-size:12px;text-align:center;padding:24px;background:var(--dark3);border:1px dashed var(--border);border-radius:8px;">Belum ada target. Klik <strong style="color:var(--gold);">✏️ Edit Target</strong> untuk mulai.</div>';
    return;
  }

  function fmtUSD(v) { return '$' + v.toLocaleString('id-ID', { minimumFractionDigits:2, maximumFractionDigits:2 }); }

  container.innerHTML = _payoutTargets.map(function(target) {
    var prog = getPayoutProgress(target);
    var pct  = prog.pct.toFixed(1);
    var milestoneMsg = '';
    if (prog.pct >= 100) milestoneMsg = '<div style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--green);margin-top:8px;text-align:center;animation:pulse 1s ease infinite;">🎉 TARGET TERCAPAI! Kamu luar biasa! 🎉</div>';
    else if (prog.pct >= 75) milestoneMsg = '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--gold);margin-top:6px;">⚡ 75% tercapai — hampir sampai, tetap disiplin!</div>';
    else if (prog.pct >= 50) milestoneMsg = '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--blue);margin-top:6px;">💪 Setengah jalan — pertahankan konsistensi!</div>';

    return '<div style="background:var(--dark3);border:1px solid var(--border);border-radius:10px;padding:18px;position:relative;">' +
      '<button onclick="deletePayoutTarget(' + target.id + ')" style="position:absolute;top:12px;right:12px;background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;" title="Hapus target">✕</button>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
        '<div style="font-size:36px;line-height:1;">' + target.emoji + '</div>' +
        '<div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:14px;font-weight:700;color:var(--text);">' + escapeHtml(target.name) + '</div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);margin-top:2px;">Target: <span style="color:var(--gold);">' + fmtUSD(target.value) + '</span> · Akun: ' + fmtUSD(target.account) + ' · Split: ' + target.split + '%</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);margin-bottom:6px;">' +
        '<span>Progress: <strong style="color:' + (prog.pct >= 100 ? 'var(--green)' : 'var(--gold)') + ';">' + fmtUSD(prog.earned) + '</strong></span>' +
        '<span><strong style="color:' + (prog.pct >= 100 ? 'var(--green)' : 'var(--gold)') + ';">' + pct + '%</strong></span>' +
      '</div>' +
      '<div class="payout-progress-bar">' +
        '<div class="payout-progress-fill" style="width:' + pct + '%;' + (prog.pct >= 100 ? 'background:linear-gradient(90deg,#2ECC71,#27AE60);' : '') + '"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-muted);margin-top:4px;">' +
        '<span>$0</span><span>' + fmtUSD(target.value) + '</span>' +
      '</div>' +
      milestoneMsg +
    '</div>';
  }).join('');
}

// Refresh payout board setiap kali journal dirender
var _origRenderJournal = window.renderJournal;
if (typeof renderJournal === 'function') {
  var _payoutOrigRender = renderJournal;
  renderJournal = function() {
    _payoutOrigRender();
    renderPayoutCards();
  };
}

// ══════════════════════════════════════════════════════════════════
//  2. FOCUS MUSIC — Web Audio API (generated tones, no external CDN)
// ══════════════════════════════════════════════════════════════════

var _audioCtx      = null;
var _musicNodes    = [];
var _musicPlaying  = false;
var _currentTrack  = 'lofi';
var _musicVolume   = 0.4;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function stopAllMusic() {
  _musicNodes.forEach(function(n) {
    try { n.stop(); } catch(e) {}
  });
  _musicNodes = [];
}

function createLoFi(ctx, masterGain) {
  // Simple Lo-Fi: layered sine waves with gentle rhythm simulation
  var freqs = [220, 277.18, 329.63, 440, 369.99, 293.66];
  freqs.forEach(function(freq, i) {
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    var filt = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    // Slow pitch drift for Lo-Fi feel
    osc.frequency.linearRampToValueAtTime(freq * 1.002, ctx.currentTime + 8 + i);

    filt.type = 'lowpass';
    filt.frequency.value = 800;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06 / freqs.length, ctx.currentTime + 2 + i * 0.3);

    // Gentle tremolo
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    lfo.frequency.value = 0.3 + i * 0.05;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    osc.start();
    _musicNodes.push(osc, lfo);
  });

  // Add subtle noise for vinyl feel
  var bufLen = ctx.sampleRate * 2;
  var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.008;
  var src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  var nGain = ctx.createGain();
  nGain.gain.value = 0.015;
  src.connect(nGain);
  nGain.connect(masterGain);
  src.start();
  _musicNodes.push(src);
}

function createBinaural(ctx, masterGain) {
  // Alpha binaural: 10Hz beat (left: 200Hz, right: 210Hz)
  var merger = ctx.createChannelMerger(2);
  merger.connect(masterGain);

  [[200, 0], [210, 1]].forEach(function(pair) {
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    var splitter = ctx.createChannelSplitter(1);
    osc.type = 'sine';
    osc.frequency.value = pair[0];
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 3);
    osc.connect(gain);
    gain.connect(merger, 0, pair[1]);
    osc.start();
    _musicNodes.push(osc);
  });
}

function createRain(ctx, masterGain) {
  // Brown noise (rain-like)
  var bufLen = ctx.sampleRate * 4;
  var buf    = ctx.createBuffer(2, bufLen, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var data  = buf.getChannelData(ch);
    var last  = 0;
    for (var i = 0; i < bufLen; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  var src   = ctx.createBufferSource();
  var filt  = ctx.createBiquadFilter();
  var gain  = ctx.createGain();
  src.buffer = buf;
  src.loop   = true;
  filt.type  = 'lowpass';
  filt.frequency.value = 600;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(masterGain);
  src.start();
  _musicNodes.push(src);

  // Thunder effect every ~20s
  var thunderInterval = setInterval(function() {
    if (!_musicPlaying) { clearInterval(thunderInterval); return; }
    var tBuf  = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    var tData = tBuf.getChannelData(0);
    for (var i = 0; i < tData.length; i++) {
      tData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.8));
    }
    var tSrc   = ctx.createBufferSource();
    var tFilt  = ctx.createBiquadFilter();
    var tGain  = ctx.createGain();
    tSrc.buffer = tBuf;
    tFilt.type  = 'lowpass';
    tFilt.frequency.value = 200;
    tGain.gain.value = 0.4;
    tSrc.connect(tFilt);
    tFilt.connect(tGain);
    tGain.connect(masterGain);
    tSrc.start();
  }, 18000 + Math.random() * 10000);
}

function createWhiteNoise(ctx, masterGain) {
  var bufLen = ctx.sampleRate * 2;
  var buf    = ctx.createBuffer(2, bufLen, ctx.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var data = buf.getChannelData(ch);
    for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  }
  var src  = ctx.createBufferSource();
  var gain = ctx.createGain();
  src.buffer = buf;
  src.loop   = true;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1);
  src.connect(gain);
  gain.connect(masterGain);
  src.start();
  _musicNodes.push(src);
}

var _masterGainNode = null;

function toggleMusic() {
  var btn = document.getElementById('musicPlayBtn');
  if (_musicPlaying) {
    stopAllMusic();
    if (_masterGainNode) {
      _masterGainNode.gain.linearRampToValueAtTime(0, getAudioCtx().currentTime + 0.5);
      setTimeout(function() {
        try { _audioCtx.suspend(); } catch(e) {}
      }, 600);
    }
    _musicPlaying = false;
    if (btn) { btn.textContent = '▶ PLAY'; btn.style.color = 'var(--green)'; btn.style.borderColor = 'rgba(46,204,113,0.4)'; btn.style.background = 'rgba(46,204,113,0.12)'; }
    showToast('🎵 Musik dimatikan');
  } else {
    playMusic(_currentTrack);
  }
}

function playMusic(track) {
  stopAllMusic();
  var ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  _masterGainNode = ctx.createGain();
  _masterGainNode.gain.value = _musicVolume;
  _masterGainNode.connect(ctx.destination);

  if (track === 'lofi')      createLoFi(ctx, _masterGainNode);
  else if (track === 'binaural') createBinaural(ctx, _masterGainNode);
  else if (track === 'rain')     createRain(ctx, _masterGainNode);
  else if (track === 'white')    createWhiteNoise(ctx, _masterGainNode);

  _musicPlaying = true;
  var btn = document.getElementById('musicPlayBtn');
  if (btn) { btn.textContent = '⏸ PAUSE'; btn.style.color = 'var(--gold)'; btn.style.borderColor = 'rgba(201,168,76,0.4)'; btn.style.background = 'rgba(201,168,76,0.1)'; }

  var trackNames = { lofi:'Lo-Fi Hip Hop', binaural:'Binaural Beats', rain:'Rain & Thunder', white:'White Noise' };
  showToast('🎵 ' + (trackNames[track] || track) + ' — Playing');
}

function selectTrack(btn, track) {
  _currentTrack = track;
  document.querySelectorAll('.music-track-btn').forEach(function(b) {
    b.classList.remove('active-track');
    b.style.background = 'transparent';
    b.style.borderColor = 'var(--border)';
    b.style.color = 'var(--text-muted)';
  });
  btn.classList.add('active-track');
  if (_musicPlaying) playMusic(track);
}

function setMusicVolume(val) {
  _musicVolume = val / 100;
  if (_masterGainNode) _masterGainNode.gain.value = _musicVolume;
  var lbl = document.getElementById('musicVolLabel');
  if (lbl) lbl.textContent = val + '%';
}

// ══════════════════════════════════════════════════════════════════
//  3. WAKE LOCK
// ══════════════════════════════════════════════════════════════════

var _wakeLock = null;

async function toggleWakeLock() {
  var btn    = document.getElementById('wakeLockBtn');
  var status = document.getElementById('wakeLockStatus');

  if (_wakeLock) {
    await _wakeLock.release();
    _wakeLock = null;
    if (btn)    { btn.textContent = 'Aktifkan'; btn.style.background = 'var(--dark4)'; btn.style.color = 'var(--text-muted)'; btn.style.borderColor = 'var(--border)'; }
    if (status) { status.textContent = 'OFF'; status.style.color = 'var(--text-muted)'; }
    showToast('📺 Screen lock: OFF');
    return;
  }

  if (!('wakeLock' in navigator)) {
    showToast('⚠️ Browser kamu tidak mendukung Wake Lock');
    return;
  }

  try {
    _wakeLock = await navigator.wakeLock.request('screen');
    if (btn)    { btn.textContent = 'Matikan'; btn.style.background = 'rgba(46,204,113,0.12)'; btn.style.color = 'var(--green)'; btn.style.borderColor = 'rgba(46,204,113,0.4)'; }
    if (status) { status.textContent = '🟢 AKTIF'; status.style.color = 'var(--green)'; }
    showToast('📺 Layar akan tetap hidup');

    _wakeLock.addEventListener('release', function() {
      _wakeLock = null;
      if (btn)    { btn.textContent = 'Aktifkan'; btn.style.background = 'var(--dark4)'; btn.style.color = 'var(--text-muted)'; btn.style.borderColor = 'var(--border)'; }
      if (status) { status.textContent = 'OFF'; status.style.color = 'var(--text-muted)'; }
    });
  } catch(e) {
    showToast('❌ Wake Lock gagal: ' + e.message);
  }
}

// Re-acquire wake lock after visibility change (required by spec)
document.addEventListener('visibilitychange', async function() {
  if (_wakeLock && document.visibilityState === 'visible') {
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
  }
});

// ══════════════════════════════════════════════════════════════════
//  4. BOX BREATHING — smooth rAF engine
// ══════════════════════════════════════════════════════════════════

var _breathRAF        = null;
var _breathRunning    = false;
var _breathPhase      = 0;   // 0=inhale 1=hold 2=exhale 3=hold
var _breathCycle      = 0;
var _breathPhaseStart = 0;   // performance.now() timestamp
var BREATH_TOTAL_CYCLES = 4;
var BREATH_PHASE_SEC    = 4;
var CIRC                = 553; // 2 * PI * 88

var _breathPhases = [
  { label: 'TARIK NAPAS', color: '#5B9BD5', instruction: 'Hirup udara perlahan<br>melalui hidung...' },
  { label: 'TAHAN',       color: '#C9A84C', instruction: 'Tahan napas kamu.<br>Tetap tenang...' },
  { label: 'HEMBUSKAN',   color: '#2ECC71', instruction: 'Hembuskan perlahan<br>melalui mulut...' },
  { label: 'TAHAN',       color: '#9B59B6', instruction: 'Tahan. Bersiap<br>untuk siklus berikutnya...' }
];

// Cache DOM elements once
var _bEls = {};
function _breathEls() {
  if (!_bEls.count) {
    _bEls.count  = document.getElementById('breathCountdown');
    _bEls.label  = document.getElementById('breathPhaseLabel');
    _bEls.circ   = document.getElementById('breathCircle');
    _bEls.cycle  = document.getElementById('breathCycleLabel');
    _bEls.inst   = document.getElementById('breathInstruction');
    _bEls.btn    = document.getElementById('breathStartBtn');
  }
  return _bEls;
}

function openBreathingModal() {
  var modal = document.getElementById('breathingModal');
  if (modal) {
    modal.style.display = 'flex';
    _bEls = {}; // reset cache so elements are re-fetched
    resetBreathing();
  }
}

function closeBreathingModal() {
  stopBreathing();
  var modal = document.getElementById('breathingModal');
  if (modal) modal.style.display = 'none';
}

function resetBreathing() {
  stopBreathing();
  _breathPhase = 0; _breathCycle = 0; _breathPhaseStart = 0;
  var e = _breathEls();
  if (e.count) { e.count.style.transition = 'none'; e.count.textContent = BREATH_PHASE_SEC; }
  if (e.label) { e.label.textContent = 'SIAP'; e.label.style.color = '#5B9BD5'; }
  if (e.circ)  {
    e.circ.style.transition = 'none';
    e.circ.style.stroke = '#5B9BD5';
    e.circ.style.strokeDashoffset = CIRC;
  }
  if (e.cycle) e.cycle.textContent = 'Siklus 1 / ' + BREATH_TOTAL_CYCLES;
  if (e.inst)  e.inst.innerHTML = 'Temukan posisi nyaman.<br>Kita akan bernapas bersama.';
  if (e.btn)   { e.btn.textContent = '▶ MULAI'; e.btn.onclick = startBreathing; }
}

function _breathTick(timestamp) {
  if (!_breathRunning) return;

  if (!_breathPhaseStart) _breathPhaseStart = timestamp;
  var elapsed  = (timestamp - _breathPhaseStart) / 1000; // seconds
  var phaseDur = BREATH_PHASE_SEC;
  var progress = Math.min(elapsed / phaseDur, 1);

  var phase    = _breathPhases[_breathPhase];
  var secsLeft = Math.ceil(phaseDur - elapsed);
  if (secsLeft < 1) secsLeft = 1;

  var e = _breathEls();

  // Smooth circle — always real-time
  if (e.circ) {
    e.circ.style.transition = 'stroke 0.4s ease';
    e.circ.style.stroke = phase.color;
    e.circ.style.strokeDashoffset = CIRC - (CIRC * progress);
  }

  // Countdown number — update only when digit changes, with fade
  if (e.count && e.count.textContent !== String(secsLeft)) {
    e.count.style.transition = 'opacity 0.15s ease';
    e.count.style.opacity = '0';
    var _secsLeft = secsLeft;
    setTimeout(function() {
      if (e.count) {
        e.count.textContent = _secsLeft;
        e.count.style.opacity = '1';
      }
    }, 150);
  }

  // Label & instruction
  if (e.label) { e.label.textContent = phase.label; e.label.style.color = phase.color; }
  if (e.inst)  e.inst.innerHTML = phase.instruction;
  if (e.cycle) e.cycle.textContent = 'Siklus ' + (_breathCycle + 1) + ' / ' + BREATH_TOTAL_CYCLES;

  // Phase complete?
  if (progress >= 1) {
    _breathPhase++;
    _breathPhaseStart = timestamp;

    if (_breathPhase >= 4) {
      _breathPhase = 0;
      _breathCycle++;
      if (_breathCycle >= BREATH_TOTAL_CYCLES) {
        stopBreathing();
        finishBreathing();
        return;
      }
    }
  }

  _breathRAF = requestAnimationFrame(_breathTick);
}

function startBreathing() {
  if (_breathRunning) return;
  _breathRunning    = true;
  _breathPhaseStart = 0;

  var e = _breathEls();
  if (e.btn) { e.btn.textContent = '⏹ STOP'; e.btn.onclick = function() { resetBreathing(); }; }

  _breathRAF = requestAnimationFrame(_breathTick);
}

function stopBreathing() {
  _breathRunning = false;
  if (_breathRAF) { cancelAnimationFrame(_breathRAF); _breathRAF = null; }
}

function finishBreathing() {
  var e = _breathEls();
  if (e.count) { e.count.style.transition = 'none'; e.count.textContent = '✓'; }
  if (e.label) { e.label.textContent = 'SELESAI'; e.label.style.color = '#2ECC71'; }
  if (e.circ)  {
    e.circ.style.transition = 'stroke-dashoffset 0.8s ease, stroke 0.4s ease';
    e.circ.style.stroke = '#2ECC71';
    e.circ.style.strokeDashoffset = '0';
  }
  if (e.inst)  e.inst.innerHTML = 'Bagus sekali! 🎉<br>Kamu sudah lebih tenang.<br>Jangan buka trade dulu — tunggu<br>5 menit sebelum keputusan berikutnya.';
  if (e.btn)   { e.btn.textContent = '🔄 ULANGI'; e.btn.onclick = function() { resetBreathing(); startBreathing(); }; }
}

// ── AUTO-TRIGGER BREATHING SETELAH LOSS ──────────────────────────
// Hook ke addJournalEntry — intercept saat result = loss
(function hookBreathingAfterLoss() {
  var originalAdd = window.addJournalEntry;
  if (typeof originalAdd !== 'function') return;

  window.addJournalEntry = function() {
    var resultEl = document.getElementById('journalResult');
    var wasLoss  = resultEl && resultEl.value === 'loss';
    originalAdd.apply(this, arguments);
    if (wasLoss) {
      setTimeout(function() {
        showToast('😮‍💨 Catat LOSS — Tarik napas sebentar ya...');
        setTimeout(function() { openBreathingModal(); }, 1500);
      }, 800);
    }
  };
})();

// Also hook renderJournal for payout refresh
(function hookPayoutRefresh() {
  var orig = window.renderJournal;
  if (typeof orig !== 'function') return;
  window.renderJournal = function() {
    orig.apply(this, arguments);
    renderPayoutCards();
  };
})();

// ── INIT ─────────────────────────────────────────────────────────
function _initPayoutRelax() {
  initPayoutBoard();
  console.log('[Payout+Relax v2.1] Loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initPayoutRelax);
} else {
  _initPayoutRelax();
}
