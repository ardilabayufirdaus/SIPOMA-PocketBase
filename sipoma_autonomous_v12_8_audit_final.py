import os
import time
import json
import sqlite3
import logging
import asyncio
import httpx
import hashlib
import math
from datetime import datetime, timezone, timedelta
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
XAI_API_KEY = os.getenv('XAI_API_KEY')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')
MODEL_ID = 'grok-4-1-fast-reasoning'
FALLBACK_MODEL_ID = 'grok-4-1-fast-non-reasoning'
DB_PATH = '/home/ardilabayufirdaus/ai-commander/commander_v2.db'
MT4_FILES = '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files'
SIGNAL_PATH = os.path.join(MT4_FILES, 'trades.txt')
iSTATS_PATH = os.path.join(MT4_FILES, 'account_stats.txt')
iSPECS_PATH = os.path.join(MT4_FILES, 'symbol_specs.txt')
iRESULTS_PATH = os.path.join(MT4_FILES, 'trade_results.txt')
iCLOSE_PATH = os.path.join(MT4_FILES, 'close_signal.txt')
iPRICE_PATH = os.path.join(MT4_FILES, 'price_data.txt')
iCANDLE_PATH = os.path.join(MT4_FILES, 'candle_patterns.txt')
GROK_LOG = '/home/ardilabayufirdaus/ai-commander/grok_decisions.log'
JOURNAL_LOG = '/home/ardilabayufirdaus/ai-commander/trade_journal.log'

PAIRS = ['EURUSD','GBPUSD','USDJPY','GBPJPY','EURJPY','AUDUSD','USDCAD','USDCHF','AUDJPY','NZDJPY','NZDUSD','EURGBP','EURCAD','CADJPY','CHFJPY']

SESSION_CONFIG = {
    'TOKYO':   {'threshold': 95, 'sl_mult': 1.0, 'tp_mult': 2.0, 'style': 'RANGE', 'max_loss_pct': 1.0, 'pairs': ['USDJPY','EURJPY','GBPJPY','AUDJPY','NZDJPY','CADJPY','CHFJPY']},
    'LONDON':  {'threshold': 90, 'sl_mult': 1.5, 'tp_mult': 3.0, 'style': 'BREAKOUT', 'max_loss_pct': 2.0, 'pairs': PAIRS},
    'OVERLAP': {'threshold': 88, 'sl_mult': 1.5, 'tp_mult': 4.0, 'style': 'AGGRESSIVE', 'max_loss_pct': 1.5, 'pairs': PAIRS},
    'NEWYORK': {'threshold': 90, 'sl_mult': 1.5, 'tp_mult': 4.0, 'style': 'TREND_CONTINUATION', 'max_loss_pct': 2.0, 'pairs': ['EURUSD','GBPUSD','USDCAD','USDJPY','AUDUSD','NZDUSD','USDCHF','EURCAD']},
    'OFF':     {'threshold': 100, 'sl_mult': 0, 'tp_mult': 0, 'style': 'HOLD', 'max_loss_pct': 0, 'pairs': []},
}
MAX_SIMULTANEOUS_ORDERS = 5
COOLDOWN_MINUTES = 5
MAX_DAILY_LOSS_PCT = 3.0
DRAWDOWN_LOCK_PCT = 5.0
EQUITY_CURVE_DROP_PCT = 5.0
KELLY_HARD_CAP_PCT = 2.0  # V12.1: Hard cap

CORRELATION_CLUSTERS = {
    'USD': ['EURUSD','GBPUSD','USDJPY','USDCAD','USDCHF','AUDUSD','NZDUSD'],
    'JPY': ['USDJPY','EURJPY','GBPJPY','AUDJPY','NZDJPY','CADJPY','CHFJPY'],
    'EUR': ['EURUSD','EURJPY','EURGBP','EURCAD'],
    'GBP': ['GBPUSD','GBPJPY','EURGBP'],
}
MAX_PER_CLUSTER = 2

