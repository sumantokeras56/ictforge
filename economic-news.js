// ═══════════════════════════════════════════════════════════════════
//  ICT FORGE — ECONOMIC NEWS FEED v1.0
//  Berita ekonomi hari ini: US & Indonesia via newsdata.io
//  Author: Rizky Saputra · ICT Forge v1.0
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────
  const NEWSDATA_API_KEY  = window._NEWSDATA_KEY || 'pub_720f8970bca242bdb33001f15e59c9b2';
  const CACHE_KEY         = 'ict-econnews-cache';
  const CACHE_TS_KEY      = 'ict-econnews-ts';
  const CACHE_TTL_MS      = 3 * 60 * 60 * 1000; // 3 jam cache
  const SECTION_ID        = 'econNewsSection';
  const LIST_ID           = 'econNewsList';

  // ── KATEGORI & KEYWORDS PREDIKSI ──────────────────────────────────
  const BULLISH_USD_KW = [
    'rate hike','hawkish','strong jobs','beat expectations','gdp growth',
    'inflation rises','consumer spending up','record high','surplus',
    'strong dollar','optimism','recovery','expansion','positive outlook'
  ];
  const BEARISH_USD_KW = [
    'rate cut','dovish','job losses','miss expectations','recession',
    'inflation falls','consumer spending down','deficit','weak dollar',
    'uncertainty','slowdown','contraction','negative outlook','layoffs'
  ];
  const BULLISH_IDR_KW = [
    'rupiah menguat','ekspor naik','surplus','pertumbuhan ekonomi','bi rate',
    'investasi masuk','cadangan devisa naik','inflasi terkendali','gdp naik',
    'optimis','pemulihan ekonomi','ekspansi','neraca surplus'
  ];
  const BEARISH_IDR_KW = [
    'rupiah melemah','impor naik','defisit','perlambatan ekonomi',
    'investasi turun','cadangan devisa turun','inflasi tinggi','gdp turun',
    'resesi','pemutusan hubungan kerja','kontraksi','neraca defisit'
  ];

  const NEUTRAL_ICONS  = ['📰','📊','💼','🏦','📈','📉','💹','🌐'];
  const IMPACT_COLORS  = {
    bullish: { bg:'rgba(46,204,113,0.08)', border:'rgba(46,204,113,0.25)', label:'#2ECC71', text:'BULLISH' },
    bearish: { bg:'rgba(231,76,60,0.08)',  border:'rgba(231,76,60,0.25)',  label:'#E74C3C', text:'BEARISH' },
    neutral: { bg:'rgba(90,88,86,0.12)',   border:'rgba(90,88,86,0.25)',  label:'#9A9890', text:'NEUTRAL' }
  };

  // ── PREDIKSI LOGIC ────────────────────────────────────────────────
  function analyzeSentiment(title, description, country) {
    const text  = ((title || '') + ' ' + (description || '')).toLowerCase();
    const bulls = country === 'id' ? BULLISH_IDR_KW  : BULLISH_USD_KW;
    const bears = country === 'id' ? BEARISH_IDR_KW  : BEARISH_USD_KW;

    let bullScore = 0, bearScore = 0;
    bulls.forEach(kw => { if (text.includes(kw)) bullScore++; });
    bears.forEach(kw => { if (text.includes(kw)) bearScore++; });

    if (bullScore > bearScore) return 'bullish';
    if (bearScore > bullScore) return 'bearish';
    return 'neutral';
  }

  function getPrediction(sentiment, country) {
    const asset = country === 'id' ? 'IDR/Pasar Indo' : 'USD/Pasar AS';
    if (sentiment === 'bullish') {
      return {
        text: `Potensi penguatan ${asset}. Sentimen pasar cenderung positif berdasarkan berita ini.`,
        icon: '📈'
      };
    }
    if (sentiment === 'bearish') {
      return {
        text: `Tekanan pada ${asset}. Waspadai volatilitas & potensi pelemahan jangka pendek.`,
        icon: '📉'
      };
    }
    return {
      text: `Dampak netral pada ${asset}. Perlu konfirmasi dari data fundamental lanjutan.`,
      icon: '⚖️'
    };
  }

  // ── SAFE ESCAPE ───────────────────────────────────────────────────
  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // ── FORMAT WAKTU ──────────────────────────────────────────────────
  function formatTime(pubDate) {
    try {
      const d = new Date(pubDate.replace(' ','T') + (pubDate.includes('Z') ? '' : 'Z'));
      if (isNaN(d)) return '';
      return d.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit', minute: '2-digit'
      }) + ' WIB';
    } catch(e) { return ''; }
  }

  // ── INJECT SECTION HTML ───────────────────────────────────────────
  function injectSectionHTML() {
    // Cari economic calendar section (parent div.econ-calendar)
    const econCal = document.querySelector('.econ-calendar');
    if (!econCal || document.getElementById(SECTION_ID)) return;

    const section = document.createElement('div');
    section.id    = SECTION_ID;
    section.style.cssText = `
      background: var(--dark3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    `;

    section.innerHTML = `
      <div class="v14-subheader" style="margin-bottom:4px;">
        📡 ECONOMIC NEWS — HARI INI
        <span style="font-size:9px;color:var(--text-muted);text-transform:none;
          letter-spacing:0;font-weight:400;margin-left:6px;">
          🇺🇸 US &amp; 🇮🇩 Indonesia · Sumber: newsdata.io
        </span>
      </div>
      <div id="econNewsStatus" style="
        font-size:9px; font-family:'DM Mono',monospace; letter-spacing:0.5px;
        padding:4px 8px; border-radius:3px; margin-bottom:10px;
        color:var(--text-muted); background:var(--dark4); text-align:center;">
        ⏳ Memuat berita ekonomi...
      </div>
      <div id="${LIST_ID}"></div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:14px;
        border-top:1px solid var(--border);padding-top:10px;line-height:1.6;">
        ⚠️ <strong style="color:var(--text-dim);">Disclaimer:</strong>
        Prediksi bersifat algoritmik berdasarkan analisis sentimen teks berita.
        Bukan saran finansial. Selalu lakukan analisis mandiri sebelum trading.
      </div>
    `;

    // Masukkan setelah .econ-calendar
    econCal.parentNode.insertBefore(section, econCal.nextSibling);
  }

  // ── SET STATUS ────────────────────────────────────────────────────
  function setStatus(msg, type) {
    const el = document.getElementById('econNewsStatus');
    if (!el) return;
    const styleMap = {
      loading: 'color:var(--text-muted);background:var(--dark4)',
      ok:      'color:var(--green);background:rgba(46,204,113,0.08)',
      warn:    'color:var(--orange);background:rgba(230,126,34,0.08)',
      error:   'color:var(--red);background:rgba(231,76,60,0.08)'
    };
    el.style.cssText = `
      font-size:9px; font-family:'DM Mono',monospace; letter-spacing:0.5px;
      padding:4px 8px; border-radius:3px; margin-bottom:10px; text-align:center;
      ${styleMap[type] || styleMap.loading}
    `;
    el.textContent = msg;
  }

  // ── RENDER BERITA ─────────────────────────────────────────────────
  function renderNews(articles) {
    const container = document.getElementById(LIST_ID);
    if (!container) return;

    if (!articles || articles.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">
          <div style="font-size:28px;margin-bottom:8px;">🔍</div>
          Tidak ada berita ekonomi hari ini yang ditemukan.
        </div>`;
      return;
    }

    // Group by country
    const usNews  = articles.filter(a => a._country === 'us');
    const idNews  = articles.filter(a => a._country === 'id');

    let html = '';

    // ── Render satu grup ──────────────────────────────────────────
    function renderGroup(list, flag, label, country) {
      if (list.length === 0) return '';

      let out = `
        <div style="
          font-family:'DM Mono',monospace; font-size:10px; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase;
          color:var(--text-dim); margin:14px 0 8px;
          display:flex; align-items:center; gap:6px;">
          <span>${flag}</span>
          <span>${label}</span>
          <span style="color:var(--border-bright);font-size:10px;">
            ─────
          </span>
          <span style="color:var(--text-muted);font-size:9px;font-weight:400;
            text-transform:none;letter-spacing:0;">
            ${list.length} berita
          </span>
        </div>`;

      list.forEach((article, idx) => {
        const sentiment  = analyzeSentiment(article.title, article.description, country);
        const prediction = getPrediction(sentiment, country);
        const impact     = IMPACT_COLORS[sentiment];
        const timeStr    = article.pubDate ? formatTime(article.pubDate) : '';
        const icon       = NEUTRAL_ICONS[idx % NEUTRAL_ICONS.length];
        const desc       = article.description
          ? esc(article.description).substring(0, 160) + (article.description.length > 160 ? '…' : '')
          : '';
        const source     = esc(article.source_id || article.source_name || 'newsdata.io');

        out += `
          <div style="
            background: ${impact.bg};
            border: 1px solid ${impact.border};
            border-left: 3px solid ${impact.label};
            border-radius: 6px;
            padding: 12px 14px;
            margin-bottom: 10px;
            cursor: ${article.link ? 'pointer' : 'default'};
            transition: opacity 0.15s;"
            ${article.link ? `onclick="window.open('${esc(article.link)}','_blank')"` : ''}
            onmouseenter="this.style.opacity='0.85'"
            onmouseleave="this.style.opacity='1'">

            <!-- Header: sentiment badge + source + waktu -->
            <div style="display:flex;align-items:center;justify-content:space-between;
              flex-wrap:wrap;gap:4px;margin-bottom:7px;">
              <div style="display:flex;align-items:center;gap:5px;">
                <span style="
                  font-size:8px; font-family:'DM Mono',monospace; font-weight:700;
                  letter-spacing:1px; padding:2px 7px; border-radius:3px;
                  background:${impact.label}22; color:${impact.label};
                  border:1px solid ${impact.label}55;">
                  ${impact.text}
                </span>
                <span style="font-size:9px;color:var(--text-muted);
                  font-family:'DM Mono',monospace;">
                  ${source}
                </span>
              </div>
              ${timeStr ? `
              <span style="font-size:9px;color:var(--text-muted);
                font-family:'DM Mono',monospace;">
                🕐 ${timeStr}
              </span>` : ''}
            </div>

            <!-- Judul berita -->
            <div style="
              font-size:13px; font-weight:600; color:var(--text);
              line-height:1.45; margin-bottom:${desc ? '7px' : '0'};">
              ${icon} ${esc(article.title)}
              ${article.link ? `<span style="color:var(--text-muted);font-size:10px;margin-left:4px;">↗</span>` : ''}
            </div>

            <!-- Deskripsi singkat -->
            ${desc ? `
            <div style="
              font-size:11px; color:var(--text-dim);
              line-height:1.55; margin-bottom:8px;">
              ${desc}
            </div>` : ''}

            <!-- Prediksi -->
            <div style="
              background:rgba(0,0,0,0.25);
              border:1px solid rgba(255,255,255,0.06);
              border-radius:4px;
              padding:7px 10px;
              margin-top:6px;
              display:flex; align-items:flex-start; gap:6px;">
              <span style="font-size:14px;flex-shrink:0;margin-top:1px;">
                ${prediction.icon}
              </span>
              <div>
                <div style="font-size:8px;font-family:'DM Mono',monospace;
                  letter-spacing:1px;color:var(--gold);font-weight:700;
                  margin-bottom:2px;">
                  PREDIKSI
                </div>
                <div style="font-size:11px;color:var(--text-dim);line-height:1.5;">
                  ${prediction.text}
                </div>
              </div>
            </div>
          </div>`;
      });

      return out;
    }

    html += renderGroup(usNews, '🇺🇸', 'United States', 'us');
    html += renderGroup(idNews, '🇮🇩', 'Indonesia', 'id');

    container.innerHTML = html || `
      <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">
        Tidak ada berita ditemukan untuk hari ini.
      </div>`;
  }

  // ── FETCH ─────────────────────────────────────────────────────────
  async function fetchEconomicNews() {
    // Cek cache dulu
    try {
      const cachedTs = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0');
      if (Date.now() - cachedTs < CACHE_TTL_MS) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            renderNews(parsed);
            setStatus(
              `✅ ${parsed.length} berita dimuat (cache) · Update: ${new Date(cachedTs).toLocaleTimeString('id-ID')}`,
              'ok'
            );
            return;
          }
        }
      }
    } catch(e) {}

    setStatus('⏳ Mengambil berita ekonomi hari ini...', 'loading');

    try {
      // Fetch US news — ekonomi/bisnis/keuangan
      const queryUS = encodeURIComponent(
        'economy OR inflation OR Federal Reserve OR interest rate OR GDP OR jobs OR stock market OR dollar'
      );
      const urlUS = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}` +
        `&q=${queryUS}&country=us&language=en&category=business&size=5`;

      // Fetch Indonesia news
      const queryID = encodeURIComponent(
        'ekonomi OR inflasi OR Bank Indonesia OR rupiah OR IHSG OR investasi OR ekspor OR impor'
      );
      const urlID = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}` +
        `&q=${queryID}&country=id&language=id,en&category=business&size=5`;

      const [resUS, resID] = await Promise.allSettled([
        fetch(urlUS),
        fetch(urlID)
      ]);

      let articles = [];

      // Parse US
      if (resUS.status === 'fulfilled' && resUS.value.ok) {
        const dataUS = await resUS.value.json();
        if (dataUS.status === 'success' && Array.isArray(dataUS.results)) {
          dataUS.results.forEach(a => { a._country = 'us'; articles.push(a); });
        }
      }

      // Parse ID
      if (resID.status === 'fulfilled' && resID.value.ok) {
        const dataID = await resID.value.json();
        if (dataID.status === 'success' && Array.isArray(dataID.results)) {
          dataID.results.forEach(a => { a._country = 'id'; articles.push(a); });
        }
      }

      if (articles.length === 0) {
        throw new Error('Tidak ada berita ditemukan dari kedua sumber');
      }

      // Simpan cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));

      renderNews(articles);
      setStatus(
        `✅ ${articles.length} berita dimuat · Update: ${new Date().toLocaleTimeString('id-ID')}`,
        'ok'
      );

    } catch(err) {
      console.warn('[ICT Forge EconNews] Error:', err.message);
      setStatus('⚠️ Gagal memuat berita — cek koneksi atau quota API', 'warn');

      // Coba load cache lama meski expired
      try {
        const stale = localStorage.getItem(CACHE_KEY);
        if (stale) {
          const parsed = JSON.parse(stale);
          if (Array.isArray(parsed) && parsed.length > 0) {
            renderNews(parsed);
            setStatus('⚠️ Menampilkan cache lama — koneksi gagal', 'warn');
          }
        }
      } catch(e) {}
    }
  }

  // ── REFRESH BUTTON ────────────────────────────────────────────────
  window.refreshEconNews = function() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
    fetchEconomicNews();
  };

  // ── INIT ──────────────────────────────────────────────────────────
  function init() {
    injectSectionHTML();
    fetchEconomicNews();
    // Auto-refresh tiap 3 jam
    setInterval(fetchEconomicNews, CACHE_TTL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Tunggu sebentar agar calendar.html sudah di-render ke DOM
    setTimeout(init, 500);
  }

})();
