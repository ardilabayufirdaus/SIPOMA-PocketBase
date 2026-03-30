import os
import json
import asyncio
import logging
import pandas as pd
import pandas_ta as ta
import numpy as np
import pytz
from datetime import datetime, time
from dotenv import load_dotenv
from openai import OpenAI
from risk_manager import risk_mgr
from smart_alert import analyze_and_send
from news_engine import get_ff_calendar, check_news
from db_manager import db_mgr

load_dotenv()
PATHS = {
    'signal': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/signals.txt',
    'price': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/price_data.txt',
    'stats': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_stats.txt',
    'close': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/close.txt'
}
client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url='https://api.x.ai/v1')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - V25.1-GOLD-PREDATOR - %(message)s')

STATS = {'balance': 0, 'equity': 0, 'trades': []}

async def call_grok_commander(payload_json):
    system_prompt = """You are SAC V25.1 GOLD PREDATOR AI. You trade EXCLUSIVELY XAUUSD 24/7.
RULES BASED ON INSTITUTIONAL GOLD BLUEPRINT:
[PRIORITY RULES]
- CORE INDICATORS (Mandatory): Trend (EMA 20/50/200, SMA 200), Momentum (RSI, MACD), Volatility (ATR 1.5-2x for SL), S/R (Pivots, Fib 61.8/78.6).
- KONFIRMASI (Filters): Ichimoku (Kumo/Tenkan cross), BB, OBV, VWAP, S/D Zones (Round numbers: 1900, 2000, 2100, etc.).
- AUX (Optional): Stochastic.

[GOLD SPECIFIC RULES]
1. HARDCODE S/R: Gold is highly sensitive to Psychological Round Numbers (nearest_50, nearest_100). Treat them as strong S/R magnets.
2. FIBONACCI: Gold respects 61.8% and 78.6% massively. Confluence with EMA is an A+ setup.
3. VOLATILITY SL: Never use flat SL! Your SL MUST be strictly calculated as 1.5x up to 2.0x of the provided M15_ATR to avoid Gold's noise/whipsaws.
4. EXECUTION: Top-down bias -> H4 setup -> M15 entry. Never trade lagging indicators together (e.g., RSI+Stoch = fake dual signal). Wait for 3 Confluences minimum.

Respond ONLY with a valid JSON matching this schema:
{"action": "BUY_MARKET"|"SELL_MARKET"|"BUY_LIMIT"|"SELL_LIMIT"|"HOLD", "confidence": <integer 0-100>, "entry": <float price>, "sl": <float price>, "tp": <float price>, "reason": "<Detailed list of 3 Core Confluences + Gold SR/Fib logic>"}"""
    try:
        res = await asyncio.to_thread(client.chat.completions.create, 
            model='grok-4-1-fast-non-reasoning', 
            messages=[{'role':'system', 'content': system_prompt},
                      {'role':'user', 'content': json.dumps(payload_json)}],
            response_format={'type':'json_object'})
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        logging.error(f"Grok API Error: {e}")
        return {"action": "HOLD", "confidence": 0}

