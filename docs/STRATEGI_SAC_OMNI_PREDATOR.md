# 🔱 SAC V12.9 OMNI PREDATOR — AI SUPREME (DOKUMEN STRATEGI)

> **Versi**: 12.9 | **Tanggal**: 26 Maret 2026 | **Status**: AKTIF (AI SUPREME)

---

## 1. ARSITEKTUR SISTEM

```
┌────────── MT4 EA (V11.0) ──────────┐
│ price_data.txt    → OHLCV M5/H1/H4│
│ candle_patterns.txt → Pattern M5/15│
│ account_stats.txt → Balance/Equity │
│ symbol_specs.txt  → Spread/ATR     │
└──────────────┬─────────────────────┘
               │ File I/O (setiap 30s)
               ▼
┌────────── Python Brain V12.9 ──────┐
│ sipoma_autonomous.py               │
│ Interpreter: venv/bin/python3      │
│ Manager: PM2 (SAC-BRAIN-V8)       │
│                                    │
│ WATCHDOG (1s loop)                 │
│ → Profit Lock (EMA/Stoch reversal) │
│ → Trade Journal AI (Grok analisis) │
│                                    │
│ SCANNER (30s loop)                 │
│ → L0 TOKEN OPTIMIZER (Sanity)      │
│ → News Sentiment Scraper           │
│ → 10-Layer Payload → x.AI          │
│ → AI SUPREME (OVR Decision)        │
│ → Half-Kelly + 2% Hard Cap        │
│ → Pattern Memory + Decay           │
│                                    │
│ FALLBACK V2 (jika API timeout)     │
│ → Regime + Sweep + News Block      │
│ → Local Pattern Boost              │
└────────────────────────────────────┘
```

### File Paths (Server)
| File | Path | Fungsi |
|------|------|--------|
| Brain | `/home/.../ai-commander/sipoma_autonomous.py` | Python otak utama (V12.9) |
| DB | `/home/.../ai-commander/commander_v2.db` | SQLite: trade_history, pattern_memory |
| Grok Log | `/home/.../ai-commander/grok_decisions.log` | Audit keputusan AI Supreme |
| Journal | `/home/.../ai-commander/trade_journal.log` | Analisis reflektif per trade |

---

## 2. CORE PHILOSOPHY: AI SUPREMACY

Di V12.9, SAC memasuki mode **AI Supreme**.
- **OVR-Logic**: x.AI (Grok) memiliki otoritas mutlak. Filter teknikal lokal (seperti MTF alignment wajib) ditiadakan untuk memberikan kebebasan pada AI dalam mendeteksi *Institutional Footprints*.
- **L0 Token Optimizer**: Filter lokal sekarang hanya berfungsi sebagai *sanity check* (apakah harga bergerak?) untuk menghemat token API, bukan sebagai filter penentu arah.
- **Institutional Reasoning**: AI dilatih untuk melihat *Liquidity Pools*, *Stop Hunts*, dan *Intermarket Confluence* (DXY/Bond Yields) daripada sekadar indikator statis.

---

## 3. SESSION-SPECIFIC STRATEGIES

| Session | Waktu (WITA/UTC+8) | UTC | Teknik | Threshold | SL:TP (ATR) | Max Loss |
|---------|-------------------|-----|--------|-----------|-------------|----------|
| 🌸 Tokyo | 07:00-15:00 | 23:00-07:00 | Range Reflex | 95% | 1:2 | 1% eq |
| 🏛️ London | 15:00-20:00 | 07:00-12:00 | Breakout | 90% | 1.5:3 | 2% eq |
| ⚡ Overlap | 20:00-00:00 | 12:00-16:00 | Aggressive | 88% | 1.5:4 | 1.5% eq |
| 🗽 New York | 00:00-05:00 | 16:00-21:00 | Trend Cont. | 90% | 1.5:4 | 2% eq |

---

## 4. 10-LAYER ANALYSIS (Payload x.AI)

Sistem mengirim 10 lapisan data mentah ke Grok untuk evaluasi holistik:
1. **L1 Teknikal**: RSI, Stoch, EMA7/21, Bollinger Positioning, ATR.
2. **MTF Context**: Status H4, H1, M15 (BULLISH/BEARISH/NEUTRAL).
3. **L2 Fundamental**: Sesi, Spread, Daily H/L.
4. **L3 Sentimen**: Pola Candlestick M5 & M15.
5. **L4 Risk**: Margin Level, Win/Loss streak, Open orders.
6. **L5 Bandarmology**: Volume Spike & Institutional Interest.
7. **L6 Seasonality**: Efek bulan/hari spesifik.
8. **News Layer**: Top Headlines dari ForexLive (Fix 301).
9. **L7 Macro**: USD Bias (DXY Trend).
10. **L8 Intermarket**: Korelasi Emas & Bond Yields.
11. **L9 Liquidity**: Deteksi Liquidity Sweep (Stop Hunt).
12. **L10 Regime**: ADX + Market Regime Classification.

---

## 5. RISK MANAGEMENT (V12.9)

- **Kelly Criterion**: Dynamic sizing berbasis win-rate historis.
- **Hard Cap 2%**: Limit resiko per trade tetap terkunci.
- **Daily Loss 3%**: Saklar darurat jika drawdown mencapai limit harian.
- **Cluster Guard**: Max 2 order per kluster (USD/JPY/EUR/GBP).
- **News Block**: 15 menit sebelum/sesudah event berdampak besar di ForexFactory.

---

## 6. CHANGELOG

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| V12.7 | 26 Mar | Update x.AI Model ID & Implementasi Range Reflex |
| V12.8 | 26 Mar | Relaxed MTF alignment (Pullback Entry Support). |
| V12.9 | 26 Mar | **AI SUPREME**: Full OVR Logic, Fix News Redirect, Institutional Prompt. |

---

*🔱 SAC V12.9 OMNI PREDATOR — AI SUPREME*
*"Trust the machine, but verify the data. Evolution is mandatory."*
 V12.3 | 26 Mar | Trade Log DB: session, regime, mtf, hash, confidence, outcome, pips |
| V12.4 | 26 Mar | Dual-Model Fallback: reasoning → fast → Fallback V2 (lokal) |
| V12.5 | 26 Mar | Token Optimizer L0: Pre-filter teknis sebelum panggil API |
| V12.6 | 26 Mar | Fix Spread math (points vs pips) untuk pair JPY |
| V12.7 | 26 Mar | Update x.AI Model ID & Implementasi Range Reflex |

---

*🔱 SAC V12.2 INSTITUTIONAL INTELLIGENCE*
*"Setiap layer adalah filter. Yang tersisa adalah peluang emas."*