# V12.2: Calendar cache
CALENDAR_CACHE = {"events": [], "last_update": datetime.min.replace(tzinfo=timezone.utc)}
PATTERN_DECAY_DAYS = 60  # Pattern confidence halves every 60 days

client = OpenAI(api_key=XAI_API_KEY, base_url='https://api.x.ai/v1/')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

CURRENT_STATS = {"m_level": 10000.0, "open_trades": {}, "balance": 0, "equity": 0}
PAIR_COOLDOWN = {}
INTERMARKET_CACHE = {"data": {}, "last_update": datetime.min.replace(tzinfo=timezone.utc)}
PEAK_EQUITY_WEEK = 0.0
PEAK_EQUITY_TS = datetime.min
SESSION_PNL = {}

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('CREATE TABLE IF NOT EXISTS trade_history (id INTEGER PRIMARY KEY, pair TEXT, action TEXT, entry REAL, sl REAL, tp REAL, risk REAL, timestamp DATETIME, reason TEXT, score INTEGER, style TEXT, result TEXT, ticket INTEGER, session TEXT, regime TEXT, mtf_alignment TEXT, pattern_hash TEXT, confidence REAL, outcome TEXT DEFAULT "PENDING", pips_result REAL)')
    conn.execute('CREATE TABLE IF NOT EXISTS pattern_memory (id INTEGER PRIMARY KEY, setup_hash TEXT UNIQUE, pair TEXT, session TEXT, pattern TEXT, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, last_used DATETIME)')
    conn.execute('CREATE TABLE IF NOT EXISTS equity_tracker (id INTEGER PRIMARY KEY, date TEXT UNIQUE, peak_equity REAL, current_equity REAL)')
    # V12.3: Migrate existing DB — add new columns if missing
    for col_def in ['session TEXT', 'regime TEXT', 'mtf_alignment TEXT', 'pattern_hash TEXT', 'confidence REAL', 'outcome TEXT DEFAULT "PENDING"', 'pips_result REAL']:
        try: conn.execute('ALTER TABLE trade_history ADD COLUMN ' + col_def)
        except: pass
    conn.close()

async def send_telegram(msg):
    try:
        async with httpx.AsyncClient() as c:
            await c.post("https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage", json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "Markdown"})
    except: pass

def get_session():
    utc_hour = datetime.now(timezone.utc).hour
    if utc_hour >= 23 or utc_hour < 7: return 'TOKYO'
    elif 7 <= utc_hour < 12: return 'LONDON'
    elif 12 <= utc_hour < 16: return 'OVERLAP'
    elif 16 <= utc_hour < 21: return 'NEWYORK'
    else: return 'OFF'

# ══════ V12.8: Robust News Scraper (JSON) ══════
def scrape_calendar():
    """V12.8: Use JSON endpoint for reliability (avoid 403)."""
    now = datetime.now(timezone.utc)
    if (now - CALENDAR_CACHE["last_update"]).total_seconds() < 3600 and CALENDAR_CACHE["events"]:
        return CALENDAR_CACHE["events"]
    try:
        # User defined source: nfs.faireconomy.media/ff_calendar_thisweek.json
        resp = httpx.get('https://nfs.faireconomy.media/ff_calendar_thisweek.json', timeout=10)
        events = resp.json()
        CALENDAR_CACHE["events"] = events
        CALENDAR_CACHE["last_update"] = now
        return events
    except Exception as e:
        logging.error(f"Calendar Scrape Error: {e}")
        return CALENDAR_CACHE["events"]

def check_news_block(pair):
    """V12.1: Block trading 15 mins before/after high-impact news."""
    events = scrape_calendar()
    now = datetime.now(timezone.utc)
    cur1, cur2 = pair[:3], pair[3:]
    for ev in events:
        if ev.get('impact') == 'High' and (cur1 in ev.get('country', '') or cur2 in ev.get('country', '')):
            try:
                # FF JSON uses UTC datetime string
                ev_time = datetime.fromisoformat(ev['date'].replace('Z', '+00:00'))
                diff = abs((now - ev_time).total_seconds() / 60)
                if diff < 15: return ev.get('title', 'High Impact News')
            except: pass
    return None

