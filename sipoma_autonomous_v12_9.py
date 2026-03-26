import os, json, asyncio, logging, sqlite3, httpx, hashlib, math, re
from datetime import datetime, timedelta, timezone
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd
import numpy as np

load_dotenv()

# ══════════════════════════════════════════════════════
# SAC V12.2 INSTITUTIONAL INTELLIGENCE
# ══════════════════════════════════════════════════════
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

# ══════ V12.2: ForexFactory Calendar Scraper ══════
def scrape_forexfactory_calendar():
    """Scrape today's high-impact events from ForexFactory."""
    now = datetime.now(timezone.utc)
    if (now - CALENDAR_CACHE["last_update"]).total_seconds() < 1800 and CALENDAR_CACHE["events"]:
        return CALENDAR_CACHE["events"]
    events = []
    try:
        url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
        resp = httpx.get(url, timeout=8, follow_redirects=True)
        data = resp.json()
        today_str = now.strftime('%Y-%m-%d')
        for ev in data:
            if ev.get('impact', '') not in ('High', 'Medium'): continue
            ev_date = ev.get('date', '')
            if today_str not in ev_date: continue
            currency = ev.get('country', '').upper()
            title = ev.get('title', '')
            try:
                ev_dt = datetime.fromisoformat(ev_date.replace('Z', '+00:00'))
                if ev_dt.tzinfo is None:
                    ev_dt = ev_dt.replace(tzinfo=timezone.utc)
                events.append({'time_utc': ev_dt, 'currency': currency, 'event': title, 'impact': ev.get('impact', '')})
            except: continue
        CALENDAR_CACHE["events"] = events
        CALENDAR_CACHE["last_update"] = now
        logging.info("Calendar: " + str(len(events)) + " events today")
    except Exception as e:
        logging.error("Calendar scrape error: " + str(e))
    return events

def check_news_block(pair):
    """Block trading 15 min before and after high-impact event."""
    now = datetime.now(timezone.utc)
    pair_currencies = [c for c in ['USD','EUR','GBP','JPY','AUD','NZD','CAD','CHF'] if c in pair]
    events = scrape_forexfactory_calendar()
    for ev in events:
        if ev['currency'] not in pair_currencies: continue
        ev_time = ev['time_utc']
        if ev_time.tzinfo is None:
            ev_time = ev_time.replace(tzinfo=timezone.utc)
        diff = abs((now - ev_time).total_seconds())
        if diff < 900:  # 15 min before and after
            return ev['event'] + " (" + ev['impact'] + ")"
    # NFP auto-detect (first Friday of month, 13:30 UTC)
    if now.weekday() == 4 and now.day <= 7 and 'USD' in pair_currencies:
        nfp_time = now.replace(hour=13, minute=30, second=0)
        if abs((now - nfp_time).total_seconds()) < 900:
            return "NFP (Auto-Detected)"
    return None

# ══════ MT4 DATA READERS ══════
def get_symbol_specs():
    specs = {}
    if os.path.exists(iSPECS_PATH):
        try:
            with open(iSPECS_PATH, 'r') as f:
                for line in f:
                    p = line.strip().split('|')
                    if len(p) >= 11:
                        specs[p[0]] = {'digits': int(float(p[1])), 'point': float(p[2]), 'spread': float(p[7]), 'daily_high': float(p[8]), 'daily_low': float(p[9]), 'stoplevel': float(p[10])}
        except: pass
    return specs

def read_price_data():
    data = {}
    if not os.path.exists(iPRICE_PATH): return data
    try:
        with open(iPRICE_PATH, 'r') as f:
            for line in f:
                p = line.strip().split('|')
                if len(p) >= 8:
                    key = p[0] + "_" + p[1]
                    if key not in data: data[key] = []
                    data[key].append({'bar': int(p[2]), 'open': float(p[3]), 'high': float(p[4]), 'low': float(p[5]), 'close': float(p[6]), 'volume': int(float(p[7]))})
    except: pass
    for key in data:
        data[key] = pd.DataFrame(data[key]).sort_values('bar', ascending=False).reset_index(drop=True)
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

