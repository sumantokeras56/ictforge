// ═══════════════════════════════════════════════════════════════════
//  ICT FORGE — ECONOMIC NEWS FEED v3.0
//  Fix: CORS bypass via script injection (JSONP-style)
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const NEWSDATA_API_KEY = 'pub_720f8970bca242bdb33001f15e59c9b2';
  const CACHE_KEY        = 'ict-econnews-v3-cache';
  const CACHE_TS_KEY     = 'ict-econnews-v3-ts';
  const CACHE_TTL_MS     = 3 * 60 * 60 * 1000;
  const SECTION_ID       = 'econNewsSection';
  const LIST_ID          = 'econNewsList';

  const KW = {
    bullish_us: ['rate hike','hawkish','strong jobs','beat expectations','gdp growth','inflation rises','consumer spending up','record high','surplus','strong dollar','optimism','recovery','expansion','positive outlook','hiring','wages rise','retail sales up','manufacturing growth','nuclear','energy security','infrastructure','investment boom'],
    bearish_us: ['rate cut','dovish','job losses','miss expectations','recession','inflation falls','consumer spending down','deficit','weak dollar','uncertainty','slowdown','contraction','negative outlook','layoffs','bankruptcy','debt ceiling','shutdown','tariff','trade war','default'],
    bullish_id: ['rupiah menguat','ekspor naik','surplus','pertumbuhan ekonomi','bi rate naik','investasi masuk','cadangan devisa naik','inflasi terkendali','gdp naik','optimis','pemulihan','ekspansi','neraca surplus','ihsg naik','modal asing masuk'],
    bearish_id: ['rupiah melemah','impor naik','defisit','perlambatan','bi rate turun','investasi turun','cadangan devisa turun','inflasi tinggi','gdp turun','resesi','phk','kontraksi','neraca defisit','ihsg turun','modal asing keluar','bbm naik','harga naik','subsidi dipotong'],
    topic_energy:    ['nuclear','energy','oil','gas','bbm','fuel','power','electricity'],
    topic_labor:     ['jobs','employment','payroll','hiring','layoff','phk','tenaga kerja'],
    topic_inflation: ['inflation','cpi','ppi','price','harga','inflasi'],
    topic_rates:     ['rate','fed','fomc','bi rate','suku bunga','interest'],
    topic_trade:     ['trade','export','import','ekspor','impor','tariff','surplus','deficit'],
    topic_fiscal:    ['budget','deficit','debt','anggaran','utang','tax','pajak'],
    topic_equity:    ['stock','market','ihsg','wall street','nasdaq','s&p','equit'],
    topic_currency:  ['dollar','rupiah','usd','idr','forex','currency','fx'],
  };

  const IMPACT_COLORS = {
    bullish: { bg:'rgba(46,204,113,0.07)', border:'rgba(46,204,113,0.22)', label:'#2ECC71', text:'BULLISH' },
    bearish: { bg:'rgba(231,76,60,0.07)',  border:'rgba(231,76,60,0.22)',  label:'#E74C3C', text:'BEARISH' },
    neutral: { bg:'rgba(34,34,40,0.6)',    border:'rgba(90,88,86,0.2)',    label:'#9A9890', text:'NEUTRAL'  }
  };

  const ICONS = ['📰','📊','💼','🏦','📈','📉','💹','🌐','⚡','🔍'];

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function formatTime(pubDate) {
    try {
      const d = new Date(pubDate.replace(' ','T')+(pubDate.includes('Z')?'':'Z'));
      if (isNaN(d)) return '';
      return d.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'})+' WIB';
    } catch(e){ return ''; }
  }

  function analyzeSentiment(title, desc, country) {
    const text = ((title||'')+' '+(desc||'')).toLowerCase();
    const bulls = country==='id' ? KW.bullish_id : KW.bullish_us;
    const bears = country==='id' ? KW.bearish_id : KW.bearish_us;
    let b=0,r=0;
    bulls.forEach(k=>{ if(text.includes(k)) b++; });
    bears.forEach(k=>{ if(text.includes(k)) r++; });
    return b>r?'bullish':r>b?'bearish':'neutral';
  }

  function detectTopics(title, desc) {
    const text = ((title||'')+' '+(desc||'')).toLowerCase();
    const found = [];
    if (KW.topic_energy.some(k=>text.includes(k)))    found.push('energy');
    if (KW.topic_labor.some(k=>text.includes(k)))     found.push('labor');
    if (KW.topic_inflation.some(k=>text.includes(k))) found.push('inflation');
    if (KW.topic_rates.some(k=>text.includes(k)))     found.push('rates');
    if (KW.topic_trade.some(k=>text.includes(k)))     found.push('trade');
    if (KW.topic_fiscal.some(k=>text.includes(k)))    found.push('fiscal');
    if (KW.topic_equity.some(k=>text.includes(k)))    found.push('equity');
    if (KW.topic_currency.some(k=>text.includes(k)))  found.push('currency');
    return found.length ? found : ['general'];
  }

  function calcImpactScore(sentiment, topics) {
    let score = 5;
    const hi = ['rates','inflation','labor','fiscal'];
    const md = ['trade','currency','equity'];
    topics.forEach(t => { if(hi.includes(t)) score+=3; else if(md.includes(t)) score+=2; else score+=1; });
    if (sentiment !== 'neutral') score += 1;
    return Math.min(score, 15);
  }

  function setStatus(msg, type) {
    const el = document.getElementById('econNewsStatus');
    if (!el) return;
    const c = {
      loading:'color:#9A9890;background:rgba(34,34,40,0.6)',
      ok:'color:#2ECC71;background:rgba(46,204,113,0.08)',
      warn:'color:#E67E22;background:rgba(230,126,34,0.08)',
      error:'color:#E74C3C;background:rgba(231,76,60,0.08)'
    };
    el.style.cssText = `font-size:9px;font-family:'DM Mono',monospace;letter-spacing:0.5px;padding:4px 8px;border-radius:3px;margin-bottom:10px;text-align:center;${c[type]||c.loading}`;
    el.textContent = msg;
  }

  window._econNewsToggle = function(id) {
    const panel = document.getElementById('enr-'+id);
    const btn   = document.getElementById('enb-'+id);
    if (!panel||!btn) return;
    const open = panel.style.display !== 'none';
    panel.style.display  = open?'none':'block';
    btn.textContent      = open?'📊 Lihat Analisis Lengkap ▾':'📊 Tutup Analisis ▴';
  };

  function renderNews(articles) {
    const container = document.getElementById(LIST_ID);
    if (!container) return;
    if (!articles||!articles.length) {
      container.innerHTML='<div style="text-align:center;padding:24px;color:#9A9890;font-size:12px;">🔍 Tidak ada berita ditemukan.</div>';
      return;
    }
    const usNews = articles.filter(a=>a._country==='us');
    const idNews = articles.filter(a=>a._country==='id');
    let html='';

    function renderGroup(list, flag, label, country) {
      if (!list.length) return '';
      let out=`<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9A9890;margin:14px 0 8px;">${flag} ${label} ─── ${list.length} berita</div>`;
      list.forEach((article,idx)=>{
        const uid       = country+idx;
        const sentiment = analyzeSentiment(article.title,article.description,country);
        const topics    = detectTopics(article.title,article.description);
        const impact    = IMPACT_COLORS[sentiment];
        const score     = calcImpactScore(sentiment,topics);
        const strength  = score>=12?'Strong':score>=9?'Moderate':'Weak';
        const sColor    = score>=12?'#2ECC71':score>=9?'#C9A84C':'#9A9890';
        const timeStr   = article.pubDate?formatTime(article.pubDate):'';
        const icon      = ICONS[idx%ICONS.length];
        const source    = esc(article.source_id||'newsdata.io');
        const desc      = article.description?esc(article.description).substring(0,160)+'…':'';

        out+=`<div style="background:${impact.bg};border:1px solid ${impact.border};border-left:3px solid ${impact.label};border-radius:6px;padding:12px 14px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:7px;flex-wrap:wrap;">
            <span style="font-size:8px;font-weight:700;padding:2px 7px;border-radius:3px;background:${impact.label}22;color:${impact.label};border:1px solid ${impact.label}55;">${impact.text}</span>
            <span style="font-size:8px;color:${sColor};border:1px solid ${sColor}44;padding:2px 6px;border-radius:3px;">${strength.toUpperCase()}</span>
            <span style="font-size:9px;color:#9A9890;">${source}</span>
            ${timeStr?`<span style="font-size:9px;color:#9A9890;margin-left:auto;">🕐 ${timeStr}</span>`:''}
          </div>
          <div style="font-size:13px;font-weight:600;line-height:1.45;margin-bottom:6px;">
            ${icon} ${esc(article.title)}
            ${article.link?`<span style="color:#9A9890;font-size:10px;margin-left:3px;cursor:pointer;" onclick="window.open('${esc(article.link)}','_blank')">↗</span>`:''}
          </div>
          ${desc?`<div style="font-size:11px;color:#9A9890;line-height:1.55;margin-bottom:8px;">${desc}</div>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${topics.map(t=>`<span style="font-size:8px;padding:1px 6px;border-radius:2px;background:rgba(201,168,76,0.08);color:#C9A84C;border:1px solid rgba(201,168,76,0.15);">${t.toUpperCase()}</span>`).join('')}
          </div>
        </div>`;
      });
      return out;
    }

    html += renderGroup(usNews,'🇺🇸','United States','us');
    html += renderGroup(idNews,'🇮🇩','Indonesia','id');
    container.innerHTML = html || '<div style="text-align:center;padding:20px;color:#9A9890;">Tidak ada berita.</div>';
  }

  // ── FETCH VIA JSONP (bypass CORS tanpa proxy) ──
  function fetchJSONP(url) {
    return new Promise((resolve, reject) => {
      const cbName = 'nd_cb_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        delete window[cbName];
        script.remove();
        reject(new Error('timeout'));
      }, 10000);
      window[cbName] = function(data) {
        clearTimeout(timer);
        delete window[cbName];
        script.remove();
        resolve(data);
      };
      script.src = url + '&callback=' + cbName;
      script.onerror = () => { clearTimeout(timer); delete window[cbName]; reject(new Error('script error')); };
      document.head.appendChild(script);
    });
  }

  async function fetchEconomicNews() {
    // Cek cache dulu
    try {
      const cachedTs = parseInt(localStorage.getItem(CACHE_TS_KEY)||'0');
      if (Date.now()-cachedTs < CACHE_TTL_MS) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            renderNews(parsed);
            setStatus(`✅ ${parsed.length} berita dimuat (cache) · ${new Date(cachedTs).toLocaleTimeString('id-ID')}`,'ok');
            return;
          }
        }
      }
    } catch(e){}

    setStatus('⏳ Mengambil berita ekonomi...','loading');

    try {
      const qUS = 'economy OR inflation OR "Federal Reserve" OR "interest rate" OR GDP OR jobs OR dollar OR tariff';
      const qID = 'ekonomi OR inflasi OR rupiah OR IHSG OR investasi OR ekspor OR "suku bunga" OR BBM';

      const baseUS = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(qUS)}&country=us&language=en&category=business&size=5`;
      const baseID = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(qID)}&country=id&language=id,en&category=business&size=5`;

      const WORKER = 'https://black-hat-ebc4.waxewi.workers.dev';
      const [rUS, rID] = await Promise.allSettled([
        fetch(WORKER+'/?u='+encodeURIComponent(baseUS)).then(r=>r.json()),
        fetch(WORKER+'/?u='+encodeURIComponent(baseID)).then(r=>r.json())
      ]);

      let articles = [];
      if (rUS.status==='fulfilled' && rUS.value && rUS.value.status==='success') {
        rUS.value.results.forEach(a => { a._country='us'; articles.push(a); });
      }
      if (rID.status==='fulfilled' && rID.value && rID.value.status==='success') {
        rID.value.results.forEach(a => { a._country='id'; articles.push(a); });
      }

      if (!articles.length) throw new Error('Tidak ada berita');

      localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
      renderNews(articles);
      setStatus(`✅ ${articles.length} berita dimuat · ${new Date().toLocaleTimeString('id-ID')}`,'ok');

    } catch(err) {
      console.warn('[ICT Forge EconNews]', err.message);
      // Coba tampilkan cache lama
      try {
        const stale = localStorage.getItem(CACHE_KEY);
        if (stale) {
          const p = JSON.parse(stale);
          if (Array.isArray(p) && p.length > 0) {
            renderNews(p);
            setStatus('⚠️ Menampilkan cache lama','warn');
            return;
          }
        }
      } catch(e){}
      setStatus('⚠️ Gagal memuat berita — cek koneksi atau quota API','warn');
    }
  }

  window.refreshEconNews = function() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
    fetchEconomicNews();
  };

  function init() {
    fetchEconomicNews();
    setInterval(fetchEconomicNews, CACHE_TTL_MS);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 500);

})();
