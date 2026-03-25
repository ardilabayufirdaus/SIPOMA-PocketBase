import time, os, json, asyncio, logging, sqlite3, httpx
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import numpy as np

load_dotenv()

# --- OMNI PREDATOR V8.1 (FINAL GOD OF TRADING) ---
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
    conn.execute('CREATE TABLE IF NOT EXISTS trade_history (id INTEGER PRIMARY KEY, pair TEXT, action TEXT, entry REAL, sl REAL, tp REAL, risk REAL, timestamp DATETIME, reason TEXT, score INTEGER, style TEXT)')
    conn.close()

async def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as c: await c.post(url, json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "Markdown"})
    except Exception as e: logging.error(f"Telegram Send Error: {e}")

async def fetch_news():
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get('https://r.jina.ai/https://www.forexfactory.com/calendar')
            return r.text[:3000] if r.status_code == 200 else 'No News'
    except: return 'No News'

async def fetch_cot_sentiment():
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get('https://r.jina.ai/https://www.tradingster.com/cot/legacy-futures/122621')
            return r.text[:3000] if r.status_code == 200 else 'COT Data Unavailable'
    except: return 'COT Error'

def detect_smc_patterns(df):
    try:
        patterns = []
        for i in range(2, len(df)):
            if df['Low'].iloc[i] > df['High'].iloc[i-2]: patterns.append(f"Bullish FVG {df['High'].iloc[i-2]:.5f}-{df['Low'].iloc[i]:.5f}")
            if df['High'].iloc[i] < df['Low'].iloc[i-2]: patterns.append(f"Bearish FVG {df['Low'].iloc[i-2]:.5f}-{df['High'].iloc[i]:.5f}")
        return ", ".join(patterns[-3:])
    except: return "No SMC Data"

def fetch_yfinance_data(pair):
    symbol = "GC=F" if pair == "XAUUSD" else f"{pair}=X"
    try:
        m1 = yf.download(symbol, period='1d', interval='1m', progress=False)
        m5 = yf.download(symbol, period='1d', interval='5m', progress=False)
        m15 = yf.download(symbol, period='5d', interval='15m', progress=False)
        h4_raw = yf.download(symbol, period='1mo', interval='1h', progress=False)
        for df in [m1, m5, m15, h4_raw]:
            if not df.empty and isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
        h4 = h4_raw.resample('4h').agg({'Open':'first','High':'max','Low':'min','Close':'last'}).dropna()
        if m5.empty or m15.empty or h4.empty: return None

        def calc_rsi(series, p=14):
            delta = series.diff()
            up, dw = delta.copy(), delta.copy()
            up[up < 0] = 0; dw[dw > 0] = 0
            roll_up, roll_dw = up.rolling(p).mean(), dw.abs().rolling(p).mean()
            return 100 - (100 / (1 + roll_up / (roll_dw + 1e-9)))

        def squash(val):
            if hasattr(val, 'iloc'): val = val.iloc[-1]
            return float(val) if val is not None else 0.0

        m5['rsi'] = calc_rsi(m5['Close'])
        m5['ma20'] = m5['Close'].rolling(20).mean()
        m5['std20'] = m5['Close'].rolling(20).std()
        m5['bb_up'] = m5['ma20'] + (m5['std20'] * 2)
        m5['bb_dw'] = m5['ma20'] - (m5['std20'] * 2)
        m15['rsi'] = calc_rsi(m15['Close'])
        h4_close = h4['Close']
        h4_tr = pd.concat([h4['High']-h4['Low'], abs(h4['High']-h4_close.shift()), abs(h4['Low']-h4_close.shift())], axis=1).max(axis=1)
        adx_h4_num = 100 * (abs(100*(h4['High'].diff().rolling(14).mean()/h4_tr.rolling(14).mean()) - 100*(h4['Low'].diff().abs().rolling(14).mean()/h4_tr.rolling(14).mean())) / (100*(h4['High'].diff().rolling(14).mean()/h4_tr.rolling(14).mean()) + 100*(h4['Low'].diff().abs().rolling(14).mean()/h4_tr.rolling(14).mean()))).rolling(14).mean().iloc[-1]
        ema50, ema200 = h4_close.ewm(span=50).mean().iloc[-1], h4_close.ewm(span=200).mean().iloc[-1]
        h4_c = h4_close.iloc[-1]
        trend_lock = "BULLISH" if h4_c > ema50 > ema200 else ("BEARISH" if h4_c < ema50 < ema200 else "NEUTRAL")
        smc_m15 = detect_smc_patterns(m15.tail(20))

        def get_prices(df, tf):
            d = df.tail(3); txt = ""
            for idx, row in d.iterrows():
                c, h, l, o = squash(row['Close']), squash(row['High']), squash(row['Low']), squash(row['Open'])
                txt += f"{tf}|{idx}|{o:.5f}|{h:.5f}|{l:.5f}|{c:.5f}"
                if tf == "M5": txt += f"|RSI:{squash(row.get('rsi', 50)):.1f}|BB:{squash(row.get('bb_dw', 0)):.5f}-{squash(row.get('bb_up', 0)):.5f}"
                txt += "\n"
            return txt

        f_data = get_prices(m5, "M5") + get_prices(m15, "M15") 
        f_data += f"ADX_H4:{adx_h4_num:.1f} | EMA50:{ema50:.5f} | EMA200:{ema200:.5f} | SMC:{smc_m15}\n"
        return {"formatted": f_data, "h4_trend": trend_lock, "adx_h4": adx_h4_num, "current_price": h4_c}
    except Exception as e:
        logging.error(f"Predator Data Error: {e}"); return None

