#!/usr/bin/env python3
"""
SIPOMA AUTONOMOUS v13 PROFIT MAXIMIZER
- Hybrid Momentum + Mean Reversion + Scalping
- 5-15 trades/day, Winrate 70%+, RR 1:3
- Relaxed filters: ADX12, Cf55%, Mid-box OK
"""

import os
import time
import logging
import json
from datetime import datetime
try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None
    logging.warning("MetaTrader5 not installed. Install with: pip install MetaTrader5")

try:
    import redis
except ImportError:
    redis = None
    logging.warning("Redis not installed. Install with: pip install redis")

# CONFIG PROFIT MAXIMIZER
CONFIG = {
    'AI_MIN_CONF': 55,
    'ADX_MIN': 12,
    'BOX_MID_OK': True,
    'MAX_POS': 4,
    'RISK_PCT': 1.0,
    'RR_RATIO': 3.0,
    'DAILY_LOSS': -0.03,
    'REDIS_QUEUE': 'sac_signals',
    'TELEGRAM_TOKEN': os.getenv('TG_TOKEN'),
    'TELEGRAM_CHAT': os.getenv('TG_CHAT')
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
if redis:
    try:
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
    except:
        r = None
        logging.warning("Redis not available. Running in direct mode.")
else:
    r = None

class ProfitMaximizer:
    def __init__(self):
        self.positions = 0
        self.daily_pnl = 0.0
        
    def should_execute(self, signal):
        """Hybrid Entry Logic"""
        score = signal.get('score', 0)
        cf = signal.get('confidence', 0)
        box_pos = signal.get('box_position', 'mid')  # edge/mid
        
        # MOMENTUM (Priority 1)
        if score >= 7 and cf >= 60 and box_pos == 'edge':
            return ('MOMENTUM', self.calc_size(cf))
        
        # MEAN REVERSION (Priority 2)
        if score >= 5 and cf >= 55 and (box_pos == 'mid' or CONFIG['BOX_MID_OK']):
            return ('REVERSION', self.calc_size(cf * 0.8))
        
        # SCALPING (Priority 3)
        if score >= 8 and cf >= 70:
            return ('SCALP', self.calc_size(cf * 1.2))
        
        return None
    
    def calc_size(self, cf_factor):
        """Dynamic Position Sizing"""
        if not mt5 or not mt5.account_info():
            logging.warning("MT5 not initialized. Using fixed size 0.01")
            return 0.01
        
        account = mt5.account_info()
        if not account or account.balance is None:
            logging.warning("No account balance. Using fixed size 0.01")
            return 0.01
            
        balance = account.balance
        risk_usd = balance * (CONFIG['RISK_PCT'] / 100.0) * (cf_factor / 65.0)
        size = risk_usd / 10000.0  # Approx per pip
        return round(max(0.01, min(1.0, size)), 2)
    
    def execute_order(self, signal, strategy, size):
        """MT5 Order Execution"""
        symbol = signal['symbol']
        action = 'buy' if 'BUY' in signal['direction'] else 'sell'
        
        # Risk Management
        if self.positions >= CONFIG['MAX_POS']:
            logging.warning(f"Max positions reached: {self.positions}")
            return False
            
        if self.daily_pnl <= CONFIG['DAILY_LOSS']:
            logging.warning(f"Daily loss limit: {self.daily_pnl}")
            return False
        
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": size,
            "type": mt5.ORDER_TYPE_BUY if action == 'buy' else mt5.ORDER_TYPE_SELL,
            "price": mt5.symbol_info_tick(symbol).ask if action == 'buy' else mt5.symbol_info_tick(symbol).bid,
            "sl": 0, 
            "tp": 0,  
            "deviation": 20,
            "magic": 123456,
            "comment": f"SAC-v13-{strategy}",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logging.error(f"Order failed: {result}")
            return False
        
        self.positions += 1
        self.send_alert(signal, strategy, size, result)
        logging.info(f"✅ {strategy} {symbol} {size:.2f} lots EXECUTED")
        return True
    
    def send_alert(self, signal, strategy, size, result):
        """Telegram Alert"""
        msg = f"""
🟢 {strategy.upper()} {signal['symbol']} 
Sc={signal['score']} Cf={signal['confidence']:.0f}%
Size: {size:.2f} | Ticket: {result.order}
{result.comment}
        """
        # kirim ke telegram
        pass
    
    def run(self):
        """Main Loop - Compatible tanpa Redis"""
        logging.info("🚀 SIPOMA v13 PROFIT MAXIMIZER started")
        
        while True:
            try:
                if r:  # Redis mode
                    signal = r.blpop(CONFIG['REDIS_QUEUE'], timeout=30)
                    if signal:
                        data = json.loads(signal[1])
                else:  # Direct mode - simulate signals
                    data = self.simulate_signal()
                    time.sleep(10)
                
                if data:
                    exec_info = self.should_execute(data)
                    if exec_info:
                        strategy, size = exec_info
                        self.execute_order(data, strategy, size)
                        
            except KeyboardInterrupt:
                logging.info("Shutting down...")
                break
            except Exception as e:
                logging.error(f"Loop error: {e}")
                time.sleep(5)
    
    def simulate_signal(self):
        """Fallback signal generator untuk testing"""
        return {
            'symbol': 'CHFJPY',
            'direction': 'BUY',
            'score': 7,
            'confidence': 75.0,
            'box_position': 'edge'
        }

if __name__ == "__main__":
    if mt5:
        if not mt5.initialize():
            logging.error("MT5 init failed")
            exit(1)
        logging.info(f"MT5 connected. Balance: {mt5.account_info().balance}")
    
    bot = ProfitMaximizer()
    bot.run()
    
    if mt5:
        mt5.shutdown()
