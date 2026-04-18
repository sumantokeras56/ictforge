# 🔥 ICT Forge — Institutional Trading Hub

![Release](https://img.shields.io/badge/Release-v1.0.0--Stable-gold)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android%20%7C%20Desktop-blue)
![Language](https://img.shields.io/badge/Language-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-yellow)
![Methodology](https://img.shields.io/badge/Methodology-ICT%20%2F%20SMC-red)
![License](https://img.shields.io/badge/License-Educational%20Use-orange)
![Live](https://img.shields.io/badge/Live-sumantokeras56.github.io%2Fictmasterclass-brightgreen)

> **"Retail trader kalah bukan karena kurang teknik, tapi karena mereka tidak mengerti siapa yang benar-benar menggerakkan pasar."**
> — Michael J. Huddleston (ICT)

**ICT Forge** adalah platform trading education dan tools berbasis web yang dibangun khusus untuk trader yang mempelajari metodologi **Inner Circle Trader (ICT)** dan **Smart Money Concepts (SMC)**. Bukan sekadar kumpulan artikel — ICT Forge adalah ekosistem lengkap yang menggabungkan edukasi mendalam, alat analisis profesional, jurnal trading, dan kalender ekonomi real-time dalam satu antarmuka yang cepat, ringan, dan bisa diinstall sebagai Progressive Web App (PWA) di semua perangkat.

---

## 📖 Daftar Isi

1. [Tentang ICT Forge](#-tentang-ict-forge)
2. [Visi & Filosofi](#-visi--filosofi)
3. [Fitur Lengkap](#-fitur-lengkap)
4. [Modul Edukasi ICT](#-modul-edukasi-ict)
5. [Daily Bias Helper](#-daily-bias-helper)
6. [COT Analyzer](#-cot-analyzer)
7. [Trading Journal](#-trading-journal)
8. [Kalkulator RR & Position Sizer](#-kalkulator-rr--position-sizer)
9. [Live Clock & Session Tracker](#-live-clock--session-tracker)
10. [Economic Calendar Real-Time](#-economic-calendar-real-time)
11. [Event Countdown](#-event-countdown)
12. [PineScript Tools](#-pinescript-tools)
13. [Indikator Siap Pakai](#-indikator-siap-pakai)
14. [Notifikasi Browser](#-notifikasi-browser)
15. [PWA — Install ke Homescreen](#-pwa--install-ke-homescreen)
16. [Arsitektur & Teknologi](#-arsitektur--teknologi)
17. [Struktur File](#-struktur-file)
18. [Cara Deploy](#-cara-deploy)
19. [Roadmap Pengembangan](#-roadmap-pengembangan)
20. [Kredit & Atribusi](#-kredit--atribusi)
21. [Disclaimer](#-disclaimer)

---

## 🧠 Tentang ICT Forge

ICT Forge lahir dari kebutuhan nyata seorang trader Indonesia yang mempelajari metodologi ICT secara serius. Alih-alih bergantung pada puluhan tab browser yang berbeda — satu untuk kalender ekonomi, satu untuk jurnal, satu untuk kalkulator RR, satu untuk membaca materi — ICT Forge menyatukan semuanya dalam satu aplikasi yang bisa dibuka di HP, tablet, maupun desktop.

Nama **"Forge"** dipilih dengan alasan: layaknya sebuah tempaan besi, platform ini dirancang untuk membentuk trader yang kuat, presisi, dan berkarakter institusional. Setiap fitur dibangun berdasarkan prinsip-prinsip ICT yang telah terbukti — bukan indikator retail biasa, melainkan pemahaman mendalam tentang bagaimana institusi menggerakkan pasar.

ICT Forge dikembangkan sepenuhnya oleh **Rizky Saputra**, seorang ICT SMC Researcher dan trader aktif di NQ/Nasdaq Futures dan Forex, yang telah melewati evaluasi prop firm dan terus mengembangkan pemahamannya tentang metodologi ICT. Seluruh konten dan logika dalam aplikasi ini mencerminkan pemahaman langsung dari penggunaan metodologi tersebut di pasar nyata.

---

## 🎯 Visi & Filosofi

### Masalah yang ICT Forge Selesaikan

Dunia trading ritel dipenuhi dengan noise — indikator yang tumpang tindih, sinyal palsu, dan sistem yang dirancang untuk membuat trader kalah. Metodologi ICT hadir untuk membongkar ilusi tersebut dengan mengajarkan cara membaca pergerakan harga dari perspektif institusional.

Namun mempelajari ICT sendiri juga punya tantangan: materinya sangat luas, tersebar di ratusan video YouTube, dan membutuhkan alat-alat bantu yang spesifik. Di sinilah ICT Forge berperan.

### Tiga Pilar Utama

**1. Edukasi Terstruktur**
Semua materi ICT — dari konsep paling dasar hingga model-model lanjutan — disusun secara sistematis dan mudah diakses. Bukan ringkasan dangkal, melainkan pemahaman mendalam yang bisa langsung diaplikasikan ke chart.

**2. Tools yang Relevan**
Setiap alat yang ada di ICT Forge dirancang spesifik untuk kebutuhan trader ICT: bukan generic trading tool, melainkan tools yang berbicara bahasa yang sama dengan metodologi — Kill Zone, PD Array, AMD Cycle, COT positioning.

**3. Efisiensi Workflow**
Dari analisis HTF bias pagi hari, cek kalender berita, entry trade, hingga jurnal — semuanya bisa dilakukan dalam satu aplikasi tanpa berpindah-pindah. Ini mengurangi distraksi dan meningkatkan konsistensi.

---

## ✨ Fitur Lengkap

| Fitur | Status | Keterangan |
|-------|--------|------------|
| 🎓 ICT Masterclass (14 Modul) | ✅ Live | Materi lengkap dari dasar hingga lanjutan |
| 🧠 Daily Bias Helper | ✅ Live | COT-aware, TTrades logic, multi-instrument |
| 📈 COT Analyzer | ✅ Live | Upload TXT dari CFTC, parse otomatis |
| 📓 Trading Journal | ✅ Live | Entry cepat + statistik + equity curve |
| 🧮 Kalkulator RR | ✅ Live | NQ, ES, YM, Forex, JPY pairs, Custom |
| 📅 Economic Calendar | ✅ Live | Real-time via newsdata.io API |
| ⏰ Event Countdown | ✅ Live | NFP, CPI, FOMC, Jobless, COT — realtime |
| 🕐 Live Clock | ✅ Live | NY, London, WIB — auto DST |
| 🗓️ Calendar & Session Tracker | ✅ Live | Kill Zone, market hours, WIB countdown |
| ⚡ PineScript Tools | ✅ Live | Modifikasi, Merge, Convert v4→v6, AI Fix |
| 📦 Indikator Siap Pakai | ✅ Live | Session Dashboard Pro + Quantum Veil |
| 🔔 Browser Notification | ✅ Live | Sesi & news alert otomatis |
| 📲 PWA Support | ✅ Live | Install di iOS, Android, Desktop |
| 🌓 Dark/Light Mode | ✅ Live | Toggle manual |
| 📄 Export PDF/CSV | ✅ Live | Journal CSV, COT PDF, Checklist PDF |

---

## 📚 Modul Edukasi ICT

ICT Forge menyediakan **14 modul edukasi lengkap** yang mencakup seluruh spektrum metodologi ICT, dari landasan filosofis hingga model eksekusi presisi. Setiap modul dirancang dengan pendekatan yang praktis dan langsung bisa diaplikasikan ke chart.

### Modul 00 — Ajaran Pertama ICT
Fondasi dari segala fondasi. Modul ini membahas sejarah ICT, mengapa metodologi ini berbeda dari pendekatan teknikal konvensional, dan empat pilar utama ajaran ICT: Smart Money vs Retail, Price Delivery Theory, Time & Price Theory, dan HTF to LTF Analysis. Trader yang melewati modul ini akan memahami mengapa 95% retail trader kalah dan bagaimana cara keluar dari jebakan tersebut.

### Modul 01 — ICT Overview
Gambaran menyeluruh tentang framework ICT. Mencakup filosofi dasar Smart Money, konsep Price Delivery Algorithmic, pengenalan Kill Zone, dan pentingnya bias HTF sebelum setiap trading session. Modul ini menjadi jembatan antara pemahaman filosofis dan aplikasi praktis.

### Modul 02 — Market Structure
Pendalaman tentang BOS (Break of Structure), CHoCH (Change of Character), dan MSS (Market Structure Shift). Trader akan memahami perbedaan antara konfirmasi trend dan sinyal reversal, serta cara membaca struktur pasar dari HTF ke LTF secara konsisten. Termasuk konsep Premium vs Discount zone berdasarkan equilibrium 50%.

### Modul 03 — PD Arrays
PD Arrays (Premium/Discount Arrays) adalah inti dari metodologi ICT. Modul ini mencakup Fair Value Gap (FVG), Order Block (OB), Breaker Block, Mitigation Block, Rejection Block, Void, dan Propulsion Block. Setiap konsep dijelaskan dengan logika institusional yang jelas — mengapa area-area ini bekerja dan kapan harus dihindari.

### Modul 04 — AMD Cycle
Accumulation, Manipulation, Distribution — siklus pergerakan harga yang berulang di setiap timeframe dan setiap sesi. Modul ini mengajarkan cara mengidentifikasi fase mana yang sedang terjadi dan bagaimana mengambil posisi yang selaras dengan siklus institusional tersebut.

### Modul 05 — Kill Zones
Waktu adalah senjata trader ICT. Modul Kill Zone membahas secara detail empat window trading utama: Asia Session, London Kill Zone, New York AM Kill Zone, dan New York PM Session. Termasuk karakteristik pergerakan harga di masing-masing sesi dan instrumen mana yang paling optimal untuk setiap Kill Zone.

### Modul 06 — Liquidity
Konsep likuiditas adalah jantung dari ICT. Modul ini membahas Buy-side Liquidity (BSL), Sell-side Liquidity (SSL), Equal Highs/Lows, Liquidity Voids, dan cara membaca di mana institusi akan "mengambil" likuiditas sebelum melanjutkan pergerakan sesungguhnya. Tanpa pemahaman likuiditas, setup apapun menjadi gambling.

### Modul 07 — 8AM Strategy (NY Open)
Strategi spesifik untuk New York Open jam 8:00-9:30 AM NY. Mencakup analisis opening candle, identifikasi Judas Swing, dan teknik membaca manipulasi awal sesi sebelum distribusi harga yang sebenarnya dimulai pada 9:30 NY.

### Modul 08 — ICT Models
Kumpulan model trading konkret yang bisa langsung diaplikasikan: Silver Bullet (10:00-11:00 NY & 14:00-15:00 NY), OTE (Optimal Trade Entry), Power of 3 (PO3), IPDA (Interbank Price Delivery Algorithm), Midnight Open Model, dan beberapa model lanjutan lainnya. Setiap model disertai kondisi entry, SL placement, dan target berdasarkan prinsip ICT.

### Modul 09 — Trade Checklist
Checklist interaktif yang bisa diisi langsung di aplikasi sebelum eksekusi trade. Mencakup verifikasi HTF bias, konfirmasi Kill Zone, identifikasi PD Array, validasi liquidity target, dan risk management check. Checklist ini dirancang untuk mencegah impulsive entry dan memastikan setiap trade memenuhi kriteria metodologi.

### Modul 10 — Kalkulator RR
Kalkulator Risk-Reward terintegrasi yang mendukung berbagai instrumen trading. Lebih dari sekadar kalkulator biasa — ini adalah position sizer yang mempertimbangkan balance akun, persentase risiko, dan karakteristik spesifik setiap instrumen.

### Modul 11 — Glossary
Kamus lengkap terminologi ICT. Lebih dari 80 istilah teknis ICT/SMC dijelaskan dengan bahasa yang jelas dan contoh kontekstual. Dari AMD hingga VWAP, dari Buyside Liquidity hingga Turtle Soup — semua ada di sini.

### Modul 12 — COT Analyzer
Alat analisis Commitment of Traders yang terintegrasi langsung dengan data CFTC. Membantu trader memahami positioning institusional mingguan dan menggunakannya sebagai filter bias HTF yang powerful.

### Modul 13 — Trading Journal
Sistem pencatatan dan analisis trade yang komprehensif, dirancang untuk mendukung proses evaluasi dan peningkatan performa trading secara berkelanjutan.

---

## 🧠 Daily Bias Helper

Daily Bias Helper adalah salah satu fitur paling unik di ICT Forge. Alat ini membantu trader menentukan bias harian (Bullish/Bearish/Netral) berdasarkan kombinasi data COT, analisis PDH/PDL, dan kondisi pasar terkini.

### Logika TTrades Six-Condition Priority

Bias Helper menggunakan sistem prioritas enam kondisi berbasis metodologi TTrades TFO (Time Frame Overlay), yang merupakan interpretasi praktis dari prinsip ICT untuk menentukan arah harian:

1. **Kondisi 1 — Gap Opening**: Jika harga gap di atas PDH → bias Bullish; gap di bawah PDL → bias Bearish
2. **Kondisi 2 — PDH/PDL Breach**: Apakah harga sudah menembus PDH atau PDL pada sesi sebelumnya?
3. **Kondisi 3 — NWOG/NDOG**: New Week/Day Opening Gap dan pengaruhnya terhadap arah pergerakan
4. **Kondisi 4 — COT Positioning**: Apakah Commercial Hedgers net Long atau net Short secara signifikan?
5. **Kondisi 5 — HTF Structure**: Konfirmasi BOS atau CHoCH di timeframe Daily/Weekly
6. **Kondisi 6 — Session Context**: Kill Zone mana yang aktif dan bagaimana karakteristik pergerakannya?

Sistem ini memastikan bias harian tidak pernah ditentukan secara arbitrary atau berdasarkan EMA semata — selalu mengikuti urutan prioritas institusional yang terstruktur.

### Multi-Instrument Support

Daily Bias Helper mendukung analisis untuk berbagai instrumen:
- **Futures**: NQ (Nasdaq), ES (S&P 500), YM (Dow Jones), GC (Gold), CL (Crude Oil)
- **Forex Majors**: EURUSD, GBPUSD, AUDUSD, USDJPY, USDCAD, USDCHF, NZDUSD
- **Forex Minors**: GBPJPY, EURJPY, AUDJPY, dan pasangan lainnya

---

## 📈 COT Analyzer

Commitment of Traders (COT) Report adalah salah satu data paling berharga yang tersedia secara gratis dari CFTC (Commodity Futures Trading Commission). Sayangnya, format laporan aslinya sangat sulit dibaca — ribuan baris teks monospace yang membutuhkan keahlian khusus untuk diinterpretasi.

ICT Forge COT Analyzer menyelesaikan masalah ini.

### Cara Kerja

1. **Download data** dari CFTC.gov — halaman Legacy Reports, format Long Format
2. **Copy semua teks** dari halaman tersebut (Ctrl+A → Ctrl+C)
3. **Paste ke Notepad** dan simpan sebagai file .TXT
4. **Upload file .TXT** ke COT Analyzer di ICT Forge
5. **Klik "Ekstrak dari TXT"** — sistem akan otomatis parse dan menampilkan:
   - Net position Commercial (Hedgers)
   - Net position Non-Commercial (Large Speculators)
   - Net position Non-Reportable (Small Speculators)
   - Perubahan minggu ke minggu
   - Interpretasi bias berdasarkan ICT framework

### Instrumen yang Didukung

NQ (E-mini Nasdaq), ES (E-mini S&P), YM (E-mini Dow), Gold (GC), EUR/USD, GBP/USD, USD/JPY, AUD/USD, CAD/USD, CHF, NZD/USD.

### Cara Membaca COT dalam Konteks ICT

- **Commercial Net Long** → Smart Money akumulasi posisi beli → mendukung bias Bullish HTF → cari setup buy di Discount Zone + Kill Zone
- **Commercial Net Short** → Smart Money distribusi/hedging ke bawah → mendukung bias Bearish HTF → cari setup sell di Premium Zone + Kill Zone
- **COT bukan sinyal entry** → ini adalah filter bias Weekly/Monthly. Setelah COT menunjukkan arah, gunakan ICT framework (AMD, PD Arrays, Kill Zone) untuk eksekusi presisi
- **Lag data 3 hari** → CFTC merilis COT setiap Jumat untuk posisi hari Selasa. Gunakan sebagai konfirmasi bias minggu depan, bukan untuk trading hari ini

---

## 📓 Trading Journal

Trading Journal di ICT Forge bukan sekadar tempat mencatat trade — ini adalah sistem analisis performa yang membantu trader mengidentifikasi pola kekuatan dan kelemahan dalam eksekusi mereka.

### Entry Trade Cepat

Modal panel yang bisa dibuka dari mana saja di aplikasi. Input yang diperlukan:
- **Symbol**: Instrumen yang diperdagangkan
- **Side**: Buy atau Sell
- **Entry Price, Stop Loss, Take Profit**: Diisi manual atau import dari kalkulator
- **R:R Ratio**: Dihitung otomatis berdasarkan input harga
- **Result**: Win/Loss/Breakeven
- **Note**: Catatan konteks trade (opsional)

### Statistik Otomatis

Setelah beberapa trade tercatat, Journal secara otomatis menghitung:
- **Win Rate** keseluruhan dan per instrumen
- **Average R:R** yang dicapai vs yang direncanakan
- **Profit Factor**: rasio total profit terhadap total loss
- **Equity Curve**: visualisasi grafis pertumbuhan akun
- **Streak Analysis**: win streak dan loss streak terpanjang

### Export Data

Seluruh data journal bisa diekspor sebagai file **CSV** untuk dianalisis lebih lanjut di Excel atau Google Sheets. Ini memungkinkan trader melakukan analisis mendalam di luar aplikasi jika diperlukan.

---

## 🧮 Kalkulator RR & Position Sizer

Kalkulator RR ICT Forge adalah yang paling komprehensif untuk kebutuhan trader ICT, dengan dukungan penuh untuk instrumen futures yang sering digunakan dalam prop firm trading.

### Instrumen yang Didukung

**Forex Standard (non-JPY)**
1 lot = 100,000 units. Pip = 0.0001. Pip value ~$10/lot. Cocok untuk EURUSD, GBPUSD, AUDUSD, XAUUSD.

**JPY Pairs**
1 lot = 100,000 units. Pip = 0.01. Pip value ~$7.6/lot (bervariasi). Cocok untuk USDJPY, GBPJPY, EURJPY.

**NQ — E-mini Nasdaq-100 Futures**
Tick = 0.25 poin. Tick value = $5. Full contract = $20/poin. Micro MNQ = 1/10 dari full contract.

**ES — E-mini S&P 500 Futures**
Tick = 0.25 poin. Tick value = $12.5. Full contract = $50/poin. Micro MES = 1/10.

**YM — E-mini Dow Jones Futures**
Tick = 1 poin. Tick value = $5. Full contract = $5/poin. Micro MYM = 1/10.

**Custom Instrument**
Input manual pip/tick value untuk instrumen apapun yang tidak tercakup di atas.

### Input Kalkulasi

- **Balance Akun**: Modal total atau allocated capital
- **Risk %**: Persentase risiko per trade (default 1%)
- **Entry Price**: Harga masuk
- **Stop Loss**: Level stop loss
- **Take Profit**: Target profit
- **Tick/Pip Value**: Otomatis terisi berdasarkan instrumen yang dipilih

### Output Kalkulasi

- **Dollar Risk**: Nominal risiko dalam USD
- **R:R Ratio**: Perbandingan risk vs reward
- **Position Size**: Jumlah lot/contract yang optimal
- **Potential Profit**: Proyeksi profit jika target tercapai
- **Breakeven %**: Minimum win rate yang dibutuhkan untuk strategi ini profitable

---

## 🕐 Live Clock & Session Tracker

Salah satu fitur yang paling sering digunakan trader adalah Live Clock yang menampilkan waktu secara real-time di tiga timezone sekaligus.

### Three-Timezone Display

- **🇺🇸 UTC-4/5 New York** — Referensi utama semua analisis ICT. Otomatis beralih antara EDT (UTC-4) dan EST (UTC-5) mengikuti Daylight Saving Time Amerika.
- **🇬🇧 UTC+0/+1 London** — Penting untuk monitoring London Kill Zone (03:00-08:30 NY). Otomatis beralih antara GMT dan BST.
- **🇮🇩 UTC+7 WIB** — Waktu lokal Indonesia, tidak berubah (Jakarta tidak menggunakan DST).

Semua jam menggunakan `Intl.DateTimeFormat` API — artinya akurasi dijamin oleh sistem operasi dan tidak bergantung pada hardcoded offset yang rentan salah saat pergantian DST.

### Session Highlight

Kill Zone yang sedang aktif otomatis di-highlight secara visual:
- **Asia Session** (20:00-03:00 NY) — Biru
- **London Kill Zone** (03:00-08:30 NY) — Gold
- **New York Kill Zone** (08:30-16:00 NY) — Hijau
- **NY PM Session** (13:00-16:00 NY) — Ungu

### Market Status Card

Kartu status pasar yang menampilkan kondisi terkini secara real-time:
- 🟢 **LIQUID** — Kill Zone aktif, setup ICT valid
- 🟡 **PRE-MARKET** — Menunggu NY Open
- 🟡 **VOLATILE** — Sesi aktif tapi bukan prime Kill Zone
- 🔴 **OFF HOURS** — Di luar semua Kill Zone
- 🔴 **NEWS RISK** — 20 menit sebelum/10 menit setelah rilis data high-impact
- 🔴 **MARKET CLOSED** — Weekend (Jumat 17:00 NY hingga Minggu 18:00 NY)

### Session Progress Bar

Progress bar yang menunjukkan seberapa jauh sesi yang sedang aktif telah berjalan, lengkap dengan countdown sisa waktu sesi dan estimasi sesi berikutnya.

### WIB Market Hours

Untuk kemudahan trader Indonesia, ICT Forge juga menampilkan jam pasar dalam format WIB:
- **Market Buka**: Senin 05:00 WIB
- **Market Tutup**: Sabtu 04:00 WIB
- **London KZ**: 10:00–15:30 WIB
- **NY KZ**: 15:30–23:00 WIB

---

## 📅 Economic Calendar Real-Time

Sejak update v1.1, ICT Forge mengintegrasikan kalender ekonomi real-time via **newsdata.io API**, menggantikan jadwal static yang sebelumnya di-hardcode.

### Cara Kerja

Saat aplikasi dibuka, `realtime-news.js` secara otomatis:
1. Mengecek apakah ada data cache yang masih valid (TTL 6 jam)
2. Jika cache sudah expired, fetch data baru dari newsdata.io
3. Mendeteksi event high-impact dari artikel berita (NFP, CPI, FOMC, PPI, GDP, PCE, Retail Sales, ISM, Jobless Claims, BOE, ECB, BOJ, RBA, BOC)
4. Merge dengan jadwal static 2026 yang sudah ada sebagai fallback
5. Render kalender dengan tampilan yang jelas dan informatif

### Tampilan Dual Timezone

Setiap header tanggal menampilkan dua zona waktu sekaligus:
```
🇺🇸  Jumat, 17 Apr 2026   [NY TODAY]
🇮🇩  Sabtu, 18 Apr 2026   [WIB TODAY]
```

Ini memastikan trader Indonesia tidak salah menginterpretasi kapan sebenarnya event tersebut terjadi dalam konteks waktu lokal mereka.

### Badge Status

- **NY TODAY** (merah) — Event terjadi hari ini di NY
- **NY BESOK** (biru) — Event terjadi besok di NY
- **WIB TODAY** (cyan) — Event terjadi hari ini di Indonesia
- **LIVE** (hijau) — Data berasal dari API real-time, bukan jadwal static
- **⏱ Xj Ym lagi** — Countdown realtime untuk event hari ini
- **🔴 BARU RILIS** — Event baru saja dirilis dalam 60 menit terakhir

### Event yang Dipantau

| Event | Frekuensi | Waktu NY | Dampak |
|-------|-----------|----------|--------|
| NFP (Non-Farm Payrolls) | Jumat Pertama/Bulan | 08:30 | 🔴 HIGH |
| CPI (Consumer Price Index) | ~Pertengahan Bulan | 08:30 | 🔴 HIGH |
| FOMC Rate Decision | 8× per Tahun | 14:00 | 🔴 HIGH |
| Initial Jobless Claims | Setiap Kamis | 08:30 | 🔴 HIGH |
| PPI (Producer Price Index) | Bulanan | 08:30 | 🔴 HIGH |
| GDP | Kuartalan | 08:30 | 🔴 HIGH |
| PCE | Bulanan | 08:30 | 🔴 HIGH |
| Retail Sales | Bulanan | 08:30 | 🔴 HIGH |
| ISM Manufacturing/Services | Bulanan | 10:00 | 🔴 HIGH |
| BOE Rate Decision | 8× per Tahun | 07:00 | 🔴 HIGH |
| ECB Rate Decision | 8× per Tahun | 07:45 | 🔴 HIGH |
| BOJ Policy | Bulanan | 23:00 | 🔴 HIGH |
| COT Report Release | Setiap Jumat | 15:30 | 📊 MEDIUM |

---

## ⏰ Event Countdown

Panel Event Countdown menampilkan countdown real-time (update setiap detik) ke lima event paling kritikal untuk trader ICT:

### NFP — Non-Farm Payrolls
Event terpenting di kalender ekonomi. Setiap Jumat pertama bulan ini, rilis pukul 08:30 NY. Volatilitas extreme — spread bisa melebar 10–50× normal. ICT Forge memperingatkan 15 menit dan 5 menit sebelum rilis via browser notification.

### CPI — Consumer Price Index
Data inflasi AS yang menjadi penentu kebijakan The Fed. Dirilis sekitar pertengahan bulan pukul 08:30 NY. Reaksi pasar seringkali lebih besar dari NFP jika hasilnya jauh dari ekspektasi.

### FOMC — Federal Reserve Rate Decision
Delapan kali setahun, FOMC mengumumkan keputusan suku bunga pukul 14:00 NY. Ini adalah salah satu event dengan volatilitas tertinggi sepanjang tahun — terutama jika keputusan berbeda dari ekspektasi pasar.

### Initial Jobless Claims
Data mingguan (setiap Kamis 08:30 NY) yang mencerminkan kesehatan pasar tenaga kerja AS. Kurang volatile dari NFP tapi tetap menghasilkan pergerakan signifikan di USD pairs dan Nasdaq.

### COT Report Release
Setiap Jumat pukul 15:30 NY, CFTC merilis data positioning untuk posisi hari Selasa. Penting untuk update bias mingguan dan konfirmasi arah institusional.

---

## ⚡ PineScript Tools

Bagi trader yang juga menggunakan TradingView, ICT Forge menyediakan seperangkat alat untuk memodifikasi, merge, convert, dan memperbaiki script PineScript langsung dari browser.

### 🔧 Modifikasi & Perbaiki (Offline)
Engine berbasis rule untuk memperbaiki syntax umum, modernisasi kode, dan menerapkan instruksi modifikasi tanpa memerlukan koneksi internet atau AI. Ideal untuk perbaikan cepat dan perubahan yang sudah jelas.

### 🔗 Merge Engine (Offline)
Menggabungkan dua script PineScript menjadi satu — dengan unifikasi input parameters yang duplikat, penggabungan logika yang konflik, dan pembersihan variabel ganda. Sangat berguna ketika ingin mengkombinasikan indikator overlay dengan strategy.

### 🔄 Convert v4/v5 → v6 (Offline)
Upgrade otomatis syntax deprecated:
- `study()` → `indicator()`
- Penambahan prefix `ta.` (ta.ema, ta.rsi, ta.macd, dll)
- Update `na` checks ke format modern
- Perbaikan `security()` → `request.security()`
- Dan banyak perubahan syntax lainnya

### 🤖 AI Error Fixer (Claude API)
Fitur premium yang menggunakan Claude Sonnet API untuk menganalisis error kompleks yang tidak bisa ditangani oleh engine offline. Cocok untuk:
- Error yang melibatkan logic flow yang rumit
- Konflik antara fungsi-fungsi dalam script panjang
- Error yang tidak jelas pesan errornya
- Optimasi performa script

**Catatan**: Fitur AI Error Fixer memerlukan API key Claude Anthropic sendiri. Biaya sekitar $0.001–$0.003 per request tergantung panjang kode. API key disimpan di browser pengguna (localStorage) — tidak pernah dikirim ke server.

---

## 📦 Indikator Siap Pakai

ICT Forge menyediakan dua indikator TradingView yang sudah fully tested di PineScript v6, siap untuk langsung di-copy paste ke editor TradingView.

### Indikator #1 — Session Dashboard Pro v10

Indikator overlay komprehensif yang menggabungkan semua elemen analisis ICT dalam satu tampilan:

**Kill Zone Boxes** — Background highlight otomatis untuk setiap sesi (Asia, London, NY AM, NY PM) dengan warna yang berbeda dan dapat dikustomisasi.

**TTrades Daily Bias** — Implementasi 6 kondisi prioritas TTrades TFO langsung di chart, dengan label alasan bias yang ditampilkan di atas/bawah candle.

**PDH/PDL + Monte Carlo Probability** — Menghitung probabilitas harga mencapai PDH vs PDL berdasarkan 12 parameter pasar nyata, menggunakan simulasi Monte Carlo untuk menghasilkan estimasi probabilitas yang lebih akurat dari sekadar analisis historis sederhana.

**NY 9:30 Open Analysis** — Klasifikasi otomatis karakter candle pembukaan 9:30 NY: Manipulasi, Impulse, atau Neutral, berdasarkan posisi relatif terhadap EMA 9 dan 21.

**VWAP Weekly + Daily** — Bias mingguan dari slope VWAP Weekly ditambah jarak ATR untuk menentukan apakah harga berada di area premium atau discount relatif terhadap VWAP.

**Opening Candle Lines** — Garis otomatis untuk harga pembukaan 08:30 London dan 09:30 NY, extend ke kanan sepanjang sesi.

### Indikator #2 — Quantum Veil Trend Engine

Indikator berbasis machine learning yang menghasilkan composite score dari 12 fitur teknikal:

**EMA 9/21 Ribbon** — Ribbon warna bull/bear dengan deteksi crossover otomatis dan label yang informatif.

**ML Dashboard Table** — Tabel di chart yang menampilkan 12 fitur: EMA separation, RSI momentum, MACD signal, Bollinger Band position, OBV divergence, VWAP distance, dan lainnya.

**Continuation % Bar** — Visual bar yang menunjukkan probabilitas kelanjutan trend vs potensi reversal berdasarkan composite score.

**Logistic Score** — Composite score melalui fungsi logistik yang menghasilkan klasifikasi HIGH / MEDIUM / LOW confidence.

**Smart Alerts** — Alert otomatis untuk bull/bear cross dengan konfirmasi AI score, serta peringatan ketika ada potensi reversal yang signifikan.

---

## 🔔 Notifikasi Browser

ICT Forge menggunakan Web Notifications API untuk memberikan alert real-time yang tidak memerlukan aplikasi native.

### Jenis Notifikasi

**Session Alerts** — Notifikasi ketika Kill Zone baru dibuka: Asia Session, London KZ, New York KZ, NY PM. Berguna untuk trader yang tidak selalu memantau chart secara aktif.

**News Alerts** — Peringatan 15 menit dan 5 menit sebelum rilis data high-impact (NFP, CPI, FOMC, Jobless Claims). Cukup waktu untuk menutup posisi yang terbuka atau menghindari entry baru.

### Cara Mengaktifkan

1. Klik hamburger menu (☰) di pojok kiri atas
2. Toggle **"Notifikasi Sesi"** ke posisi ON
3. Browser akan meminta izin notifikasi — klik Allow
4. Uji dengan tombol **"Test Notifikasi"**

### Deduplication System

Sistem notifikasi ICT Forge menggunakan kombinasi in-memory Set dan localStorage untuk mencegah notifikasi duplikat, bahkan jika halaman di-reload di tengah sesi yang sedang berjalan.

---

## 📲 PWA — Install ke Homescreen

ICT Forge adalah Progressive Web App (PWA) yang bisa diinstall seperti aplikasi native di semua perangkat, tanpa perlu App Store atau Play Store.

### iOS (Safari) — Recommended

1. Buka `sumantokeras56.github.io/ictmasterclass` di **Safari** (wajib Safari, bukan Chrome)
2. Tap ikon **Share** (kotak dengan panah ke atas) di bagian bawah browser
3. Scroll ke bawah dan pilih **"Add to Home Screen"**
4. Beri nama "ICT Forge" → tap **Add**
5. Aplikasi akan muncul di homescreen dengan ikon khusus

Setelah diinstall di iOS, aplikasi berjalan dalam **Standalone Mode** — tanpa address bar, tanpa tab bar browser, layaknya aplikasi native.

### Android (Chrome/Edge)

1. Buka website di Chrome atau Edge
2. Banner instalasi akan muncul otomatis di bagian bawah
3. Jika tidak muncul: tap menu titik tiga → **"Install App"** atau **"Add to Home Screen"**
4. Konfirmasi instalasi → aplikasi muncul di drawer dan homescreen

### Desktop (Chrome/Edge)

1. Buka website di Chrome atau Edge
2. Klik ikon install di address bar (ikon komputer dengan tanda +)
3. Atau: menu tiga titik → **"Install ICT Forge"**
4. Aplikasi akan berjalan di window terpisah tanpa browser chrome

### Keunggulan PWA Mode

- **Offline Support**: Aset statis di-cache oleh Service Worker, aplikasi tetap bisa dibuka tanpa internet
- **Fullscreen**: Tidak ada address bar yang mengurangi ruang layar
- **Fast Launch**: Waktu loading jauh lebih cepat dari membuka browser
- **Notifikasi**: Support browser notification yang terintegrasi

---

## 🏗️ Arsitektur & Teknologi

ICT Forge dibangun dengan prinsip **zero dependency** — tidak ada framework JavaScript, tidak ada npm packages, tidak ada build step yang kompleks. Semua ditulis dalam Vanilla HTML5, CSS3, dan JavaScript modern.

### Keputusan Arsitektur

**Mengapa Vanilla JS?**
Framework seperti React atau Vue menambahkan overhead yang tidak diperlukan untuk aplikasi seperti ini. Dengan Vanilla JS, First Contentful Paint (FCP) bisa dijaga di bawah 1 detik bahkan pada koneksi 3G. Aplikasi juga lebih mudah di-maintain dan di-debug tanpa abstraksi framework yang kompleks.

**Mengapa Single-Page Application?**
Semua konten ada di satu file `index.html` yang sudah di-cache oleh Service Worker. Navigasi antar section tidak memerlukan network request sama sekali — instant dan smooth.

**Mengapa GitHub Pages?**
Hosting gratis, reliable, CDN global, HTTPS otomatis, dan deployment semudah git push. Untuk aplikasi educational yang tidak memerlukan backend, ini adalah pilihan paling efisien.

### Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Markup | HTML5 Semantic |
| Styling | CSS3 Custom Properties, Flexbox, Grid |
| Logic | Vanilla JavaScript ES2020+ |
| Fonts | DM Sans, DM Mono (Google Fonts) |
| Icons | Emoji native (zero dependency) |
| PWA | Service Worker + Web App Manifest |
| Time | Intl.DateTimeFormat API (DST-safe) |
| Notification | Web Notifications API |
| Storage | localStorage (journal, settings, cache) |
| News API | newsdata.io REST API |
| AI | Anthropic Claude Sonnet API |
| Hosting | GitHub Pages |

### Penanganan Timezone

Semua operasi waktu di ICT Forge menggunakan `Intl.DateTimeFormat` dengan explicit timezone, bukan hardcoded UTC offset. Ini memastikan akurasi penuh saat transisi Daylight Saving Time (DST) di Amerika dan Eropa, tanpa perlu library seperti moment.js atau date-fns.

---

## 📁 Struktur File

```
ictmasterclass/
├── index.html          # Entry point utama — seluruh UI ada di sini
├── style.css           # Semua styling: dark theme, komponen, responsif
├── main.js             # Logic utama: clock, journal, COT, kalkulator, dll
├── realtime-news.js    # Live economic calendar via newsdata.io API
└── README.md           # Dokumentasi ini
```

### Penjelasan Per File

**`index.html`** (±6200 baris)
Struktur lengkap aplikasi. Mencakup semua section/tab, modal, panel, konten edukasi, dan markup untuk semua fitur. Sudah termasuk inline PWA manifest generation dan Service Worker registration.

**`style.css`** (±1100 baris)
Semua styling aplikasi. Menggunakan CSS Custom Properties (variables) untuk theming yang konsisten. Dark mode menggunakan palette gold (#C9A84C) sebagai warna aksen utama — dipilih untuk mengurangi eye strain saat sesi trading panjang.

**`main.js`** (±4800 baris)
Otak aplikasi. Berisi:
- Live clock engine dengan DST-safe timezone handling
- Session detection dan market hours logic
- Trading journal CRUD dengan localStorage
- COT parser untuk format CFTC Legacy Report
- Kalkulator RR untuk semua instrumen
- PineScript offline tools (modifier, merger, converter)
- Claude API integration untuk AI Error Fixer
- Browser notification system
- Daily Bias Helper logic
- Economic calendar event definitions

**`realtime-news.js`** (±380 baris)
Engine news real-time yang di-load setelah `main.js`. Mengambil data dari newsdata.io, mendeteksi event high-impact via keyword matching, merge dengan data static, dan render kalender dengan tampilan dual-timezone (NY + WIB).

---

## 🚀 Cara Deploy

### Fork dan Deploy Sendiri

1. **Fork** repository ini ke akun GitHub kamu
2. Pergi ke **Settings** → **Pages**
3. Pilih source: **Deploy from a branch** → branch **main** → folder **/ (root)**
4. Klik **Save**
5. Website akan live di `yourusername.github.io/ictmasterclass`

### Update Konten

Untuk mengupdate file:
1. Buka file di GitHub (klik nama file)
2. Klik ikon pensil (Edit)
3. Lakukan perubahan
4. Scroll bawah → **Commit changes**
5. GitHub Pages otomatis deploy dalam 1–3 menit

Atau upload file baru/replace file lama via **Add file → Upload files**.

### Custom Domain (Opsional)

1. Beli domain (contoh: ictforge.id)
2. Di GitHub: Settings → Pages → Custom domain → masukkan domain
3. Di provider domain: tambahkan CNAME record yang mengarah ke `yourusername.github.io`
4. Tunggu propagasi DNS (bisa sampai 48 jam)

---

## 🗺️ Roadmap Pengembangan

### v1.1 — Real-Time Integration (✅ Done)
- ✅ Live economic calendar via newsdata.io API
- ✅ Dual timezone display (NY + WIB) di kalender
- ✅ Countdown realtime per event dengan badge status
- ✅ Auto-refresh cache setiap 6 jam

### v1.2 — Enhanced Journal (Planned)
- 📋 Filter journal by setup type (FVG, OB, Silver Bullet, dll)
- 📋 Screenshot attachment per trade
- 📋 Monthly/weekly performance report
- 📋 Psychology rating per trade (1-5 bintang)

### v1.3 — Interactive Charts (Planned)
- 📋 Integrasi TradingView Lightweight Charts untuk visualisasi setup
- 📋 Markup PD Array langsung di chart mini
- 📋 Historical session overlay visualization

### v2.0 — Community Features (Future)
- 📋 Trade sharing (anonymized) antar pengguna ICT Forge
- 📋 Leaderboard prop firm challenge tracker
- 📋 Live study session via embedded video
- 📋 Custom alert builder berdasarkan kondisi ICT

---

## 👥 Kredit & Atribusi

### Michael J. Huddleston — Inner Circle Trader (ICT)
Seluruh metodologi, konsep, dan framework yang menjadi fondasi ICT Forge berasal dari ajaran **Michael J. Huddleston** (`@InnerCircleTrader`). ICT telah berbagi pengetahuan ini secara gratis melalui YouTube sejak 2016, dan ICT Forge hadir sebagai tribute dan alat bantu untuk komunitas yang mempelajari ajarannya.

🎥 Channel resmi ICT: [youtube.com/@InnerCircleTrader](https://youtube.com/@InnerCircleTrader)

### Rizky Saputra — Developer
Developer, researcher, dan trader yang membangun ICT Forge dari nol. Aktif trading NQ/Nasdaq Futures dan Forex menggunakan metodologi ICT, telah melewati evaluasi prop firm, dan terus mengembangkan pemahaman tentang Smart Money Concepts.

### Tools & Services
- **newsdata.io** — Real-time news API
- **Anthropic Claude** — AI-powered PineScript error fixing
- **CFTC** — Data COT gratis untuk publik
- **TradingView** — Platform charting referensi
- **GitHub Pages** — Hosting gratis dan reliable

---

## ⚠️ Disclaimer

**ICT Forge adalah platform edukasi semata.**

Seluruh konten, alat, indikator, dan analisis yang tersedia di ICT Forge ditujukan **hanya untuk tujuan pendidikan**. Tidak ada yang ada di platform ini yang merupakan saran keuangan, rekomendasi investasi, atau sinyal trading.

Trading instrumen keuangan — termasuk Forex, Futures, CFD, dan instrumen derivatif lainnya — mengandung **risiko kerugian yang signifikan**, termasuk kemungkinan kehilangan seluruh modal yang diinvestasikan. Performa masa lalu tidak menjamin hasil di masa depan.

Sebelum trading dengan uang nyata, pastikan kamu:
1. Memahami sepenuhnya instrumen yang akan diperdagangkan
2. Telah berlatih di akun demo minimal 3-6 bulan
3. Memiliki rencana trading yang jelas dan tertulis
4. Mengerti dan menerima risiko kerugian total
5. Berkonsultasi dengan penasihat keuangan berlisensi jika diperlukan

**Metodologi ICT bukan sistem trading yang menjamin profit.** Seperti sistem trading apapun, hasilnya bergantung pada konsistensi, disiplin, manajemen risiko, dan kondisi pasar yang terus berubah.

---

*ICT Forge v1.0 — Built with ❤️ by Rizky Saputra · ICT SMC Researcher · Indonesia*

*Based on teachings of Michael J. Huddleston (@InnerCircleTrader)*

*"The best trade is the one you don't take." — ICT*
