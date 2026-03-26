import os, time, json, sqlite3, logging, asyncio, hashlib, math, httpx
from datetime import datetime, timezone, timedelta
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

# Internal Modules (Optimized V13.1)
import news_filter, risk_manager, pair_evaluator

load_dotenv()
XAI_API_KEY = os.getenv('XAI_API_KEY')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')

# V13.1 Core Info
FULL_NAME = "SAC V13.1 OMNI-PREDATOR"
VERSION = "13.1.0"
BUILD = "Institutional Grade"
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
    'TOKYO':   {'threshold': 80, 'sl_mult': 1.0, 'tp_mult': 2.5, 'style': 'RANGE', 'max_loss_pct': 1.0, 'pairs': ['USDJPY','EURJPY','GBPJPY','AUDJPY','NZDJPY','CADJPY','CHFJPY']},
    'LONDON':  {'threshold': 80, 'sl_mult': 1.5, 'tp_mult': 3.0, 'style': 'BREAKOUT', 'max_loss_pct': 2.0, 'pairs': PAIRS},
    'OVERLAP': {'threshold': 80, 'sl_mult': 1.5, 'tp_mult': 4.0, 'style': 'AGGRESSIVE', 'max_loss_pct': 1.5, 'pairs': PAIRS},
    'NEWYORK': {'threshold': 80, 'sl_mult': 1.5, 'tp_mult': 4.0, 'style': 'TREND_CONTINUATION', 'max_loss_pct': 2.0, 'pairs': ['EURUSD','GBPUSD','USDCAD','USDJPY','AUDUSD','NZDUSD','USDCHF','EURCAD']},
    'OFF':     {'threshold': 100, 'sl_mult': 0, 'tp_mult': 0, 'style': 'HOLD', 'max_loss_pct': 0, 'pairs': []},
}
MAX_SIMULTANEOUS_ORDERS = 5
COOLDOWN_MINUTES = 5
MAX_DAILY_LOSS_PCT = 3.0
DRAWDOWN_LOCK_PCT = 5.0
EQUITY_CURVE_DROP_PCT = 5.0
KELLY_HARD_CAP_PCT = 2.0  

# V12.8.4: Session-Aware Intelligence (Per-Pair Asian Range)
ADX_THRESHOLDS = {"TOKYO": 15, "LONDON": 22, "OVERLAP": 25, "NEWYORK": 22, "OFF": 100}
ASIAN_RANGE = {} # pair -> {"high": h, "low": l, "captured": True, "date": "..."}

CORRELATION_CLUSTERS = {
    'USD': ['EURUSD','GBPUSD','USDJPY','USDCAD','USDCHF','AUDUSD','NZDUSD'],
    'JPY': ['USDJPY','EURJPY','GBPJPY','AUDJPY','NZDJPY','CADJPY','CHFJPY'],
    'EUR': ['EURUSD','EURJPY','EURGBP','EURCAD'],
    'GBP': ['GBPUSD','GBPJPY','EURGBP'],
}
MAX_PER_CLUSTER = 2

# V12.2: Calendar cache (scraped from ForexFactory)
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

PRICE_STORAGE = {}

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

