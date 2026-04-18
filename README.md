<div align="center">

<br/>

```
██╗ ██████╗████████╗    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
██║██╔════╝╚══██╔══╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
██║██║        ██║       █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
██║██║        ██║       ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
██║╚██████╗   ██║       ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝ ╚═════╝   ╚═╝       ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**Smart Money Concepts Trading Platform**

[![Version](https://img.shields.io/badge/version-1.0.0-C9A84C?style=for-the-badge&logo=github)](https://github.com/sumantokeras56/ictforge)
[![License](https://img.shields.io/badge/license-MIT-2ECC71?style=for-the-badge)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-5B9BD5?style=for-the-badge&logo=googlechrome)](https://sumantokeras56.github.io/ictforge/)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-181717?style=for-the-badge&logo=github)](https://sumantokeras56.github.io/ictforge/)
[![Language](https://img.shields.io/badge/language-Bahasa%20Indonesia-E74C3C?style=for-the-badge)](https://sumantokeras56.github.io/ictforge/)

<br/>

> **ICT Forge** adalah platform trading all-in-one berbasis **Inner Circle Trader (ICT)** dan **Smart Money Concepts (SMC)** — dibangun sepenuhnya di atas teknologi web modern tanpa backend, 100% berjalan di browser, dan dapat diinstall sebagai aplikasi native di perangkat apapun.

<br/>

[🚀 Buka Aplikasi](https://sumantokeras56.github.io/ictforge/) · [📖 Dokumentasi](#-dokumentasi-fitur) · [🐛 Laporkan Bug](https://github.com/sumantokeras56/ictforge/issues) · [💡 Request Fitur](https://github.com/sumantokeras56/ictforge/issues/new)

<br/>

---

</div>

<br/>

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Dokumentasi Fitur](#-dokumentasi-fitur)
- [Instalasi & Deployment](#-instalasi--deployment)
- [Struktur Direktori](#-struktur-direktori)
- [Konfigurasi](#-konfigurasi)
- [Roadmap](#-roadmap)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

<br/>

---

## 🎯 Tentang Proyek

**ICT Forge** lahir dari kebutuhan nyata trader Indonesia yang belajar metodologi **Inner Circle Trader (ICT)** — sebuah pendekatan trading berbasis Smart Money Concepts yang dikembangkan oleh Michael J. Huddleston. Platform ini menggabungkan seluruh kebutuhan analisis dan eksekusi trader ICT dalam satu aplikasi yang cepat, ringan, dan berjalan sepenuhnya tanpa koneksi internet setelah instalasi pertama.

### Mengapa ICT Forge?

| Masalah Trader | Solusi ICT Forge |
|---|---|
| Tools trading tersebar di banyak platform | Semua dalam satu aplikasi |
| Harus online untuk mengakses materi | Offline-first PWA — berjalan tanpa internet |
| Kalkulator lot size manual & rawan error | Kalkulator otomatis multi-instrumen |
| Tidak ada reminder saat Kill Zone buka | Notifikasi real-time berbasis browser |
| Sulit track performa trading sendiri | Trading Journal terintegrasi |
| Bingung baca data COT CFTC | COT Analyzer dengan penjelasan bahasa awam |

<br/>

---

## ✨ Fitur Unggulan

<table>
<tr>
<td width="50%">

### 📊 Live Market Dashboard
- **Real-time clock** untuk 3 timezone (NY, London, WIB)
- **Session detector** otomatis — Asia, London KZ, New York KZ, NY PM
- **Kill Zone highlighter** live dengan badge `● LIVE`
- **Market Status Card** — Liquid / Illiquid / News Risk / Market Closed
- **Session Progress Bar** dengan countdown akurat berbasis UTC timestamp
- **Weekend detection** dengan countdown buka pasar Minggu 18:00 NY

</td>
<td width="50%">

### 🔔 Sistem Notifikasi Sesi
- Notifikasi browser saat **Kill Zone buka**
- Alert **15 menit & 5 menit** sebelum High Impact News
- **News proximity warning** — otomatis tampil saat mendekati NFP, CPI, FOMC
- Service Worker push notification support
- Deduplication via localStorage — tidak double notif saat reload

</td>
</tr>
<tr>
<td width="50%">

### 🧮 Position Size Calculator
Mendukung **6 instrumen** dengan perhitungan akurat:

| Instrumen | Keterangan |
|---|---|
| **Forex Standard** | Non-JPY pairs, pip = 0.0001 |
| **JPY Pairs** | USDJPY, GBPJPY, pip = 0.01 |
| **NQ Futures** | E-mini Nasdaq, tick = $5 |
| **ES Futures** | E-mini S&P 500, tick = $12.5 |
| **YM Futures** | E-mini Dow Jones, tick = $5 |
| **Custom** | Manual pip/tick value |

Fitur: RR Ratio visual bar, verdict ICT (minimum 1:2), animasi loading step-by-step

</td>
<td width="50%">

### 📅 Economic Calendar
- **High Impact Events 2026** — NFP, CPI, FOMC, PPI, GDP, PCE, Retail Sales, ISM, Jobless Claims
- **Central Bank calendar** — BOE, ECB, BOJ, RBA, BOC
- **Live data via newsdata.io API** dengan 6 jam cache cerdas
- Tampilan **dual timezone** (NY 🇺🇸 + WIB 🇮🇩)
- **Countdown realtime** per event dengan badge urgency
- Fallback ke static 2026 data saat API tidak tersedia

</td>
</tr>
<tr>
<td width="50%">

### 📈 COT Analyzer
- Analisis **9 instrumen futures** — ES, NQ, EUR, GBP, JPY, AUD, CAD, CHF, NZD
- Input data Commercial / Non-Commercial / Open Interest
- **Penjelasan bahasa awam** — cocok untuk trader pemula
- Simpan bias per instrumen ke localStorage
- Integrasi dengan **Daily Bias Helper**
- COT release countdown (setiap Jumat 15:30 NY)

</td>
<td width="50%">

### 📝 Trading Journal
- Catat trade: Symbol, Side, Entry, SL, TP, R:R, Result, Catatan
- **Statistik otomatis** — Total trades, Win Rate, Profit Factor, Avg R:R
- **Entry Trade Cepat** via sidebar modal
- Export ke **CSV** untuk analisis di Excel/Google Sheets
- 100% privat — tersimpan di `localStorage` perangkat kamu
- Filter & sort by date, symbol, result

</td>
</tr>
<tr>
<td width="50%">

### ✅ Trade Checklist ICT
- Checklist **multi-tab** — Pre-Trade, Confirmation, Risk Management
- Progress bar visual dengan verdict
- Item **critical** ditandai khusus
- Auto-save ke localStorage
- Export ke **PDF** satu klik
- Reset per sesi trading

</td>
<td width="50%">

### ⚡ PineScript Tools
- **Modifikasi & Perbaiki** — upgrade syntax, modernisasi v6 (offline)
- **Merge Engine** — gabungkan 2 script, deduplikasi variabel otomatis
- **Convert v4/v5 → v6** — migrasi `study()`, `ta.` prefix, `input.int()` dll
- **AI Error Fixer** — powered by **Claude API** (Anthropic), perbaiki error kompleks
- Static syntax checker bawaan
- Copy output satu klik

</td>
</tr>
<tr>
<td width="50%">

### 🧠 Daily Bias Helper
- Analisis bias harian COT-aware
- Multi-instrument & session algorithm
- Rekomendasi Long / Short / Neutral per Kill Zone
- Integrasi dengan data COT yang sudah diinput

</td>
<td width="50%">

### 📚 Materi ICT Lengkap
- **Overview** — Pengenalan Smart Money Concepts
- **Market Structure** — BOS, ChoCh, HH/LL
- **Liquidity** — BSL, SSL, Equal Highs/Lows
- **PD Arrays** — FVG, OB, Breaker, Mitigation Block
- **AMD Model** — Accumulation, Manipulation, Distribution
- **8AM Strategy** — Judas Swing, Kill Zone entry
- **Foundational Concepts** — Premium/Discount, Equilibrium
- **Glossary** — Kamus lengkap istilah ICT/SMC
- **Indicators Guide** — Panduan indikator TradingView

</td>
</tr>
</table>

<br/>

---

## 🛠 Tech Stack

```
ICT Forge — Zero-dependency, Vanilla Web Stack
```

| Layer | Teknologi |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES2022+) |
| **PWA Engine** | Service Worker API, Web App Manifest |
| **Storage** | localStorage (journal, checklist, COT, settings) |
| **Notifications** | Web Notifications API + Service Worker Push |
| **Timezone** | `Intl.DateTimeFormat` — akurat DST otomatis |
| **Live News** | [newsdata.io](https://newsdata.io) REST API |
| **AI Integration** | [Anthropic Claude API](https://www.anthropic.com) (claude-sonnet) |
| **Fonts** | Google Fonts — Bebas Neue, DM Mono, Inter |
| **Hosting** | GitHub Pages |
| **CI/CD** | GitHub Actions (auto-deploy on push) |

> 💡 **Zero framework, zero bundler, zero node_modules** — ICT Forge berjalan murni sebagai static files. Tidak ada React, Vue, Angular, Webpack, atau Vite. Buka `index.html` → langsung jalan.

<br/>

---

## 🏗 Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  index.html  │───▶│   main.js    │───▶│   style.css  │  │
│  │  (App Shell) │    │ (Core Logic) │    │  (Theming)   │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ realtime-news.js│                      │
│                    │ (News Engine)   │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│         ┌───────────────────┼───────────────────┐          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐  │
│  │ localStorage│   │  newsdata   │   │  Claude API     │  │
│  │  (Journal,  │   │  .io API    │   │  (PineScript    │  │
│  │  Checklist, │   │  (6h cache) │   │   AI Fixer)     │  │
│  │  COT, Keys) │   └─────────────┘   └─────────────────┘  │
│  └─────────────┘                                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  SERVICE WORKER (sw.js)               │  │
│  │  Cache Strategy: Network-first → Cache fallback       │  │
│  │  Offline: Serve cached app shell + offline.html       │  │
│  │  Push: Session & News notifications                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Cache Strategy

| Resource Type | Strategy | Cache Name |
|---|---|---|
| App HTML | Network-first → Cache fallback | `ictforge-v3` |
| JS / CSS | Network-first → Cache fallback | `ictforge-v3` |
| Google Fonts | Cache-first (stabil) | `ictforge-fonts-v1` |
| API calls | Bypass (tidak di-cache) | — |
| Offline fallback | Serve `offline.html` | `ictforge-v3` |

<br/>

---

## 📖 Dokumentasi Fitur

### 🕐 Session Timing (NY Timezone)

| Session | Buka NY | Tutup NY | Buka WIB | Tutup WIB |
|---|---|---|---|---|
| Asia Session | 20:00 | 03:00 | 07:00 | 10:00 |
| London Kill Zone | 03:00 | 08:30 | 10:00 | 15:30 |
| New York Kill Zone | 08:30 | 16:00 | 15:30 | 23:00 |
| NY PM Session | 13:00 | 16:00 | 20:00 | 23:00 |

> ⚠️ Semua waktu WIB di atas adalah **perkiraan** saat EDT (UTC-4). Saat EST (UTC-5, Nov–Mar), geser +1 jam. Aplikasi menghitung timezone secara otomatis via `Intl.DateTimeFormat`.

### 📊 High Impact Events 2026

| Event | Frekuensi | Waktu NY | Dampak |
|---|---|---|---|
| NFP (Non-Farm Payrolls) | Jumat pertama tiap bulan | 08:30 | 🔴 HIGH |
| CPI (Consumer Price Index) | ~Tengah bulan | 08:30 | 🔴 HIGH |
| FOMC Rate Decision | 8× setahun | 14:00 | 🔴 HIGH |
| Initial Jobless Claims | Setiap Kamis | 08:30 | 🔴 HIGH |
| PPI | ~Tengah bulan | 08:30 | 🔴 HIGH |
| GDP | Kuartalan | 08:30 | 🔴 HIGH |
| PCE | Bulanan | 08:30 | 🔴 HIGH |
| BOE / ECB / BOJ / RBA / BOC | Sesuai jadwal | Varies | 🔴 HIGH |

### 🧮 Formula Kalkulator

```
Risk Amount  = Account Balance × (Risk % / 100)
Position Size = Risk Amount / (SL Distance × Pip/Tick Value)
Potential Profit = Position Size × TP Distance × Pip/Tick Value
R:R Ratio    = TP Distance / SL Distance
```

**Minimum R:R ICT:** ≥ 1:2 (Valid), ≥ 1:3 (Excellent)

### ⚡ PineScript AI Error Fixer

```
User Input (kode error)
        │
        ▼
