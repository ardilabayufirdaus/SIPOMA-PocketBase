import time, os, json, asyncio, logging, sqlite3, httpx
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import numpy as np

load_dotenv()

# --- GOLD GUARDIAN (V8 PRO - API DRIVEN) ---
XAI_API_KEY = os.getenv('XAI_API_KEY')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')
MODEL_ID = 'grok-4-1-fast-reasoning'
DB_PATH = '/home/ardilabayufirdaus/ai-commander/commander_v2.db'
SIGNAL_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/trades.txt'
PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'GBPJPY', 'USDJPY', 'EURJPY', 'AUDUSD']

client = OpenAI(api_key=XAI_API_KEY, base_url='https://api.x.ai/v1')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('CREATE TABLE IF NOT EXISTS trade_history (id INTEGER PRIMARY KEY, pair TEXT, action TEXT, entry REAL, sl REAL, tp REAL, risk REAL, timestamp DATETIME, reason TEXT)')
    conn.close()

async def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as c: await c.post(url, json={"chat_id": CHAT_ID, "text": msg})
    except: pass

async def get_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*), action FROM trade_history GROUP BY action")
        rows = cur.fetchall()
        cur.execute("SELECT pair, action, timestamp FROM trade_history ORDER BY timestamp DESC LIMIT 5")
        recent = cur.fetchall()
        conn.close()
        summary = "📊 **SIPOMA PERFORMANCE**\n\n"
        for r in rows: summary += f"- {r[1]}: {r[0]} trades\n"
        summary += "\n🕒 **Recent Pro Trades:**\n"
        for r in recent: summary += f"- {r[0]} | {r[1]} | {r[2][:16]}\n"
        return summary
    except: return "Belum ada data."

async def handle_general_question(user_text):
    try:
        resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': 'Anda adalah SIPOMA GOLD GUARDIAN (Low-Risk). Gunakan grok-4-1-fast-reasoning.'}, {'role': 'user', 'content': user_text}])
        return resp.choices[0].message.content
    except Exception as e: return f"Koneksi model {MODEL_ID} sibuk. (Error: {str(e)})"

async def telegram_listener():
    offset = 0
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates"
    while True:
        try:
            async with httpx.AsyncClient(timeout=30) as c:
                resp = await c.get(url, params={"offset": offset, "timeout": 20})
                if resp.status_code == 200:
                    data = resp.json()
                    for up in data.get("result", []):
                        offset = up["update_id"] + 1
                        msg = up.get("message", {})
                        text = msg.get("text", "")
                        from_id = msg.get("from", {}).get("id")
                        if str(from_id) != str(CHAT_ID): continue
                        if text == "/statistik": await send_telegram(await get_stats())
                        elif text: await send_telegram(await handle_general_question(text))
        except: pass
        await asyncio.sleep(2)

async def fetch_news():
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get('https://r.jina.ai/https://www.forexfactory.com/calendar')
            return r.text[:3000] if r.status_code == 200 else 'No News'
    except: return 'News Error'

async def fetch_cot_sentiment():
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            # Gold COT as proxy for institutional sentiment
            r = await c.get('https://r.jina.ai/https://www.tradingster.com/cot/legacy-futures/122621')
            return r.text[:3000] if r.status_code == 200 else 'COT Data Unavailable'
    except: return 'COT Error'

def calculate_adx(df, period=14):
    try:
        if len(df) < period * 2: return 0
        df = df.copy()
        for col in ['High', 'Low', 'Close']:
            if isinstance(df[col], pd.DataFrame): df[col] = df[col].iloc[:, 0]
        
        plus_dm = df['High'].diff(); minus_dm = df['Low'].diff()
        plus_dm[plus_dm < 0] = 0; minus_dm[minus_dm > 0] = 0
        minus_dm = abs(minus_dm)
        
        tr = pd.concat([df['High']-df['Low'], abs(df['High']-df['Close'].shift()), abs(df['Low']-df['Close'].shift())], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr)
        minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr)
        dx = 100 * (abs(plus_di - minus_di) / (plus_di + minus_di))
        return dx.rolling(window=period).mean().iloc[-1]
    except: return 0

