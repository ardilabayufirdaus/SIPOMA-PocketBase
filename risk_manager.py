#!/usr/bin/env python3
"""
SAC-RISK-MANAGER-V13.1: Institutional Money Management
- Kelly Criterion Modified for Cent Account
- ATR Dynamic SL, Pip Matrix, Drawdown Filters
- Broker Limits: 0.10-5.00 lot cent RoboForex
"""

import os
import logging
import math
from typing import Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - RISK - %(message)s')
logger = logging.getLogger(__name__)

class RiskManager:
    def __init__(self):
        self.risk_per_trade_pct = 1.0  # 1% risk per trade
        self.max_daily_dd_pct = 5.0
        self.min_lot = 0.10  # Cent account minimum
        self.max_lot = 5.00  # Broker limit
        self.leverage = 500
        
    def pip_value(self, pair: str, lot: float = 0.01) -> float:
        """Pip value calculation for RoboForex Cent account"""
        if 'JPY' in pair:
            return lot * 1000 * 0.01 / self.leverage  # ~0.1 USD per pip per 0.01 lot
        elif 'XAUUSD' in pair:
            return lot * 1000 * 0.1 / self.leverage   # Gold pip value
        else:
            return lot * 1000 * 0.0001 / self.leverage  # Standard forex

    def calculate_pips(self, pair: str, price1: float, price2: float) -> float:
        """V13.1 Pip Calculation Matrix"""
        if 'JPY' in pair:
            return abs(price1 - price2) / 0.01
        elif 'XAUUSD' in pair:
            return abs(price1 - price2) / 0.1
        else:
            return abs(price1 - price2) / 0.0001

    def atr_sl_distance(self, atr_value: float, pair: str) -> float:
        """ATR-Enforced Defensive SL: Max(1.5*ATR, 15 pips)"""
        min_sl_pips = 15
        atr_pips = self.calculate_pips(pair, atr_value * 1.5, 0)
        return max(atr_pips, min_sl_pips)

    def kelly_lot_size(self, equity: float, sl_pips: float, pair: str, winrate: float = 0.65) -> float:
        """Modified Kelly: Lot = (Equity * Risk%) / (SL_Pips * Pip_Value)"""
        risk_amount = equity * (self.risk_per_trade_pct / 100)
        pip_val_01 = self.pip_value(pair, 0.01)
        lot_size = risk_amount / (sl_pips * pip_val_01)
        
        # Kelly adjustment for conservatism
        lot_size *= 0.25  # Quarter Kelly for safety
        
        # Broker limits
        return max(self.min_lot, min(self.max_lot, round(lot_size, 2)))

    def validate_trade(self, equity: float, daily_peak: float, sl_pips: float) -> bool:
        """Global filters"""
        if equity < daily_peak * (1 - self.max_daily_dd_pct / 100):
            logger.warning("Daily DD limit hit - blocking trades")
            return False
        if sl_pips < 10:
            logger.warning("SL too tight")
            return False
        return True

    def generate_trade_command(self, pair: str, action: str, entry_price: float, 
                             atr: float, winrate: float, equity: float, 
                             daily_peak: float) -> Dict:
        """Full trade generation with risk params"""
        sl_pips = self.atr_sl_distance(atr, pair)
        
        if not self.validate_trade(equity, daily_peak, sl_pips):
            return None
            
        lot = self.kelly_lot_size(equity, sl_pips, pair, winrate)
        tp_pips = sl_pips * 2  # 1:2 RR minimum
        pip_size = 0.0001 if 'JPY' not in pair else 0.01
        pip_size = 0.1 if 'XAUUSD' in pair else pip_size
        
        sl_price = entry_price - (sl_pips * pip_size) if action == 'BUY' else entry_price + (sl_pips * pip_size)
        tp_price = entry_price + (tp_pips * pip_size) if action == 'BUY' else entry_price - (tp_pips * pip_size)
        
        logger.info(f"{pair} {action}: Lot={lot}, SL={sl_pips:.1f}pips, TP={tp_pips:.1f}pips")
        
        return {
            'pair': pair,
            'action': f"{action}_MARKET",
            'price': entry_price,
            'sl': sl_price,
            'tp': tp_price,
            'lot': lot,
            'sl_pips': sl_pips,
            'risk_pct': self.risk_per_trade_pct
        }

# Global instance
risk_mgr = RiskManager()

if __name__ == "__main__":
    # Test usage
    trade = risk_mgr.generate_trade_command(
        pair='EURUSD', action='BUY', entry_price=1.0850,
        atr=0.0015, winrate=0.7, equity=10000, daily_peak=10500
    )
    if trade:
        print(f"TRADE CMD: {trade['pair']}|{trade['action']}|{trade['price']:.5f}|{trade['sl']:.5f}|{trade['tp']:.5f}|{trade['lot']}")