┌───────────────────┐
│  Validasi Input   │ ← Cek API key, cek kode tidak kosong
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Claude Sonnet API│ ← POST ke api.anthropic.com/v1/messages
│  ~$0.001–$0.003   │   Model: claude-sonnet-4-20250514
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Render Output    │ ← Format kode + penjelasan perubahan
└───────────────────┘
```

> **Catatan:** API key Claude tidak dikirim ke server ICT Forge. Request dilakukan langsung dari browser pengguna ke `api.anthropic.com`.

<br/>

---

## 🚀 Instalasi & Deployment

### Akses Langsung (Tanpa Instalasi)

Buka browser dan kunjungi:
```
https://sumantokeras56.github.io/ictforge/
```

### Install sebagai PWA (Direkomendasikan)

**Android (Chrome):**
1. Buka URL di atas di Chrome
2. Tap menu ⋮ → **"Tambahkan ke layar utama"**
3. Tap **Install**
4. ICT Forge siap dipakai seperti app native

**iOS (Safari):**
1. Buka URL di Safari
2. Tap ikon **Share** (□↑)
3. Scroll → **"Tambahkan ke Layar Utama"**
4. Tap **Tambahkan**

**Desktop (Chrome/Edge):**
1. Klik ikon install (📲) di address bar
2. Klik **Install**

### Self-Hosting / Fork

```bash
# 1. Clone repositori
git clone https://github.com/sumantokeras56/ictforge.git
cd ictforge