def calculate_atr(df, period=14):
    try:
        if len(df) < period + 1: return 0
        df = df.copy()
        # Handle cases where columns might be MultiIndex or simple Index
        cols = ['High', 'Low', 'Close']
        data = {}
        for col in cols:
            if isinstance(df[col], pd.DataFrame): data[col] = df[col].iloc[:, 0]
            else: data[col] = df[col]
        
        high_low = data['High'] - data['Low']
        high_close = np.abs(data['High'] - data['Close'].shift())
        low_close = np.abs(data['Low'] - data['Close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return tr.rolling(window=period).mean().iloc[-1]
    except: return 0

def fetch_yfinance_data(pair):
    symbol = "GC=F" if pair == "XAUUSD" else f"{pair}=X"
    try:
        # 1. Fetch Mult-Timeframe Data
        m1 = yf.download(symbol, period='1d', interval='1m', progress=False)
        m5 = yf.download(symbol, period='1d', interval='5m', progress=False)
        m15 = yf.download(symbol, period='5d', interval='15m', progress=False)
        h4_raw = yf.download(symbol, period='1mo', interval='1h', progress=False)
        
        # 2. Handle Multi-Index (YFinance V3+)
        for df in [m1, m5, m15, h4_raw]:
            if not df.empty and isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
        
        # 3. Resample H4 correctly
        h4 = h4_raw.resample('4h').agg({'Open':'first','High':'max','Low':'min','Close':'last','Volume':'sum'}).dropna()
        
        if m5.empty or m15.empty or h4.empty: return None

        # 4. Indicators Logic
        def calc_rsi(series, p=14):
            delta = series.diff()
            up, dw = delta.copy(), delta.copy()
            up[up < 0] = 0; dw[dw > 0] = 0
            roll_up, roll_dw = up.rolling(p).mean(), dw.abs().rolling(p).mean()
            return 100 - (100 / (1 + roll_up / (roll_dw + 1e-9)))

        def squash(val):
            if hasattr(val, 'iloc'): val = val.iloc[-1]
            return float(val) if val is not None else 0.0

        # Technicals M5
        m5['rsi'] = calc_rsi(m5['Close'])
        m5['ma20'] = m5['Close'].rolling(20).mean()
        m5['std20'] = m5['Close'].rolling(20).std()
        m5['bb_up'] = m5['ma20'] + (m5['std20'] * 2)
        m5['bb_dw'] = m5['ma20'] - (m5['std20'] * 2)
        
        # M1 Quick RSI & M15 Trend RSI
        if not m1.empty: m1['rsi'] = calc_rsi(m1['Close'], 9)
        m15['rsi'] = calc_rsi(m15['Close'])
        
        # ADX Regime Calculation (M15)
        low, high, close = m15['Low'], m15['High'], m15['Close']
        tr = pd.concat([high - low, abs(high - close.shift()), abs(low - close.shift())], axis=1).max(axis=1)
        atr_adx = tr.rolling(14).mean()
        pdm = high.diff(); mdm = low.diff().abs()
        pdm[pdm < 0] = 0; mdm[mdm < 0] = 0
        pdi = 100 * (pdm.rolling(14).mean() / (atr_adx + 1e-9))
        mdi = 100 * (mdm.rolling(14).mean() / (atr_adx + 1e-9))
        adx = 100 * (abs(pdi - mdi) / (pdi + mdi + 1e-9)).rolling(14).mean().iloc[-1]
        
        # ATR H1 (using m15 as proxy or h4)
        atr_val = calculate_atr(h4_raw.tail(100), 14)

        # 5. Format Prompt Data
        def get_prices(df, tf):
            d = df.tail(3)
            txt = ""
            for idx, row in d.iterrows():
                c, h, l, o = squash(row['Close']), squash(row['High']), squash(row['Low']), squash(row['Open'])
                txt += f"{tf}|{idx}|{o:.5f}|{h:.5f}|{l:.5f}|{c:.5f}"
                if tf == "M5":
                    txt += f"|RSI:{squash(row.get('rsi', 50)):.1f}|BB:{squash(row.get('bb_dw', 0)):.5f}-{squash(row.get('bb_up', 0)):.5f}"
                txt += "\n"
            return txt

        f_data = get_prices(m5, "M5") + get_prices(m15, "M15") 
        f_data += f"M1_RSI:{squash(m1['rsi']):.1f} | ADX_REGIME:{adx:.1f}\n"

        # 6. H4 Trend Lock
        h4_c = squash(h4['Close'].iloc[-1])
        h4_s20 = squash(h4['Close'].rolling(20).mean().iloc[-1])
        h4_s50 = squash(h4['Close'].rolling(50).mean().iloc[-1])
        trend = "BULLISH" if h4_c > h4_s20 > h4_s50 else ("BEARISH" if h4_c < h4_s20 < h4_s50 else "NEUTRAL")
        
        return {"formatted": f_data, "h4_trend": trend, "raw": {"atr": atr_val, "adx": adx}}
    except Exception as e:
        logging.error(f"Predator Data Error: {e}")
        return None

async def trader_loop():
    init_db()
    iSTATS_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_stats.txt'
    CLOSE_SIGNAL_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/close_signal.txt'
    
    await send_telegram(f"🔱 **SAC OMNI PREDATOR V7.3** 🔱\n- Mode: REGIME-ADAPTIVE\n- Strategy: High-Frequency Predator\n- Confluence: M1-M5-M15 Triple View\n- Status: OMNI AI ON")
    
    cot_data = "Fetching COT..."
    last_cot_time = 0
    
    while True:
        try:
            m_level = 0.0
            open_trades = []
            if os.path.exists(iSTATS_PATH):
                if (time.time() - os.path.getmtime(iSTATS_PATH)) < 300: # 5 min allow
                    with open(iSTATS_PATH, 'r') as f:
                        for line in f:
                            try:
                                p = line.strip().split('|')
                                if not p or len(p) < 5: continue
                                if p[0] == "ORDER":
                                    open_trades.append({'ticket': p[1], 'pair': p[2], 'type': p[3], 'entry': p[4], 'profit': float(p[5])})
                                else:
                                    m_level = float(p[4])
                            except Exception as e:
                                logging.warning(f"Stats parse line error: {e}")
            
            if m_level < 500.0:
                logging.info(f"Margin Safety Lock Aktif ({m_level}%). Skip.")
                await asyncio.sleep(300); continue

            if time.time() - last_cot_time > 86400:
                cot_data = await fetch_cot_sentiment()
                last_cot_time = time.time()

            news = await fetch_news()
            
            # --- PHASE 1: GOLDEN EXIT (PROFIT PROTECTION) ---
            for trade in open_trades:
                pair = trade['pair']
                market_data = await asyncio.to_thread(fetch_yfinance_data, pair)
                if not market_data: continue
                
                exit_prompt = f"""
                AUDIT POSISI TERBUKA (GOLDEN EXIT V4):
                PAIR: {pair} | PROFIT: {trade['profit']} | TICKET: {trade['ticket']}
                DATA TEKNIKAL AKTUAL:
                {market_data}
                NEWS/COT:
                {news} | {cot_data}
                
                INTRUKSI GOLDEN EXIT:
                1. ANALISA PUNCAK: Jika Profit sudah besar (> 1.5x ATR) DAN terdeteksi 'Penyimpangan/Divergence' atau 'Pelemahan Tren' (ADX turun/H4 berlawanan), segara tutup.
                2. AMANKAN CUAN: Lebih baik ambil profit di tangan daripada menunggu TP kaku jika indikator menunjukkan tanda reversal.
                
                WAJIB JSON: {"decision": "CLOSE"|"HOLD", "reason":...}
                """
                resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': 'Anda adalah PROFIT PROTECTOR V4.2. Amankan Cuan di Titik Puncak. Jika akun sedang krisis margin, lebih agresiflah menutup profit/loss besar.'}, {'role': 'user', 'content': exit_prompt}], response_format={'type': 'json_object'})
                res = json.loads(resp.choices[0].message.content)
                if res.get('decision') == "CLOSE":
                    with open(CLOSE_SIGNAL_PATH, 'w') as f: f.write(pair)
                    await send_telegram(f"💰 **GOLDEN EXIT EXECUTED** ({pair})\n📌 Profit: {trade['profit']}\n💡 Reason: {res['reason']}")
                    logging.info(f"GOLDEN EXIT: Closed {pair} due to {res['reason']}")
                    await asyncio.sleep(5)

            # --- PHASE 2: NEW TRADE SCANNING (Safety Lock Restricted) ---
            if m_level < 500.0:
                logging.info(f"Margin Safety Lock Aktif ({m_level}%). Skip New Trades.")
                await asyncio.sleep(300); continue

            # Determine Risk Multiplier based on Margin
            risk_mult = 1.0
            if m_level < 300: risk_mult = 0.5 # Defensive
            if m_level < 200: risk_mult = 0.25 # Survival Mode

            cycle_decisions = []
            for pair in PAIRS:
                # Skip if already have open trade for this pair
                if any(t['pair'] == pair for t in open_trades): continue
                
                market_data = await asyncio.to_thread(fetch_yfinance_data, pair)
                if not market_data: continue
                
                h4_trend = market_data.get('h4_trend', 'NEUTRAL')
                f_data = market_data.get('formatted', '')
                
                # --- V5.5 CORRELATION GUARD (Hard-Coded) ---
                base_cur = str(pair)[0:3]
                quote_cur = str(pair)[3:6]
                if m_level < 300: # Tighten if margin low
                    is_correlated = False
                    for t in open_trades:
                        t_pair = str(t.get('pair', ''))
                        if base_cur in t_pair or quote_cur in t_pair:
                            is_correlated = True; break
                    if is_correlated:
                        logging.info(f"CORRELATION GUARD: REJECTED {pair} (Clustered Exposure Risk)")
                        continue

                prompt = f"""
                Analisa {pair} STRATEGI OMNI PREDATOR V7.3.
                DATA TEKNIKAL TRIPLE (M1-M5-M15): {f_data}
                H4_TREND_LOCK: {h4_trend}
                SENTIMEN: {news} | COT: {cot_data}
                
                INSTRUKSI PREDATOR V7.3:
                1. ANALISA REZIM (ADX):
                   - ADX < 20 (RANGING): Jadilah SANGAT AGRESIF pada Mean Reversion (M1-M5 RSI/BB).
                   - ADX > 25 (TRENDING): Jadilah SANGAT AGRESIF pada Breakout Momentum.
                2. KONFLUENSI TRIPLE: Gunakan M1 untuk presisi entry, M5 untuk trigger jenuh, dan M15 untuk konfirmasi keamanan lokal.
                3. MODE STRIKER: Ambil 10-25 pips. MODE SNIPER: Ambil > 50 pips.
                4. SYARAT MUTLAK: Eksekusi WAJIB searah Tren Utama (H4/H1).
                
                WAJIB JSON: {{ "decision": "BUY_MARKET"|"SELL_MARKET"|"HOLD", "mode": "SNIPER"|"STRIKER", "regime": "TRENDING"|"RANGING", "entry": 0.0, "sl_pips": 20, "tp_pips": 40, "risk_percent": 1.0, "reason": "..." }}
                """
                resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': 'Anda adalah OMNI PREDATOR V7.3. Beradaptasi dengan Rezim ADX secara instan. Jadilah predator yang lapar profit.'}, {'role': 'user', 'content': prompt}], response_format={'type': 'json_object'})
                res = json.loads(resp.choices[0].message.content)
                dec = str(res.get('decision', 'HOLD')).upper()
                
                if 'BUY' in dec or 'SELL' in dec:
                    # --- V5.5 H4 TREND LOCK (Logic Override) ---
                    if dec == "BUY_MARKET" and h4_trend == "BEARISH":
                        logging.warning(f"TREND LOCK: REJECTED {pair} {dec} (Counter-Trend H4 Bearish)")
                        continue
                    if dec == "SELL_MARKET" and h4_trend == "BULLISH":
                        logging.warning(f"TREND LOCK: REJECTED {pair} {dec} (Counter-Trend H4 Bullish)")
                        continue

                    if sum(1 for d in cycle_decisions if d['action'] == dec) < 2:
                        res['risk_percent'] = float(res.get('risk_percent', 1.0)) * risk_mult
                        cycle_decisions.append({'pair': pair, 'action': dec, 'res': res})

            for sig in cycle_decisions:
                pair, action, res = sig['pair'], sig['action'], sig['res']
                risk = min(float(res.get('risk_percent', 1.0)), 2.5)
                with open(SIGNAL_PATH, 'w') as f: f.write(f"{pair}|{action}|{res['entry']}|{res['sl_pips']}|{res['tp_pips']}|{risk}")
                conn = sqlite3.connect(DB_PATH)
                conn.execute('INSERT INTO trade_history (pair, action, entry, sl, tp, risk, timestamp, reason) VALUES (?,?,?,?,?,?,?,?)', (pair, action, res['entry'], res['sl_pips'], res['tp_pips'], risk, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res['reason']))
                conn.commit(); conn.close()
                await send_telegram(f"🔱 **SAC OMNI PREDATOR V7.3 EXECUTION** ({pair})\n📌 Mode: {res.get('mode')} ({res.get('regime')})\n📍 Action: {action}\n💡 Reason: {res.get('reason')}")
                await asyncio.sleep(5)

            await asyncio.sleep(60)
        except Exception as e: logging.error(f"Error V4: {e}"); await asyncio.sleep(30)

async def main():
    await asyncio.gather(trader_loop(), telegram_listener())

if __name__ == '__main__':
    asyncio.run(main())