def get_streak():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT result FROM trade_history WHERE result IS NOT NULL ORDER BY timestamp DESC LIMIT 5')
    results = [row[0] for row in cursor.fetchall()]
    conn.close()
    if not results: return 0, "NONE"
    streak = 1
    for i in range(1, len(results)):
        if results[i] == results[0]: streak += 1
        else: break
    return streak, results[0]

def check_cooldown(pair):
    if pair in PAIR_COOLDOWN:
        if datetime.now() < PAIR_COOLDOWN[pair]: return True
        else: del PAIR_COOLDOWN[pair]
    return False

def set_cooldown(pair):
    PAIR_COOLDOWN[pair] = datetime.now() + timedelta(minutes=COOLDOWN_MINUTES)

def check_penalty(pair):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT timestamp FROM trade_history WHERE pair=? AND result="LOSS" ORDER BY timestamp DESC LIMIT 1', (pair,))
    row = cursor.fetchone(); conn.close()
    if row:
        last_loss = datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
        if (datetime.now() - last_loss).total_seconds() < 3600: return True
    return False

def check_cluster_exposure(pair, open_trades):
    cur1, cur2 = pair[:3], pair[3:]
    for cluster, members in CORRELATION_CLUSTERS.items():
        if pair in members:
            count = sum(1 for p in open_trades if p in members)
            if count >= MAX_PER_CLUSTER: return cluster
    return None

def check_equity_curve():
    global PEAK_EQUITY_WEEK, PEAK_EQUITY_TS
    eq = CURRENT_STATS["equity"]
    now = datetime.now()
    
    # Load from DB if 0
    if PEAK_EQUITY_WEEK == 0:
        try:
            conn = sqlite3.connect(DB_PATH)
            row = conn.execute('SELECT peak_equity FROM equity_tracker ORDER BY id DESC LIMIT 1').fetchone()
            if row: PEAK_EQUITY_WEEK = row[0]
            conn.close()
        except: pass

    if now - PEAK_EQUITY_TS > timedelta(days=7): 
        PEAK_EQUITY_WEEK = eq
        PEAK_EQUITY_TS = now
    
    if eq > PEAK_EQUITY_WEEK: 
        PEAK_EQUITY_WEEK = eq
        # Persist to DB
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.execute('INSERT OR REPLACE INTO equity_tracker (date, peak_equity, current_equity) VALUES (?, ?, ?)', (now.strftime('%Y-%m-%d'), PEAK_EQUITY_WEEK, eq))
            conn.commit(); conn.close()
        except: pass

    if PEAK_EQUITY_WEEK > 0 and (PEAK_EQUITY_WEEK - eq) / PEAK_EQUITY_WEEK * 100 > EQUITY_CURVE_DROP_PCT: return True
    return False

def get_symbol_specs():
    specs = {}
    if os.path.exists(iSPECS_PATH):
        try:
            with open(iSPECS_PATH, 'r') as f:
                for line in f:
                    p = line.strip().split('|')
                    if len(p) >= 5: specs[p[0]] = {'spread': float(p[1]), 'point': float(p[2]), 'daily_high': float(p[3]), 'daily_low': float(p[4])}
        except: pass
    return specs

def read_price_data():
    data = {}
    if os.path.exists(iPRICE_PATH):
        try:
            import pandas as pd
            df = pd.read_csv(iPRICE_PATH, sep='|', names=['pair_tf', 'time', 'open', 'high', 'low', 'close', 'vol'])
            for (ptf), group in df.groupby('pair_tf'):
                data[ptf] = group.sort_values('time')
        except: pass
    return data

def read_candle_patterns():
    patterns = {}
    if os.path.exists(iCANDLE_PATH):
        try:
            with open(iCANDLE_PATH, 'r') as f:
                for line in f:
                    p = line.strip().split('|')
                    if len(p) >= 3: patterns[p[0]] = {'m5': p[1], 'm15': p[2]}
        except: pass
    return patterns