# ══════ SAFETY GUARDS ══════
def check_penalty(pair):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT timestamp FROM trade_history WHERE pair=? AND result="LOSS" ORDER BY timestamp DESC LIMIT 1', (pair,))
    row = cursor.fetchone(); conn.close()
    if row:
        try:
            if datetime.now() - datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S') < timedelta(minutes=60): return True
        except: pass
    return False

def check_cooldown(pair):
    if pair in PAIR_COOLDOWN:
        if datetime.now() < PAIR_COOLDOWN[pair]: return True
        else: del PAIR_COOLDOWN[pair]
    return False

def set_cooldown(pair):
    PAIR_COOLDOWN[pair] = datetime.now() + timedelta(minutes=COOLDOWN_MINUTES)

def get_streak():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT result FROM trade_history WHERE result IS NOT NULL ORDER BY timestamp DESC LIMIT 10')
    rows = cursor.fetchall(); conn.close()
    if not rows: return 0, "NONE"
    streak, direction = 0, rows[0][0]
    for r in rows:
        if r[0] == direction: streak += 1
        else: break
    return streak, direction

def get_daily_pnl_from_history():
    total = 0.0
    hist = os.path.join(MT4_FILES, 'account_history.txt')
    if os.path.exists(hist):
        try:
            today_str = datetime.now().strftime('%Y.%m.%d')
            with open(hist, 'r') as f:
                for line in f:
                    p = line.strip().split('|')
                    if len(p) >= 7 and today_str in str(p[6]): total += float(p[5])
        except: pass
    return total

def check_cluster_exposure(pair, open_trades):
    for cname, cpairs in CORRELATION_CLUSTERS.items():
        if pair in cpairs:
            count = sum(1 for p in open_trades if p in cpairs)
            if count >= MAX_PER_CLUSTER: return cname
    return None

def check_equity_curve():
    global PEAK_EQUITY_WEEK, PEAK_EQUITY_TS
    eq = CURRENT_STATS.get("equity", 0)
    if eq <= 0: return False
    now = datetime.now()
    if now.weekday() == 0 and (now - PEAK_EQUITY_TS).days >= 1:
        PEAK_EQUITY_WEEK = eq; PEAK_EQUITY_TS = now
    if eq > PEAK_EQUITY_WEEK:
        PEAK_EQUITY_WEEK = eq; PEAK_EQUITY_TS = now
    if PEAK_EQUITY_WEEK > 0:
        drop = ((PEAK_EQUITY_WEEK - eq) / PEAK_EQUITY_WEEK) * 100
        if drop > EQUITY_CURVE_DROP_PCT: return True
    return False

# V12.1: Half-Kelly + Hard Cap 2%
def kelly_lot_size(ind, equity, sl_dist, session_cfg):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT result FROM trade_history WHERE result IS NOT NULL ORDER BY timestamp DESC LIMIT 50')
    rows = cursor.fetchall(); conn.close()
    wins = sum(1 for r in rows if r[0] == 'PROFIT')
    total = len(rows) if rows else 1
    win_rate = wins / total if total > 0 else 0.5
    rr_ratio = session_cfg['tp_mult'] / session_cfg['sl_mult'] if session_cfg['sl_mult'] > 0 else 2.0
    kelly_f = win_rate - ((1 - win_rate) / rr_ratio)
    kelly_f = max(0.01, kelly_f)
    half_kelly = kelly_f * 0.5  # V12.1: Half-Kelly for safety
    atr = ind.get('atr', 0.001)
    atr_baseline = 0.0008 if atr < 0.01 else 0.08
    atr_factor = min(2.0, max(0.5, atr_baseline / (atr + 1e-9)))
    risk_pct = half_kelly * atr_factor * 100
    risk_pct = max(0.3, min(risk_pct, KELLY_HARD_CAP_PCT))  # V12.1: Hard cap
    return round(risk_pct, 2)

