import os
import sys
import asyncio
from openai import OpenAI
from telegram import Bot
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv('XAI_API_KEY'), base_url='https://api.x.ai/v1')
bot = Bot(token=os.getenv('TELEGRAM_TOKEN'))
CHAT_ID = os.getenv('CHAT_ID')

async def analyze_and_send(alert_type, prompt):
    """
    SIPOMA Smart Alert Module V14.0
    Menganalisis sinyal teknis dan mengirimkan notifikasi cerdas melalui AI.
    """
    # --- CUSTOM FILTER START ---
    allowed_alerts = ['EXECUTION', 'CLOSE', 'REVERSAL', 'ENTRY', 'TP_SL']
    if not any(x in alert_type.upper() for x in allowed_alerts):
        print(f"Muted: {alert_type}")
        return
    # --- CUSTOM FILTER END ---

    try:
        response = client.chat.completions.create(
            model='grok-4-1-fast-non-reasoning',
            messages=[
                {'role': 'system', 'content': 'Anda adalah SIPOMA AI System Monitor. Berikan laporan trading lengkap: SL, TP, Risk, Lot Size, dan ALASAN logis. Fokus pada akurasi eksekusi.'},
                {'role': 'user', 'content': prompt}
            ]
        )
        
        analysis = response.choices[0].message.content
        final_message = f"🚀 *INTELLIGENT ALERT: {alert_type}*\n\n{analysis}"
        
        await bot.send_message(chat_id=CHAT_ID, text=final_message, parse_mode='Markdown')
        print('Successfully sent smart alert.')
    except Exception as e:
        error_msg = f'⚠️ AI Alert Error: {str(e)}\n\nOriginal Alert: {alert_type}'
        await bot.send_message(chat_id=CHAT_ID, text=error_msg)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(1)
    asyncio.run(analyze_and_send(sys.argv[1], sys.argv[2]))
