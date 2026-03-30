#!/usr/bin/env python3
"""
SAC-TICK-V13.1: Data Integrity Guardian
- yfinance → MT4 Candle Validation
- 6-hourly sync untuk MTF alignment
- Detect data corruption/mismatch
"""

import os
import logging
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - TICK - %(message)s')
logger = logging.getLogger(__name__)

MT4_FILES = '/home/rog/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files'
PRICE_DATA_PATH = os.path.join(MT4_FILES, 'price_data.txt')
VALIDATION_PATH = os.path.join(MT4_FILES, 'data_validation.txt')

PAIRS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'GBPJPY=X', 'EURJPY=X', 
         'AUDUSD=X', 'USDCAD=X', 'USDCHF=X', 'XAUUSD=X']

class TickHistorian:
    def __init__(self):
        self.last_sync = None
        
    def fetch_yfinance_data(self, symbol: str, period: str = '5d', interval: str = '5m') -> pd.DataFrame:
        """Fetch reliable market data"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
            if data.empty:
                logger.warning(f"No data for {symbol}")
                return pd.DataFrame()
            return data
        except Exception as e:
            logger.error(f"yfinance {symbol} failed: {e}")
            return pd.DataFrame()

    def validate_mt4_data(self, mt4_pair: str, yf_data: pd.DataFrame) -> dict:
        """Compare MT4 price_data.txt vs yfinance"""
        try:
            with open(PRICE_DATA_PATH, 'r') as f:
                line = f.read().strip()
                parts = line.split('|')
                if len(parts) < 7:
                    return {'valid': False, 'reason': 'Invalid MT4 format'}
                
                mt4_pair_check, tf, idx, o, h, l, c = parts[:7]
                mt4_c = float(c)
                
            # Get latest yf close
            if yf_data.empty:
                return {'valid': False, 'reason': 'No yf data'}
            
            yf_close = yf_data['Close'].iloc[-1]
            price_diff_pct = abs(mt4_c - yf_close) / yf_close * 100
            
            is_valid = price_diff_pct < 0.5  # 0.5% tolerance
            
            return {
                'valid': is_valid,
                'mt4_close': mt4_c,
                'yf_close': yf_close,
                'diff_pct': price_diff_pct,
                'action': 'RESYNC' if not is_valid else 'OK'
            }
        except Exception as e:
            return {'valid': False, 'reason': str(e)}

    def write_validation_report(self, reports: dict):
        """Write to MT4 for MQL4 action"""
        with open(VALIDATION_PATH, 'w') as f:
            for pair, report in reports.items():
                f.write(f"{pair}|{report['valid']}|{report['action']}|{report.get('diff_pct',0):.2f}\n")
        logger.info(f"Validation report written: {len(reports)} pairs")

    def sync_all_pairs(self):
        """Main sync routine"""
        logger.info("Starting yfinance → MT4 validation sync")
        reports = {}
        
        for mt4_pair in ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'XAUUSD']:
            yf_symbol = mt4_pair.replace('USD', 'USD=X') if 'USD' in mt4_pair else f"{mt4_pair}=X"
            if mt4_pair == 'XAUUSD':
                yf_symbol = 'GC=F'  # Gold futures proxy
            
            yf_data = self.fetch_yfinance_data(yf_symbol)
            report = self.validate_mt4_data(mt4_pair, yf_data)
            reports[mt4_pair] = report
            
            if not report['valid']:
                logger.warning(f"MISMATCH {mt4_pair}: {report['diff_pct']:.2f}%")
        
        self.write_validation_report(reports)
        self.last_sync = datetime.now()
        logger.info(f"Sync complete. Issues: {sum(1 for r in reports.values() if not r['valid'])}")
        return reports

if __name__ == "__main__":
    import sys
    historian = TickHistorian()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'sync':
        reports = historian.sync_all_pairs()
        print("SYNC COMPLETE")
        for pair, report in reports.items():
            print(f"{pair}: {'OK' if report['valid'] else 'RESYNC'} ({report.get('diff_pct',0):.2f}%)")
    else:
        print("Usage: python3 tick_historian.py sync")