# ══════ INDICATORS ══════
def calculate_indicators(df):
    if df is None or len(df) < 25: return {}
    c = df['close']
    ema7 = c.ewm(span=7).mean().iloc[-1]
    ema21 = c.ewm(span=21).mean().iloc[-1]
    delta = c.diff()
    up = delta.clip(lower=0).rolling(14).mean()
    down = delta.clip(upper=0).abs().rolling(14).mean()
    rsi = (100 - (100 / (1 + up / (down + 1e-9)))).iloc[-1]
    lk = df['low'].rolling(5).min(); hk = df['high'].rolling(5).max()
    stok = (100 * (c - lk) / (hk - lk + 1e-9)).iloc[-1]
    stod = (100 * (c - lk) / (hk - lk + 1e-9)).rolling(3).mean().iloc[-1]
    sma20 = c.rolling(20).mean().iloc[-1]; std20 = c.rolling(20).std().iloc[-1]
    bb_upper = sma20 + 2 * std20; bb_lower = sma20 - 2 * std20
    price = c.iloc[-1]; bb_range = bb_upper - bb_lower
    if bb_range > 0:
        bb_pct = (price - bb_lower) / bb_range
        bb_pos = "NEAR_LOWER" if bb_pct < 0.2 else ("NEAR_UPPER" if bb_pct > 0.8 else "MIDDLE")
    else: 
        bb_pct = 0.5
        bb_pos = "MIDDLE"
    tr = pd.concat([df['high']-df['low'], (df['high']-c.shift()).abs(), (df['low']-c.shift()).abs()], axis=1).max(axis=1)
    atr = tr.rolling(14).mean().iloc[-1]
    vol_avg = df['volume'].rolling(20).mean().iloc[-1] if 'volume' in df else 0
    vol_current = df['volume'].iloc[-1] if 'volume' in df else 0
    vol_spike = bool(vol_current > vol_avg * 1.5) if vol_avg > 0 else False
    stok_prev = (100 * (c - lk) / (hk - lk + 1e-9)).iloc[-2] if len(df) > 2 else stok
    stod_prev = (100 * (c - lk) / (hk - lk + 1e-9)).rolling(3).mean().iloc[-2] if len(df) > 3 else stod
    if stok > stod and stok_prev <= stod_prev: stoch_cross = "K_CROSS_ABOVE_D"
    elif stok < stod and stok_prev >= stod_prev: stoch_cross = "K_CROSS_BELOW_D"
    else: stoch_cross = "NONE"
    # ADX + Regime
    plus_dm = df['high'].diff().clip(lower=0); minus_dm = (-df['low'].diff()).clip(lower=0)
    atr14 = tr.rolling(14).mean()
    plus_di = 100 * (plus_dm.rolling(14).mean() / (atr14 + 1e-9))
    minus_di = 100 * (minus_dm.rolling(14).mean() / (atr14 + 1e-9))
    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di + 1e-9))
    adx = dx.rolling(14).mean().iloc[-1] if len(dx) > 14 else 20
    pdi = plus_di.iloc[-1]; mdi = minus_di.iloc[-1]
    if adx > 25 and pdi > mdi: regime = "TRENDING_UP"
    elif adx > 25 and mdi > pdi: regime = "TRENDING_DOWN"
    elif adx < 20: regime = "RANGING"
    else: regime = "CHOPPY"
    # Liquidity Sweep
    sweep = "NONE"
    if len(df) >= 3:
        ph = df['high'].iloc[-2]; pl = df['low'].iloc[-2]
        if df['high'].iloc[-1] > ph and c.iloc[-1] < ph: sweep = "SWEEP_UP"
        if df['low'].iloc[-1] < pl and c.iloc[-1] > pl: sweep = "SWEEP_DOWN"
    return {
        'ema7': ema7, 'ema21': ema21, 'rsi': rsi, 'stok': stok, 'stod': stod,
        'stoch_cross': stoch_cross, 'bb_upper': bb_upper, 'bb_lower': bb_lower,
        'bb_pos': bb_pos, 'bb_pct': bb_pct, 'atr': atr, 'vol_spike': vol_spike, 'price': price,
        'adx': adx, 'regime': regime, 'sweep': sweep
    }