# 2. Tidak ada dependencies — langsung buka
open index.html
# atau gunakan server lokal
npx serve .
# atau
python3 -m http.server 8000
```

**Deploy ke GitHub Pages:**
1. Fork repo ini
2. Settings → Pages → Source: `main` branch, folder `/` (root)
3. Akses di `https://[username].github.io/ictforge/`

> ⚠️ **Service Worker membutuhkan HTTPS atau localhost.** Buka via `http://` tidak akan mengaktifkan offline mode dan notifikasi.

<br/>

---

## 📁 Struktur Direktori

```
ictforge/
│
├── index.html              # App Shell utama — semua tab & UI
├── main.js                 # Core logic — clock, calculator, journal, COT, PineScript
├── style.css               # Global styling, dark theme, komponen UI
├── realtime-news.js        # Live news engine via newsdata.io API
├── sw.js                   # Service Worker — cache, offline, push notifications
├── manifest.json           # PWA manifest — icon, shortcuts, display mode
├── offline.html            # Halaman fallback saat offline
│
├── 📚 Materi ICT (HTML Fragments)
│   ├── overview.html       # Pengenalan SMC & ICT methodology
│   ├── structure.html      # Market Structure — BOS, ChoCh
│   ├── liquidity.html      # Liquidity — BSL, SSL, EQH/EQL
│   ├── pd-arrays.html      # PD Arrays — FVG, OB, Breaker
│   ├── amd.html            # AMD Model — Accumulation, Manipulation, Distribution
│   ├── 8am-strategy.html   # 8AM NY Strategy — Judas Swing
│   ├── foundational.html   # Foundational Concepts — Premium/Discount
│   ├── models.html         # Trading Models ICT
│   ├── indicators.html     # Panduan Indikator TradingView
│   └── glossary.html       # Kamus istilah ICT/SMC
│
├── 🛠 Tools (HTML Fragments)
│   ├── calculator.html     # Position size & RR calculator UI
│   ├── calendar.html       # Economic calendar UI
│   ├── checklist.html      # Trade checklist UI
│   ├── cot.html            # COT analyzer UI
│   ├── journal.html        # Trading journal UI
│   └── pinescript.html     # PineScript tools UI
│
└── README.md               # Dokumentasi ini
```