def calculate_indicators(df):
    if len(df) < 30: return None
    import numpy as np
    c = df['close'].values
    h = df['high'].values
    l = df['low'].values
    v = df['vol'].values
    
    # EMA
    ema7 = df['close'].ewm(span=7).mean().iloc[-1]
    ema21 = df['close'].ewm(span=21).mean().iloc[-1]
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs.iloc[-1]))
    
    # Bollinger
    sma20 = df['close'].rolling(window=20).mean()
    std20 = df['close'].rolling(window=20).std()
    upper = sma20 + (2 * std20)
    lower = sma20 - (2 * std20)
    bb_pct = (c[-1] - lower.iloc[-1]) / (upper.iloc[-1] - lower.iloc[-1]) if (upper.iloc[-1] - lower.iloc[-1]) != 0 else 0.5
    bb_pos = "UPPER" if bb_pct > 0.8 else ("LOWER" if bb_pct < 0.2 else "MID")
    
    # Stochastic
    low14 = df['low'].rolling(window=14).min()
    high14 = df['high'].rolling(window=14).max()
    pk = 100 * ((df['close'] - low14) / (high14 - low14))
    pd = pk.rolling(window=3).mean()
    stok, stod = pk.iloc[-1], pd.iloc[-1]
    stoch_cross = "BULLISH" if pk.iloc[-2] < pd.iloc[-2] and stok > stod else ("BEARISH" if pk.iloc[-2] > pd.iloc[-2] and stok < stod else "NONE")
    
    # ATR
    tr = np.maximum(h[1:] - l[1:], np.maximum(abs(h[1:] - c[:-1]), abs(l[1:] - c[:-1])))
    atr = np.mean(tr[-14:])
    
    # Volume Spike
    vol_avg = np.mean(v[-20:-1])
    vol_spike = v[-1] / vol_avg if vol_avg > 0 else 1.0
    
    # Liquidity Sweep
    sweep = "NONE"
    if h[-1] > np.max(h[-6:-1]) and c[-1] < h[-1] - (0.3 * (h[-1]-l[-1])): sweep = "SWEEP_UP"
    if l[-1] < np.min(l[-6:-1]) and c[-1] > l[-1] + (0.3 * (h[-1]-l[-1])): sweep = "SWEEP_DOWN"

    # Market Regime (ADX)
    plus_dm = np.where((h[1:] - h[:-1]) > (l[:-1] - l[1:]), np.maximum(h[1:] - h[:-1], 0), 0)
    minus_dm = np.where((l[:-1] - l[1:]) > (h[1:] - h[:-1]), np.maximum(l[:-1] - l[1:], 0), 0)
    tr_sum = np.sum(tr[-14:])
    plus_di = 100 * np.sum(plus_dm[-14:]) / tr_sum if tr_sum != 0 else 0
    minus_di = 100 * np.sum(minus_dm[-14:]) / tr_sum if tr_sum != 0 else 0
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) != 0 else 0
    regime = "TRENDING" if dx > 25 else ("RANGING" if dx > 15 else "CHOPPY")

    return {'ema7': ema7, 'ema21': ema21, 'rsi': rsi, 'bb_upper': upper.iloc[-1], 'bb_lower': lower.iloc[-1], 'bb_pos': bb_pos, 'bb_pct': bb_pct, 'stok': stok, 'stod': stod, 'stoch_cross': stoch_cross, 'atr': atr, 'vol_spike': vol_spike, 'sweep': sweep, 'adx': dx, 'regime': regime, 'price': c[-1]}