def get_xau_indicators(df_raw, p):
    d = df_raw[df_raw[0]==p].tail(3000).copy()
    if len(d) < 200: return None
    
    d[7] = pd.to_datetime(d[7], errors='coerce')
    d.set_index(7, inplace=True)
    d.rename(columns={2:'open', 3:'high', 4:'low', 5:'close', 6:'volume'}, inplace=True)
    m5 = d[['open','high','low','close','volume']].astype(float)
    
    try:
        m15 = m5.resample('15min').agg({'open':'first', 'high':'max', 'low':'min', 'close':'last', 'volume':'sum'}).dropna()
        h1 = m5.resample('1H').agg({'open':'first', 'high':'max', 'low':'min', 'close':'last', 'volume':'sum'}).dropna()
        h4 = m5.resample('4H').agg({'open':'first', 'high':'max', 'low':'min', 'close':'last', 'volume':'sum'}).dropna()
        d1 = m5.resample('1D').agg({'open':'first', 'high':'max', 'low':'min', 'close':'last', 'volume':'sum'}).dropna()
        
        curr = m5['close'].iloc[-1]
        
        # --- VOLATILITAS & MOMENTUM (M15 & H1) ---
        atr = ta.atr(m15['high'], m15['low'], m15['close'], length=14).iloc[-1]
        rsi = ta.rsi(m15['close'], length=14).iloc[-1]
        macd = ta.macd(m15['close'])
        macd_hist = macd['MACDh_12_26_9'].iloc[-1] if macd is not None else 0
        stoch = ta.stoch(m15['high'], m15['low'], m15['close'])
        stoch_k = stoch['STOCHk_14_3_3'].iloc[-1] if stoch is not None else 0
        obv = ta.obv(m15['close'], m15['volume']).iloc[-1]
        bb = ta.bbands(h1['close'], length=20, std=2)
        bb_u = bb['BBU_20_2.0'].iloc[-1] if bb is not None else 0
        bb_l = bb['BBL_20_2.0'].iloc[-1] if bb is not None else 0
        
        try: vwap = ta.vwap(m15['high'], m15['low'], m15['close'], m15['volume']).iloc[-1]
        except: vwap = curr

        # --- TREND CORE (H1) ---
        ema20 = ta.ema(h1['close'], length=20).iloc[-1] if len(h1) >= 20 else 0
        ema50 = ta.ema(h1['close'], length=50).iloc[-1] if len(h1) >= 50 else 0
        ema200 = ta.ema(h1['close'], length=200).iloc[-1] if len(h1) >= 200 else 0
        sma200 = ta.sma(h1['close'], length=200).iloc[-1] if len(h1) >= 200 else 0

        # --- S/R & STRUKTUR (Pivots D1 & Fib H4) ---
        if len(d1) >= 2:
            prev_d = d1.iloc[-2]
            pivot = (prev_d['high'] + prev_d['low'] + prev_d['close']) / 3
            r1 = (2 * pivot) - prev_d['low']
            s1 = (2 * pivot) - prev_d['high']
        else: pivot = r1 = s1 = 0
            
        if len(h4) >= 10:
            h4_high = h4['high'].tail(15).max()
            h4_low = h4['low'].tail(15).min()
            diff = h4_high - h4_low
            fib_618 = h4_high - (diff * 0.618)
            fib_786 = h4_high - (diff * 0.786)
        else:
            h4_high = h4_low = fib_618 = fib_786 = 0

        nearest_100 = round(curr / 100) * 100
        nearest_50 = round(curr / 50) * 50

        return {
            "current_price": round(curr, 2),
            "CORE_trend_h1": {"ema_20": round(ema20, 2), "ema_50": round(ema50, 2), "ema_200": round(ema200, 2), "sma_200": round(sma200, 2)},
            "CORE_momentum_m15": {"rsi_14": round(rsi, 2), "macd_histogram": round(macd_hist, 2)},
            "CORE_volatility_m15": {"atr_14": round(atr, 2)},
            "CORE_sr_structure": {
                "daily_pivot": round(pivot, 2), "r1": round(r1, 2), "s1": round(s1, 2),
                "fib_618_h4": round(fib_618, 2), "fib_786_h4": round(fib_786, 2)
            },
            "CONFIRMATION_filters": {
                "bollinger_upper": round(bb_u, 2), "bollinger_lower": round(bb_l, 2),
                "obv_volume": round(obv, 2), "vwap": round(vwap, 2),
                "psychological_zones": {"nearest_100": nearest_100, "nearest_50": nearest_50}
            },
            "AUX": {"stochastic": round(stoch_k, 2)}
        }
    except Exception as e:
        logging.error(f"Indicator calculation error: {e}")
        return None

def validate_ai_decision(symbol, decision, current_price, m15_atr):
    if type(decision) is not dict: return False, "Invalid format"
    if decision.get('action', 'HOLD') == 'HOLD': return False, "HOLD"
    if decision.get('confidence', 0) < 70: return False, f"Confidence < 70%"
    
    action = decision['action']
    try:
        ent = float(decision.get('entry', 0))
        sl = float(decision.get('sl', 0))
        tp = float(decision.get('tp', 0))
    except: return False, "Price not numeric"
    
    if ent <= 0 or sl <= 0 or tp <= 0: return False, "Price <= 0"

    min_dist = m15_atr * 1.5 # Safety threshold: Strict 1.5x ATR minimum for Gold Volatility
    if abs(ent - sl) < min_dist:
        return False, f"SL too tight for GOLD. Distance {abs(ent-sl):.2f} < Min ATR Buffer {min_dist:.2f}"
        
    return True, "Valid"