<br/>

---

## ⚙️ Konfigurasi

### Mengganti API Key Newsdata.io

Edit `realtime-news.js` baris 14:
```javascript
// Daftarkan API key gratis di https://newsdata.io
const NEWSDATA_API_KEY = window._NEWSDATA_KEY || 'YOUR_API_KEY_HERE';
```

Atau inject via HTML sebelum script dimuat:
```html
<script>window._NEWSDATA_KEY = 'YOUR_API_KEY_HERE';</script>
<script src="realtime-news.js"></script>
```

### Mengatur Cache Version (setelah update)

Edit `sw.js` baris 4:
```javascript
const CACHE_VERSION = 'ictforge-v4'; // increment untuk force refresh
```

### Menambahkan Event Kalender Custom

Edit `main.js` — tambahkan ke array `HIGH_IMPACT_NEWS`:
```javascript
{ name: 'CUSTOM', date: '2026-05-15', time: '08:30', currency: 'USD', impact: 'high' }
```

<br/>

---

## 🗺 Roadmap

### v1.1.0 — Q2 2026
- [ ] Grafik equity curve di Trading Journal
- [ ] Filter journal berdasarkan instrumen & tanggal range
- [ ] Dark/Light mode toggle yang persistent
- [ ] Export Journal ke PDF (lengkap dengan statistik)

