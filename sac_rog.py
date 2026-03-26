#!/usr/bin/env python3
"""
SAC ROG - SCALPING OMNI GOD MODE v1.0
Flow: Scalping Teknikal → xAI 90%+ → News Check → MT4 Execute
Syarat: No double order, Trailing SL, Force close profit lock
"""

import os
import time
import json
import logging
import sqlite3
import httpx
import asyncio
from datetime import datetime
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
try:
    import yfinance as yf
except ImportError:
    yf = None
try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = np = None
try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None

from dotenv import load_dotenv
load_dotenv()

# CONFIG
CONFIG = {
    'XAI_PROXY': 'https://db.sipoma.online/api/xai.js',
    'PAIRS': ['EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'USDCHF'],
    'SCALP_TP_PIPS': 10,
    'SCALP_SL_PIPS': 5,
    'XAI_MIN_SCORE': 90,
    'DB_PATH': 'sac_rog.db',
    'SIGNAL_PATH': '/home/ardilabayufirdaus/.wine/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/sac_rog_signals.txt',
    'STATS_PATH': '/home/ardilabayufirdaus/.