def get_mtf_alignment(price_data, pair, c_p):
    """V12.1: H4 -> H1 -> M15 Trend Confluence. V12.8: Mandatory Institutional Rule."""
    trends = {}
    for tf in ['H4', 'H1', 'M15']:
        key = pair + "_" + tf
        if key in price_data and len(price_data[key]) > 25:
            df = price_data[key]
            e7 = df['close'].ewm(span=7).mean().iloc[-1]
            e21 = df['close'].ewm(span=21).mean().iloc[-1]
            cp = df['close'].iloc[-1]
            if cp > e21 and e7 > e21: trends[tf] = 'BULLISH'
            elif cp < e21 and e7 < e21: trends[tf] = 'BEARISH'
            else: trends[tf] = 'NEUTRAL'
        else: trends[tf] = 'UNKNOWN'
    
    if trends['H4'] == 'BULLISH' and trends['H1'] != 'BEARISH': return 'BULLISH', trends
    if trends['H4'] == 'BEARISH' and trends['H1'] != 'BULLISH': return 'BEARISH', trends
    return 'NEUTRAL', trends

def get_intermarket():
    now = datetime.now(timezone.utc)
    if (now - INTERMARKET_CACHE["last_update"]).total_seconds() < 300 and INTERMARKET_CACHE["data"]:
        return INTERMARKET_CACHE["data"]
    data = {"dxy_trend": "UP", "gold_trend": "DOWN", "us10y_trend": "UP"}
    INTERMARKET_CACHE["data"] = data
    INTERMARKET_CACHE["last_update"] = now
    return data

def get_seasonality():
    m = datetime.now().month
    if m in [1, 9]: return "USD_BULLISH"
    if m in [4, 12]: return "EUR_GBP_BULLISH"
    return "STABLE"

def get_daily_pnl_from_history():
    today = datetime.now().strftime('%Y-%m-%d')
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT SUM(pips_result) FROM trade_history WHERE timestamp LIKE ?', (today + '%',))
    res = cursor.fetchone()[0]
    conn.close()
    return res if res else 0.0

def kelly_lot_size(ind, equity, sl_dist, s_cfg):
    if sl_dist == 0: return 0.01
    win_rate, risk_reward = 0.55, 1.5
    kelly = win_rate - ((1 - win_rate) / risk_reward)
    half_kelly = kelly / 2
    return max(0.1, min(half_kelly * 100, KELLY_HARD_CAP_PCT, s_cfg['max_loss_pct']))

def fallback_decision_v2(ind, tr_h4, session, pair, setup_hash, intermarket):
    score = 0
    if ind['regime'] == "TRENDING":
        if tr_h4 == "BULLISH" and ind['bb_pct'] < 0.4: score += 4
        if tr_h4 == "BEARISH" and ind['bb_pct'] > 0.6: score += 4
    if ind['sweep'] != "NONE": score += 3
    if ind['vol_spike'] > 1.5: score += 2
    if score >= 7: return ("BUY" if tr_h4 == "BULLISH" else "SELL"), score/10, 85
    return "HOLD", 0, 0

SYSTEM_PROMPT = """You are SAC V12.8 INSTITUTIONAL EFFICIENCY. JSON only.
{ "action": "BUY"|"SELL"|"HOLD", "score": 0.0-1.0, "confidence": 0-100, "reason": "Institutional rationale" }"""

