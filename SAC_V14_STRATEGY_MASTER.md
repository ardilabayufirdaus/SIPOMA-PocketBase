# 📄 MASTER STRATEGY: SAC V14.0 INSTITUTIONAL UPGRADE
## 🤖 SIPOMA Autonomous Commander - ROG Strix Local Instance

Dokumen ini menjelaskan secara teknis logika dan strategi operasional pada sistem SAC V14.0 yang telah direplikasi ke ROG Strix.

---

### 1. ARSITEKTUR SISTEM (THE THREE PILLARS)

SAC bekerja menggunakan 3 mikroservis utama yang tersinkronisasi via PM2:

1. **SAC-BRAIN-V14.0**: Otak pusat pengambilan keputusan. Ia mengintegrasikan data teknikal, fundamental, dan analisa AI (xAI/Gemini/Llama).
2. **SAC-MONITOR-V14.0**: Pengawas portofolio real-time. Memeriksa drawdown, sisa margin, dan floating secara detik demi detik.
3. **SAC-TICK-V14.0**: Pencatat histori harga (Tick). Berguna untuk backtesting internal dan pembentukan database signal mandiri.

---

### 2. LOGIKA STRATEGI (CORE LOGIC)

SAC V14.0 menggunakan pendekatan **Institutional Multi-Confluence**:

*   **Intermarket Analysis**: SAC memantau **DXY (Dollar Index)**, **Gold (XAUUSD)**, dan **US10Y (Yield 10 Tahun AS)**. 
    * *Logika:* Jika DXY turun tajam dan Gold naik, SAC akan memprioritaskan posisi 'Buy' pada instrument berpasangan USD (misal: EURUSD).
*   **Timeframe Hybrid**: SAC menganalisa trend jangka panjang di **H4** namun mengeksekusi entri pada **M5** untuk mendapatkan harga terbaik (precision entry).
*   **Dual-Verification AI**: Sebelum membuka posisi, Signal dari indikator teknikal dikirim ke AI (LLM) untuk diverifikasi. Jika AI mendeteksi 'Market Noise', signal akan ditolak meskipun indikator valid.

---

### 3. FLOW KERJA (OPERATIONAL FLOW)

1. **Harga Masuk**: MT4 menulis data harga ke `price_data.txt`.
2. **Brain Analysis**: SAC-BRAIN membaca data tersebut setiap detik.
3. **Context Gathering**: brain mengambil harga Gold & DXY via API eksternal.
4. **Decision Making**: Data dikirim ke AI Model untuk keputusan: LONG, SHORT, atau WAIT.
5. **Execution Bridge**: Jika setuju, SAC menulis instruksi ke `signals.txt`.
6. **MT4 Action**: EA SIPOMA Bridge di MT4 membaca instruksi dan mengeksekusi order secara instan.

---

### 4. MANAJEMEN RISIKO (SAFETY PROTOCOL)

Sesuai aturan operasional SIPOMA:
*   **Absolute Price Distance**: SL dan TP tidak menggunakan Pips/Points untuk menghindari perbedaan digit broker. Contoh: SL diatur sejauh 0.0030 (Forex) atau 0.30 (Emas).
*   **Margin Safety**: SAC-MONITOR akan menghentikan seluruh aktivitas jika drawdown melebihi ambang batas yang ditentukan di `.env`.

---

### 5. INFORMASI TEKNIS ROG LOCAL
* **User**: rog
* **Direktori**: /home/rog/ai-commander/
* **Python**: Version 3.12 (venv)
* **Status**: FULLY REPLICATED FROM SERVER

---
**Status Dokumen**: 📅 Mar 27, 2026 | ✅ Verified by Antigravity Agent
