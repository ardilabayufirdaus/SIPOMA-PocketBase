import os, time, json, re, sys
import requests
import yfinance as yf
import pandas as pd
from datetime import datetime

# --- LOAD SECRETS ON SERVER (V20 SOVEREIGN BRAIN) ---
CONFIG_PATH = os.path.expanduser('~/config.json')
try:
    with open(CONFIG_PATH, 'r') as f:
        CONF = json.load(f)
    API_KEY = CONF['API_KEY']
    TELEGRAM_TOKEN = CONF['TELEGRAM_TOKEN']
    CHAT_ID = CONF['CHAT_ID']
except Exception: sys.exit(1)

def tg(msg):
    try:
        msg_safe = msg.replace('"', "'")[:300]
        os.system(f'curl -s -4 -X POST https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage -d chat_id={CHAT_ID} -d text="[GALAXY MASTER V20] {msg_safe}"')
    except: pass

def get_market_data(symbol="GC=F"): # GC=F is Gold Futures on Yahoo
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="1d", interval="5m").tail(20)
    return hist.to_json()

def main():
    tg("Sovereign Master V20 Started. Monitoring Market 24/7.")
    while True:
        try:
            # 1. PULL LIVE DATA (NO OCR, NO IMAGES, JUST PURE DATA)
            # Symbol: XAUUSD (Gold) usually GC=F or XAUUSD=X
            data_json = get_market_data("GC=F")
            
            # 2. ASK GROK (BRAIN V20)
            tg("Analyzing Market Fundamentals & SMC Patterns...")
            prompt = f"GALAXY MASTER MISSION: ANALYZE GOLD (XAUUSD) MARKET DATA AND OUTPUT SMC TRADING SIGNAL. DATA: {data_json}. OUTPUT JSON: {{'action':'BUY/SELL/WAIT','lot':float,'reason':'string'}}"
            
            headers = {'Authorization': 'Bearer ' + API_KEY}
            payload = {'model': 'grok-4-1-fast-reasoning', 'messages': [{'role': 'user', 'content': prompt}]}
            
            res_api = requests.post('https://api.x.ai/v1/chat/completions', headers=headers, json=payload, timeout=80).json()
            
            if 'choices' in res_api:
                data = json.loads(re.search(r'\{.*\}', res_api['choices'][0]['message']['content'], re.DOTALL).group(0))
                action = data.get('action', 'WAIT')
                reason = data.get('reason', '')[:150]
                lot = data.get('lot', 0.01)
                
                tg(f"TITAH: {action} | Lot: {lot} | {reason}")
            else:
                tg("Master Error: API Response invalid.")
                
        except Exception as e:
            tg(f"MASTER ERROR: {str(e)[:100]}")
        
        # PATROL EVERY 5 MINUTES
        time.sleep(300)

if __name__ == '__main__':
    main()
