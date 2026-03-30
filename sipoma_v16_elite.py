import os
import json
import asyncio
import logging
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import OpenAI
from risk_manager import risk_mgr
from smart_alert import analyze_and_send

load_dotenv()

# --- SAC V16.2 ELITE (FOREX MAJOR ONLY) ---
MT4_DIR = "/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files"
PATHS = {
    "signal": os.path.join(MT4_DIR, "signals.txt"),
    "price": os.path.join(MT4_DIR, "price_data.txt"),
    "stats": os.path.join(MT4_DIR, "account_stats.txt"),
    "specs": os.path.join(MT4_DIR, "symbol_specs.txt"),
    "close": os.path.join(MT4_DIR, "close.txt"),
}
MAJORS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD"]
MAX_TRADES = 5
MIN_AI_SCORE = 95

client = OpenAI(api_key=os.getenv("XAI_API_KEY"), base_url="https://api.x.ai/v1")
stats = {"balance": 0, "equity": 0, "trades": []}
logging.basicConfig(level=logging.INFO, format="%(asctime)s - V16-ELITE - %(message)s")


async def get_ai_score(pair, action, price, ma10, ma20, dxy):
    """AI Validation 2.0: Rich Context + JSON Response"""
    try:
        trend = "UP" if ma10 > ma20 else "DOWN"
        prompt = (
            "Instrument: " + pair
            + " | Action: " + action
            + " @ " + str(round(price, 5))
            + " | SMA10: " + str(round(ma10, 5))
            + " | SMA20: " + str(round(ma20, 5))
            + " | Trend: " + trend
            + " | DXY: " + str(round(dxy, 2))
            + ' | Tugas: Skor 0-100. JSON: {"score": 95, "reason": "str"}'
        )
        res = client.chat.completions.create(
            model="grok-4-1-fast-non-reasoning",
            messages=[
                {"role": "system", "content": "SAC Institutional Strategy Validator."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        data = json.loads(res.choices[0].message.content)
        return int(data.get("score", 0)), data.get("reason", "")
    except Exception as e:
        logging.error("AI Error: %s", e)
        return 0, ""


async def watchdog():
    """Reads account stats and open trades from MT4 every 2 seconds"""
    while True:
        if os.path.exists(PATHS["stats"]):
            try:
                with open(PATHS["stats"], "r") as f:
                    lines = f.readlines()
                if lines:
                    p = lines[0].strip().split("|")
                    if len(p) >= 2:
                        stats["balance"] = float(p[0])
                        stats["equity"] = float(p[1])
                    stats["trades"] = [
                        l.strip() for l in lines[1:] if "ORDER" in l
                    ]
            except Exception:
                pass
        await asyncio.sleep(2)


async def scan():
    """Main scanning loop for Forex Majors with AI validation"""
    while True:
        try:
            # Fundamental: DXY
            d_raw = yf.download(
                ["DX-Y.NYB"], period="1d", interval="1m",
                progress=False,
            )
            dxy = d_raw.iloc[-1]["Close"].get("DX-Y.NYB", 100)

            if os.path.exists(PATHS["price"]):
                df = pd.read_csv(PATHS["price"], sep="|", header=None)
                logging.info(
                    "V16.2-SCAN | Active: %d/5 | DXY: %.2f",
                    len(stats["trades"]), dxy,
                )

                for pair in MAJORS:
                    # Risk Shield 1: Global max
                    if len(stats["trades"]) >= MAX_TRADES:
                        break
                    # Risk Shield 2: No duplicate pair
                    if any(pair in t for t in stats["trades"]):
                        continue

                    data = df[df[0] == pair].tail(50)
                    if len(data) < 25:
                        continue

                    prices = data[6].astype(float).values
                    ma10 = np.mean(prices[-10:])
                    ma20 = np.mean(prices[-20:])
                    curr = prices[-1]

                    act, entry = "", 0.0

                    # Momentum BUY
                    if curr > ma10 > ma20 and dxy < 102:
                        act, entry = "BUY_MARKET", curr
                    # Momentum SELL
                    elif curr < ma10 < ma20 and dxy > 98:
                        act, entry = "SELL_MARKET", curr
                    # Retracement BUY LIMIT
                    elif ma10 > ma20 and ma20 < curr < ma10:
                        act, entry = "BUY_LIMIT", ma20
                    # Retracement SELL LIMIT
                    elif ma10 < ma20 and ma10 < curr < ma20:
                        act, entry = "SELL_LIMIT", ma20

                    if act:
                        sc, reason = await get_ai_score(
                            pair, act, entry, ma10, ma20, dxy
                        )
                        if sc >= MIN_AI_SCORE:
                            t = risk_mgr.generate_trade_command(
                                pair, act.split("_")[0], entry,
                                30, 60, 0.70, stats["equity"] or 1000,
                            )
                            lot = max(0.1, round(t["lot"], 2))
                            exp = (
                                int((datetime.now() + timedelta(hours=4)).timestamp())
                                if "LIMIT" in act else 0
                            )
                            with open(PATHS["signal"], "a") as f:
                                f.write(
                                    f"{pair}|{act}|{round(entry,5)}"
                                    f"|{round(t['sl'],5)}|{round(t['tp'],5)}"
                                    f"|{lot}|{exp}\n"
                                )
                            asyncio.create_task(
                                analyze_and_send(
                                    "EXECUTION",
                                    f"🚀 AI APPROVED ({sc}/100)\n"
                                    f"Pair: {pair}\nAction: {act}\nWhy: {reason}",
                                )
                            )
                            logging.info("🏆 APPROVED: %s Score:%d", pair, sc)

            await asyncio.sleep(60)
        except Exception as e:
            logging.error("Scanner Error: %s", e)
            await asyncio.sleep(60)


async def guardian():
    """Reversal Shield: Force closes profitable trades on MA10 cross"""
    while True:
        try:
            if stats["trades"] and os.path.exists(PATHS["price"]):
                df = pd.read_csv(PATHS["price"], sep="|", header=None)
                for trade in stats["trades"]:
                    parts = trade.split("|")
                    if len(parts) < 6:
                        continue
                    t_pair = parts[2]
                    t_type = int(parts[3])
                    t_profit = float(parts[5])

                    if t_profit > 1.0:
                        cl_d = df[df[0] == t_pair].tail(10)
                        if len(cl_d) < 10:
                            continue
                        p = cl_d[6].astype(float).values
                        ma10 = np.mean(p)
                        curr = p[-1]

                        if (t_type == 0 and curr < ma10) or (
                            t_type == 1 and curr > ma10
                        ):
                            with open(PATHS["close"], "a") as cf:
                                cf.write(t_pair + "\n")
                            asyncio.create_task(
                                analyze_and_send(
                                    "REVERSAL",
                                    f"🛡️ V16.2 PROTECT: {t_pair} "
                                    f"closed at profit ${t_profit}",
                                )
                            )
                            logging.info("🛡️ PROTECT: %s closed", t_pair)
            await asyncio.sleep(5)
        except Exception:
            await asyncio.sleep(5)


async def main():
    await asyncio.gather(watchdog(), scan(), guardian())

if __name__ == "__main__":
    asyncio.run(main())