async def watchdog_task():
    logging.info("V12.8 Watchdog Active")
    while True:
        try:
            if os.path.exists(iSTATS_PATH):
                with open(iSTATS_PATH, 'r') as f:
                    new_open = {}
                    for line in f:
                        p = line.strip().split('|')
                        if len(p) >= 10:
                            pair = p[0]
                            profit = float(p[4])
                            new_open[pair] = {'type': int(p[1]), 'entry': float(p[2]), 'sl': float(p[3]), 'profit': profit, 'ticket': int(p[8])}
                    
                    for p in list(CURRENT_STATS["open_trades"].keys()):
                        if p not in new_open:
                            closed = CURRENT_STATS["open_trades"][p]
                            outcome = 'PROFIT' if closed['profit'] > 0 else 'LOSS'
                            conn = sqlite3.connect(DB_PATH)
                            conn.execute('UPDATE trade_history SET result=?, outcome=?, pips_result=? WHERE pair=? AND ticket=?', (outcome, outcome, closed['profit'], p, closed['ticket']))
                            conn.commit(); conn.close()
                            asyncio.create_task(run_trade_journal(p, closed['type'], closed['entry'], 0, closed['profit'], get_session(), {}))
                    CURRENT_STATS["open_trades"] = new_open
            
            price_data = read_price_data()
            for pair, trade in CURRENT_STATS["open_trades"].items():
                key = pair + "_M5"
                if key in price_data and not price_data[key].empty:
                    ind = calculate_indicators(price_data[key].copy())
                    if trade['profit'] > 1.0 and ind:
                        c_it = False
                        if trade['type'] == 0 and (ind['ema7'] < ind['ema21'] or (ind['stok'] > 80 and ind['stok'] < ind['stod'])): c_it = True
                        elif trade['type'] == 1 and (ind['ema7'] > ind['ema21'] or (ind['stok'] < 20 and ind['stok'] > ind['stod'])): c_it = True
                        if c_it:
                            with open(iCLOSE_PATH, 'w') as cl: cl.write(pair + "\n")
                            set_cooldown(pair)
            await asyncio.sleep(1)
        except Exception as e: logging.error(f"Watchdog: {e}"); await asyncio.sleep(1)