def has_open_position(pair):
    """V13.1: Check if pair already has an open position in DB"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("SELECT COUNT(*) FROM trade_history WHERE pair = ? AND outcome = 'OPEN'", (pair,))
    count = cursor.fetchone()[0]
    conn.close()
    return count > 0

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

# ══════ V12.8: Robust News Scraper ══════
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
                if diff < 30: return ev.get('title', 'High Impact News')
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
    """V12.8.4: Robust price loader with I/O Collision Shield & Cache."""
    global PRICE_STORAGE
    if not os.path.exists(iPRICE_PATH): return PRICE_STORAGE
    
    new_data = {}
    try:
        # Retry up to 5 times if file is being written (empty)
        for _ in range(5):
            try:
                with open(iPRICE_PATH, 'r') as f:
                    lines = f.readlines()
                if lines: break
            except: pass
            time.sleep(0.05)
        
        if not lines: return PRICE_STORAGE # Return Last Known Good
        
        for line in lines:
            parts = line.strip().split('|')
            if len(parts) < 8: continue
            try:
                p, tf = parts[0], parts[1]
                o, h, l, c = float(parts[3]), float(parts[4]), float(parts[5]), float(parts[6])
                # Junk Volume Shield + Numeric Validator
                vol_str = parts[7].strip()
                if not vol_str.isdigit() or len(vol_str) > 50: vol = 0.0
                else: vol = float(vol_str)
                
                k = f"{p}_{tf}"
                if k not in new_data: new_data[k] = []
                new_data[k].append({'open': o, 'high': h, 'low': l, 'close': c, 'vol': vol})
            except: continue
            
        if new_data:
            import pandas as pd
            for k in new_data:
                # Store as DataFrame for calculate_indicators compat
                PRICE_STORAGE[k] = pd.DataFrame(new_data[k][::-1]) 
            # logging.debug(f"PRICE_STORAGE Sync: {len(PRICE_STORAGE)} keys")
            
    except Exception as e:
        logging.error(f"PRICE_IO_SHIELD Error: {e}")
        
    return PRICE_STORAGE

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
    # V12.5: Store bb_pct as float for logic comparisons
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
    
    # V12.0: Liquidity Sweep Detection
    sweep = "NONE"
    if h[-1] > np.max(h[-6:-1]) and c[-1] < h[-1] - (0.3 * (h[-1]-l[-1])): sweep = "SWEEP_UP"
    if l[-1] < np.min(l[-6:-1]) and c[-1] > l[-1] + (0.3 * (h[-1]-l[-1])): sweep = "SWEEP_DOWN"

    # V12.0: Market Regime Detection (ADX Sim)
    plus_dm = np.where((h[1:] - h[:-1]) > (l[:-1] - l[1:]), np.maximum(h[1:] - h[:-1], 0), 0)
    minus_dm = np.where((l[:-1] - l[1:]) > (h[1:] - h[:-1]), np.maximum(l[:-1] - l[1:], 0), 0)
    tr_sum = np.sum(tr[-14:])
    plus_di = 100 * np.sum(plus_dm[-14:]) / tr_sum if tr_sum != 0 else 0
    minus_di = 100 * np.sum(minus_dm[-14:]) / tr_sum if tr_sum != 0 else 0
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di) if (plus_di + minus_di) != 0 else 0
    # regime
    regime = "TRENDING" if dx > 25 else ("RANGING" if dx > 15 else "CHOPPY")

    return {'ema7': ema7, 'ema21': ema21, 'rsi': rsi, 'bb_upper': upper.iloc[-1], 'bb_lower': lower.iloc[-1], 'bb_pos': bb_pos, 'bb_pct': bb_pct, 'stok': stok, 'stod': stod, 'stoch_cross': stoch_cross, 'atr': atr, 'vol_spike': vol_spike, 'sweep': sweep, 'adx': dx, 'regime': regime, 'price': c[-1]}

def get_mtf_alignment(price_data, pair, c_p, session):
    """V12.1: H4 -> H1 -> M15 Trend Confluence. V12.8.4: Relaxed for Tokyo."""
    trends = {}
    intervals = ['H4', 'H1', 'M15']
    # V12.8.4: Tokyo only needs H1/M15
    if session == 'TOKYO': intervals = ['H1', 'M15']
    
    for tf in intervals:
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
    
    if session == 'TOKYO':
        if trends.get('H1') == 'BULLISH' and trends.get('M15') == 'BULLISH': return 'BULLISH', trends
        if trends.get('H1') == 'BEARISH' and trends.get('M15') == 'BEARISH': return 'BEARISH', trends
        return 'NEUTRAL', trends

    if trends.get('H4') == 'BULLISH' and trends.get('H1') != 'BEARISH': return 'BULLISH', trends
    if trends.get('H4') == 'BEARISH' and trends.get('H1') != 'BULLISH': return 'BEARISH', trends
    return 'NEUTRAL', trends

def get_intermarket():
    """V12.1: Intermarket cache."""
    now = datetime.now(timezone.utc)
    if (now - INTERMARKET_CACHE["last_update"]).total_seconds() < 300 and INTERMARKET_CACHE["data"]:
        return INTERMARKET_CACHE["data"]
    # Mock for local env
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
    """V12.0: Dynamic sizing via Half-Kelly."""
    if sl_dist == 0: return 0.01
    win_rate = 0.55 # Baseline
    risk_reward = 1.5
    kelly = win_rate - ((1 - win_rate) / risk_reward)
    half_kelly = kelly / 2
    # Cap at 2% or session limit
    risk_pct = max(0.1, min(half_kelly * 100, KELLY_HARD_CAP_PCT, s_cfg['max_loss_pct']))
    return risk_pct

def fallback_decision_v2(ind, tr_h4, session, pair, setup_hash, intermarket):
    """V12.1: Rich local fallback if API fails."""
    # Logic based on indicator synergy
    score = 0
    if ind['regime'] == "TRENDING":
        if tr_h4 == "BULLISH" and ind['bb_pct'] < 0.4: score += 4
        if tr_h4 == "BEARISH" and ind['bb_pct'] > 0.6: score += 4
    if ind['sweep'] != "NONE": score += 3
    if ind['vol_spike'] > 1.5: score += 2
    
    if score >= 7: return ("BUY" if tr_h4 == "BULLISH" else "SELL"), score/10, 85
    return "HOLD", 0, 0

# ══════ SYSTEM PROMPT V13.1 INSTITUTIONAL OPTIMIZER ══════
SYSTEM_PROMPT = """You are SAC V13.1 INSTITUTIONAL OPTIMIZER.
Prioritize DIVERGENCE and LIQUIDITY. Only suggest action if Confidence > 90%.
Avoid exhaustion zones where ADX > 65.
Detail trade reasoning based on Smart Money Concepts (SMC).
Response MUST BE JSON:
{
  "action": "BUY/SELL/WAIT",
  "confidence": float (0-100),
  "sl_pips": float,
  "reason": "Institutional Optimizer: Liquidity Grab + MTF H4/H1 Convergence"
}"""

# ══════ WATCHDOG (1s) ══════
async def watchdog_task():
    logging.info("V13.1 Watchdog Active")
    while True:
        try:
            if os.path.exists(iSTATS_PATH):
                with open(iSTATS_PATH, 'r') as f:
                    new_open = {}
                    for line in f:
                        p = line.strip().split('|')
                        # Account Stats: Balance|Equity|UsedMargin|FreeMargin|MarginLevel
                        if len(p) == 5:
                            try:
                                CURRENT_STATS['balance'] = float(p[0])
                                CURRENT_STATS['equity'] = float(p[1])
                                CURRENT_STATS['m_level'] = float(p[4])
                            except: pass
                        # Trade List: ORDER|Ticket|Pair|Type|Entry|Profit|SL|TP|...
                        elif len(p) >= 10:
                            if p[0] == 'ORDER':
                                pair, ticket, t_type, t_entry, profit, t_sl = p[2], int(p[1]), int(p[3]), float(p[4]), float(p[5]), float(p[6])
                            else:
                                pair, t_type, t_entry, t_sl, profit, ticket = p[0], int(p[1]), float(p[2]), float(p[3]), float(p[4]), int(p[8])
                            
                            if pair in CURRENT_STATS["open_trades"] and profit != CURRENT_STATS["open_trades"][pair]['profit']:
                                pass # potential profit update
                            new_open[pair] = {'type': t_type, 'entry': t_entry, 'sl': t_sl, 'profit': profit, 'ticket': ticket}
                    
                    # Detect closed trades
                    for p in list(CURRENT_STATS["open_trades"].keys()):
                        if p not in new_open:
                            closed_trade = CURRENT_STATS["open_trades"][p]
                            pnl = closed_trade['profit']
                            outcome = 'PROFIT' if pnl > 0 else 'LOSS'
                            logging.info("CLOSED: " + p + " PnL: " + str(pnl))
                            # V13.1 Telegram: Order Closed
                            close_msg = f"📉 *ORDER CLOSED*\nPair: {p}\nTicket: #{closed_trade['ticket']}\nResult: {outcome}\nPnL: ${round(pnl, 2)}"
                            asyncio.create_task(send_telegram(close_msg))
                            
                            # Update DB outcome
                            conn = sqlite3.connect(DB_PATH)
                            conn.execute('UPDATE trade_history SET result=?, outcome=?, pips_result=? WHERE pair=? AND ticket=?', (outcome, outcome, pnl, p, closed_trade['ticket']))
                            conn.commit(); conn.close()
                            # async task for journal
                            asyncio.create_task(run_trade_journal(p, closed_trade['type'], closed_trade['entry'], 0, pnl, get_session(), {}))

                    CURRENT_STATS["open_trades"] = new_open
            specs = get_symbol_specs()
            price_data = read_price_data()
            for pair, trade in CURRENT_STATS["open_trades"].items():
                key = pair + "_M5"
                if key not in price_data or price_data[key].empty: continue
                ind = calculate_indicators(price_data[key].copy())
                if not ind: continue
                
                # V12.9: Smart Exit (Trailing & Force Close)
                sp = specs.get(pair, {'point': 0.0001})
                p_point = sp['point']
                p_divisor = 10.0 if p_point in [0.00001, 0.001] else 1.0
                
                # Calculate pips from entry (type 0=Buy, 1=Sell)
                if trade['type'] == 0: pips = (ind['price'] - trade['entry']) / (p_point * p_divisor)
                else: pips = (trade['entry'] - ind['price']) / (p_point * p_divisor)
                
                close_it = False
                reason = ""
                
                # 1. Breakeven: If profit > 10 pips, close if price pulls back to entry + 2 pips
                if pips > 10 and (trade['type'] == 0 and ind['price'] < trade['entry'] + (2 * p_point * p_divisor)):
                    close_it, reason = True, "BREAKEVEN_LOCK"
                elif pips > 10 and (trade['type'] == 1 and ind['price'] > trade['entry'] - (2 * p_point * p_divisor)):
                    close_it, reason = True, "BREAKEVEN_LOCK"
                
                # 2. Trailing Profit: If profit > 20 pips, close if pulls back 50% of peak or back to 10 pips
                elif pips > 20 and pips < 10: # Virtual Trailing
                    close_it, reason = True, "TRAIL_EXIT"
                
                # 3. Technical Reversal: Force close if in profit and indicators flip
                if trade['profit'] > 1.0:
                    if trade['type'] == 0 and (ind['ema7'] < ind['ema21'] or (ind['stok'] > 80 and ind['stok'] < ind['stod'])): 
                        close_it, reason = True, "TECH_REVERSAL"
                    elif trade['type'] == 1 and (ind['ema7'] > ind['ema21'] or (ind['stok'] < 20 and ind['stok'] > ind['stod'])): 
                        close_it, reason = True, "TECH_REVERSAL"
                
                if close_it:
                    with open(iCLOSE_PATH, 'w') as cl: cl.write(pair + "\n")
                    set_cooldown(pair)
                    await send_telegram(f"V12.9 {reason}\n{pair} ${round(trade['profit'], 2)} ({round(pips,1)} pips)")
            await asyncio.sleep(1)
        except Exception as e:
            logging.error("Watchdog: " + str(e)); await asyncio.sleep(1)

# ══════ SCANNER (30s) ══════
async def scanner_task():
    init_db()
    logging.info("V13.1 Scanner Active (30s)")
    await send_telegram("🚀 *SAC V13.1 OMNI-PREDATOR ACTIVE*\nInstitutional Grade | 60pts L0 Threshold | Liquidity Search")
    while True:
        try:
            if os.path.exists(iRESULTS_PATH):
                conn = sqlite3.connect(DB_PATH)
                with open(iRESULTS_PATH, 'r') as f:
                    for l in f:
                        p = l.strip().split('|')
                        if len(p) >= 3: conn.execute('UPDATE trade_history SET ticket=? WHERE pair=? AND ticket IS NULL ORDER BY timestamp DESC LIMIT 1', (int(p[2]), p[0]))
                conn.commit(); conn.close(); os.remove(iRESULTS_PATH)

            session = get_session(); s_cfg = SESSION_CONFIG[session]
            specs = get_symbol_specs(); price_data = read_price_data()
            candle_patterns = read_candle_patterns(); intermarket = get_intermarket()
            seasonality = get_seasonality(); daily_pnl = get_daily_pnl_from_history()
            streak_count, streak_dir = get_streak()
            total_open = len(CURRENT_STATS["open_trades"])
            equity = CURRENT_STATS.get("equity", 0)

            # V12.8.4: Asian Range Box Capture (07:00-10:00 WITA) - Per Pair Fix
            now_wita = datetime.now(timezone.utc) + timedelta(hours=8)
            today_str = now_wita.strftime('%Y-%m-%d')
            
            for p in s_cfg['pairs']:
                if p not in ASIAN_RANGE or ASIAN_RANGE[p].get("date") != today_str:
                    ASIAN_RANGE[p] = {"high": 0, "low": 0, "captured": False, "date": today_str}
                
                if not ASIAN_RANGE[p]["captured"] or (7 <= now_wita.hour < 10):
                    k = p + "_M5"
                    if k in price_data:
                        df_m5 = price_data[k]
                        if 7 <= now_wita.hour < 10:
                            h, l = df_m5['high'].max(), df_m5['low'].min()
                            ASIAN_RANGE[p].update({"high": h, "low": l, "captured": True})
                        elif now_wita.hour >= 10:
                            # Recovery: Use historical bars (approx 6 hours)
                            h, l = df_m5['high'].iloc[:72].max(), df_m5['low'].iloc[:72].min()
                            ASIAN_RANGE[p].update({"high": h, "low": l, "captured": True})

            # Safety Guards
            if equity > 0 and (daily_pnl < -(equity * MAX_DAILY_LOSS_PCT / 100) or check_equity_curve()):
                logging.info("DAILY LOSS LOCK or EQUITY CURVE LOCK"); await asyncio.sleep(30); continue
            if streak_count >= 3 and streak_dir == "LOSS":
                logging.info("3-LOSS STREAK LOCK"); await asyncio.sleep(30); continue
            if session == 'OFF':
                logging.info("OFF-HOURS"); await asyncio.sleep(30); continue
            
            # V12.8.4: Overlap Defensive Caps
            current_max_orders = MAX_SIMULTANEOUS_ORDERS
            current_threshold = s_cfg['threshold']
            if session == 'OVERLAP':
                current_max_orders = 3
                current_threshold = 91

            news_headlines = get_news_headlines()

            for pair in s_cfg['pairs']:
                logging.info(f"Scan {pair} [{session}]")
                if total_open >= current_max_orders or pair in CURRENT_STATS["open_trades"]: continue
                
                # V13.1: Professional Guardrails
                if has_open_position(pair):
                    logging.info(f"SKIP {pair}: Position already open in DB")
                    continue
                if check_cooldown(pair) or check_penalty(pair): continue
                blocked_cluster = check_cluster_exposure(pair, CURRENT_STATS["open_trades"])
                if blocked_cluster: logging.info("SKIP " + pair + ": Cluster " + blocked_cluster); continue

                # V13.1: News Calendar Blackout (30m)
                is_news, news_reason = news_filter.is_news_blackout(pair)
                if is_news:
                    logging.info(f"SKIP {pair}: NEWS BLACKOUT - {news_reason}")
                    continue

                # V12.8.4: London Open Spike Filter (15:00-15:15)
                if session == 'LONDON' and now_wita.hour == 15 and now_wita.minute < 15:
                    logging.info(f"SKIP {pair}: London Open Spike Protect")
                    continue
                
                # V12.8.4: NY Close Filter (after 03:30)
                if session == 'NEWYORK' and now_wita.hour == 3 and now_wita.minute >= 30:
                    logging.info(f"SKIP {pair}: NY Close Filter")
                    continue

                m5_key, h4_key = pair + "_M5", pair + "_H4"
                if m5_key not in price_data or h4_key not in price_data:
                    logging.info(f"SKIP {pair}: Data missing (M5/H4)")
                    continue
                ind = calculate_indicators(price_data[m5_key])
                if not ind:
                    logging.info(f"SKIP {pair}: Indicators calc failed")
                    continue
                
                adx_limit = ADX_THRESHOLDS.get(session, 25)
                if ind['adx'] < adx_limit: 
                    logging.info(f"SKIP {pair}: ADX {round(ind['adx'],1)} < {adx_limit} ({session})")
                    continue

                # V12.1: Multi-Timeframe Confirmation
                mtf_trend, mtf_details = get_mtf_alignment(price_data, pair, ind['price'], session)
                
                # V12.8.4: Asian Range Box Filter (after 10:00) - Per Pair Fix
                box = ASIAN_RANGE.get(pair)
                if session == 'TOKYO' and now_wita.hour >= 10 and box and box["captured"]:
                    # V12.8.4 Fix: Allow Breakouts (Edge or Outside)
                    is_edge_or_breakout = (ind['price'] >= box["high"] - (ind['atr'] * 0.5)) or \
                                          (ind['price'] <= box["low"] + (ind['atr'] * 0.5))
                    
                    if not is_edge_or_breakout:
                        logging.info(f"SKIP {pair}: Price at {round(ind['price'],5)} (Box: {round(box['low'],5)}-{round(box['high'],5)}) - Mid Range")
                        continue

                sp = specs.get(pair, {'spread': 20.0, 'point': 0.0001})
                divisor = 10.0 if sp['point'] in [0.00001, 0.001] else 1.0
                spread_pips = sp.get('spread', 20.0) / divisor
                spread_level = "LOW" if spread_pips < 1.5 else ("MED" if spread_pips < 3.0 else "HIGH")
                cp_data = candle_patterns.get(pair, {'m5': 'NONE', 'm15': 'NONE'})
                dxy_bias = "WEAK" if intermarket.get('dxy_trend') == "DOWN" else "STRONG"

                # V12.2: Pattern Memory
                tr_h4 = mtf_details.get('H4', 'NEUTRAL')
                setup_hash = make_setup_hash(pair, tr_h4, ind['bb_pos'], ind['stoch_cross'], ind['regime'], session, dxy_bias, spread_level)
                pattern_boost = get_pattern_boost(setup_hash)

                # V12.8.4: Token Optimizer L0 (K-of-N Logic)
                # V13.1: Heavyweight Liquidity Requirements (3 of 5, Liquidity mandatory)
                has_liquidity = (ind['sweep'] != "NONE" or ind['vol_spike'] > 1.5)
                tech_factors = [
                    (ind['bb_pct'] >= 0.8 or ind['bb_pct'] <= 0.2), 
                    (ind['stoch_cross'] != "NONE"), 
                    has_liquidity, # Double weight
                    has_liquidity, 
                    (pattern_boost != 0)
                ]
                is_potential_setup = sum(tech_factors) >= 3 and has_liquidity

                if not is_potential_setup:
                    logging.info(f"HOLD {pair}: Tech Score {sum(tech_factors)}/5 {'(NO LIQUIDITY)' if not has_liquidity else ''} (API Saved)")
                    continue

                payload = {
                    "pair": pair, "price": round(float(ind['price']), 5),
                    "L1_TECHNICAL": {"h4_trend": tr_h4, "rsi": round(float(ind['rsi']), 1), "stoch_k": round(float(ind['stok']), 1), "stoch_d": round(float(ind['stod']), 1), "stoch_cross": ind['stoch_cross'], "ema7_vs_21": "UP" if ind['ema7'] > ind['ema21'] else "DOWN", "bb_upper": round(float(ind['bb_upper']), 5), "bb_lower": round(float(ind['bb_lower']), 5), "bb_position": ind['bb_pos'], "atr": round(float(ind['atr']), 5)},
                    "mtf_alignment": mtf_details,
                    "mtf_summary": mtf_trend,
                    "L2_FUNDAMENTAL": {"session": session, "style": s_cfg['style'], "spread_pips": round(float(spread_pips), 1), "daily_high": round(float(sp.get('daily_high', 0)), 5), "daily_low": round(float(sp.get('daily_low', 0)), 5), "news_block": None},
                    "L3_SENTIMENT": {"candle_m5": cp_data['m5'], "candle_m15": cp_data['m15']},
                    "L4_RISK": {"margin_level": round(float(CURRENT_STATS['m_level']), 1), "daily_pnl_pct": round(float(daily_pnl / equity * 100), 2) if equity > 0 else 0, "win_streak": streak_count if streak_dir == "PROFIT" else 0, "loss_streak": streak_count if streak_dir == "LOSS" else 0, "open_orders": total_open},
                    "L5_BANDARMOLOGY": {"volume_spike": ind['vol_spike']},
                    "L6_SEASONALITY": seasonality,
                    "news_headlines": news_headlines[:3],
                    "L7_MACRO": {"usd_bias": dxy_bias},
                    "L8_INTERMARKET": intermarket,
                    "L9_LIQUIDITY": {"sweep": ind['sweep']},
                    "L10_REGIME": {"adx": round(float(ind['adx']), 1), "regime": ind['regime']},
                    "pattern_memory_boost": pattern_boost
                }

                try:
                    resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': json.dumps(payload)}], response_format={'type': 'json_object'}, timeout=15)
                    res = json.loads(resp.choices[0].message.content)
                    dec = str(res.get('action', 'HOLD')).upper()
                    sc = int(abs(float(str(res.get('score', 0)).replace('%',''))) * 10)
                    cf = float(str(res.get('confidence', 0)).replace('%',''))
                    ai_tp = float(res.get('tp_pips', 0))
                    ai_sl = float(res.get('sl_pips', 0))
                except Exception as api_err:
                    logging.warning("Reasoning timeout, switching to fast model: " + str(api_err))
                    try:
                        resp = client.chat.completions.create(model=FALLBACK_MODEL_ID, messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': json.dumps(payload)}], response_format={'type': 'json_object'}, timeout=15)
                        res = json.loads(resp.choices[0].message.content)
                        dec = str(res.get('action', 'HOLD')).upper()
                        sc = int(abs(float(str(res.get('score', 0)).replace('%',''))) * 10)
                        cf = float(str(res.get('confidence', 0)).replace('%',''))
                        ai_tp = float(res.get('tp_pips', 0))
                        ai_sl = float(res.get('sl_pips', 0))
                        res['reason'] = '[FAST-MODEL] ' + res.get('reason', '')
                    except Exception as api_err2:
                        logging.error("Both models failed → Fallback V2: " + str(api_err2))
                        dec, sc, cf = fallback_decision_v2(ind, tr_h4, session, pair, setup_hash, intermarket)
                        res = {'reason': 'Fallback V2: ' + dec + ' [regime=' + ind['regime'] + ', sweep=' + ind['sweep'] + ']'}
                        ai_tp, ai_sl = 0, 0

                # ══════ V13.1: POINT & PIP CALCULATION MATRIX ══════
                p_point = 0.0001
                p_divisor = 1.0
                if 'JPY' in pair or ind['price'] > 500: # JPY Pairs or Gold/Indices
                    p_point = 0.01
                    p_divisor = 1.0 # Cent account already 2 digits
                if 'XAU' in pair and ind['price'] > 1000: # Gold Standard
                    p_point = 0.1
                    p_divisor = 1.0

                # ATR-Enforced SL (Max(1.5*ATR, 15 Pips)) - V13.1
                atr_sl_pips = (ind['atr'] * 1.5) / p_point
                final_sl_pips = max(atr_sl_pips, 15.0)
                sl_dist = final_sl_pips * p_point
                
                sl = ind['price'] - sl_dist if dec == "BUY" else ind['price'] + sl_dist
                
                # Logic Point
                ai_tp = res.get('tp_pips', 30.0) 
                ai_sl = res.get('sl_pips', final_sl_pips)
                
                # V13.1: Risk Manager (Kelly Modified)
                sl = round(sl, 5) if p_point == 0.0001 else round(sl, 2)
                tp_dist = ai_tp * p_point
                tp = ind['price'] + tp_dist if dec == "BUY" else ind['price'] - tp_dist
                tp = round(tp, 5) if p_point == 0.0001 else round(tp, 2)

                log_grok_decision(pair, session, payload, res)
                cf += pattern_boost
                logging.info(pair + " [" + session + "|" + ind['regime'] + "]: " + dec + " Sc=" + str(sc) + " Cf=" + str(cf) + " Sweep=" + ind['sweep'] + " MTF=" + str(mtf_details))

                # V13.1: Institutional Confidence Threshold (from SESSION_CONFIG)
                if dec != 'HOLD' and cf >= current_threshold:
                    # sl and tp are already calculated in the V13.1 block above
                    
                    # Calculate sl_pips for risk manager
                    sl_pips = abs(sl - ind['price']) / (p_point * p_divisor)
                    risk = risk_manager.calculate_lot(equity, KELLY_HARD_CAP_PCT, sl_pips, pair)
                    
                    with open(SIGNAL_PATH, 'w') as f: f.write(pair + "|" + dec + "_MARKET|" + str(ind['price']) + "|" + str(sl) + "|" + str(tp) + "|" + str(risk))
                    conn = sqlite3.connect(DB_PATH)
                    conn.execute('INSERT INTO trade_history (pair,action,entry,sl,tp,risk,timestamp,reason,score,style,session,regime,mtf_alignment,pattern_hash,confidence,outcome) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (pair, dec, ind['price'], sl, tp, risk, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res.get('reason',''), sc, FULL_NAME + '-' + session, session, ind['regime'], str(mtf_details), setup_hash, round(cf, 1), 'OPEN'))
                    conn.commit(); conn.close()
                    update_pattern_memory(setup_hash, pair, session, ind['regime'], 'PENDING')
                    set_cooldown(pair); total_open += 1
                    
                    # V13.1 Telegram: Execution Detail
                    reason_text = res.get('reason', 'Institutional Convergence').replace('_', ' ')
                    msg = (f"🚀 *ORDER EXECUTED*\n"
                           f"Pair: {pair} ({dec})\n"
                           f"Entry: {ind['price']}\n"
                           f"SL: {round(sl, 5)} ({round(sl_pips, 1)} pips)\n"
                           f"TP: {round(tp, 5)}\n"
                           f"Lot: {risk}\n"
                           f"Score: {round(sc, 1)}/100\n"
                           f"Reason: {reason_text}")
                    await send_telegram(msg); await asyncio.sleep(5)

            await asyncio.sleep(30)
        except Exception as e:
            logging.error("Scanner: " + str(e)); await asyncio.sleep(30)

def get_news_headlines():
    try:
        import xml.etree.ElementTree as ET
        # Use /feed/ to avoid 301
        resp = httpx.get('https://www.forexlive.com/feed/', timeout=5, follow_redirects=True)
        # V12.8: Robust XML parsing
        content = resp.text.encode('utf-8')
        root = ET.fromstring(content)
        return [item.find('title').text for item in root.findall('.//item')[:5] if item.find('title') is not None]
    except Exception as e:
        logging.warning(f"News Headline Error: {e}")
        return []

# V12.1: Pattern Memory (richer hash)
def make_setup_hash(pair, tr_h4, bb_pos, stoch_cross, regime, session, dxy_bias, spread_level):
    raw = pair + tr_h4 + bb_pos + stoch_cross + regime + session + dxy_bias + spread_level
    return hashlib.md5(raw.encode()).hexdigest()[:16]

def get_pattern_boost(setup_hash):
    """V12.2: Pattern Memory with exponential decay."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT wins, losses, last_used FROM pattern_memory WHERE setup_hash=?', (setup_hash,))
    row = cursor.fetchone(); conn.close()
    if row:
        w, l, last_used = row
        days_since = 0
        if last_used:
            try:
                last_dt = datetime.strptime(str(last_used), '%Y-%m-%d %H:%M:%S')
                days_since = (datetime.now() - last_dt).days
            except: pass
        decay_factor = math.exp(-days_since / PATTERN_DECAY_DAYS)
        if w >= 3 and w > l: return int(round(5 * decay_factor))
        if l >= 3 and l > w: return int(round(-10 * decay_factor))
    return 0