# V12.1: Multi-Timeframe Confirmation (H4→H1→M15→M5)
def get_mtf_alignment(price_data, pair, price):
    """Returns alignment status. ALL must agree for entry."""
    trends = {}
    for tf, span_f, span_s, min_bars in [('H4', 5, 10, 15), ('H1', 9, 21, 20), ('M15', 7, 21, 25)]:
        key = pair + "_" + tf
        if key not in price_data or len(price_data[key]) < min_bars:
            trends[tf] = "NEUTRAL"; continue
        c = price_data[key]['close']
        ef = c.ewm(span=span_f).mean().iloc[-1]
        es = c.ewm(span=span_s).mean().iloc[-1]
        # V12.8 Optimization: Price just needs to be above slow EMA (Pullback allowed)
        if price > es and ef > es: trends[tf] = "BULLISH"
        elif price < es and ef < es: trends[tf] = "BEARISH"
        else: trends[tf] = "NEUTRAL"
    # All must align
    if all(t == "BULLISH" for t in trends.values()): return "BULLISH", trends
    if all(t == "BEARISH" for t in trends.values()): return "BEARISH", trends
    return "NEUTRAL", trends

# ══════ INTERMARKET (cached 10 min) ══════
def get_intermarket():
    now = datetime.now(timezone.utc)
    if (now - INTERMARKET_CACHE["last_update"]).total_seconds() < 600 and INTERMARKET_CACHE["data"]:
        return INTERMARKET_CACHE["data"]
    try:
        import yfinance as yf
        result = {}
        for sym, name in [('DX-Y.NYB', 'dxy'), ('GC=F', 'gold'), ('^TNX', 'us10y')]:
            d = yf.download(sym, period='5d', interval='1h', progress=False)
            if not d.empty:
                if isinstance(d.columns, pd.MultiIndex): d.columns = d.columns.get_level_values(0)
                e20 = d['Close'].ewm(span=20).mean().iloc[-1]
                result[name + "_trend"] = "UP" if d['Close'].iloc[-1] > e20 else "DOWN"
            else: result[name + "_trend"] = "NEUTRAL"
        INTERMARKET_CACHE["data"] = result; INTERMARKET_CACHE["last_update"] = now
        return result
    except:
        return {"dxy_trend": "NEUTRAL", "gold_trend": "NEUTRAL", "us10y_trend": "NEUTRAL"}

def get_seasonality():
    now = datetime.now(timezone.utc)
    dow = now.strftime('%a').upper()[:3]; dom = now.day
    return {'day_of_week': dow, 'month': now.strftime('%b').upper()[:3], 'end_of_month': dom >= 28, 'nfp_day': dow == 'FRI' and dom <= 7, 'friday_late': dow == 'FRI' and now.hour >= 20}

def get_news_headlines():
    try:
        import xml.etree.ElementTree as ET
        # V12.9: Use /feed/ to avoid 301
        resp = httpx.get('https://www.forexlive.com/feed/', timeout=5, follow_redirects=True)
        root = ET.fromstring(resp.text)
        return [item.find('title').text for item in root.findall('.//item')[:5] if item.find('title') is not None]
    except: return []

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
        prompt = "Analyze this closed trade. WHY was it profitable or not? What pattern worked? Be concise (2-3 sentences)."
        data = {"pair": pair, "action": action, "entry": entry, "exit": exit_price, "pnl": round(pnl, 2), "session": session}
        try:
            resp = client.chat.completions.create(model=MODEL_ID, messages=[{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps(data)}], timeout=10)
        except:
            resp = client.chat.completions.create(model=FALLBACK_MODEL_ID, messages=[{'role': 'system', 'content': prompt}, {'role': 'user', 'content': json.dumps(data)}], timeout=10)
        with open(JOURNAL_LOG, 'a') as f:
            f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S') + " | " + pair + " | PnL=" + str(round(pnl, 2)) + " | " + resp.choices[0].message.content + "\n")
    except: pass

