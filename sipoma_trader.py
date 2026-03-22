import os, time, json, re, sys, requests
import yfinance as yf
import pandas as pd

# --- LOAD SECRETS ON SERVER (SIPOMA AI COMMANDER V21 - GOD OF TRADER FOREX) ---
CONFIG_PATH = os.path.expanduser('~/config.json')
try:
    with open(CONFIG_PATH, 'r') as f:
        CONF = json.load(f)
    API_KEY = CONF['API_KEY']
    TELEGRAM_TOKEN = CONF['TELEGRAM_TOKEN']
    CHAT_ID = CONF['CHAT_ID']
except Exception: 
    print('ERROR: config.json missing!'); sys.exit(1)

def tg(msg):
    os.system(f'curl -s -4 -X POST https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage -d chat_id={CHAT_ID} -d text=\"[GOD OF TRADER FOREX] {msg.replace(\'\"\', \"\'\")[:350]}\"')

def main():
    tg('🔱 SIPOMA AI COMMANDER AKTIF! Sang Dewa Trader Forex Telah Kembali Menduduki Tahtanya di Server.')
    while True:
        try:
            # 1. PURE DATA SOURCE (GOLD FUTURES)
            ticker = yf.Ticker('GC=F')
            hist = ticker.history(period='1d', interval='5m').tail(15)
            data_json = hist.to_json()
            
            # 2. SMC BRAIN (GROK-4-1-FAST-REASONING)
            prompt = f'SIPOMA MISSION: ANALYZE GOLD (XAUUSD) AND OUTPUT SMC SIGNAL. DATA: {data_json}. OUTPUT JSON ONLY: {{'action':'BUY/SELL/WAIT','lot':float,'reason':'string'}}'
            
            headers = {'Authorization': 'Bearer ' + API_KEY}
            payload = {'model': 'grok-4-1-fast-reasoning', 'messages': [{'role': 'user', 'content': prompt}]}
            
            res_api = requests.post('https://api.x.ai/v1/chat/completions', headers=headers, json=payload, timeout=80).json()
            
            if 'choices' in res_api:
                content = res_api['choices'][0]['message']['content']
                data = json.loads(re.search(r'\{.*\}', content, re.DOTALL).group(0))
                tg(f'TITAH: {data[\"action\"]} | Lot: {data[\"lot\"]} | {data[\"reason\"][:150]}')
            else:
                tg('Sistem Sidratul Muntaha Sedang Menunggu Respon Alam (API Error).')
                
        except Exception as e:
            tg(f'Gangguan Sinyal Dewa: {str(e)[:100]}')
        
        # MONITORING SETIAP 5 MENIT
        time.sleep(300)

if __name__ == '__main__': main()
