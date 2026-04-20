// ══════════════════════════════════════════════════════════════════════
//  ICT FORGE — APP CORE v3.0
//  Centralized State · Init System · Event Delegation · Bug Fixes
//  Fixes: Journal CRUD, Trade Detail, Edit Pending,
//  Compounding Calculator, Screenshots, AI Review,
//         AI Integration, API Key Unification, Schema v2, Performance
// ══════════════════════════════════════════════════════════════════════

(function (window) {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  // 0. CONSTANTS & SCHEMA
  // ─────────────────────────────────────────────────────────────────
  var SCHEMA_VERSION = 2;
  var JOURNAL_KEY    = 'ict-journal';
  var SCHEMA_VER_KEY = 'ict-journal-schema-version';
  var GROQ_KEY_KEY   = 'ict-groq-apikey';          // unified key name
  var BIAS_NOTE_KEY  = 'ict-daily-bias-note';

  // Unified API key getters/setters (used by both main.js & ictforge-ai)
  window.getGroqApiKey = function () {
    // Try unified key first, then legacy keys
    return localStorage.getItem(GROQ_KEY_KEY) ||
           localStorage.getItem('ictforge_groq_key') ||
           '';
  };
  window.setGroqApiKey = function (key) {
    localStorage.setItem(GROQ_KEY_KEY, key);
    localStorage.setItem('ictforge_groq_key', key); // keep legacy in sync
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. CENTRALIZED STATE
  // ─────────────────────────────────────────────────────────────────
  var AppState = {
    journal: [],
    _saving: false,

    load: function () {
      try {
        var raw = localStorage.getItem(JOURNAL_KEY);
        var data = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(data)) data = [];
        this.journal = this._migrate(data);
        // Sync to global journalEntries expected by main.js/journal-enhanced.js
        window.journalEntries = this.journal;
      } catch (e) {
        console.error('[AppCore] Failed to load journal:', e);
        this.journal = [];
        window.journalEntries = [];
      }
    },

    save: function () {
      if (this._saving) return; // debounce double-save
      this._saving = true;
      try {
        window.journalEntries = this.journal; // keep in sync
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(this.journal));
        localStorage.setItem(SCHEMA_VER_KEY, String(SCHEMA_VERSION));
      } catch (e) {
        console.error('[AppCore] Failed to save journal:', e);
        showToastSafe('❌ Gagal menyimpan — storage penuh?');
      } finally {
        var self = this;
        setTimeout(function () { self._saving = false; }, 50);
      }
    },

    // ── Generate stable entry ID ──
    _genId: function () {
      try {
        return crypto.randomUUID();
      } catch (e) {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
      }
    },

    // ── Schema migration: v1 → v2 ──
    _migrate: function (entries) {
      var changed = false;
      var migrated = entries.map(function (e) {
        if (!e) return null;
        var updated = Object.assign({}, e);
        // Add stable ID if missing
        if (!updated.id) { updated.id = AppState._genId(); changed = true; }
        // Ensure arrays
        if (!Array.isArray(updated.tags))        { updated.tags = [];        changed = true; }
        if (!Array.isArray(updated.screenshots)) { updated.screenshots = []; changed = true; }
        // Ensure aiReview field
        if (typeof updated.aiReview === 'undefined') { updated.aiReview = null; changed = true; }
        // Ensure result field
        if (!updated.result) { updated.result = 'pending'; changed = true; }
        return updated;
      }).filter(Boolean);

      if (changed) {
        try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(migrated)); } catch (e) {}
        console.log('[AppCore] Journal migrated to schema v' + SCHEMA_VERSION);
      }
      return migrated;
    },

    // ── Add entry ──
    addEntry: function (data) {
      var entry = {
        id:          this._genId(),
        date:        new Date().toISOString(),
        symbol:      (data.symbol || '').toUpperCase().trim(),
        side:        data.side || 'long',
        entry:       parseFloat(data.entry) || 0,
        sl:          parseFloat(data.sl)    || 0,
        tp:          parseFloat(data.tp)    || 0,
        rr:          parseFloat(data.rr)    || 1,
        result:      data.result  || 'pending',
        note:        (data.note   || '').trim(),
        tags:        Array.isArray(data.tags)        ? data.tags        : [],
        screenshots: Array.isArray(data.screenshots) ? data.screenshots : [],
        aiReview:    null
      };
      this.journal.unshift(entry);
      this.save();
      window.journalEntries = this.journal;
      return entry;
    },

    // ── Update entry by id ──
    updateEntry: function (id, fields) {
      var idx = this._findIdx(id);
      if (idx === -1) return false;
      var entry = this.journal[idx];
      Object.keys(fields).forEach(function (k) {
        if (k !== 'id' && k !== 'date') entry[k] = fields[k];
      });
      this.save();
      window.journalEntries = this.journal;
      return true;
    },

    // ── Delete entry by id ──
    deleteEntry: function (id) {
      var idx = this._findIdx(id);
      if (idx === -1) return false;
      this.journal.splice(idx, 1);
      this.save();
      window.journalEntries = this.journal;
      return true;
    },

    // ── Find index by id ──
    _findIdx: function (id) {
      for (var i = 0; i < this.journal.length; i++) {
        if (this.journal[i].id === id) return i;
      }
      return -1;
    },

    getById: function (id) {
      return this.journal[this._findIdx(id)] || null;
    }
  };

  window.AppState = AppState;

  // ─────────────────────────────────────────────────────────────────
  // 2. SAFE HELPERS
  // ─────────────────────────────────────────────────────────────────
  function showToastSafe(msg, duration) {
    if (typeof showToast === 'function') showToast(msg, duration);
    else console.log('[Toast]', msg);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. JOURNAL RENDER (production-grade override)
  // ─────────────────────────────────────────────────────────────────
  // NOTE v2.4: Mistake Tags dihapus per permintaan user.
  // Kolom ke-9 di tabel sekarang menampilkan thumbnail screenshot.

  window.renderJournal = function () {
    AppState.journal = window.journalEntries || AppState.journal;
    var tbody = document.getElementById('journalBody');
    if (!tbody) return;

    var entries = AppState.journal;

    // ── Empty state ──
    if (!entries.length) {
      tbody.innerHTML =
        '<tr><td colspan="11" style="text-align:center;padding:40px 20px;' +
        'color:var(--text-muted);font-family:\'DM Mono\',monospace;font-size:12px;">' +
        '📋 Belum ada trade. Tambahkan trade pertama kamu!</td></tr>';
      _updateStats({ total:0, wins:0, totalRR:0, pfNum:0, pfDen:0 });
      if (typeof drawEquityCurve === 'function') drawEquityCurve();
      return;
    }

    var stats = { total:0, wins:0, totalRR:0, pfNum:0, pfDen:0 };
    var html = '';

    entries.forEach(function (entry, idx) {
      if (!entry) return;
      var id        = entry.id || ('idx-' + idx);
      var date      = new Date(entry.date).toLocaleDateString('id-ID');
      var sideIcon  = entry.side === 'long' ? '📈' : '📉';
      var rClass    = entry.result === 'win'  ? 'style="color:var(--green);"' :
                      entry.result === 'loss' ? 'style="color:var(--red);"'  : '';
      var rText     = entry.result === 'win'  ? '✅ WIN' :
                      entry.result === 'loss' ? '❌ LOSS' : '⏳ Pending';
      var isPending = entry.result === 'pending';

      var ssCount = (entry.screenshots || []).length;
      var ssHtml  = ssCount
        ? '<div style="display:flex;gap:3px;flex-wrap:wrap;">' +
          (entry.screenshots).slice(0, 3).map(function (url, si) {
            return '<div class="screenshot-thumb" style="width:28px;height:28px;" onclick="event.stopPropagation();viewScreenshot(' + si + ',\'entry\',' + AppState._findIdx(entry.id) + ')">' +
              '<img src="' + esc(url) + '" alt="ss"/></div>';
          }).join('') +
          (ssCount > 3 ? '<span style="font-size:10px;color:var(--text-muted);align-self:center;">+' + (ssCount - 3) + '</span>' : '') +
          '</div>'
        : '<span style="color:var(--text-muted);font-size:10px;">—</span>';

      var aiHtml = entry.aiReview
        ? '<span style="font-size:10px;color:var(--green);margin-left:4px;" title="AI Review tersedia">🤖</span>'
        : '';

      // Each row is clickable for detail; delete/edit are separate buttons
      html +=
        '<tr class="journal-row" data-id="' + esc(id) + '" style="cursor:pointer;" title="Tap untuk detail">' +
        '<td style="font-size:11px;">' + esc(date) + '</td>' +
        '<td><strong>' + esc(String(entry.symbol || '').toUpperCase()) + '</strong>' + aiHtml + '</td>' +
        '<td>' + sideIcon + ' ' + esc(String(entry.side || '').toUpperCase()) + '</td>' +
        '<td>' + esc(String(entry.entry || '')) + '</td>' +
        '<td>' + esc(String(entry.sl    || '')) + '</td>' +
        '<td>' + esc(String(entry.tp    || '')) + '</td>' +
        '<td>1:' + esc(String(entry.rr   || '')) + '</td>' +
        '<td ' + rClass + '>' + rText + '</td>' +
        '<td style="min-width:60px;">' + ssHtml + '</td>' +
        '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + esc(entry.note || '—') + '</td>' +
        '<td style="white-space:nowrap;">' +
          (isPending
            ? '<button class="action-btn btn-edit-entry" data-id="' + esc(id) + '" style="padding:4px 8px;font-size:10px;margin-right:4px;" onclick="event.stopPropagation();">✏️</button>'
            : '') +
          '<button class="action-btn btn-delete-entry" data-id="' + esc(id) + '" style="padding:4px 8px;font-size:10px;background:rgba(231,76,60,0.08);border-color:var(--red);color:var(--red);" onclick="event.stopPropagation();">🗑</button>' +
        '</td>' +
        '</tr>';

      stats.total++;
      if (entry.result === 'win') stats.wins++;
      if (entry.result === 'win' || entry.result === 'loss') {
        stats.totalRR += parseFloat(entry.rr) || 0;
        if (entry.result === 'win')  stats.pfNum += parseFloat(entry.rr) || 0;
        else                         stats.pfDen += 1;
      }
    });

    tbody.innerHTML = html;
    _updateStats(stats);
    if (typeof drawEquityCurve           === 'function') requestAnimationFrame(drawEquityCurve);
  };

  // ── Also expose as renderJournalTable (legacy call in _onTabLoaded) ──
  window.renderJournalTable = window.renderJournal;

  function _updateStats(stats) {
    var winRate      = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
    var avgRR        = stats.total > 0 ? (stats.totalRR / stats.total).toFixed(2) : 0;
    var profitFactor = stats.pfDen > 0 ? (stats.pfNum / stats.pfDen).toFixed(2) : stats.pfNum > 0 ? '∞' : '0';
    function s(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    s('statTotal',        stats.total);
    s('statWinRate',      winRate + '%');
    s('statProfitFactor', profitFactor);
    s('statAvgRR',        avgRR);
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. ADD JOURNAL ENTRY (override — schema-aware, ID-based)
  // ─────────────────────────────────────────────────────────────────
  window.addJournalEntry = function () {
    var symbol = _val('journalSymbol');
    var side   = _val('journalSide')   || 'long';
    var entry  = parseFloat(_val('journalEntry'));
    var sl     = parseFloat(_val('journalSL'));
    var tp     = parseFloat(_val('journalTP'));
    var rr     = parseFloat(_val('journalRr'));
    var result = _val('journalResult') || 'pending';
    var note   = _val('journalNote');

    if (!symbol)             { showToastSafe('⚠️ Isi Symbol terlebih dahulu'); return; }
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) { showToastSafe('⚠️ Isi Entry, SL, TP dengan angka valid'); return; }
    if (isNaN(rr) || rr <= 0) { showToastSafe('⚠️ R:R harus lebih dari 0'); return; }

    // Double-submit guard
    var btn = document.querySelector('button[onclick*="addJournalEntry"]');
    if (btn && btn._submitting) return;
    if (btn) { btn._submitting = true; setTimeout(function () { btn._submitting = false; }, 1500); }

    var screenshots = (typeof _pendingScreenshots !== 'undefined' && Array.isArray(_pendingScreenshots))
      ? _pendingScreenshots.map(function (s) { return s.dataUrl; })
      : [];

    var newEntry = AppState.addEntry({ symbol: symbol, side: side, entry: entry, sl: sl, tp: tp, rr: rr, result: result, note: note, screenshots: screenshots });

    // Clear form
    ['journalSymbol','journalEntry','journalSL','journalTP','journalRr','journalNote'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var resEl = document.getElementById('journalResult');
    if (resEl) resEl.value = 'pending';
    if (typeof _pendingScreenshots !== 'undefined') { window._pendingScreenshots = []; }
    if (typeof renderScreenshotPreviews === 'function') renderScreenshotPreviews();

    window.renderJournal();
    showToastSafe('✅ Trade berhasil ditambahkan!');

    // Auto AI review in background (non-blocking)
    if (newEntry.result !== 'pending') {
      setTimeout(function () { _autoAIReview(newEntry); }, 800);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 5. QUICK TRADE SAVE (fixed — adds missing fields)
  // ─────────────────────────────────────────────────────────────────
  window.quickTradeSave = function () {
    var symbol = _val('qt-symbol');
    var side   = _val('qt-side')   || 'long';
    var entry  = parseFloat(_val('qt-entry'));
    var sl     = parseFloat(_val('qt-sl'));
    var tp     = parseFloat(_val('qt-tp'));
    var rr     = parseFloat(_val('qt-rr'));
    var result = _val('qt-result') || 'pending';
    var note   = _val('qt-note');

    if (!symbol || isNaN(entry) || isNaN(sl) || isNaN(tp) || isNaN(rr) || rr <= 0) {
      showToastSafe('❌ Isi semua field wajib (Symbol, Entry, SL, TP, R:R)');
      return;
    }

    var newEntry = AppState.addEntry({ symbol: symbol, side: side, entry: entry, sl: sl, tp: tp, rr: rr, result: result, note: note, tags: [], screenshots: [] });

    ['qt-symbol','qt-entry','qt-sl','qt-tp','qt-rr','qt-note'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    var qtRes = document.getElementById('qt-result');
    if (qtRes) qtRes.value = 'pending';

    if (typeof closeModal === 'function') closeModal('modalQuickTrade');
    showToastSafe('✅ Trade tersimpan!');
    window.renderJournal();

    if (newEntry.result !== 'pending') {
      setTimeout(function () { _autoAIReview(newEntry); }, 800);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 6. DELETE / EDIT ENTRY (ID-based — no more index bugs)
  // ─────────────────────────────────────────────────────────────────
  window.deleteJournalEntry = function (idOrIndex) {
    // Support both old index-based calls and new ID-based calls
    var id = idOrIndex;
    if (typeof idOrIndex === 'number') {
      // Legacy: index-based call from old inline onclick
      var entry = AppState.journal[idOrIndex];
      if (!entry) return;
      id = entry.id;
    }
    if (!confirm('Hapus trade ini?')) return;
    AppState.deleteEntry(id);
    window.renderJournal();
    showToastSafe('🗑 Trade dihapus');
  };

  // ── EDIT MODAL ────────────────────────────────────────────────────
  window.openEditTradeModal = function (id) {
    var entry = AppState.getById(id);
    if (!entry) return;

    // Only allow editing pending trades
    if (entry.result !== 'pending') {
      showToastSafe('ℹ️ Hanya trade Pending yang bisa diedit. Gunakan detail view untuk melihat trade selesai.');
      return;
    }

    _ensureEditModal();

    _setVal('editTradeId',     id);
    _setVal('editSymbol',      entry.symbol  || '');
    _setVal('editSide',        entry.side    || 'long');
    _setVal('editEntry',       entry.entry   || '');
    _setVal('editSL',          entry.sl      || '');
    _setVal('editTP',          entry.tp      || '');
    _setVal('editRr',          entry.rr      || '');
    _setVal('editResult',      entry.result  || 'pending');
    _setVal('editNote',        entry.note    || '');

    var modal = document.getElementById('modalEditTrade');
    if (modal) modal.style.display = 'flex';
  };

  window.saveEditTrade = function () {
    var id     = _val('editTradeId');
    var symbol = _val('editSymbol');
    var side   = _val('editSide');
    var entry  = parseFloat(_val('editEntry'));
    var sl     = parseFloat(_val('editSL'));
    var tp     = parseFloat(_val('editTP'));
    var rr     = parseFloat(_val('editRr'));
    var result = _val('editResult');
    var note   = _val('editNote');

    if (!symbol)                              { showToastSafe('⚠️ Isi Symbol'); return; }
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) { showToastSafe('⚠️ Isi Entry, SL, TP'); return; }
    if (isNaN(rr) || rr <= 0)                { showToastSafe('⚠️ R:R harus > 0'); return; }

    var updated = AppState.updateEntry(id, {
      symbol: symbol.toUpperCase().trim(),
      side: side, entry: entry, sl: sl, tp: tp, rr: rr, result: result, note: note.trim()
    });

    if (!updated) { showToastSafe('❌ Trade tidak ditemukan'); return; }

    var modal = document.getElementById('modalEditTrade');
    if (modal) modal.style.display = 'none';
    window.renderJournal();
    showToastSafe('✅ Trade diperbarui!');

    // Auto AI review if result changed from pending
    if (result !== 'pending') {
      var entry2 = AppState.getById(id);
      if (entry2) setTimeout(function () { _autoAIReview(entry2); }, 800);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 7. TRADE DETAIL MODAL
  // ─────────────────────────────────────────────────────────────────
  window.openTradeDetailModal = function (id) {
    var entry = AppState.getById(id);
    if (!entry) return;

    _ensureDetailModal();

    var modal   = document.getElementById('modalTradeDetail');
    var content = document.getElementById('tradeDetailContent');
    if (!modal || !content) return;

    var date    = new Date(entry.date).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
    var sideCol = entry.side === 'long' ? 'var(--green)' : 'var(--red)';
    var resCol  = entry.result === 'win'  ? 'var(--green)' :
                  entry.result === 'loss' ? 'var(--red)'   : 'var(--gold)';
    var resText = entry.result === 'win'  ? '✅ WIN' :
                  entry.result === 'loss' ? '❌ LOSS' : '⏳ Pending';

    var ssHtml = (entry.screenshots || []).length
      ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">' +
        (entry.screenshots).map(function (url, si) {
          return '<div class="screenshot-thumb" style="width:80px;height:80px;" onclick="viewScreenshot(' + si + ',\'entry\',' + AppState._findIdx(entry.id) + ')">' +
            '<img src="' + esc(url) + '" alt="ss"/></div>';
        }).join('') + '</div>'
      : '<span style="color:var(--text-muted);font-size:11px;">Tidak ada screenshot</span>';

    var aiHtml = '';
    if (entry.aiReview) {
      aiHtml = '<div style="margin-top:16px;background:rgba(91,155,213,0.08);border:1px solid rgba(91,155,213,0.3);border-radius:8px;padding:14px;">' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;color:var(--blue);margin-bottom:8px;">🤖 AI REVIEW</div>' +
        '<div style="font-size:12px;color:var(--text);white-space:pre-wrap;line-height:1.7;">' + esc(entry.aiReview) + '</div>' +
        '</div>';
    } else {
      var hasKey = !!window.getGroqApiKey();
      aiHtml = '<div style="margin-top:16px;background:var(--dark4);border:1px solid var(--border);border-radius:8px;padding:14px;text-align:center;">' +
        '<div style="color:var(--text-muted);font-size:12px;margin-bottom:8px;">🤖 AI Review belum tersedia</div>' +
        (hasKey && entry.result !== 'pending'
          ? '<button class="action-btn" onclick="triggerAIReview(\'' + esc(entry.id) + '\')" style="padding:6px 16px;font-size:11px;">🔄 Generate AI Review</button>'
          : (hasKey ? '<span style="font-size:11px;color:var(--text-muted);">Selesaikan trade untuk AI review</span>'
                    : '<span style="font-size:11px;color:var(--text-muted);">Masukkan Groq API key di tab 🤖 ICT Forge AI</span>')) +
        '</div>';
    }

    content.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
        '<div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:20px;font-weight:700;color:var(--gold);">' + esc(entry.symbol) + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);">' + esc(date) + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:16px;font-weight:700;color:' + resCol + ';">' + resText + '</div>' +
          '<div style="font-size:12px;font-weight:600;color:' + sideCol + ';">' + (entry.side === 'long' ? '📈 LONG' : '📉 SHORT') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">' +
        _detailCard('Entry',  entry.entry) +
        _detailCard('Stop Loss', entry.sl,  '#e74c3c') +
        _detailCard('Take Profit', entry.tp, '#2ecc71') +
        _detailCard('R:R Ratio', '1:' + entry.rr, 'var(--gold)') +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;color:var(--gold-dim);margin-bottom:6px;">📝 CATATAN</div>' +
        '<div style="background:var(--dark4);border-radius:6px;padding:12px;font-size:13px;color:var(--text);line-height:1.6;">' + esc(entry.note || '—') + '</div>' +
      '</div>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:2px;color:var(--gold-dim);margin-bottom:6px;">📸 SCREENSHOTS</div>' +
        ssHtml +
      '</div>' +
      aiHtml;

    modal.style.display = 'flex';
  };

  window.closeTradeDetailModal = function () {
    var modal = document.getElementById('modalTradeDetail');
    if (modal) modal.style.display = 'none';
  };

  window.triggerAIReview = function (id) {
    var entry = AppState.getById(id);
    if (!entry) return;
    var btn = event && event.target;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Menganalisis...'; }
    _autoAIReview(entry, function () {
      window.openTradeDetailModal(id); // re-render modal with result
    });
  };

  function _detailCard(label, value, color) {
    return '<div style="background:var(--dark4);border:1px solid var(--border);border-radius:6px;padding:10px;text-align:center;">' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">' + esc(label) + '</div>' +
      '<div style="font-family:\'DM Mono\',monospace;font-size:15px;font-weight:700;color:' + (color || 'var(--text)') + ';">' + esc(String(value || '—')) + '</div>' +
    '</div>';
  }

  // ─────────────────────────────────────────────────────────────────
  // 8. AUTO AI REVIEW (Groq — fires after save)
  // ─────────────────────────────────────────────────────────────────
  function _autoAIReview(entry, callback) {
    var apiKey = window.getGroqApiKey();
    if (!apiKey || entry.result === 'pending') return;

    var risk   = Math.abs(parseFloat(entry.entry) - parseFloat(entry.sl));
    var reward = Math.abs(parseFloat(entry.tp)    - parseFloat(entry.entry));
    var rrCalc = risk > 0 ? '1:' + (reward / risk).toFixed(2) : '1:' + entry.rr;

    var prompt =
      'Kamu adalah mentor trading ICT/SMC yang berpengalaman. Review trade ini dengan singkat (maks 200 kata), fokus pada kualitas setup, R:R, dan satu lesson learned:\n\n' +
      'Symbol: ' + entry.symbol + '\n' +
      'Direction: ' + (entry.side === 'long' ? 'LONG (Buy)' : 'SHORT (Sell)') + '\n' +
      'Entry: ' + entry.entry + ' | SL: ' + entry.sl + ' | TP: ' + entry.tp + '\n' +
      'R:R: ' + rrCalc + '\n' +
      'Result: ' + (entry.result === 'win' ? 'WIN ✅' : 'LOSS ❌') + '\n' +
      'Catatan trader: ' + (entry.note || 'tidak ada') + '\n\n' +
      'Berikan review singkat dan konstruktif dalam Bahasa Indonesia.';

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return;
      AppState.updateEntry(entry.id, { aiReview: text });
      window.renderJournal();
      showToastSafe('🤖 AI Review selesai untuk ' + entry.symbol + '!');
      if (typeof callback === 'function') callback(text);
    })
    .catch(function (err) {
      console.warn('[AppCore] AI Review failed:', err.message);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 9. LEGACY saveJournal / loadJournal overrides
  // ─────────────────────────────────────────────────────────────────
  window.saveJournal = function () {
    // Sync from global journalEntries to AppState (for legacy compatibility)
    if (window.journalEntries && Array.isArray(window.journalEntries)) {
      AppState.journal = window.journalEntries;
    }
    AppState.save();
    window.renderJournal();
  };

  window.loadJournal = function () {
    AppState.load();
    window.renderJournal();
  };

  // ─────────────────────────────────────────────────────────────────
  // 10. EVENT DELEGATION (replaces all broken direct bindings)
  // ─────────────────────────────────────────────────────────────────
  function _initEventDelegation() {
    // ── Journal row click → detail modal ──
    document.addEventListener('click', function (e) {
      // Journal row tap → detail
      var row = e.target.closest && e.target.closest('tr.journal-row');
      if (row && !e.target.closest('.action-btn')) {
        var id = row.getAttribute('data-id');
        if (id) window.openTradeDetailModal(id);
        return;
      }

      // Delete button
      if (e.target.classList.contains('btn-delete-entry')) {
        var id = e.target.getAttribute('data-id');
        if (id) window.deleteJournalEntry(id);
        return;
      }

      // Edit button
      if (e.target.classList.contains('btn-edit-entry')) {
        var id = e.target.getAttribute('data-id');
        if (id) window.openEditTradeModal(id);
        return;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 11. (removed — mistake tags dihapus per permintaan user v2.4)
  //     Stub globals tetap di-register agar code lain yang mungkin
  //     masih memanggil getSelectedMistakeTags/clearMistakeTags tidak crash.
  // ─────────────────────────────────────────────────────────────────
  if (typeof window.getSelectedMistakeTags !== 'function') {
    window.getSelectedMistakeTags = function () { return []; };
  }
  if (typeof window.clearMistakeTags !== 'function') {
    window.clearMistakeTags = function () { /* no-op */ };
  }

  // ─────────────────────────────────────────────────────────────────
  // 12. DAILY BIAS NOTE (deferred — element lives in lazy tab)
  // ─────────────────────────────────────────────────────────────────
  window.initDailyBiasNote = function () {
    var textarea = document.getElementById('dailyBiasNote');
    if (!textarea) {
      // Not loaded yet — watch for it
      if (typeof MutationObserver !== 'undefined') {
        var obs = new MutationObserver(function () {
          var el = document.getElementById('dailyBiasNote');
          if (el) { obs.disconnect(); _bindBiasNote(el); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      }
      return;
    }
    _bindBiasNote(textarea);
  };

  function _bindBiasNote(textarea) {
    // Restore saved note
    try {
      var saved = localStorage.getItem(BIAS_NOTE_KEY);
      if (saved) textarea.value = saved;
    } catch (e) {}

    var _noteTimer = null;
    textarea.addEventListener('input', function () {
      clearTimeout(_noteTimer);
      _noteTimer = setTimeout(function () {
        try { localStorage.setItem(BIAS_NOTE_KEY, textarea.value); } catch (e) {}
        var badge = document.getElementById('dailyNoteSaved');
        if (badge) { badge.style.opacity = '1'; setTimeout(function () { badge.style.opacity = '0'; }, 1500); }
      }, 600);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 13. ECONOMIC EVENT COUNTDOWN (null-safe wrapper)
  // ─────────────────────────────────────────────────────────────────
  var _origRenderEventCountdownGrid = window.renderEventCountdownGrid;
  window.renderEventCountdownGrid = function () {
    var grid = document.getElementById('eventCountdownGrid');
    if (!grid) return; // calendar tab not loaded yet — skip silently
    if (typeof _origRenderEventCountdownGrid === 'function') {
      try { _origRenderEventCountdownGrid(); } catch (e) { console.warn('[AppCore] Countdown error:', e); }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 14. GROQ API KEY UNIFICATION (patch ictforge-ai.html's saveApiKey)
  // ─────────────────────────────────────────────────────────────────
  // This runs after ictforge-ai.html's script block, patching saveApiKey
  // to also write to the unified key so main.js Daily Bias can use it.
  var _patchAITabApiKey = function () {
    var origSaveApiKey = window.saveApiKey;
    window.saveApiKey = function () {
      if (typeof origSaveApiKey === 'function') origSaveApiKey();
      // Also sync to unified key
      var input = document.getElementById('apiKeyInput');
      if (input && input.value) window.setGroqApiKey(input.value.trim());
    };

    // Patch initICTForgeAI to load from unified key
    var origInit = window.initICTForgeAI;
    window.initICTForgeAI = function () {
      // Ensure unified key
      var key = window.getGroqApiKey();
      if (key && !localStorage.getItem('ictforge_groq_key')) {
        localStorage.setItem('ictforge_groq_key', key);
      }
      if (typeof origInit === 'function') origInit();
    };
  };

  // ─────────────────────────────────────────────────────────────────
  // 15. MODAL BUILDERS (create missing modals dynamically)
  // ─────────────────────────────────────────────────────────────────
  function _ensureEditModal() {
    if (document.getElementById('modalEditTrade')) return;
    var div = document.createElement('div');
    div.id = 'modalEditTrade';
    div.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);align-items:center;justify-content:center;';
    div.innerHTML =
      '<div class="modal-box" style="max-width:480px;width:90%;">' +
        '<button class="modal-close" onclick="document.getElementById(\'modalEditTrade\').style.display=\'none\'">✕</button>' +
        '<div class="modal-title">✏️ Edit Trade</div>' +
        '<div class="modal-sub">Hanya trade Pending yang bisa diedit</div>' +
        '<input type="hidden" id="editTradeId"/>' +
        '<div class="modal-form">' +
          _field('editSymbol',  'Symbol',      'text',   'EURUSD') +
          _selectField('editSide', 'Side', [['long','📈 LONG (Buy)'],['short','📉 SHORT (Sell)']]) +
          _field('editEntry',   'Entry Price', 'number', '1.0950') +
          _field('editSL',      'Stop Loss',   'number', '1.0900') +
          _field('editTP',      'Take Profit', 'number', '1.1050') +
          _field('editRr',      'R:R Ratio',   'number', '2') +
          _selectField('editResult', 'Result', [['pending','⏳ Pending'],['win','✅ WIN'],['loss','❌ LOSS']]) +
          '<div class="modal-field modal-form-full">' +
            '<label>Catatan</label>' +
            '<textarea id="editNote" rows="2" placeholder="Catatan..." style="width:100%;background:var(--dark3);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);font-family:\'DM Mono\',monospace;font-size:12px;resize:vertical;"></textarea>' +
          '</div>' +
        '</div>' +
        '<button class="modal-save-btn" onclick="saveEditTrade()">💾 Simpan Perubahan</button>' +
      '</div>';
    document.body.appendChild(div);
    div.addEventListener('click', function (e) { if (e.target === div) div.style.display = 'none'; });
  }

  function _ensureDetailModal() {
    if (document.getElementById('modalTradeDetail')) return;
    var div = document.createElement('div');
    div.id = 'modalTradeDetail';
    div.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 16px;';
    div.innerHTML =
      '<div style="max-width:560px;width:100%;background:var(--dark2);border:1px solid var(--border);border-radius:12px;padding:24px;position:relative;margin:auto;">' +
        '<button onclick="closeTradeDetailModal()" style="position:absolute;top:14px;right:14px;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:15px;">✕</button>' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:3px;color:var(--gold-dim);margin-bottom:16px;text-transform:uppercase;">📊 Trade Detail</div>' +
        '<div id="tradeDetailContent"></div>' +
      '</div>';
    document.body.appendChild(div);
    div.addEventListener('click', function (e) { if (e.target === div) div.style.display = 'none'; });
  }

  function _field(id, label, type, placeholder) {
    return '<div class="modal-field">' +
      '<label>' + esc(label) + '</label>' +
      '<input id="' + esc(id) + '" type="' + esc(type) + '" placeholder="' + esc(placeholder) + '" step="any"/>' +
    '</div>';
  }

  function _selectField(id, label, options) {
    return '<div class="modal-field">' +
      '<label>' + esc(label) + '</label>' +
      '<select id="' + esc(id) + '">' +
        options.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') +
      '</select>' +
    '</div>';
  }

  // ─────────────────────────────────────────────────────────────────
  // 16. UTILITY HELPERS
  // ─────────────────────────────────────────────────────────────────
  function _val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function _setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
  }

  // ─────────────────────────────────────────────────────────────────
  // 17. initApp() — MASTER INIT
  // ─────────────────────────────────────────────────────────────────
  function initApp() {
    console.log('[AppCore v3.0] initApp() starting...');

    // Load journal data
    AppState.load();

    // Pre-create modals (so they're ready before tabs load)
    _ensureEditModal();
    _ensureDetailModal();

    // Setup event delegation
    _initEventDelegation();

    // Init daily bias note (deferred)
    window.initDailyBiasNote();

    // Patch AI tab functions once available
    // Runs immediately (ictforge-ai.html loads lazily, but when it does,
    // it defines saveApiKey which we wrap)
    _patchAITabApiKey();

    // FAQ
    if (typeof renderFAQ === 'function') renderFAQ();

    // Handle multi-tab storage sync
    window.addEventListener('storage', function (e) {
      if (e.key === JOURNAL_KEY && e.newValue) {
        try {
          var incoming = JSON.parse(e.newValue);
          if (Array.isArray(incoming) && incoming.length !== AppState.journal.length) {
            AppState.journal = incoming;
            window.journalEntries = incoming;
            window.renderJournal();
            console.log('[AppCore] Journal synced from another tab');
          }
        } catch (err) {}
      }
    });

    console.log('[AppCore v3.0] Ready — ' + AppState.journal.length + ' trade(s) loaded.');
  }

  window.initApp = initApp;

  // ─────────────────────────────────────────────────────────────────
  // 18. AUTO-RUN
  // ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    // Already loaded (script injected late)
    setTimeout(initApp, 0);
  }

  // ── Patch _onTabLoaded to re-render journal after journal tab loads ──
  // The tab lazy loader calls _onTabLoaded(tabId) — we hook in after it.
  var _tabLoadHookInstalled = false;
  function _installTabLoadHook() {
    if (_tabLoadHookInstalled) return;
    // Wait for loadTab to exist
    var _checkInterval = setInterval(function () {
      if (typeof window._loadTab === 'function') {
        clearInterval(_checkInterval);
        var origLoadTab = window._loadTab;
        window._loadTab = function (tabId) {
          origLoadTab(tabId);
        };
        // Hook into showTab to re-render when journal becomes visible
        var origShowTab = window.showTab;
        window.showTab = function (name, el) {
          if (typeof origShowTab === 'function') origShowTab(name, el);
          if (name === 'journal') {
            // Re-render after a short delay for DOM to settle
            setTimeout(function () {
              window.renderJournal();
              window.initDailyBiasNote();
            }, 100);
          }
          if (name === 'ictforge-ai') {
            setTimeout(function () {
              _patchAITabApiKey();
              if (typeof initICTForgeAI === 'function') initICTForgeAI();
            }, 200);
          }
        };
        _tabLoadHookInstalled = true;
      }
    }, 100);
  }
  _installTabLoadHook();

})(window);
