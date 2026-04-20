// ═══════════════════════════════════════════════════════════════════
//  ICT FORGE — REALTIME NEWS ENGINE v2.0
//  Live economic calendar via newsdata.io API
//  Author: Rizky Saputra · ICT Forge v1.0
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────
  // 🔐 API key SENGAJA tidak di-hardcode. Cara supply:
  //   1. Inject via HTML sebelum script ini:
  //      <script>window._NEWSDATA_KEY = 'pub_XXXXXX';</script>
  //   2. Simpan per-device via localStorage:
  //      localStorage.setItem('ict-newsdata-key', 'pub_XXXXXX');
  //   3. (Rekomendasi) Pakai Cloudflare Workers proxy — worker simpan key
  //      server-side, tidak perlu key di client sama sekali.
  // Dapatkan API key gratis: https://newsdata.io/register
  const NEWSDATA_API_KEY = window._NEWSDATA_KEY ||
                           localStorage.getItem('ict-newsdata-key') ||
                           '';
  const CACHE_KEY        = 'ict-live-news-cache';
  const CACHE_TS_KEY     = 'ict-live-news-ts';
  const CACHE_TTL_MS     = 6 * 60 * 60 * 1000; // 6 jam (hemat quota API)
  const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // auto refresh tiap 6 jam

  // Kata kunci untuk deteksi event high-impact
  const HIGH_IMPACT_KEYWORDS = {
    'NFP':   ['non-farm payrolls', 'nonfarm payrolls', 'nfp', 'jobs report', 'payrolls'],
    'CPI':   ['consumer price index', 'cpi', 'inflation data', 'core cpi', 'core inflation'],
    'FOMC':  ['fomc', 'federal reserve', 'fed rate', 'interest rate decision', 'rate decision', 'powell', 'fed meeting'],
    'PPI':   ['producer price index', 'ppi', 'producer prices'],
    'GDP':   ['gdp', 'gross domestic product'],
    'PCE':   ['pce', 'personal consumption expenditure', 'core pce'],
    'RETAIL':['retail sales'],
    'ISM':   ['ism manufacturing', 'ism services', 'purchasing managers'],
    'JOBLESS':['jobless claims', 'unemployment claims', 'initial claims'],
    'BOE':   ['bank of england', 'boe rate', 'bailey'],
    'ECB':   ['european central bank', 'ecb rate', 'lagarde'],
    'BOJ':   ['bank of japan', 'boj', 'ueda'],
    'RBA':   ['reserve bank of australia', 'rba rate'],
    'BOC':   ['bank of canada', 'boc rate']
  };

  // Estimated NY time per event type (default fallback)
  const EVENT_NY_TIMES = {
    'NFP':    '08:30', 'CPI': '08:30', 'PPI': '08:30',
    'FOMC':   '14:00', 'PCE': '08:30', 'GDP': '08:30',
    'RETAIL': '08:30', 'ISM': '10:00', 'JOBLESS': '08:30',
    'BOE':    '07:00', 'ECB': '07:45', 'BOJ': '23:00',
    'RBA':    '22:30', 'BOC': '10:00'
  };

  const EVENT_ICONS = {
    'NFP':'📊','CPI':'💹','FOMC':'🏦','PPI':'📉','GDP':'📈',
    'PCE':'💰','RETAIL':'🛒','ISM':'🏭','JOBLESS':'📋',
    'BOE':'🇬🇧','ECB':'🇪🇺','BOJ':'🇯🇵','RBA':'🇦🇺','BOC':'🇨🇦'
  };

  const EVENT_CURRENCIES = {
    'NFP':'USD','CPI':'USD','FOMC':'USD','PPI':'USD','GDP':'USD',
    'PCE':'USD','RETAIL':'USD','ISM':'USD','JOBLESS':'USD',
    'BOE':'GBP','ECB':'EUR','BOJ':'JPY','RBA':'AUD','BOC':'CAD'
  };

  // ── STATE ─────────────────────────────────────────────────────────
  let liveNewsEvents = [];   // array sama format HIGH_IMPACT_NEWS
  let fetchInProgress = false;

  // ── UTILITY ───────────────────────────────────────────────────────
  function pad2(n) { return String(n).padStart(2, '0'); }

  function getNYDateStr(dateObj) {
    // Konversi Date ke YYYY-MM-DD dalam NY timezone
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(dateObj);
    const y = parts.find(p => p.type === 'year')?.value;
    const mo = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${mo}-${d}`;
  }

  function detectEventType(title, description) {
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();
    for (const [type, keywords] of Object.entries(HIGH_IMPACT_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) return type;
    }
    return null;
  }

  function parseDateToNY(pubDateStr) {
    // newsdata.io format: "2026-04-18 14:30:00" atau ISO 8601
    try {
      // Coba parse langsung
      const d = new Date(pubDateStr.replace(' ', 'T') + (pubDateStr.includes('Z') ? '' : 'Z'));
      if (!isNaN(d)) return d;
    } catch (e) {}
    return null;
  }

  // ── MAIN FETCH ────────────────────────────────────────────────────
  async function fetchLiveNews() {
    if (fetchInProgress) return;
    fetchInProgress = true;

    // ── Bail early jika tidak ada API key — fallback ke static data diam-diam.
    // Static HIGH_IMPACT_NEWS dari main.js akan tetap jalan → aplikasi tidak rusak.
    if (!NEWSDATA_API_KEY) {
      console.info('[ICT Forge News] Tidak ada API key — menggunakan jadwal static 2026.');
      showNewsStatus('ℹ️ Menggunakan jadwal static — tambahkan API key newsdata.io untuk live updates', 'warn');
      fetchInProgress = false;
      return;
    }

    try {
      // Cek cache dulu
      const cachedTs = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0');
      const now = Date.now();
      if (now - cachedTs < CACHE_TTL_MS) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            liveNewsEvents = parsed;
            applyLiveNewsToApp();
            console.log('[ICT Forge News] Cache loaded:', liveNewsEvents.length, 'events');
            fetchInProgress = false;
            return;
          }
        }
      }

      // Fetch via Cloudflare Worker proxy (bypass CORS)
      const WORKER = 'https://black-hat-ebc4.waxewi.workers.dev';
      const query = encodeURIComponent('CPI OR FOMC OR NFP OR inflation OR payrolls');
      const rawUrl = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}&q=${query}&language=en&category=business&size=10`;
      const url = WORKER + '/?u=' + encodeURIComponent(rawUrl);

      showNewsStatus('⏳ Memuat berita ekonomi live...', 'loading');

      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'API error');
      }

      // Parse articles → HIGH_IMPACT_NEWS format
      const parsed = parseNewsToEvents(data.results || []);

      // Merge dengan static 2026 data (fallback untuk events yang tidak ada di news)
      liveNewsEvents = mergeWithStatic(parsed);

      // Simpan ke cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(liveNewsEvents));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));

      applyLiveNewsToApp();
      showNewsStatus(`✅ ${liveNewsEvents.length} events dimuat · Update terakhir: ${new Date().toLocaleTimeString('id-ID')}`, 'ok');
      console.log('[ICT Forge News] Live fetch:', liveNewsEvents.length, 'events');

    } catch (err) {
      console.warn('[ICT Forge News] Fetch error:', err.message);
      // Fallback: pakai static data yang sudah ada di main.js
      showNewsStatus('⚠️ Gagal memuat live data — menggunakan jadwal static 2026', 'warn');
      // Tidak menimpa HIGH_IMPACT_NEWS jika gagal — static tetap aktif
    } finally {
      fetchInProgress = false;
    }
  }

  // ── PARSE ARTICLES → EVENT OBJECTS ───────────────────────────────
  function parseNewsToEvents(articles) {
    const events = [];
    const seen = new Set(); // deduplicate

    articles.forEach(article => {
      const type = detectEventType(article.title, article.description);
      if (!type) return;

      // Cari tanggal dari pubDate
      let dateStr = null;
      if (article.pubDate) {
        const d = parseDateToNY(article.pubDate);
        if (d) {
          dateStr = getNYDateStr(d);
        }
      }
      if (!dateStr) return;

      // Deduplicate: type + date
      const dedupeKey = `${type}-${dateStr}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      events.push({
        name: type,
        date: dateStr,
        time: EVENT_NY_TIMES[type] || '08:30',
        currency: EVENT_CURRENCIES[type] || 'USD',
        impact: 'high',
        source: 'live',
        title: article.title,
        link: article.link || null
      });
    });

    // Sort by date ascending
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }

  // ── MERGE LIVE + STATIC ───────────────────────────────────────────
  function mergeWithStatic(liveEvents) {
    // Ambil static HIGH_IMPACT_NEWS dari window (sudah di-define di main.js)
    const staticEvents = (typeof HIGH_IMPACT_NEWS !== 'undefined') ? HIGH_IMPACT_NEWS : [];

    const merged = [...staticEvents];
    const staticKeys = new Set(staticEvents.map(e => `${e.name}-${e.date}`));

    // Tambah live events yang tidak ada di static
    liveEvents.forEach(ev => {
      const key = `${ev.name}-${ev.date}`;
      if (!staticKeys.has(key)) {
        merged.push(ev);
      }
    });

    // Sort by date
    merged.sort((a, b) => a.date.localeCompare(b.date));
    return merged;
  }

  // ── APPLY TO APP ──────────────────────────────────────────────────
  function applyLiveNewsToApp() {
    if (liveNewsEvents.length === 0) return;

    // Override global HIGH_IMPACT_NEWS array (dipakai oleh main.js)
    if (typeof HIGH_IMPACT_NEWS !== 'undefined') {
      // Ganti isi array (preserve reference)
      HIGH_IMPACT_NEWS.length = 0;
      liveNewsEvents.forEach(ev => HIGH_IMPACT_NEWS.push(ev));
    } else {
      // Buat global variable baru jika belum ada
      window.HIGH_IMPACT_NEWS = liveNewsEvents;
    }

    // Re-render economic calendar
    renderLiveEconomicCalendar();

    // Update event countdown grid (via updateEventCountdowns jika tersedia)
    if (typeof updateEventCountdowns === 'function') {
      const ny = (typeof getNYTime === 'function') ? getNYTime(new Date()) : null;
      if (ny) updateEventCountdowns(ny);
    }
  }

  // ── RENDER LIVE ECONOMIC CALENDAR ────────────────────────────────
  function renderLiveEconomicCalendar() {
    const container = document.getElementById('econEventsList');
    if (!container) return;

    const nowNY    = new Date();
    const todayStr = getNYDateStr(nowNY);
    const in30Days = getNYDateStr(new Date(Date.now() + 30 * 86400000));

    // Filter events upcoming (30 hari)
    const upcoming = liveNewsEvents.filter(ev => ev.date >= todayStr && ev.date <= in30Days);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:11px;">
          <div style="font-size:20px;margin-bottom:8px;">📅</div>
          Tidak ada event high-impact 30 hari ke depan
        </div>`;
      return;
    }

    const dayNames   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Tanggal hari ini di WIB
    const todayWIBStr = getNYDateStr(new Date()); // kita hitung WIB sendiri
    function getWIBDateStr(dateObj) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(dateObj);
      const y  = parts.find(p => p.type === 'year')?.value;
      const mo = parts.find(p => p.type === 'month')?.value;
      const dd = parts.find(p => p.type === 'day')?.value;
      return `${y}-${mo}-${dd}`;
    }
    const todayWIB = getWIBDateStr(nowNY);

    // Helper: konversi NY date string → WIB date string
    // Event terjadi jam tertentu NY — kita konversi ke WIB
    function nyDateToWIB(dateStr, timeStr) {
      // Bangun timestamp: NY midnight + jam event
      const [ey, emo, ed] = dateStr.split('-').map(Number);
      const [eh, em]      = (timeStr || '12:00').split(':').map(Number);
      const utcMid        = Date.UTC(ey, emo - 1, ed);
      // Cari offset NY pada hari itu
      const midObj  = new Date(utcMid + 12 * 3600000);
      const midParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York', hour: '2-digit', hour12: false
      }).formatToParts(midObj);
      const midNYH  = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
      const nyOff   = midNYH - 12; // EDT=-4, EST=-5
      const evMs    = utcMid + (-nyOff) * 3600000 + (eh * 3600 + em * 60) * 1000;
      return getWIBDateStr(new Date(evMs));
    }

    // Group by date
    const byDate = {};
    upcoming.forEach(ev => {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push(ev);
    });

    let html = '';
    const tomorrowStr = getNYDateStr(new Date(Date.now() + 86400000));

    Object.keys(byDate).sort().forEach(dateStr => {
      const evs      = byDate[dateStr];
      const d        = new Date(dateStr + 'T12:00:00Z');
      const isToday  = dateStr === todayStr;
      const isTomorrow = dateStr === tomorrowStr;

      // ── NY date label ──────────────────────────────────────────────
      const dayNY    = dayNames[d.getUTCDay()];
      const labelNY  = `${dayNY}, ${String(d.getUTCDate()).padStart(2,'0')} ${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

      // ── WIB date label (pakai waktu event pertama di grup ini) ─────
      const firstEv     = evs[0];
      const wibDateStr  = nyDateToWIB(dateStr, firstEv.time || '12:00');
      const wibD        = new Date(wibDateStr + 'T12:00:00Z');
      const dayWIB      = dayNames[wibD.getUTCDay()];
      const labelWIB    = `${dayWIB}, ${String(wibD.getUTCDate()).padStart(2,'0')} ${monthNames[wibD.getUTCMonth()]} ${wibD.getUTCFullYear()}`;
      const isTodayWIB  = wibDateStr === todayWIB;

      // ── Badge ──────────────────────────────────────────────────────
      let headerBg, headerColor, badgeHtml;
      if (isToday) {
        headerBg    = 'rgba(201,168,76,0.12)';
        headerColor = 'var(--gold)';
        badgeHtml   = `<span style="background:var(--red);color:#fff;font-size:7px;
          padding:2px 5px;border-radius:3px;margin-left:5px;font-weight:700;
          letter-spacing:1px;">NY TODAY</span>`;
      } else if (isTomorrow) {
        headerBg    = 'rgba(91,155,213,0.08)';
        headerColor = 'var(--blue)';
        badgeHtml   = `<span style="background:var(--blue);color:#fff;font-size:7px;
          padding:2px 5px;border-radius:3px;margin-left:5px;font-weight:700;
          letter-spacing:1px;">NY BESOK</span>`;
      } else {
        headerBg    = 'transparent';
        headerColor = 'var(--text-dim)';
        badgeHtml   = '';
      }

      // Badge WIB hari ini
      const wibTodayBadge = isTodayWIB
        ? `<span style="background:var(--cyan);color:#000;font-size:7px;
            padding:2px 5px;border-radius:3px;margin-left:4px;font-weight:700;
            letter-spacing:1px;">WIB TODAY</span>`
        : '';

      html += `
        <div style="
          padding:7px 10px 6px; margin:10px 0 4px;
          background:${headerBg};
          border-left:3px solid ${headerColor};
          border-radius:0 4px 4px 0;">
          <!-- Baris NY -->
          <div style="display:flex;align-items:center;margin-bottom:3px;">
            <span style="font-size:10px;margin-right:5px;">🇺🇸</span>
            <span style="font-size:11px;font-family:'DM Mono',monospace;
              color:${headerColor};font-weight:700;letter-spacing:0.5px;">
              ${labelNY}
            </span>
            ${badgeHtml}
          </div>
          <!-- Baris WIB -->
          <div style="display:flex;align-items:center;">
            <span style="font-size:10px;margin-right:5px;">🇮🇩</span>
            <span style="font-size:10px;font-family:'DM Mono',monospace;
              color:${isTodayWIB ? 'var(--cyan)' : 'var(--text-muted)'};letter-spacing:0.3px;">
              ${labelWIB}
            </span>
            ${wibTodayBadge}
          </div>
        </div>`;

      // ── Events dalam tanggal itu ───────────────────────────────────
      evs.forEach(ev => {
        const icon   = EVENT_ICONS[ev.name] || '📌';
        const isLive = ev.source === 'live';
        const liveBadge = isLive
          ? `<span style="font-size:7px;background:var(--green);color:#000;
              padding:1px 4px;border-radius:2px;margin-left:4px;
              font-weight:700;vertical-align:middle;">LIVE</span>`
          : '';

        // Hitung sisa waktu ke event ini secara realtime (timezone-safe)
        // Bangun timestamp event dalam NY timezone menggunakan UTC offset
        let evMs = 0;
        try {
          const [ey, emo, ed] = ev.date.split('-').map(Number);
          const [eh, em]      = (ev.time || '08:30').split(':').map(Number);
          const utcMid        = Date.UTC(ey, emo - 1, ed);
          // Cari offset NY pada hari itu (akurat DST)
          const midObj   = new Date(utcMid + 12 * 3600000);
          const midParts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York', hour: '2-digit', hour12: false
          }).formatToParts(midObj);
          const midNYH   = parseInt(midParts.find(p => p.type === 'hour')?.value || '12');
          const nyOff    = midNYH - 12; // EDT=-4, EST=-5
          evMs = utcMid + (-nyOff) * 3600000 + (eh * 3600 + em * 60) * 1000;
        } catch (_) {}
        const diffMs  = evMs - Date.now();
        let countdownBadge = '';
        if (isToday && diffMs > 0) {
          const hLeft = Math.floor(diffMs / 3600000);
          const mLeft = Math.floor((diffMs % 3600000) / 60000);
          const urgent = diffMs < 3600000; // < 1 jam
          countdownBadge = `<span style="font-size:8px;
            color:${urgent ? 'var(--red)' : 'var(--orange)'};
            font-family:'DM Mono',monospace;margin-left:6px;">
            ⏱ ${hLeft > 0 ? hLeft + 'j ' : ''}${mLeft}m lagi
          </span>`;
        } else if (isToday && diffMs <= 0 && diffMs > -3600000) {
          countdownBadge = `<span style="font-size:8px;color:var(--red);
            font-family:'DM Mono',monospace;margin-left:6px;">🔴 BARU RILIS</span>`;
        }

        html += `
          <div class="econ-event"
            style="cursor:${ev.link ? 'pointer' : 'default'};
              border-left:2px solid ${isToday ? 'var(--gold)' : 'var(--border)'};
              margin-left:8px;"
            ${ev.link ? `onclick="window.open('${ev.link}','_blank')"` : ''}>
            <div class="econ-time" style="min-width:72px;">
              ⏰ ${ev.time}<br>
              <span style="font-size:8px;color:var(--text-muted);">NY TIME</span>
            </div>
            <div class="econ-currency">${ev.currency}</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px;">
                <strong style="font-size:12px;">${icon} ${ev.name}</strong>
                ${liveBadge}
                ${countdownBadge}
              </div>
              ${ev.title
                ? `<div style="font-size:9px;color:var(--text-muted);margin-top:2px;
                    line-height:1.3;">${escapeHtmlSafe(ev.title).substring(0, 90)}…</div>`
                : ''}
            </div>
            <div class="econ-impact high" style="font-size:8px;">🔴 HIGH</div>
          </div>`;
      });
    });

    container.innerHTML = html;
  }

  // ── STATUS UI ─────────────────────────────────────────────────────
  function showNewsStatus(msg, type) {
    // Cari atau buat status element di bagian calendar
    let el = document.getElementById('ict-news-status');
    if (!el) {
      const calSection = document.getElementById('econEventsList');
      if (!calSection) return;
      el = document.createElement('div');
      el.id = 'ict-news-status';
      el.style.cssText = `
        font-size:9px; font-family:'DM Mono',monospace; letter-spacing:0.5px;
        padding:4px 8px; border-radius:3px; margin-bottom:6px; text-align:center;`;
      calSection.parentElement?.insertBefore(el, calSection);
    }
    const colors = {
      loading: 'color:var(--text-muted);background:var(--dark4)',
      ok:      'color:var(--green);background:rgba(46,204,113,0.08)',
      warn:    'color:var(--orange);background:rgba(230,126,34,0.08)'
    };
    el.style.cssText += colors[type] || colors.loading;
    el.textContent = msg;
  }

  // Safe escape untuk title dari API (hindari XSS)
  function escapeHtmlSafe(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── INIT ──────────────────────────────────────────────────────────
  function init() {
    // Tunggu main.js selesai load (HIGH_IMPACT_NEWS harus sudah ada)
    const waitForMain = () => {
      if (typeof HIGH_IMPACT_NEWS !== 'undefined' && typeof updateEventCountdowns === 'function') {
        fetchLiveNews();
        // Auto-refresh tiap 6 jam
        setInterval(fetchLiveNews, REFRESH_INTERVAL);
      } else {
        setTimeout(waitForMain, 200);
      }
    };
    waitForMain();
  }

  // Expose untuk debugging di console
  window._ictNewsEngine = {
    refresh: () => {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TS_KEY);
      fetchLiveNews();
    },
    getEvents: () => liveNewsEvents,
    status: () => console.table(liveNewsEvents)
  };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