def update_pattern_memory(setup_hash, pair, session, pattern, result):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('INSERT OR IGNORE INTO pattern_memory (setup_hash,pair,session,pattern,wins,losses,last_used) VALUES (?,?,?,?,0,0,?)', (setup_hash, pair, session, pattern, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    col = 'wins' if result == 'PROFIT' else 'losses'
    conn.execute('UPDATE pattern_memory SET ' + col + '=' + col + '+1, last_used=? WHERE setup_hash=?', (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), setup_hash))
    conn.commit(); conn.close()

def log_grok_decision(pair, session, payload, response):
    try:
        with open(GROK_LOG, 'a') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + " | " + pair + " | " + session + " | " + json.dumps(response) + "\n")
    except: pass

async def run_trade_journal(pair, action, entry, exit_price, pnl, session, indicators):
    try:
        # Trade Journal AI V12.0
        payload = {"pair": pair, "action": "BUY" if action==0 else "SELL", "pnl": pnl, "session": session}
        # In a real system, we'd call Grok to reflect on the trade.
        with open(JOURNAL_LOG, 'a') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + " | " + pair + " | PnL: " + str(pnl) + "\n")
    except: pass

async def main():
    await asyncio.gather(watchdog_task(), scanner_task())

if __name__ == '__main__':
    asyncio.run(main())
