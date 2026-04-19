// ═══════════════════════════════════════════════════════════════════
//  ICT FORGE — ECONOMIC NEWS FEED v2.0
//  Berita ekonomi hari ini: US & Indonesia via newsdata.io
//  + Bloomberg-style auto report (algorithmic, no AI API)
//  Author: Rizky Saputra · ICT Forge v1.0
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const NEWSDATA_API_KEY = window._NEWSDATA_KEY || 'pub_720f8970bca242bdb33001f15e59c9b2';
  const CACHE_KEY        = 'ict-econnews-v2-cache';
  const CACHE_TS_KEY     = 'ict-econnews-v2-ts';
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

  function calcImpactScore(sentiment, topics, country) {
    let score = 5;
    const hi = ['rates','inflation','labor','fiscal'];
    const md = ['trade','currency','equity'];
    topics.forEach(t => { if(hi.includes(t)) score+=3; else if(md.includes(t)) score+=2; else score+=1; });
    if (sentiment !== 'neutral') score += 1;
    return Math.min(score, 15);
  }

  function generateReport(article, sentiment, topics, country) {
    const impact    = IMPACT_COLORS[sentiment];
    const score     = calcImpactScore(sentiment, topics, country);
    const strength  = score>=12?'Strong':score>=9?'Moderate':'Weak';
    const sColor    = score>=12?'#2ECC71':score>=9?'#C9A84C':'#9A9890';
    const tradeable = score >= 10;
    const confPct   = Math.round((score/15)*100);
    const asset     = country==='id'?'IDR & Pasar Indonesia':'USD & Pasar AS';
    const sdir      = sentiment==='bullish'?'Bullish':sentiment==='bearish'?'Bearish':'Neutral';

    // Analytical Headline
    const topicLabel = {energy:'energy sector',labor:'labor market',inflation:'inflation',rates:'monetary policy',trade:'trade dynamics',fiscal:'fiscal policy',equity:'equity market',currency:'currency',general:'macroeconomic'}[topics[0]]||'macroeconomic';
    const dir = sentiment==='bullish'?'supportive of':sentiment==='bearish'?'negative for':'neutral for';
    const headline = `${country==='id'?'Indonesia':'U.S.'} ${topicLabel} development — ${dir} near-term market stability`;

    // Executive Summary
    const sMap = {
      bullish:`Perkembangan ini berpotensi memberikan tekanan positif pada ${asset}. `,
      bearish:`Perkembangan ini berpotensi memberikan tekanan negatif pada ${asset}. `,
      neutral:`Dampak langsung terhadap ${asset} relatif terbatas dalam jangka pendek. `
    };
    const topicCtx = {
      energy:'Sektor energi menjadi fokus dengan implikasi pada inflasi dan neraca perdagangan.',
      labor:'Data ketenagakerjaan mempengaruhi ekspektasi kebijakan moneter ke depan.',
      inflation:'Tekanan inflasi berdampak langsung pada ekspektasi kebijakan bank sentral.',
      rates:'Perubahan suku bunga memiliki transmisi langsung ke seluruh kelas aset.',
      trade:'Dinamika perdagangan mempengaruhi neraca pembayaran dan nilai tukar.',
      fiscal:'Kebijakan fiskal berdampak pada likuiditas pasar dan ekspektasi pertumbuhan.',
      equity:'Sentimen pasar saham merefleksikan ekspektasi pertumbuhan ekonomi secara luas.',
      currency:'Pergerakan nilai tukar berdampak pada inflasi impor dan daya saing ekspor.',
      general:'Perlu observasi lanjutan untuk mengkonfirmasi dampak ke pasar finansial.'
    };
    const summary = (sMap[sentiment]||sMap.neutral)+(topicCtx[topics[0]]||topicCtx.general)+' Analisis ini bersifat algoritmik dan perlu dikonfirmasi dengan data tambahan.';

    // Transmission Mechanism
    const chains = {
      energy:    ['Kebijakan/berita energi → ekspektasi biaya produksi','Biaya produksi ↑/↓ → proyeksi inflasi berubah','Ekspektasi inflasi → re-pricing ekspektasi suku bunga','Suku bunga expectations → dampak ke FX & yield curve'],
      labor:     ['Data ketenagakerjaan → ekspektasi pertumbuhan upah','Upah ↑ → tekanan inflasi (demand-pull)','Tekanan inflasi → ekspektasi kebijakan bank sentral','Kebijakan moneter → dampak ke seluruh kelas aset'],
      inflation: ['Data inflasi → re-pricing ekspektasi kebijakan Fed/BI','Ekspektasi kebijakan → pergerakan yield obligasi','Yield → re-pricing ekuitas & FX','FX & ekuitas → dampak ke portofolio investor asing'],
      rates:     ['Kebijakan suku bunga → cost of capital berubah','Cost of capital → valuasi aset di-reprice','Repricing aset → aliran modal lintas negara','Capital flow → tekanan pada nilai tukar & ekuitas'],
      trade:     ['Data perdagangan → ekspektasi neraca pembayaran','Neraca pembayaran → tekanan supply/demand FX','Tekanan FX → dampak ke inflasi impor','Inflasi impor → pertimbangan kebijakan bank sentral'],
      general:   ['Berita makro → perubahan ekspektasi pertumbuhan','Ekspektasi pertumbuhan → sentiment risk-on/risk-off','Risk sentiment → alokasi portofolio global','Alokasi portofolio → dampak ke FX & ekuitas domestik']
    };
    const steps = (chains[topics[0]]||chains.general);
    const transmission = steps.map((s,i)=>`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;"><div style="flex-shrink:0;width:18px;height:18px;border-radius:50%;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--gold);font-weight:700;margin-top:1px;">${i+1}</div><div style="font-size:11px;color:var(--text-dim);line-height:1.5;font-family:'DM Sans',sans-serif;">${s}</div></div>`).join('');

    // Market Impact
    const fxBias  = sentiment==='bullish'?(country==='id'?'Bullish IDR':'Bullish USD'):sentiment==='bearish'?(country==='id'?'Bearish IDR':'Bearish USD'):'Neutral';
    const fxColor = sentiment==='bullish'?'#2ECC71':sentiment==='bearish'?'#E74C3C':'#9A9890';
    const cell=(label,value,color)=>`<div style="background:rgba(0,0,0,0.2);border-radius:4px;padding:8px 10px;"><div style="font-size:8px;color:var(--text-muted);letter-spacing:1px;margin-bottom:3px;">${label}</div><div style="font-size:10px;font-weight:700;color:${color||'var(--text-dim)'};">${value}</div></div>`;
    const mktImpact = cell('FX',fxBias,fxColor)+cell('RATES',sentiment==='bullish'?'Slightly Bearish (yield ↑)':sentiment==='bearish'?'Slightly Bullish (yield ↓)':'Neutral',fxColor)+cell('EQUITIES',sentiment==='bullish'?'Bullish (risk-on)':sentiment==='bearish'?'Bearish (risk-off)':'Neutral',fxColor)+cell('COMMODITIES',topics.includes('energy')?(sentiment==='bullish'?'Bullish':'Bearish'):'Neutral',topics.includes('energy')?fxColor:'#9A9890');

    // Time Horizon
    const hRow=(l,v,c)=>`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:9px;color:var(--text-muted);min-width:90px;flex-shrink:0;">${l}</span><span style="font-size:10px;color:${c};text-align:right;line-height:1.4;font-family:'DM Sans',sans-serif;">${v}</span></div>`;
    const horizon = hRow('Intraday',score>=13?'⚡ High volatility possible':'Minimal direct impact',score>=13?'#E74C3C':'#9A9890')+hRow('Short (1-5h)',score>=10?'📊 Monitor price action closely':'Kondisional — perlu katalis tambahan',score>=10?'#C9A84C':'#9A9890')+hRow('Medium (1-4w)',score>=8?'📈 Potential trend confirmation':'Neutral — tergantung data berikutnya',score>=8?'#5B9BD5':'#9A9890')+hRow('Long-term','Depends on policy follow-through & macro alignment','#9A9890');

    // Market Context
    const context = country==='us'
      ? 'Pasar saat ini lebih sensitif terhadap data CPI/PCE dan sinyal FOMC. Berita ini perlu dievaluasi relatif terhadap upcoming high-impact events. Gunakan Event Countdown di atas untuk antisipasi volatilitas.'
      : 'Pasar Indonesia dipengaruhi sentimen risk global, kebijakan BI, dan aliran modal asing. IHSG & IDR lebih responsif terhadap data eksternal (Fed, DXY). Konfirmasi dengan data teknikal sebelum posisi.';

    // Risk Factors
    const riskPool = {energy:['Regulasi & perizinan dapat memperlambat implementasi','Volatilitas harga komoditas energi global'],labor:['Data revisi bulan berikutnya dapat mengubah gambaran','Seasonal adjustment dapat distorsi angka headline'],inflation:['Core vs headline dapat memberikan sinyal berbeda','Ekspektasi pasar sudah ter-priced sebelum rilis'],rates:['Forward guidance lebih penting dari keputusan aktual','Dissenting votes memberikan sinyal campur'],trade:['Volatilitas kurs dapat mendistorsi data nominal','Faktor one-off pengaruhi angka bulanan'],fiscal:['Implementasi kebijakan sering tertunda','Dampak tergantung respons bond market'],general:['Katalis makro lain dapat override dampak berita ini','Likuiditas rendah dapat amplifikasi volatilitas']};
    const riskItems = (riskPool[topics[0]]||riskPool.general).slice(0,2);
    if(topics[1]&&riskPool[topics[1]]) riskItems.push(riskPool[topics[1]][0]);
    const risks = riskItems.slice(0,3).map(r=>`<div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:5px;"><span style="color:var(--red);flex-shrink:0;font-size:10px;margin-top:2px;">▸</span><span style="font-size:11px;color:var(--text-dim);line-height:1.5;font-family:'DM Sans',sans-serif;">${r}</span></div>`).join('');

    // Bottom Line
    const trd = tradeable?'Ada trade signal — konfirmasi dengan price action.':'No immediate trade signal — gunakan sebagai konteks bias.';
    const bottomLine = `${strength} ${sdir} bias pada ${asset}. ${trd}`;

    // Positioning
    const positioning = tradeable
      ? `<span style="color:var(--green);font-weight:600;">✅ TRADEABLE</span> — ${strength} catalyst. Cukup kuat sebagai trigger entry dengan konfirmasi price action.`
      : `<span style="color:var(--text-muted);">⚠️ NOT TRADEABLE</span> — Lebih cocok sebagai konfirmasi bias jangka menengah, bukan trigger entry langsung.`;

    return `<div style="font-family:'DM Mono',monospace;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
        <span style="font-size:9px;color:var(--text-muted);letter-spacing:1px;">IMPACT SCORE</span>
        <div style="flex:1;height:4px;background:var(--dark4);border-radius:2px;">
          <div style="width:${confPct}%;height:100%;background:${sColor};border-radius:2px;"></div>
        </div>
        <span style="font-size:10px;font-weight:700;color:${sColor};">${score}/15 · ${strength}</span>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:4px;">📌 ANALYTICAL HEADLINE</div>
        <div style="font-size:12px;color:var(--text);line-height:1.5;font-weight:600;font-family:'DM Sans',sans-serif;">${esc(headline)}</div>
      </div>
      <div style="background:rgba(0,0,0,0.2);border-radius:4px;padding:10px 12px;margin-bottom:12px;border-left:2px solid ${impact.label};">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:5px;">📋 EXECUTIVE SUMMARY</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.65;font-family:'DM Sans',sans-serif;">${summary}</div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:6px;">⛓️ TRANSMISSION MECHANISM</div>
        ${transmission}
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:6px;">📊 MARKET IMPACT</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">${mktImpact}</div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:6px;">⏳ TIME HORIZON</div>
        ${horizon}
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:4px;">🌐 MARKET CONTEXT</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;font-family:'DM Sans',sans-serif;">${context}</div>
      </div>
      <div style="margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:6px;">⚠️ RISK FACTORS</div>
        ${risks}
      </div>
      <div style="background:rgba(0,0,0,0.2);border-radius:4px;padding:10px 12px;margin-bottom:12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:4px;">🎯 POSITIONING INSIGHT</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;font-family:'DM Sans',sans-serif;">${positioning}</div>
      </div>
      <div style="background:${impact.bg};border:1px solid ${impact.border};border-radius:4px;padding:10px 12px;">
        <div style="font-size:8px;letter-spacing:1.5px;color:var(--gold);font-weight:700;margin-bottom:4px;">🏁 BOTTOM LINE</div>
        <div style="font-size:12px;color:${impact.label};line-height:1.5;font-weight:700;font-family:'DM Sans',sans-serif;">${esc(bottomLine)}</div>
      </div>
    </div>`;
  }

  function injectSectionHTML() {
    const econCal = document.querySelector('.econ-calendar');
    if (!econCal || document.getElementById(SECTION_ID)) return;
    const section = document.createElement('div');
    section.id = SECTION_ID;
    section.style.cssText = 'background:var(--dark3);border:1px solid var(--border);border-radius:8px;padding:20px;margin-top:20px;';
    section.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <div class="v14-subheader" style="margin-bottom:0;">
          📡 ECONOMIC NEWS — HARI INI
          <span style="font-size:9px;color:var(--text-muted);text-transform:none;letter-spacing:0;font-weight:400;margin-left:6px;">🇺🇸 US &amp; 🇮🇩 Indonesia · newsdata.io</span>
        </div>
        <button onclick="refreshEconNews()" style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;padding:4px 10px;border-radius:3px;cursor:pointer;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:var(--gold);">↺ REFRESH</button>
      </div>
      <div id="econNewsStatus" style="font-size:9px;font-family:'DM Mono',monospace;letter-spacing:0.5px;padding:4px 8px;border-radius:3px;margin-bottom:10px;color:var(--text-muted);background:var(--dark4);text-align:center;">⏳ Memuat berita ekonomi...</div>
      <div id="${LIST_ID}"></div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:14px;border-top:1px solid var(--border);padding-top:10px;line-height:1.6;">
        ⚠️ <strong style="color:var(--text-dim);">Disclaimer:</strong> Analisis bersifat algoritmik (sentimen teks + keyword scoring). Bukan saran finansial. Konfirmasi dengan price action sebelum trading.
      </div>`;
    econCal.parentNode.insertBefore(section, econCal.nextSibling);
  }

  function setStatus(msg, type) {
    const el = document.getElementById('econNewsStatus');
    if (!el) return;
    const c={loading:'color:var(--text-muted);background:var(--dark4)',ok:'color:var(--green);background:rgba(46,204,113,0.08)',warn:'color:var(--orange);background:rgba(230,126,34,0.08)',error:'color:var(--red);background:rgba(231,76,60,0.08)'};
    el.setAttribute('style',`font-size:9px;font-family:'DM Mono',monospace;letter-spacing:0.5px;padding:4px 8px;border-radius:3px;margin-bottom:10px;text-align:center;${c[type]||c.loading}`);
    el.textContent = msg;
  }

  window._econNewsToggle = function(id) {
    const panel = document.getElementById('enr-'+id);
    const btn   = document.getElementById('enb-'+id);
    if (!panel||!btn) return;
    const open = panel.style.display !== 'none';
    panel.style.display  = open?'none':'block';
    btn.textContent      = open?'📊 Lihat Analisis Lengkap ▾':'📊 Tutup Analisis ▴';
    btn.style.background = open?'rgba(201,168,76,0.08)':'rgba(201,168,76,0.18)';
  };

  function renderNews(articles) {
    const container = document.getElementById(LIST_ID);
    if (!container) return;
    if (!articles||!articles.length) {
      container.innerHTML='<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px;"><div style="font-size:28px;margin-bottom:8px;">🔍</div>Tidak ada berita ditemukan.</div>';
      return;
    }
    const usNews = articles.filter(a=>a._country==='us');
    const idNews = articles.filter(a=>a._country==='id');
    let html='';

    function renderGroup(list, flag, label, country) {
      if (!list.length) return '';
      let out=`<div style="font-family:'DM Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);margin:14px 0 8px;display:flex;align-items:center;gap:6px;"><span>${flag}</span><span>${label}</span><span style="color:var(--border-bright);">─────</span><span style="color:var(--text-muted);font-size:9px;font-weight:400;text-transform:none;letter-spacing:0;">${list.length} berita</span></div>`;
      list.forEach((article,idx)=>{
        const uid       = country+idx;
        const sentiment = analyzeSentiment(article.title,article.description,country);
        const topics    = detectTopics(article.title,article.description);
        const impact    = IMPACT_COLORS[sentiment];
        const score     = calcImpactScore(sentiment,topics,country);
        const strength  = score>=12?'Strong':score>=9?'Moderate':'Weak';
        const sColor    = score>=12?'#2ECC71':score>=9?'#C9A84C':'#9A9890';
        const timeStr   = article.pubDate?formatTime(article.pubDate):'';
        const icon      = ICONS[idx%ICONS.length];
        const source    = esc(article.source_id||article.source_name||'newsdata.io');
        const desc      = article.description?esc(article.description).substring(0,160)+(article.description.length>160?'…':''):'';
        const reportHTML= generateReport(article,sentiment,topics,country);

        out+=`<div style="background:${impact.bg};border:1px solid ${impact.border};border-left:3px solid ${impact.label};border-radius:6px;padding:12px 14px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-bottom:7px;">
            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
              <span style="font-size:8px;font-family:'DM Mono',monospace;font-weight:700;letter-spacing:1px;padding:2px 7px;border-radius:3px;background:${impact.label}22;color:${impact.label};border:1px solid ${impact.label}55;">${impact.text}</span>
              <span style="font-size:8px;font-family:'DM Mono',monospace;color:${sColor};border:1px solid ${sColor}44;padding:2px 6px;border-radius:3px;background:${sColor}11;">${strength.toUpperCase()}</span>
              <span style="font-size:9px;color:var(--text-muted);font-family:'DM Mono',monospace;">${source}</span>
            </div>
            ${timeStr?`<span style="font-size:9px;color:var(--text-muted);font-family:'DM Mono',monospace;">🕐 ${timeStr}</span>`:''}
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.45;margin-bottom:${desc?'7px':'0'};">
            ${icon} ${esc(article.title)}
            ${article.link?`<span style="color:var(--text-muted);font-size:10px;margin-left:3px;cursor:pointer;" onclick="event.stopPropagation();window.open('${esc(article.link)}','_blank')">↗</span>`:''}
          </div>
          ${desc?`<div style="font-size:11px;color:var(--text-dim);line-height:1.55;margin-bottom:8px;">${desc}</div>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
            ${topics.map(t=>`<span style="font-size:8px;font-family:'DM Mono',monospace;padding:1px 6px;border-radius:2px;background:rgba(201,168,76,0.08);color:var(--gold-dim);border:1px solid rgba(201,168,76,0.15);">${t.toUpperCase()}</span>`).join('')}
          </div>
          <button id="enb-${uid}" onclick="_econNewsToggle('${uid}')" style="width:100%;padding:7px 12px;border-radius:4px;cursor:pointer;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;font-weight:700;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);color:var(--gold);transition:all 0.15s;text-align:center;">
            📊 Lihat Analisis Lengkap ▾
          </button>
          <div id="enr-${uid}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
            ${reportHTML}
          </div>
        </div>`;
      });
      return out;
    }

    html += renderGroup(usNews,'🇺🇸','United States','us');
    html += renderGroup(idNews,'🇮🇩','Indonesia','id');
    container.innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--text-muted);">Tidak ada berita ditemukan.</div>';
  }

  async function fetchEconomicNews() {
    try {
      const cachedTs = parseInt(localStorage.getItem(CACHE_TS_KEY)||'0');
      if (Date.now()-cachedTs<CACHE_TTL_MS) {
        const cached=localStorage.getItem(CACHE_KEY);
        if(cached){const parsed=JSON.parse(cached);if(Array.isArray(parsed)&&parsed.length>0){renderNews(parsed);setStatus(`✅ ${parsed.length} berita dimuat (cache) · ${new Date(cachedTs).toLocaleTimeString('id-ID')}`,'ok');return;}}
      }
    } catch(e){}
    setStatus('⏳ Mengambil berita ekonomi hari ini...','loading');
    try {
      const qUS=encodeURIComponent('economy OR inflation OR "Federal Reserve" OR "interest rate" OR GDP OR jobs OR "stock market" OR dollar OR tariff OR "trade war"');
      const qID=encodeURIComponent('ekonomi OR inflasi OR "Bank Indonesia" OR rupiah OR IHSG OR investasi OR ekspor OR impor OR "suku bunga" OR BBM');
      const [rUS,rID]=await Promise.allSettled([
        fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${qUS}&country=us&language=en&category=business&size=5`),
        fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${qID}&country=id&language=id,en&category=business&size=5`)
      ]);
      let articles=[];
      if(rUS.status==='fulfilled'&&rUS.value.ok){const d=await rUS.value.json();if(d.status==='success'&&Array.isArray(d.results))d.results.forEach(a=>{a._country='us';articles.push(a);});}
      if(rID.status==='fulfilled'&&rID.value.ok){const d=await rID.value.json();if(d.status==='success'&&Array.isArray(d.results))d.results.forEach(a=>{a._country='id';articles.push(a);});}
      if(!articles.length) throw new Error('Tidak ada berita');
      localStorage.setItem(CACHE_KEY,JSON.stringify(articles));
      localStorage.setItem(CACHE_TS_KEY,String(Date.now()));
      renderNews(articles);
      setStatus(`✅ ${articles.length} berita dimuat · Update: ${new Date().toLocaleTimeString('id-ID')}`,'ok');
    } catch(err){
      console.warn('[ICT Forge EconNews]',err.message);
      setStatus('⚠️ Gagal memuat berita — cek koneksi atau quota API','warn');
      try{const stale=localStorage.getItem(CACHE_KEY);if(stale){const p=JSON.parse(stale);if(Array.isArray(p)&&p.length>0){renderNews(p);setStatus('⚠️ Menampilkan cache lama — koneksi gagal','warn');}}}catch(e){}
    }
  }

  window.refreshEconNews = function() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
    fetchEconomicNews();
  };

  function init() {
    injectSectionHTML();
    fetchEconomicNews();
    setInterval(fetchEconomicNews, CACHE_TTL_MS);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else setTimeout(init,500);

})();
