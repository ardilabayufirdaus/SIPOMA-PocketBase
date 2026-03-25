import time, os, json, asyncio, logging, sqlite3, httpx
from datetime import datetime, timedelta
from openai import OpenAI
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import numpy as np

load_dotenv()

# --- OMNI PREDATOR V8.3 (PRECISION EDITION) ---
XAI_API_KEY = os.getenv('XAI_API_KEY')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')
MODEL_ID = 'grok-4-1-fast-reasoning'
DB_PATH = '/home/ardilabayufirdaus/ai-commander/commander_v2.db'
SIGNAL_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/trades.txt'
iSTATS_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_stats.txt'
iHIST_PATH = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_history.txt'
PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'GBPJPY', 'USDJPY', 'EURJPY', 'AUDUSD']

client = OpenAI(api_key=XAI_API_KEY, base_url='https://api.x.ai/v1')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# V8.3 Penalty Box & Cooldown
PENALTY_BOX = {} # {pair: expiry_time}

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('CREATE TABLE IF NOT EXISTS trade_history (id INTEGER PRIMARY KEY, pair TEXT, action TEXT, entry REAL, sl REAL, tp REAL, risk REAL, timestamp DATETIME, reason TEXT, score INTEGER, style TEXT)')
    conn.close()

async def send_telegram(msg):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as c: await c.post(url, json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "Markdown"})
    except Exception as e: logging.error(f"Telegram Send Error: {e}")

async def sync_penalty_box():
    """V8.3: Scan account_history.txt to identify failed trades and apply penalty."""
    if not os.path.exists(iHIST_PATH): return
    try:
        with open(iHIST_PATH, 'r') as f:
            for line in f:
                p = line.strip().split('|')
                if len(p) < 7: continue
                # p[2] = STATUS (PROFIT/LOSS), p[6] = SYMBOL
                status, pair = p[2], p[6]
                if status == "LOSS":
                    # Applying 60-min penalty if not already in or if older
                    PENALTY_BOX[pair] = datetime.now() + timedelta(minutes=60)
    except Exception as e: logging.error(f"Penalty Sync Error: {e}")

def get_sl_tp_distances(pair, current_price, sl_pips, tp_pips):
    """V8.3: Convert pips to absolute price distance for 100% precision."""
    # Standard Pips Definition for absolute math
    pip_val = 0.0001 if pair not in ["XAUUSD", "GBPJPY", "USDJPY", "EURJPY"] else 0.01
    return sl_pips * pip_val, tp_pips * pip_val

async def fetch_yfinance_data(pair):
    symbol = "GC=F" if pair == "XAUUSD" else f"{pair}=X"
    try:
        m5 = yf.download(symbol, period='1d', interval='5m', progress=False)
        m15 = yf.download(symbol, period='5d', interval='15m', progress=False)
        h4_raw = yf.download(symbol, period='1mo', interval='1h', progress=False)
        for df in [m5, m15, h4_raw]:
            if not df.empty and isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
        h4 = h4_raw.resample('4h').agg({'Open':'first','High':'max','Low':'min','Close':'last'}).dropna()
        if m5.empty or m15.empty or h4.empty: return None

        def squash(val):
            if hasattr(val, 'iloc'): val = val.iloc[-1]
            return float(val) if val is not None else 0.0

        ema50, ema200 = h4['Close'].ewm(span=50).mean().iloc[-1], h4['Close'].ewm(span=200).mean().iloc[-1]
        h4_c = h4['Close'].iloc[-1]
        trend_lock = "BULLISH" if h4_c > ema50 > ema200 else ("BEARISH" if h4_c < ema50 < ema200 else "NEUTRAL")
        
        def get_prices(df, tf):
            d = df.tail(3); txt = ""
            for idx, row in d.iterrows():
                c, h, l, o = squash(row['Close']), squash(row['High']), squash(row['Low']), squash(row['Open'])
                txt += f"{tf}|{idx}|{o:.5f}|{h:.5f}|{l:.5f}|{c:.5f}\n"
            return txt

        f_data = get_prices(m5, "M5") + get_prices(m15, "M15") 
        f_data += f"EMA50:{ema50:.5f} | EMA200:{ema200:.5f} | H4 Trend:{trend_lock}\n"
        return {"formatted": f_data, "h4_trend": trend_lock, "current_price": h4_c}
    except Exception as e: return None