# V12.1: FALLBACK ENGINE V2 (Regime + Pattern Memory + News Block)
def fallback_decision_v2(ind, tr_h4, session, pair, setup_hash, intermarket):
    if not ind or session == "OFF": return "HOLD", 0, 0
    # News Block
    news_block = check_news_block(pair)
    if news_block:
        logging.info("FALLBACK: Blocked by news - " + news_block)
        return "HOLD", 0, 0
    # Regime filter
    if ind['regime'] == "CHOPPY": return "HOLD", 0, 0
    # Pattern Memory boost
    boost = get_pattern_boost(setup_hash)
    base_conf = 80
    # Liquidity Sweep signal
    if ind['sweep'] == "SWEEP_DOWN" and tr_h4 == "BULLISH":
        return "BUY", 9, min(95, base_conf + 10 + boost)
    if ind['sweep'] == "SWEEP_UP" and tr_h4 == "BEARISH":
        return "SELL", 9, min(95, base_conf + 10 + boost)
    # Standard rules with regime awareness
    if ind['regime'] in ("TRENDING_UP", "RANGING") and tr_h4 == "BULLISH" and ind['rsi'] < 65 and ind['ema7'] > ind['ema21'] and ind['bb_pos'] == "NEAR_LOWER":
        return "BUY", 8, min(95, base_conf + 5 + boost)
    if ind['regime'] in ("TRENDING_DOWN", "RANGING") and tr_h4 == "BEARISH" and ind['rsi'] > 35 and ind['ema7'] < ind['ema21'] and ind['bb_pos'] == "NEAR_UPPER":
        return "SELL", 8, min(95, base_conf + 5 + boost)
    return "HOLD", 0, 0

# ══════ SYSTEM PROMPT V12.1 ══════
SYSTEM_PROMPT = """You are SAC V12.9 OMNI PREDATOR - THE SUPREME AI COMMANDER.
You are an institutional FX expert with absolute authority over execution. 

CORE MISSION: Identify high-probability institutional footprints (Smart Money).
You are NOT bound by rigid trend rules if you see a high-probability reversal or liquidity pool.

EXECUTION AUTHORITY:
- You have the authority to OVERRIDE local H4 trends if confluence (Volume + Sweep + Intermarket) is present.
- Analyze MTF (H4, H1, M15). If aligned, increase score. If neutral, look for 'mean reversion' opportunities.
- Be aggressive in TOKYO (Range Reflex) and disciplined in LONDON/NY (Breakouts).

SYNERGY LAYERS:
1. ORDER FLOW: Liquidity sweeps (SWEEP_UP/DOWN) are 70% of the signal.
2. INTERMARKET: USD pairs MUST align with DXY bias for TREND setups.
3. REGIME: Identify if we are in institutional accumulation (CHOPPY -> AGGRESSIVE).
4. SESSIONS: Adapt your bias based on the current session style (RANGE/BREAKOUT).

RESPONSE FORMAT: JSON only.
{
  "action": "BUY" | "SELL" | "HOLD",
  "score": 0.0-1.0 (Synergy level),
  "confidence": 0-100 (Conviction),
  "reason": "Clear institutional reasoning"
}"""