### v1.2.0 — Q3 2026
- [ ] Multi-account Journal support
- [ ] Backtesting simple (win rate per setup)
- [ ] Integrasi TradingView webhook alerts
- [ ] PWA installable shortcut per fitur

### v2.0.0 — Q4 2026
- [ ] Backend ringan (Cloudflare Workers) untuk API key security
- [ ] Sync data antar perangkat (optional)
- [ ] AI Daily Bias — analisis otomatis berbasis COT + Price Action
- [ ] Support multi-bahasa (EN/ID)

<br/>

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Berikut panduan singkatnya:

```bash
# 1. Fork repo
# 2. Buat branch fitur
git checkout -b feature/nama-fitur

# 3. Commit dengan pesan yang jelas
git commit -m "feat: tambahkan fitur X untuk Y"

# 4. Push & buat Pull Request
git push origin feature/nama-fitur
```

### Konvensi Commit

| Prefix | Keterangan |
|---|---|
| `feat:` | Fitur baru |
| `fix:` | Bug fix |
| `docs:` | Update dokumentasi |
| `style:` | Perubahan CSS/UI |
| `refactor:` | Refactor kode |
| `perf:` | Optimasi performa |

### Melaporkan Bug

Buka [Issues](https://github.com/sumantokeras56/ictforge/issues) dan sertakan:
- Browser & versi OS
- Langkah reproduksi bug
- Screenshot / console error (jika ada)
- Expected vs actual behavior

<br/>

---

## ⚠️ Disclaimer

> ICT Forge adalah **alat bantu edukasi dan analisis** — bukan rekomendasi investasi. Semua keputusan trading adalah tanggung jawab pengguna sepenuhnya. Trading forex, futures, dan instrumen keuangan lainnya mengandung **risiko kerugian yang signifikan**. Pastikan kamu memahami risiko sebelum bertransaksi.
>
> Metodologi ICT / Smart Money Concepts yang digunakan sebagai referensi dalam aplikasi ini dikembangkan oleh **Michael J. Huddleston**. ICT Forge tidak berafiliasi dengan atau disponsori olehnya.

<br/>

---

## 📄 Lisensi

```
MIT License

Copyright (c) 2026 Rizky Saputra — ICT Forge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

<br/>

---

<div align="center">

**Dibangun dengan ❤️ untuk komunitas trader Indonesia**

[![GitHub](https://img.shields.io/badge/GitHub-sumantokeras56-181717?style=flat-square&logo=github)](https://github.com/sumantokeras56)
[![Platform](https://img.shields.io/badge/Platform-ICT%20Forge-C9A84C?style=flat-square)](https://sumantokeras56.github.io/ictforge/)

<br/>

```
"Trade what you see, not what you think." — ICT
```

<br/>

© 2026 Rizky Saputra · ICT Forge v1.0 · MIT License

</div>
