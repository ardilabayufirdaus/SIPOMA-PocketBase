//+------------------------------------------------------------------+
//|                                         SAC AI TRADE V8.3      |
//|                                  Copyright 2026, AI Commander    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, AI Commander"
#property link      "https://sipoma.online"
#property version   "8.3"
#property strict

extern string SymbolsToWatch = "XAUUSD,EURUSD,GBPUSD,GBPJPY,USDJPY";
extern int CheckIntervalSeconds = 5;
extern double MinMarginLevel = 500.0;
extern bool EnableTrailing = true;
extern double ATR_Multiplier = 1.8;

int OnInit() { EventSetTimer(CheckIntervalSeconds); return(INIT_SUCCEEDED); }
void OnDeinit(const int reason) { EventKillTimer(); }
void OnTimer() { 
   if(IsStopped()) return;
   WriteAccountStats(); 
   WriteAccountHistory();
   CheckForSignals(); 
   CheckForCloseSignals();
   if(EnableTrailing) ApplyTrailingStop();
}

double GetCurrentMarginLevel() {
   if(AccountMargin() > 0) return (AccountEquity() / AccountMargin() * 100.0);
   return 10000.0;
}

void WriteAccountStats() {
   int handle = FileOpen("account_stats.txt", FILE_WRITE|FILE_CSV|FILE_ANSI, "|");
   if(handle != INVALID_HANDLE) {
      FileWrite(handle, AccountBalance(), AccountEquity(), AccountMargin(), AccountFreeMargin(), GetCurrentMarginLevel());
      for(int i=0; i<OrdersTotal(); i++) {
         if(OrderSelect(i, SELECT_BY_POS) && OrderType() <= 1) {
            FileWrite(handle, "ORDER", OrderTicket(), OrderSymbol(), OrderType(), OrderOpenPrice(), OrderProfit());
         }
      }
      FileClose(handle);
   }
}

void WriteAccountHistory() {
   int handle = FileOpen("account_history.txt", FILE_WRITE|FILE_CSV|FILE_ANSI, "|");
   if(handle != INVALID_HANDLE) {
      int history_total = OrdersHistoryTotal();
      int start = MathMax(0, history_total - 100);
      for(int i=history_total-1; i>=start; i--) {
         if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY) && OrderType() <= 1) {
            FileWrite(handle, OrderTicket(), OrderSymbol(), (OrderProfit() > 0 ? "PROFIT" : "LOSS"), OrderOpenPrice(), OrderClosePrice(), OrderProfit(), OrderSymbol());
         }
      }
      FileClose(handle);
   }
}

void CheckForSignals() {
   if(AccountMargin() > 0 && GetCurrentMarginLevel() < MinMarginLevel) return;
   int handle = FileOpen("trades.txt", FILE_READ|FILE_CSV|FILE_ANSI, "|");
   if(handle != INVALID_HANDLE) {
      string pair = FileReadString(handle);
      string action = FileReadString(handle);
      double entry_unused = FileReadNumber(handle);
      double sl_dist_price = FileReadNumber(handle);
      double tp_dist_price = FileReadNumber(handle);
      double risk_percent = FileReadNumber(handle);
      FileClose(handle);
      FileDelete("trades.txt");
      if(pair != "" && action != "") ExecuteTradeV83(pair, action, sl_dist_price, tp_dist_price, risk_percent);
   }
}

void CheckForCloseSignals() {
   int handle = FileOpen("close_signal.txt", FILE_READ|FILE_CSV|FILE_ANSI, "|");
   if(handle != INVALID_HANDLE) {
      string pair_to_close = FileReadString(handle);
      FileClose(handle);
      FileDelete("close_signal.txt");
      if(pair_to_close != "") {
         for(int i=OrdersTotal()-1; i>=0; i--) {
            if(OrderSelect(i, SELECT_BY_POS) && (OrderSymbol() == pair_to_close || pair_to_close == "ALL")) {
               double close_price = OrderType()==OP_BUY?MarketInfo(OrderSymbol(), MODE_BID):MarketInfo(OrderSymbol(), MODE_ASK);
               bool res = OrderClose(OrderTicket(), OrderLots(), close_price, 10, clrOrange);
               if(!res) { /* Silent fail or print error */ }
            }
         }
      }
   }
}

void ExecuteTradeV83(string pair, string action, double sl_dist, double tp_dist, double risk_percent) {
   int type = (action == "BUY_MARKET") ? OP_BUY : ((action == "SELL_MARKET") ? OP_SELL : -1);
   if(type == -1) return;
   
   double price = (type == OP_BUY) ? MarketInfo(pair, MODE_ASK) : MarketInfo(pair, MODE_BID);
   int dg = (int)MarketInfo(pair, MODE_DIGITS);
   
   double sl_val = (type == OP_BUY) ? price - sl_dist : price + sl_dist;
   double tp_val = (type == OP_BUY) ? price + tp_dist : price - tp_dist;
   
   double risk_amount = AccountEquity() * (MathMin(risk_percent, 3.0) / 100.0);
   double tick_val = MarketInfo(pair, MODE_TICKVALUE);
   double tick_size = MarketInfo(pair, MODE_TICKSIZE);
   if(sl_dist <= 0 || tick_val <= 0) return;
   
   double lot = risk_amount / ((sl_dist / tick_size) * tick_val);
   double min_lot = MarketInfo(pair, MODE_MINLOT);
   double max_lot = MarketInfo(pair, MODE_MAXLOT);
   double lot_step = MarketInfo(pair, MODE_LOTSTEP);
   lot = MathMax(min_lot, MathMin(max_lot, NormalizeDouble(lot / lot_step, 0) * lot_step));
   
   if(AccountFreeMarginCheck(pair, type, lot) <= 0) return;
   
   int ticket = OrderSend(pair, type, lot, price, 10, NormalizeDouble(sl_val, dg), NormalizeDouble(tp_val, dg), "SAC AI TRADE V8.3", 0, 0, (type==OP_BUY)?clrBlue:clrRed);
   if(ticket < 0) { /* Silent fail or print error */ }
}

void ApplyTrailingStop() {
   for(int i=OrdersTotal()-1; i>=0; i--) {
      if(OrderSelect(i, SELECT_BY_POS) && OrderType() <= 1) {
         string sym = OrderSymbol();
         double bid = MarketInfo(sym, MODE_BID);
         double ask = MarketInfo(sym, MODE_ASK);
         int dg = (int)MarketInfo(sym, MODE_DIGITS);
         double ts_dist = iATR(sym, PERIOD_H1, 14, 0) * ATR_Multiplier;

         if(OrderType() == OP_BUY && bid - OrderOpenPrice() > ts_dist) {
            if(OrderStopLoss() < bid - ts_dist) {
               bool res = OrderModify(OrderTicket(), OrderOpenPrice(), NormalizeDouble(bid - ts_dist, dg), OrderTakeProfit(), 0, clrNONE);
               if(!res) { /* Handle error */ }
            }
         }
         if(OrderType() == OP_SELL && OrderOpenPrice() - ask > ts_dist) {
            if(OrderStopLoss() > ask + ts_dist || OrderStopLoss() == 0) {
               bool res = OrderModify(OrderTicket(), OrderOpenPrice(), NormalizeDouble(ask + ts_dist, dg), OrderTakeProfit(), 0, clrNONE);
               if(!res) { /* Handle error */ }
            }
         }
      }
   }
}
