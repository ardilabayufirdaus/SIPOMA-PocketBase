import yfinance as yf
import pandas as pd
import numpy as np
import logging

def evaluate_pair(ticker):
    try:
        data = yf.download(ticker, period="1mo", interval="1h", progress=False)
        if data.empty: return f"{ticker}: No Data"
        
        h4 = data.resample('4h').last()
        
        # Determine column names (handle MultiIndex)
        if isinstance(data.columns, pd.MultiIndex):
            col_close = ('Close', ticker)
            col_high = ('High', ticker)
            col_low = ('Low', ticker)
        else:
            col_close = 'Close'
            col_high = 'High'
            col_low = 'Low'
        
        h4['SMA20'] = h4[col_close].rolling(window=20).mean()
        h4['SMA50'] = h4[col_close].rolling(window=50).mean()
        
        def squash(v):
            try: return float(np.ravel(v)[0])
            except: return 0.0

        last_close = squash(h4[col_close].iloc[-1])
        last_sma20 = squash(h4['SMA20'].iloc[-1])
        last_sma50 = squash(h4['SMA50'].iloc[-1])
        
        trend = "NEUTRAL"
        if last_close > last_sma20 and last_sma20 > last_sma50: trend = "BULLISH"
        elif last_close < last_sma20 and last_sma20 < last_sma50: trend = "BEARISH"
        
        volatility = squash(h4[col_high].iloc[-1]) - squash(h4[col_low].iloc[-1])
        
        return f"{ticker}: {trend} (Vol: {volatility:.5f})"
    except Exception as e: return f"{ticker}: Error {e}"

potential_pairs = ["AUDUSD=X", "USDCAD=X", "EURJPY=X", "BTC-USD", "ETH-USD"]
print("--- STRATEGIC PAIR EVALUATION ---")
for p in potential_pairs:
    print(evaluate_pair(p))
