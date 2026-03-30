// --- V16.0 OMNI-PREDATOR BRIDGE EA (INSTITUTIONAL MAJOR EDITION) ---
#property copyright "SIPOMA V16.0"
#property link      "https://sipoma.online"
#property version   "16.0"
#property strict

extern string SignalFile = "signals.txt";
extern string StatsFile = "account_stats.txt";
extern string PriceFile = "price_data.txt";
extern string ModifyFile = "modify.txt";
extern string CloseFile = "close.txt";
extern string SpecsFile = "symbol_specs.txt";

// LIST MAJOR ONLY
string majors[] = {"EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD"};

int OnInit() {
   EventSetTimer(1);
   Print("SAC V16.0: Institutional Bridge Active - Focusing FOREX MAJOR");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   EventKillTimer();
}

void OnTimer() {
   WriteAccountStats();
   WritePriceData();
   WriteSymbolSpecs();
   CheckForSignals();
   ProcessModifications();
   ProcessClosures();
}

void WriteAccountStats() {
   int handle = FileOpen(StatsFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      FileWrite(handle, AccountBalance(), AccountEquity(), AccountMargin(), AccountFreeMargin(), AccountStopoutLevel());
      for(int i=0; i<OrdersTotal(); i++) {
         if(OrderSelect(i, SELECT_BY_POS)) {
            FileWrite(handle, "ORDER", OrderTicket(), OrderSymbol(), OrderType(), OrderOpenPrice(), OrderProfit(), OrderStopLoss(), OrderTakeProfit());
         }
      }
      FileClose(handle);
   }
}

void WritePriceData() {
   int handle = FileOpen(PriceFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      for(int j=0; j<ArraySize(majors); j++) {
         string s = majors[j];
         // V16.0: Mengirimkan 50 Bar Historis agar Brain bisa hitung MA/RSI
         for(int i=49; i>=0; i--) {
            FileWrite(handle, s, "M5", iOpen(s,5,i), iHigh(s,5,i), iLow(s,5,i), iClose(s,5,i), iVolume(s,5,i), TimeToStr(iTime(s,5,i)));
         }
      }
      FileClose(handle);
   }
}

void WriteSymbolSpecs() {
   int handle = FileOpen(SpecsFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      for(int j=0; j<ArraySize(majors); j++) {
         string s = majors[j];
         FileWrite(handle, s,
            (int)MarketInfo(s, MODE_DIGITS),
            MarketInfo(s, MODE_POINT),
            MarketInfo(s, MODE_MINLOT),
            MarketInfo(s, MODE_LOTSTEP),
            MarketInfo(s, MODE_TICKVALUE),
            MarketInfo(s, MODE_TICKSIZE),
            (int)MarketInfo(s, MODE_STOPLEVEL),
            MarketInfo(s, MODE_ASK),
            MarketInfo(s, MODE_BID),
            (int)MarketInfo(s, MODE_SPREAD)
         );
      }
      FileClose(handle);
   }
}

void CheckForSignals() {
   int handle = FileOpen(SignalFile, FILE_READ|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      while(!FileIsEnding(handle)) {
         string p = FileReadString(handle);
         string a = FileReadString(handle);
         double entry = FileReadNumber(handle);
         double sl_val = FileReadNumber(handle);
         double tp_val = FileReadNumber(handle);
         double lot = FileReadNumber(handle);
         int exp_ts = (int)FileReadNumber(handle);
         
         if(StringLen(p) > 2) {
            datetime exp = (exp_ts > 0) ? (datetime)exp_ts : 0;
            Print("SAC V16.0: Massive Signal -> ", a, " ", p);
            ExecuteTrade(p, a, entry, sl_val, tp_val, lot, exp);
         }
      }
      FileClose(handle);
      FileDelete(SignalFile);
   }
}

void ExecuteTrade(string pair, string action, double entry, double sl, double tp, double lot, datetime exp) {
   int type = -1;
   bool isPending = false;
   if(action == "BUY_MARKET")  type = OP_BUY;
   if(action == "SELL_MARKET") type = OP_SELL;
   if(action == "BUY_LIMIT")   { type = OP_BUYLIMIT;  isPending = true; }
   if(action == "SELL_LIMIT")  { type = OP_SELLLIMIT; isPending = true; }
   if(action == "BUY_STOP")    { type = OP_BUYSTOP;   isPending = true; }
   if(action == "SELL_STOP")   { type = OP_SELLSTOP;  isPending = true; }
   
   if(type == -1) return;
   
   double price = entry;
   if(!isPending) price = (type == OP_BUY) ? MarketInfo(pair, MODE_ASK) : MarketInfo(pair, MODE_BID);
   
   double min_lot = MarketInfo(pair, MODE_MINLOT);
   double max_lot = MarketInfo(pair, MODE_MAXLOT);
   double lot_step = MarketInfo(pair, MODE_LOTSTEP);
   if(lot_step <= 0) lot_step = 0.01; 
   
   double final_lot = MathMax(min_lot, MathMin(max_lot, NormalizeDouble(lot / lot_step, 0) * lot_step));
   
   int digits = (int)MarketInfo(pair, MODE_DIGITS);
   price = NormalizeDouble(price, digits);
   sl = NormalizeDouble(sl, digits);
   tp = NormalizeDouble(tp, digits);
   
   int ticket = OrderSend(pair, type, final_lot, price, 10, sl, tp, "SAC V16.0", 0, exp, clrAliceBlue);
   if(ticket > 0) Print("SAC V16.0: SUCCESS ", action, " ", pair, " #", ticket);
   else Print("SAC V16.0: FAILED Error=", GetLastError());
}

void ProcessModifications() {
   int handle = FileOpen(ModifyFile, FILE_READ|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      while(!FileIsEnding(handle)) {
         int ticket = (int)FileReadNumber(handle);
         double new_sl = FileReadNumber(handle);
         double new_tp = FileReadNumber(handle);
         if(OrderSelect(ticket, SELECT_BY_TICKET)) {
            if(OrderStopLoss() != new_sl || OrderTakeProfit() != new_tp) {
               if(!OrderModify(ticket, OrderOpenPrice(), new_sl, new_tp, 0, clrBlue))
                  Print("SAC V16.0: Modify FAILED Error=", GetLastError());
            }
         }
      }
      FileClose(handle);
      FileDelete(ModifyFile);
   }
}

void ProcessClosures() {
   int handle = FileOpen(CloseFile, FILE_READ|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      while(!FileIsEnding(handle)) {
         string pair = FileReadString(handle);
         for(int i=OrdersTotal()-1; i>=0; i--) {
            if(OrderSelect(i, SELECT_BY_POS)) {
               if(OrderSymbol() == pair) {
                  if(OrderType() > 1) {
                     if(!OrderDelete(OrderTicket())) Print("SAC V16.0: Delete FAILED Error=", GetLastError());
                  } else {
                     double p = (OrderType() == OP_BUY) ? MarketInfo(pair, MODE_BID) : MarketInfo(pair, MODE_ASK);
                     if(!OrderClose(OrderTicket(), OrderLots(), p, 10, clrRed)) Print("SAC V16.0: Close FAILED Error=", GetLastError());
                  }
               }
            }
         }
      }
      FileClose(handle);
      FileDelete(CloseFile);
   }
}
