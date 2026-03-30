import os
import sys
import json
import asyncio
import logging
import pandas as pd
import pandas_ta as ta
import numpy as np
import pytz
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from openai import OpenAI
from risk_manager import risk_mgr
from smart_alert import analyze_and_send
from db_manager import db_mgr
from report_engine import report_engine
from news_engine import get_ff_calendar, check_news

load_dotenv()
PATHS = {
    'signal': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/signals_XAUUSD.txt',
    'price_m5': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/price_data_XAUUSD.txt',
    'multi_tf': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/multi_tf_data_XAUUSD.txt',
    'stats': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_stats_XAUUSD.txt',
    'close': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/close_XAUUSD.txt',
    'modify': '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/modify_XAUUSD.txt'
}

SAC_VERSION = "SAC V27.8-DEBUG"

client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url='https://api.x.ai/v1')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - ' + SAC_VERSION + ' - %(message)s')

STATS = {'balance': 0, 'equity': 0, 'trades': []}
PREV_BALANCE = 0
PREV_TICKETS = {}
LAST_SETTLE_TIME = 0

async def call_grok_commander(payload_json, fundamental_data, account_data):
    system_prompt = f"""You are {SAC_VERSION} MULTI-TF SENTINEL AI. ANALYZE XAUUSD.
You MUST perform 4 Pillars of Analysis before deciding:
1. TECHNICAL: Analyze the multi-timeframe data provided.
2. FUNDAMENTAL: Analyze the upcoming macroeconomic news provided.
3. SENTIMENT: Evaluate market sentiment (risk-on/risk-off) based on gold's momentum and news context.
4. RISK CONTROL: Evaluate the reward-to-risk ratio and margin safety based on Account Data.

Respond ONLY with JSON format:
{{
  "technical_analysis": "<str>",
  "fundamental_analysis": "<str>",
  "sentiment_analysis": "<str>",
  "risk_management": "<str>",
  "action": "BUY_MARKET"|"SELL_MARKET"|"HOLD",
  "confidence": <0-100>,
  "entry": <float>,
  "sl": <float>,
  "tp": <float>,
  "reason": "<final summary>"
}}"""
    try:
        context = {
            "technical_data": payload_json,
            "fundamental_news": fundamental_data,
            "account_state": account_data
        }
        res = await asyncio.to_thread(client.chat.completions.create, 
            model='grok-4-1-fast-non-reasoning', 
            messages=[{'role':'system', 'content': system_prompt}, {'role':'user', 'content': json.dumps(context)}],
            response_format={'type':'json_object'})
        data = json.loads(res.choices[0].message.content)
        logging.info(f"AI ANALYSIS [{data['action']} - {data['confidence']}%]:\n1. Tech: {data.get('technical_analysis','')}\n2. Fund: {data.get('fundamental_analysis','')}\n3. Sent: {data.get('sentiment_analysis','')}\n4. Risk: {data.get('risk_management','')}\n=> Reason: {data.get('reason','')}")
        return data
    except Exception as e: 
        logging.error(f"AI ERROR: {str(e)}")
        return {"action": "HOLD", "confidence": 0}

def get_tf_indicators(df, tf_id):
    d = df[df[0].astype(str) == str(tf_id)].copy()
    if len(d) < 100: return None
    d.rename(columns={1:'open', 2:'high', 3:'low', 4:'close', 5:'time'}, inplace=True)
    d[['open','high','low','close']] = d[['open','high','low','close']].astype(float)
    ema200 = ta.ema(d['close'], 200).iloc[-1]
    rsi = ta.rsi(d['close'], 14).iloc[-1]
    adx_df = ta.adx(d['high'], d['low'], d['close'])
    adx = adx_df.iloc[-1,0] if not adx_df.empty else 0
    trend = "Bullish" if d['close'].iloc[-1] > ema200 else "Bearish"
    return {"tf": tf_id, "price": d['close'].iloc[-1], "ema200": ema200, "rsi": rsi, "adx": adx, "trend": trend}

async def process_multi_tf_scan():
    global LAST_SETTLE_TIME
    if STATS['balance'] == 0: return # Tunggu Watchdog membaca saldo baru
    if len(STATS['trades']) > 0 or not os.path.exists(PATHS['multi_tf']): return
    if time.time() - LAST_SETTLE_TIME < 1800: return
    try:
        df_raw = pd.read_csv(PATHS['multi_tf'], sep='|', header=None, engine='python')
        tf_matrix = {}
        for tf in [5, 15, 60, 240, 1440]:
            inds = get_tf_indicators(df_raw, tf)
            if inds: tf_matrix[f"TF_{tf}"] = inds
        if not tf_matrix: return
        
        # Fundamental Guard (Fetch News)
        cal = get_ff_calendar()
        _, _, news_msg = check_news("XAUUSD", cal)
        fund_context = news_msg if news_msg else "No high-impact news in next 60m. Normal volatility expected."
        
        # Account Context
        acc_context = {"balance": STATS['balance'], "equity": STATS['equity'], "open_exposure": len(STATS['trades'])}
        
        decision = await call_grok_commander(tf_matrix, fund_context, acc_context)
        if decision.get('action', 'HOLD') != 'HOLD':
            h1_trend, h4_trend = tf_matrix.get('TF_60', {}).get('trend'), tf_matrix.get('TF_240', {}).get('trend')
            alignment = True
            if 'BUY' in decision['action'] and (h1_trend == 'Bearish' or h4_trend == 'Bearish'): alignment, msg = False, "Blocked: Counter H1/H4"
            if 'SELL' in decision['action'] and (h1_trend == 'Bullish' or h4_trend == 'Bullish'): alignment, msg = False, "Blocked: Counter H1/H4"
            if alignment and decision['confidence'] >= 83:
                xau_sym = "XAUUSD"
                t = risk_mgr.generate_trade_command(xau_sym, decision['action'], decision['entry'], abs(decision['entry']-decision['sl']), abs(decision['entry']-decision['tp']), 1.0, STATS['equity'])
                with open(PATHS['signal'], 'a') as f: f.write(f"{xau_sym}|{decision['action']}|{round(decision['entry'], 2)}|{round(t['sl'], 2)}|{round(t['tp'], 2)}|{t['lot']}|{SAC_VERSION}\n")
                asyncio.create_task(analyze_and_send(SAC_VERSION + " SENTINEL", f"🛡️ Trend: H1 {h1_trend} | H4 {h4_trend}\n💎 Order: XAUUSD {decision['action']}\nAudit: {decision.get('reason','')}\n"))
            elif not alignment: logging.warning(f"OVERRULED: {msg}")
    except Exception as e: logging.error(f"Scan Error: {str(e)}")