# ══════ WATCHDOG (1s) ══════
async def watchdog_task():
    logging.info("V12.2 Watchdog Active (1s)")
    while True:
        try:
            if os.path.exists(iSTATS_PATH):
                with open(iSTATS_PATH, 'r') as f:
                    new_open = {}
                    for line in f:
                        p = line.strip().split('|')
                        if p[0] == "ORDER" and len(p) >= 7:
                            new_open[p[2]] = {'ticket': int(p[1]), 'type': int(p[3]), 'entry': float(p[4]), 'profit': float(p[5]), 'price': float(p[6])}
                        elif len(p) >= 5 and p[0] != "ORDER":
                            CURRENT_STATS["balance"] = float(p[0]); CURRENT_STATS["equity"] = float(p[1]); CURRENT_STATS["m_level"] = float(p[4])
                    prev = set(CURRENT_STATS.get("open_trades", {}).keys())
                    curr = set(new_open.keys())
                    for pair in (prev - curr):
                        old = CURRENT_STATS["open_trades"].get(pair, {})
                        if old:
                            profit = old.get('profit', 0)
                            outcome = 'WIN' if profit > 0 else 'LOSS'
                            entry_p = old.get('entry', 0)
                            close_p = old.get('price', 0)
                            pips = abs(close_p - entry_p)
                            try:
                                conn = sqlite3.connect(DB_PATH)
                                conn.execute('UPDATE trade_history SET outcome=?, pips_result=?, result=? WHERE pair=? AND outcome="PENDING" ORDER BY id DESC LIMIT 1', (outcome, round(pips, 5), str(round(profit, 2)), pair))
                                conn.commit(); conn.close()
                                logging.info('Trade Closed: ' + pair + ' ' + outcome + ' $' + str(round(profit, 2)) + ' (' + str(round(pips, 5)) + ')')
                            except Exception as e:
                                logging.error('Update outcome error: ' + str(e))
                            asyncio.create_task(run_trade_journal(pair, "BUY" if old.get('type',0)==0 else "SELL", entry_p, close_p, profit, get_session(), {}))
                    CURRENT_STATS["open_trades"] = new_open
            price_data = read_price_data()
            for pair, trade in CURRENT_STATS["open_trades"].items():
                key = pair + "_M5"
                if key not in price_data or price_data[key].empty: continue
                ind = calculate_indicators(price_data[key].copy())
                if trade['profit'] > 1.0 and ind:
                    close_it = False
                    if trade['type'] == 0 and (ind['ema7'] < ind['ema21'] or (ind['stok'] > 80 and ind['stok'] < ind['stod'])): close_it = True
                    elif trade['type'] == 1 and (ind['ema7'] > ind['ema21'] or (ind['stok'] < 20 and ind['stok'] > ind['stod'])): close_it = True
                    if close_it:
                        with open(iCLOSE_PATH, 'w') as cl: cl.write(pair + "\n")
                        set_cooldown(pair)
                        await send_telegram("V12.9 PROFIT LOCK\n" + pair + " $" + str(round(trade['profit'], 2)))
            await asyncio.sleep(1)
        except Exception as e:
            logging.error("Watchdog: " + str(e)); await asyncio.sleep(1)

