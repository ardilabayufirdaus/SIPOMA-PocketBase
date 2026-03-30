import os
import pandas as pd

class ReportEngine:
    def __init__(self):
        self.history_file = '/home/rog/.mt4/drive_c/Program Files (x86)/MetaTrader 4/MQL4/Files/account_history.txt'

    def calculate_stats(self, balance, equity, open_trades=[]):
        # 1. ALL-TIME HISTORY STATS
        history = []
        if os.path.exists(self.history_file):
            try:
                # Format: Ticket|Symbol|Type|Lots|Profit|OpenTime|CloseTime
                history = pd.read_csv(self.history_file, sep='|', header=None).values.tolist()
            except: pass

        wins = [t[4] for t in history if t[4] > 0]
        losses = [t[4] for t in history if t[4] <= 0]
        
        total_trades = len(history)
        win_rate = round((len(wins) / total_trades * 100), 2) if total_trades > 0 else 0
        
        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
        
        # 2. EXPOSURE & RISK
        total_lots = 0
        for t in open_trades:
            try:
                # Format: ORDER|Ticket|Symbol|Type|Price|Profit|SL|TP
                p = t.split('|')
                total_lots += float(p[4])
            except: pass
        
        exposure = round(total_lots, 2)
        risk_pct = round((total_lots * 100) / (balance / 1000), 2) if balance > 0 else 0 # Hypothetical risk scoring

        # 3. DRAWDOWN (Current vs All-Time High estimation)
        # We don't have full equity curve, so we estimate DD from Balance vs Equity
        current_dd = round(((balance - equity) / balance * 100), 2) if balance > 0 and equity < balance else 0

        return {
            'all_time_wr': win_rate,
            'profit_factor': profit_factor,
            'total_history': total_trades,
            'equity': round(equity, 2),
            'balance': round(balance, 2),
            'exposure_lots': exposure,
            'current_dd': current_dd,
            'net_profit': round(gross_profit - gross_loss, 2)
        }

    def format_telegram(self, stats):
        template = (
            "🏦 INSTITUTIONAL ACCOUNT AUDIT\n"
            "──────────────────\n"
            "📊 Win Rate (All-Time): {}%\n"
            "⚖️ Profit Factor: {}\n"
            "💰 Net Profit: ${}\n"
            "🔥 History Analyzed: {} trades\n"
            "──────────────────\n"
            " Equity: ${}\n"
            "🏦 Balance: ${}\n"
            "⚠️ Current Drawdown: {}%\n"
            "──────────────────\n"
            "🚀 Total Exposure: {} Lots"
        )
        return template.format(
            stats['all_time_wr'], stats['profit_factor'], stats['net_profit'],
            stats['total_history'], stats['equity'], stats['balance'],
            stats['current_dd'], stats['exposure_lots']
        )

report_engine = ReportEngine()