async def guardian():
    global STATS
    while True:
        try:
            if STATS['trades']:
                if os.path.exists(PATHS['price_m5']):
                    df_raw = pd.read_csv(PATHS['price_m5'], sep='|', header=None)
                    xau_sym = next((s for s in df_raw[0].unique() if 'XAU' in s), 'XAUUSD')
                    d_m5 = df_raw[df_raw[0]==xau_sym].tail(100).copy()
                    d_m5.rename(columns={2:'open', 3:'high', 4:'low', 5:'close'}, inplace=True)
                    atr, curr_p = ta.atr(d_m5['high'], d_m5['low'], d_m5['close'], 14).iloc[-1], d_m5['close'].iloc[-1]
                    for t in STATS['trades']:
                        p = t.split('|')
                        if len(p)<9: continue
                        ticket, side, entry, sl, tp = p[1], p[3], float(p[6]), float(p[7]), float(p[8])
                        profit_pts = curr_p - entry if 'BUY' in side else entry - curr_p
                        if profit_pts > (1.1 * atr):
                            nsl = entry + (0.1 * atr) if 'BUY' in side else entry - (0.1 * atr)
                            if ('BUY' in side and nsl > sl + 0.1) or ('SELL' in side and nsl < sl - 0.1):
                                with open(PATHS['modify'], 'a') as f: f.write(f"{ticket}|{round(nsl, 2)}|{round(tp, 2)}\n")
                        if profit_pts > (1.6 * atr):
                            tsl = curr_p - (1.1 * atr) if 'BUY' in side else curr_p + (1.1 * atr)
                            if ('BUY' in side and tsl > sl + 0.5) or ('SELL' in side and tsl < sl - 0.5):
                                with open(PATHS['modify'], 'a') as f: f.write(f"{ticket}|{round(tsl, 2)}|{round(tp, 2)}\n")
            await asyncio.sleep(20)
        except: await asyncio.sleep(20)

async def watchdog():
    global STATS, PREV_BALANCE, PREV_TICKETS
    while True:
        if os.path.exists(PATHS['stats']):
            try:
                with open(PATHS['stats'], 'r') as f:
                    l = f.readlines()
                    if not l: continue
                    p = l[0].strip().split('|')
                    curr_bal, curr_eq = float(p[0]), float(p[1])
                    STATS['balance'], STATS['equity'] = curr_bal, curr_eq
                    curr_tickets = {x.split('|')[1]: x.strip() for x in l if x.startswith('ORDER')}
                    if PREV_BALANCE > 0:
                        for t_id in list(PREV_TICKETS.keys()):
                            if t_id not in curr_tickets:
                                global LAST_SETTLE_TIME
                                LAST_SETTLE_TIME = time.time()
                                resume_t = (datetime.now() + timedelta(minutes=30)).strftime('%H:%M')
                                db_mgr.add_closed_trade(t_id, STATS['trades'][0].split('|')[2] if STATS['trades'] else 'XAUUSD', 'CLOSED', 0, curr_bal - PREV_BALANCE)
                                rep = report_engine.calculate_stats(curr_bal, curr_eq, [x.strip() for x in l if x.startswith('ORDER')])
                                msg = report_engine.format_telegram(rep)
                                msg += f"\\n🕒 TEMPORAL GUARD: SAC akan kembali menganalisa pasar pada pukul {resume_t} WITA (Cooldown 30 menit)."
                                asyncio.create_task(analyze_and_send("MACRO AUDIT", msg))
                    STATS['trades'] = [x.strip() for x in l if x.startswith('ORDER')]
                    PREV_BALANCE, PREV_TICKETS = curr_bal, curr_tickets
            except: pass
        await asyncio.sleep(5)

async def main():
    await asyncio.gather(watchdog(), asyncio.create_task(scan_loop()), guardian())

async def scan_loop():
    while True:
        await process_multi_tf_scan()
        await asyncio.sleep(60)

if __name__ == '__main__':
    try: asyncio.run(main())
    except KeyboardInterrupt: pass