async def trader_loop():
    init_db()
    while True:
        try:
            await sync_penalty_box()
            m_level, open_trades = 0.0, []
            if os.path.exists(iSTATS_PATH):
                with open(iSTATS_PATH, 'r') as f:
                    for line in f:
                        p = line.strip().split('|')
                        if p[0] == "ORDER": open_trades.append(p[2])
                        elif len(p) >= 5: m_level = float(p[4])
            
            if m_level < 500.0: await asyncio.sleep(60); continue

            for pair in PAIRS:
                if pair in open_trades: continue
                if pair in PENALTY_BOX and datetime.now() < PENALTY_BOX[pair]:
                    logging.info(f"PENALTY BOX: {pair} remains disabled for {PENALTY_BOX[pair]-datetime.now()}")
                    continue

                market_data = await fetch_yfinance_data(pair)
                if not market_data: continue
                
                # Rule Guard: absolute distance floor to prevent noise
                min_price_dist = 0.50 if pair == "XAUUSD" else 0.0030
                
                prompt = f"""
                🔱 MISSION: OMNI PREDATOR V8.3 (PRECISION) 🔱
                PAIR: {pair} | DATA: {market_data['formatted']}
                
                [V8.3 PRECISION MANDATES]:
                1. ABSOLUTE SL PRICE: Berikan jarak SL harga (bukan pips). Min {min_price_dist} unit harga.
                2. STRUKTUR H1: Cari SL di balik swing H1. No scalping noise.
                3. ACCURACY >= 95%.
                
                OUTPUT JSON: {{ 
                    "decision": "BUY_MARKET"|"SELL_MARKET"|"HOLD", 
                    "style": "string", "f_score": int, "confidence": int,
                    "sl_dist": float, "tp_dist": float, "risk_percent": float,
                    "reason": "V8.3 Precision Verification"
                }}
                """
                resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': 'Anda adalah OMNI PREDATOR V8.3. Berikan jarak SL harga absolut yang memberikan ruang bernapas cukup (Min 50-100 pips).'}, {'role': 'user', 'content': prompt}], response_format={'type': 'json_object'})
                res = json.loads(resp.choices[0].message.content)
                dec = str(res.get('decision', 'HOLD')).upper()
                
                if (('BUY' in dec and market_data['h4_trend'] == 'BULLISH') or ('SELL' in dec and market_data['h4_trend'] == 'BEARISH')) and abs(res.get('f_score', 0)) >= 7 and res.get('confidence', 0) >= 95:
                    sl_dist = max(float(res.get('sl_dist', min_price_dist)), min_price_dist)
                    tp_dist = float(res.get('tp_dist', sl_dist * 2))

                    with open(SIGNAL_PATH, 'w') as f: f.write(f"{pair}|{dec}|{market_data['current_price']}|{sl_dist}|{tp_dist}|{res['risk_percent']}")
                    conn = sqlite3.connect(DB_PATH); conn.execute('INSERT INTO trade_history (pair, action, entry, sl, tp, risk, timestamp, reason, score, style) VALUES (?,?,?,?,?,?,?,?,?,?)', (pair, dec, market_data['current_price'], sl_dist, tp_dist, res['risk_percent'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res['reason'], res['f_score'], res['style'])); conn.commit(); conn.close()
                    await send_telegram(f"🔱 **OMNI PREDATOR V8.3 PRECISION EXECUTION**\n🎯 Action: {dec} {pair}\n📍 Entry: {market_data['current_price']}\n🛡️ SL Distance: {sl_dist:.4f} | TP: {tp_dist:.4f}\n💡 Reason: {res['reason']}")
                    await asyncio.sleep(5)
            await asyncio.sleep(60)
        except Exception as e: logging.error(f"V8.3 Error: {e}"); await asyncio.sleep(30)

if __name__ == '__main__': asyncio.run(trader_loop())