async def trader_loop():
    init_db()
    iSTATS_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_stats.txt'
    SIGNAL_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/trades.txt'
    last_cot_time, cot_data = 0, "Fetching..."
    while True:
        try:
            m_level, open_trades = 0.0, []
            if os.path.exists(iSTATS_PATH):
                with open(iSTATS_PATH, 'r') as f:
                    for line in f:
                        p = line.strip().split('|')
                        if not p or len(p) < 5: continue
                        if p[0] == "ORDER": open_trades.append({'pair': p[2], 'type': p[3], 'p': float(p[5])})
                        else: m_level = float(p[4])
            
            if m_level < 500.0: await asyncio.sleep(300); continue
            if time.time() - last_cot_time > 86400: cot_data, last_cot_time = await fetch_cot_sentiment(), time.time()
            news = await fetch_news()

            for pair in PAIRS:
                if any(t['pair'] == pair for t in open_trades): continue
                base_cur, quote_cur = pair[:3], pair[3:]
                correlated = False
                for t in open_trades:
                    t_pair = t['pair']
                    if base_cur in t_pair or quote_cur in t_pair:
                        correlated = True; break
                if correlated and m_level < 1000: continue

                market_data = await fetch_yfinance_data(pair)
                if not market_data: continue
                
                prompt = f"""
                🔱 MISSION: OMNI PREDATOR V8.1 (GOD OF TRADING) 🔱
                PAIR: {pair} | DATA: {market_data['formatted']} | NEWS: {news} | COT: {cot_data}
                
                [12-LAYER CONFLUENCE MANDATES]:
                1. FUNDAMENTAL SCORE: -10 to +10. Wajib >= |6|.
                2. NEWS BLACKOUT: High-Impact <30m = BLACKOUT.
                3. TREND LOCK (EMA 50/200 H4): Wajib searah.
                4. PULLBACK RULE: No BUY jika RSI_M5 > 62.
                5. ACCURACY: Do not enter if in doubt. >= 90% confidence.
                
                OUTPUT JSON: {{ 
                    "decision": "BUY_MARKET"|"SELL_MARKET"|"HOLD", 
                    "style": "string", "f_score": int, "confidence": int,
                    "sl_pips": int, "tp_pips": int, "risk_percent": float,
                    "reason": "Detail 12-layer verification"
                }}
                """
                resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': 'Anda adalah OMNI PREDATOR V8.1. Akurasi >= 90% adalah mutlak.'}, {'role': 'user', 'content': prompt}], response_format={'type': 'json_object'})
                res = json.loads(resp.choices[0].message.content)
                dec = str(res.get('decision', 'HOLD')).upper()
                
                if (('BUY' in dec and market_data['h4_trend'] == 'BULLISH') or ('SELL' in dec and market_data['h4_trend'] == 'BEARISH')) and abs(res.get('f_score', 0)) >= 6 and res.get('confidence', 0) >= 90:
                    with open(SIGNAL_PATH, 'w') as f: f.write(f"{pair}|{dec}|{market_data['current_price']}|{res['sl_pips']}|{res['tp_pips']}|{res['risk_percent']}")
                    conn = sqlite3.connect(DB_PATH); conn.execute('INSERT INTO trade_history (pair, action, entry, sl, tp, risk, timestamp, reason, score, style) VALUES (?,?,?,?,?,?,?,?,?,?)', (pair, dec, market_data['current_price'], res['sl_pips'], res['tp_pips'], res['risk_percent'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res['reason'], res['f_score'], res['style'])); conn.commit(); conn.close()
                    await send_telegram(f"🔱 **OMNI PREDATOR V8.1 EXECUTION**\n💰 Style: {res.get('style')}\n📊 F-Score: {res.get('f_score')}\n🎯 Action: {dec} {pair}\n💡 Reason: {res['reason']}")
                    await asyncio.sleep(5)
            await asyncio.sleep(60)
        except Exception as e: logging.error(f"V8.1 Error: {e}"); await asyncio.sleep(30)

if __name__ == '__main__': asyncio.run(trader_loop())