# ══════ SCANNER (30s) ══════
async def scanner_task():
    init_db()
    logging.info("V12.9 Scanner Active (30s)")
    await send_telegram("SAC V12.9 OMNI PREDATOR - AI SUPREME\nFull Authority x.AI | OVR-Logic | MTF Flex\nForexFactory Calendar | Institutional Confluence")
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

            logging.info("Session=" + session + " Style=" + s_cfg['style'] + " PnL=" + str(round(daily_pnl, 2)) + " Eq=" + str(round(equity, 2)) + " Open=" + str(total_open))

            if equity > 0 and daily_pnl < -(equity * MAX_DAILY_LOSS_PCT / 100):
                logging.info("DAILY LOSS LOCK: " + str(round(daily_pnl, 2))); await asyncio.sleep(30); continue
            s_key = session + "_" + datetime.now().strftime('%Y%m%d')
            if s_key not in SESSION_PNL: SESSION_PNL[s_key] = 0
            if equity > 0 and SESSION_PNL.get(s_key, 0) < -(equity * s_cfg['max_loss_pct'] / 100):
                logging.info("SESSION LOCK [" + session + "]"); await asyncio.sleep(30); continue
            if streak_count >= 3 and streak_dir == "LOSS":
                logging.info("3-LOSS STREAK LOCK"); await asyncio.sleep(30); continue
            if check_equity_curve():
                logging.info("EQUITY CURVE LOCK"); await asyncio.sleep(30); continue
            if CURRENT_STATS["balance"] > 0:
                dd = ((CURRENT_STATS["balance"] - equity) / CURRENT_STATS["balance"]) * 100
                if dd > DRAWDOWN_LOCK_PCT: logging.info("DRAWDOWN LOCK: " + str(round(dd, 1)) + "%"); await asyncio.sleep(30); continue
            if session == 'OFF':
                logging.info("OFF-HOURS"); await asyncio.sleep(30); continue

            news_headlines = get_news_headlines()

            for pair in s_cfg['pairs']:
                logging.info("Scan " + pair + " [" + session + "]")
                if total_open >= MAX_SIMULTANEOUS_ORDERS: continue
                if pair in CURRENT_STATS["open_trades"]: continue
                blocked_cluster = check_cluster_exposure(pair, CURRENT_STATS["open_trades"])
                if blocked_cluster: logging.info("SKIP " + pair + ": Cluster " + blocked_cluster); continue
                if check_cooldown(pair): continue
                if check_penalty(pair): continue

                # V12.1: News Calendar Block
                news_block = check_news_block(pair)
                if news_block:
                    logging.info("SKIP " + pair + ": NEWS BLOCK (" + news_block + ")")
                    continue

                m5_key, h4_key = pair + "_M5", pair + "_H4"
                if m5_key not in price_data or h4_key not in price_data: continue
                ind = calculate_indicators(price_data[m5_key])
                if not ind: continue
                c_p = ind['price']

                # V12.1: Multi-Timeframe Confirmation
                mtf_trend, mtf_details = get_mtf_alignment(price_data, pair, c_p)
                
                sp = specs.get(pair, {'spread': 2.0, 'point': 0.0001, 'daily_high': 0, 'daily_low': 0})
                # V12.6: Fix spread divisor for 3/5 digit brokers
                divisor = 10.0 if sp['point'] in [0.00001, 0.001] else 1.0
                spread_pips = sp.get('spread', 20.0) / divisor
                spread_level = "LOW" if spread_pips < 1.5 else ("MED" if spread_pips < 3.0 else "HIGH")
                cp_data = candle_patterns.get(pair, {'m5': 'NONE', 'm15': 'NONE'})
                dxy_bias = "WEAK" if intermarket.get('dxy_trend') == "DOWN" else "STRONG"

                # V12.2: Pattern Memory
                tr_h4 = mtf_details.get('H4', 'NEUTRAL')
                setup_hash = make_setup_hash(pair, tr_h4, ind['bb_pos'], ind['stoch_cross'], ind['regime'], session, dxy_bias, spread_level)
                pattern_boost = get_pattern_boost(setup_hash)

                # V12.9 "AI SUPREME": No local skips for MTF. Every potential setup goes to x.AI.
                # Only a minimal sanity check to avoid wasting tokens on dead markets.
                is_potential_setup = (
                    (ind['bb_pct'] >= 0.7 or ind['bb_pct'] <= 0.3) or  # More inclusive
                    (ind['stoch_cross'] != "NONE") or 
                    (ind['sweep'] != "NONE") or 
                    (ind['vol_spike'] > 1.2) or                        # Institutional interest
                    (pattern_boost != 0)
                )

                if not is_potential_setup:
                    logging.info("HOLD " + pair + ": No Minimal Setup (API Saved)")
                    continue

                payload = {
                    "pair": pair, "price": round(float(c_p), 5),
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
                except Exception as api_err:
                    logging.warning("Reasoning timeout, switching to fast model: " + str(api_err))
                    try:
                        resp = client.chat.completions.create(model=FALLBACK_MODEL_ID, messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, {'role': 'user', 'content': json.dumps(payload)}], response_format={'type': 'json_object'}, timeout=15)
                        res = json.loads(resp.choices[0].message.content)
                        dec = str(res.get('action', 'HOLD')).upper()
                        sc = int(abs(float(str(res.get('score', 0)).replace('%',''))) * 10)
                        cf = float(str(res.get('confidence', 0)).replace('%',''))
                        res['reason'] = '[FAST-MODEL] ' + res.get('reason', '')
                    except Exception as api_err2:
                        logging.error("Both models failed → Fallback V2: " + str(api_err2))
                        dec, sc, cf = fallback_decision_v2(ind, tr_h4, session, pair, setup_hash, intermarket)
                        res = {'reason': 'Fallback V2: ' + dec + ' [regime=' + ind['regime'] + ', sweep=' + ind['sweep'] + ']'}

                log_grok_decision(pair, session, payload, res)
                cf += pattern_boost
                logging.info(pair + " [" + session + "|" + ind['regime'] + "]: " + dec + " Sc=" + str(sc) + " Cf=" + str(cf) + " Sweep=" + ind['sweep'] + " MTF=" + str(mtf_details))

                threshold = s_cfg['threshold']
                # V12.9: AI Supreme execution. Trust the AI if confidence meets threshold.
                is_valid = (dec != 'HOLD' and cf >= threshold)
                
                if is_valid and sc >= 8 and cf >= threshold:
                    sl_dist = s_cfg['sl_mult'] * ind['atr']
                    tp_dist = s_cfg['tp_mult'] * ind['atr']
                    risk_pct = kelly_lot_size(ind, equity, sl_dist, s_cfg)
                    with open(SIGNAL_PATH, 'w') as f:
                        f.write(pair + "|" + dec + "_MARKET|" + str(c_p) + "|" + str(sl_dist) + "|" + str(tp_dist) + "|" + str(risk_pct))
                    confirmed = False
                    for _ in range(10):
                        await asyncio.sleep(1)
                        if os.path.exists(iRESULTS_PATH): confirmed = True; break
                    if not confirmed: logging.warning("ORDER NOT CONFIRMED: " + pair)
                    conn = sqlite3.connect(DB_PATH)
                    conn.execute('INSERT INTO trade_history (id,pair,action,entry,sl,tp,risk,timestamp,reason,score,style,session,regime,mtf_alignment,pattern_hash,confidence,outcome) VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (pair, dec, float(c_p), float(sl_dist), float(tp_dist), float(risk_pct), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), res.get('reason', ''), int(sc), 'V12.9-' + session, session, ind['regime'], str(mtf_details), setup_hash, round(cf, 1), 'PENDING'))
                    conn.commit(); conn.close()
                    update_pattern_memory(setup_hash, pair, session, ind['regime'], 'PENDING')
                    set_cooldown(pair); total_open += 1
                    msg = "SAC V12.9 [" + session + "|" + ind['regime'] + "]\n" + dec + " " + pair + "\nConf:" + str(round(cf, 1)) + "% Sc:" + str(round(sc, 1)) + "\nKelly:" + str(round(risk_pct, 1)) + "% MTF:" + str(mtf_details) + "\nReason: " + res.get('reason', 'AI Logic')
                    await send_telegram(msg); await asyncio.sleep(5)

            await asyncio.sleep(30)
        except Exception as e:
            logging.error("Scanner: " + str(e)); await asyncio.sleep(30)

async def main():
    await asyncio.gather(watchdog_task(), scanner_task())

if __name__ == '__main__':
    asyncio.run(main())