async def scanner_task():
    init_db()
    logging.info("V12.8 Scanner Active")
    await send_telegram("SAC V12.8 Institutional Efficiency Online\nAudit OK | JSON News OK | Guardrails Persistent")
    while True:
        try:
            if os.path.exists(iRESULTS_PATH):
                conn = sqlite3.connect(DB_PATH)
                with open(iRESULTS_PATH, 'r') as f:
                    for l in f:
                        p = l.strip().split('|')
                        if len(p) >= 3: conn.execute('UPDATE trade_history SET ticket=? WHERE pair=? AND ticket IS NULL ORDER BY id DESC LIMIT 1', (int(p[2]), p[0]))
                conn.commit(); conn.close(); os.remove(iRESULTS_PATH)

            session = get_session(); s_cfg = SESSION_CONFIG[session]
            specs = get_symbol_specs(); price_data = read_price_data()
            candle_patterns = read_candle_patterns(); intermarket = get_intermarket()
            seasonality = get_seasonality(); daily_pnl = get_daily_pnl_from_history()
            streak_count, streak_dir = get_streak()
            total_open = len(CURRENT_STATS["open_trades"])
            equity = CURRENT_STATS.get("equity", 0)

            # Safety Guards
            if equity > 0 and (daily_pnl < -(equity * MAX_DAILY_LOSS_PCT / 100) or check_equity_curve()): await asyncio.sleep(30); continue
            if streak_count >= 3 and streak_dir == "LOSS": await asyncio.sleep(30); continue
            if session == 'OFF': await asyncio.sleep(30); continue

            news_heads = get_news_headlines()

            for pair in s_cfg['pairs']:
                if total_open >= MAX_SIMULTANEOUS_ORDERS or pair in CURRENT_STATS["open_trades"]: continue
                if check_cooldown(pair) or check_penalty(pair) or check_cluster_exposure(pair, CURRENT_STATS["open_trades"]): continue
                if check_news_block(pair): continue

                m5_key, h4_key = pair + "_M5", pair + "_H4"
                if m5_key not in price_data or h4_key not in price_data: continue
                ind = calculate_indicators(price_data[m5_key])
                if not ind: continue
                
                mtf_trend, mtf_deets = get_mtf_alignment(price_data, pair, ind['price'])
                if session != 'TOKYO' and mtf_trend == 'NEUTRAL': continue
                if ind['regime'] == 'CHOPPY': continue

                sp = specs.get(pair, {'spread': 2.0, 'point': 0.0001, 'daily_high': 0, 'daily_low': 0})
                div = 10.0 if sp['point'] in [0.00001, 0.001] else 1.0
                spread = sp['spread'] / div
                tr_h4 = mtf_deets.get('H4', 'NEUTRAL')
                s_hash = make_setup_hash(pair, tr_h4, ind['bb_pos'], ind['stoch_cross'], ind['regime'], session, "STRONG", "LOW" if spread < 1.5 else "MED")
                p_boost = get_pattern_boost(s_hash)

                if not ((ind['bb_pct'] >= 0.8 or ind['bb_pct'] <= 0.2) or ind['stoch_cross'] != "NONE" or p_boost != 0): continue

                payload = {"pair": pair, "price": round(ind['price'], 5), "indicators": ind, "mtf": mtf_deets, "news": news_heads[:3], "session": session}
                try:
                    resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': json.dumps(payload)}], response_format={'type': 'json_object'}, timeout=15)
                    res = json.loads(resp.choices[0].message.content)
                    dec, sc, cf = str(res.get('action', 'HOLD')).upper(), int(float(str(res.get('score', 0)).replace('%',''))*10), float(str(res.get('confidence', 0)).replace('%',''))
                except: dec, sc, cf = fallback_decision_v2(ind, tr_h4, session, pair, s_hash, intermarket); res = {"reason": "Fallback V2"}

                if dec != 'HOLD' and cf + p_boost >= s_cfg['threshold']:
                    sl, tp = s_cfg['sl_mult'] * ind['atr'], s_cfg['tp_mult'] * ind['atr']
                    risk = kelly_lot_size(ind, equity, sl, s_cfg)
                    with open(SIGNAL_PATH, 'w') as f: f.write(pair + "|" + dec + "_MARKET|" + str(ind['price']) + "|" + str(sl) + "|" + str(tp) + "|" + str(risk))
                    conn = sqlite3.connect(DB_PATH)
                    conn.execute('INSERT INTO trade_history (pair,action,entry,sl,tp,risk,timestamp,reason,score,style,session,regime,mtf_alignment,pattern_hash,confidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (pair, dec, ind['price'], sl, tp, risk, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res.get('reason',''), sc, 'V12.8-'+session, session, ind['regime'], str(mtf_deets), s_hash, cf))
                    conn.commit(); conn.close()
                    set_cooldown(pair); total_open += 1
                    await send_telegram(f"SAC V12.8 {dec} {pair}\nConf: {cf}%\nMTF: {mtf_deets}")
            await asyncio.sleep(30)
        except Exception as e: logging.error(f"Scanner: {e}"); await asyncio.sleep(30)

def get_news_headlines():
    try:
        import xml.etree.ElementTree as ET
        resp = httpx.get('https://www.forexlive.com/feed/', timeout=5, follow_redirects=True)
        root = ET.fromstring(resp.text.encode('utf-8'))
        return [item.find('title').text for item in root.findall('.//item')[:5] if item.find('title') is not None]
    except: return []

def make_setup_hash(pair, tr_h4, bb_pos, stoch_cross, regime, session, dxy, spread):
    return hashlib.md5(f"{pair}{tr_h4}{bb_pos}{stoch_cross}{regime}{session}{dxy}{spread}".encode()).hexdigest()[:16]

def get_pattern_boost(s_hash):
    conn = sqlite3.connect(DB_PATH); row = conn.execute('SELECT wins, losses, last_used FROM pattern_memory WHERE setup_hash=?', (s_hash,)).fetchone(); conn.close()
    if row:
        w, l, lu = row
        days = (datetime.now() - datetime.strptime(lu, '%Y-%m-%d %H:%M:%S')).days if lu else 0
        decay = math.exp(-days / PATTERN_DECAY_DAYS)
        if w >= 3 and w > l: return int(5 * decay)
        if l >= 3 and l > w: return int(-10 * decay)
    return 0

async def run_trade_journal(p, a, e, ex, pnl, s, ind):
    with open(JOURNAL_LOG, 'a') as f: f.write(f"{datetime.now()} | {p} | {pnl}\n")

async def main(): await asyncio.gather(watchdog_task(), scanner_task())
if __name__ == '__main__': asyncio.run(main())
