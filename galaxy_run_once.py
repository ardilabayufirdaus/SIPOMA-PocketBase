import os, base64, requests, time, json, re, sys
from datetime import datetime
import subprocess

# --- LOAD SECRETS FROM BRANKAS (V14.3) ---
CONFIG_PATH = os.path.expanduser('~/config.json')
try:
    with open(CONFIG_PATH, 'r') as f:
        CONF = json.load(f)
    API_KEY = CONF['API_KEY']
    TELEGRAM_TOKEN = CONF['TELEGRAM_TOKEN']
    CHAT_ID = CONF['CHAT_ID']
except Exception as e:
    print(f"Brankas config.json tidak ditemukan atau rusak: {e}")
    sys.exit(1)

def tg(msg):
    try:
        msg_safe = msg.replace('"', "'")[:200]
        os.system(f'curl -s -4 -X POST https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage -d chat_id={CHAT_ID} -d text="[GALAXY GOD V14.3 - SECURE] {msg_safe}"')
    except: pass

def robust_cmd(cmd, timeout=30):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip()
    except subprocess.TimeoutExpired: return ""
    except Exception: return ""

def main():
    try:
        # 1. RADAR MODE (Pencari Port Wireless Debugging)
        out = robust_cmd('adb devices', 10)
        if '192.168.1.11:' not in out:
            nmap_out = robust_cmd('nmap 192.168.1.11 -p 35000-49999 -T5 --open', 60)
            port_match = re.search(r'(\d+)/tcp\s+open', nmap_out)
            if port_match:
                new_port = port_match.group(1)
                robust_cmd(f'adb connect 192.168.1.11:{new_port}', 15)
            else:
                tg("Radar Gagal Menemukan Port ADB.")
                sys.exit(1)
        time.sleep(2)
        
        # 2. Capture Layar pelan-pelan
        robust_cmd('adb exec-out screencap -p > ~/chart.png', 15)
        time.sleep(2)
        
        chart_path = os.path.expanduser('~/chart.png')
        if not os.path.exists(chart_path) or os.path.getsize(chart_path) < 1000:
            tg("Gagal memotret layar (Kamera ADB Pingsan).")
            sys.exit(1)
            
        # 3. Baca Balance dengan OCR
        res = robust_cmd('tesseract ~/chart.png stdout --psm 6', 20)
        match = re.search(r'Balance:?\s*([\d\.,]+)', res, re.I)
        balance = float(match.group(1).replace(',', '')) if match else 1000.0
        time.sleep(1)
        
        # 4. Kirim ke Grok (grok-4-1-fast-reasoning)
        with open(chart_path, 'rb') as f:
            img = base64.b64encode(f.read()).decode('utf-8')
            
        tg(f"Memulai Analisa SMC. Bal: {balance}...")
        
        prompt = "GALAXY GOD SMC ANALYZE. JSON OUTPUT ONLY containing {'action':'BUY/SELL/WAIT', 'lot':float, 'reason':'string'}"
        headers = {'Authorization': 'Bearer ' + API_KEY}
        payload = {'model': 'grok-4-1-fast-reasoning', 'messages': [{'role': 'user', 'content': [{'type': 'text', 'text': prompt}, {'type': 'image_url', 'image_url': {'url': 'data:image/png;base64,' + img}}]}]}
        
        res_api = requests.post('https://api.x.ai/v1/chat/completions', headers=headers, json=payload, timeout=60).json()
        
        # 5. Eksekusi
        if 'choices' in res_api:
            content = res_api['choices'][0]['message']['content']
            match_json = re.search(r'\{.*\}', content, re.DOTALL)
            if match_json:
                data = json.loads(match_json.group(0))
                action = data.get('action', 'WAIT')
                reason = data.get('reason', '')[:100]
                lot = data.get('lot', 0.01)
                
                if action in ['BUY', 'SELL']:
                    tg(f"TITAH: {action} | Lot: {lot} | {reason}")
                    robust_cmd('adb shell input tap 671 97', 10)
                    time.sleep(2)
                    robust_cmd(f"adb shell input text {lot}", 10)
                    time.sleep(1)
                    if action == 'BUY': robust_cmd('adb shell input tap 540 1320', 10)
                    else: robust_cmd('adb shell input tap 180 1320', 10)
                    time.sleep(1)
                    robust_cmd('adb shell input keyevent 4', 10)
                else:
                    tg(f"WAIT | {reason[:50]}")
            else:
                tg(f"Grok JSON Parse Error: {content[:100]}")
        else:
            tg(f"Grok API Error: {str(res_api)[:150]}")
            
    except Exception as e:
        tg(f"Siklus Gagal: {str(e)[:100]}")
    
    sys.exit(0)

if __name__ == '__main__':
    main()