async def process_gold_predator(df_raw, calendar):
    avail_symbols = df_raw[0].unique()
    xau_sym = next((s for s in avail_symbols if 'XAU' in s), 'XAUUSD')
    
    inds = get_xau_indicators(df_raw, xau_sym)
    if not inds: return
    
    news_block = check_news(xau_sym, calendar)
    news_impact = news_block[1] if news_block[0] else "CLEAR"
    
    payload = {
        "instruction": "EVALUATE XAUUSD using Core/Confirmation/Aux priority matrix. Find MIN 3 CONFLUENCES.",
        "symbol": xau_sym,
        "market_data": inds,
        "fundamental": {"forex_factory_news": news_impact},
        "risk_constraint": {
            "minimum_sl_distance_atr_multiplier": "1.5x",
            "minimum_sl_pips_value": round(inds['CORE_volatility_m15']['atr_14'] * 1.5, 2)
        }
    }
    
    decision = await call_grok_commander(payload)
    is_valid, msg = validate_ai_decision(xau_sym, decision, inds['current_price'], inds['CORE_volatility_m15']['atr_14'])
    
    if is_valid:
        action = decision['action']
        ent = decision['entry']
        sl = decision['sl']
        tp = decision['tp']
        conf = decision['confidence']
        
        sl_dist = abs(ent - sl)
        t = risk_mgr.generate_trade_command(xau_sym, action, ent, sl_dist, abs(ent-tp), 1.0, STATS['equity'])
        
        db_mgr.add_signal(xau_sym, action, ent, t['sl'], t['tp'], t['lot'], conf)
        with open(PATHS['signal'], 'a') as f:
            f.write(f"{xau_sym}|{action}|{round(ent, 2)}|{round(t['sl'], 2)}|{round(t['tp'], 2)}|{t['lot']}|0\n")
            
        asyncio.create_task(analyze_and_send("GOLD PREDATOR", f"👑 XAUUSD TRIGGER: {action}\nConf: {conf}%\nRes: {decision.get('reason','')}"))
    else:
        if decision.get('action') != 'HOLD':
            logging.warning(f"AI Blocked: {msg} | Output: {decision}")

async def scan():
    while True:
        try:
            cal = await asyncio.to_thread(get_ff_calendar)
            if os.path.exists(PATHS['price']):
                df_raw = await asyncio.to_thread(pd.read_csv, PATHS['price'], sep='|', header=None)
                logging.info(f"GOLD 24/7 PREDATOR | Equity: {STATS['equity']}")
                await process_gold_predator(df_raw, cal)
            await asyncio.sleep(60)
        except Exception as e:
            logging.error(f"Scan Loop Error: {e}")
            await asyncio.sleep(60)

async def watchdog():
    while True:
        if os.path.exists(PATHS['stats']):
            try:
                with open(PATHS['stats'], 'r') as f:
                    lines = f.readlines()
                    if lines:
                        p = lines[0].strip().split('|')
                        if len(p)>=2: STATS['balance'], STATS['equity'] = float(p[0]), float(p[1])
            except: pass
        await asyncio.sleep(5)

async def guardian():
    while True:
        try:
            if STATS['trades']:
                for t in STATS['trades']:
                    parts = t.split('|')
                    if len(parts)<6: continue
                    ticket, symbol, profit = parts[0], parts[1], float(parts[5])
                    db_mgr.mark_executed(symbol, ticket)
                    if profit > (STATS['balance'] * 0.015): 
                         with open(PATHS['close'], 'a') as f:
                             f.write(f"{ticket}|0.5\n")
                             asyncio.create_task(analyze_and_send("GUARDIAN", f"⚖️ GOLD PARTIAL PROFIT | #{ticket}"))
            await asyncio.sleep(10)
        except: await asyncio.sleep(10)

async def main(): await asyncio.gather(watchdog(), scan(), guardian())
if __name__ == '__main__': asyncio.run(main())