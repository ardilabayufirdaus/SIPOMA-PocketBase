#property copyright "Copyright 2026, SAC ELITE"
#property version "16.10"
#property strict

// Kita hapus extern statis, kita buat dinamis di OnInit
string SignalFile, PriceFile, MultiTFFile, StatsFile, CloseFile, ModifyFile, HistoryFile;
extern int HistoryLimit = 500;

int OnInit() { 
   string p = Symbol();
   SignalFile = "signals_" + p + ".txt";
   PriceFile  = "price_data_" + p + ".txt";
   MultiTFFile = "multi_tf_data_" + p + ".txt";
   StatsFile  = "account_stats_" + p + ".txt";
   CloseFile  = "close_" + p + ".txt";
   ModifyFile = "modify_" + p + ".txt";
   HistoryFile = "account_history_" + p + ".txt";
   
   EventSetTimer(1); 
   return(INIT_SUCCEEDED); 
}

void OnDeinit(const int reason) { EventKillTimer(); }

void OnTimer() {
   ExportPrices();
   ExportStats();
   ProcessSignals();
   ProcessModifications();
   ProcessClosures();
   
   static datetime lastHist = 0;
   if(TimeCurrent() - lastHist > 300) { ExportHistory(); lastHist = TimeCurrent(); }
   
   static datetime lastMTF = 0;
   if(TimeCurrent() - lastMTF > 60) { ExportMultiTFData(); lastMTF = TimeCurrent(); }
}

void ExportMultiTFData() {
   int tf_list[] = {1, 5, 15, 30, 60, 240, 1440};
   int handle = FileOpen(MultiTFFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      string pair = Symbol();
      FileWrite(handle, "HEADER", pair, TimeToStr(TimeCurrent()));
      for(int i=0; i<ArraySize(tf_list); i++) {
         int tf = tf_list[i];
         for(int j=0; j<250; j++) {
            FileWrite(handle, tf, iOpen(pair, tf, j), iHigh(pair, tf, j), iLow(pair, tf, j), iClose(pair, tf, j), TimeToStr(iTime(pair, tf, j)));
         }
      }
      FileClose(handle);
   }
}

void ExportPrices() {
   int handle = FileOpen(PriceFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      string pair = Symbol();
      FileWrite(handle, pair, "M5", iOpen(pair,5,0), iHigh(pair,5,0), iLow(pair,5,0), iClose(pair,5,0), iVolume(pair,5,0), TimeToStr(TimeCurrent()));
      for(int i=1; i<100; i++) {
         FileWrite(handle, pair, "M5", iOpen(pair,5,i), iHigh(pair,5,i), iLow(pair,5,i), iClose(pair,5,i), iVolume(pair,5,i), TimeToStr(iTime(pair,5,i)));
      }
      FileClose(handle);
   }
}

void ExportStats() {
   int handle = FileOpen(StatsFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      FileWrite(handle, AccountBalance(), AccountEquity(), AccountMargin(), AccountFreeMargin(), AccountStopoutLevel());
      for(int i=0; i<OrdersTotal(); i++) {
         if(OrderSelect(i, SELECT_BY_POS)) {
            if(OrderSymbol() == Symbol()) {
               FileWrite(handle, "ORDER", OrderTicket(), OrderSymbol(), OrderType(), OrderOpenPrice(), OrderProfit(), OrderStopLoss(), OrderTakeProfit());
            }
         }
      }
      FileClose(handle);
   }
}

void ExportHistory() {
   int handle = FileOpen(HistoryFile, FILE_WRITE|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      int total = OrdersHistoryTotal();
      int count = 0;
      for(int i=total-1; i>=0 && count<HistoryLimit; i--) {
         if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if(OrderSymbol() == Symbol() && OrderType() <= 1) {
               FileWrite(handle, OrderTicket(), OrderSymbol(), OrderType(), OrderLots(), OrderProfit(), TimeToStr(OrderOpenTime()), TimeToStr(OrderCloseTime()));
               count++;
            }
         }
      }
      FileClose(handle);
   }
}

void ProcessSignals() {
   int h = FileOpen(SignalFile, FILE_READ|FILE_CSV|FILE_ANSI, '|');
   if(h != INVALID_HANDLE) {
      while(!FileIsEnding(h)) {
         string pair = FileReadString(h);
         string act = FileReadString(h);
         double entry = FileReadNumber(h);
         double sl = FileReadNumber(h);
         double tp = FileReadNumber(h);
         double lot = FileReadNumber(h);
         string comment = FileReadString(h);
         if(pair != "" && pair == Symbol()) {
            int type = (act == "BUY_MARKET") ? OP_BUY : OP_SELL;
            double p = (type == OP_BUY) ? MarketInfo(pair, MODE_ASK) : MarketInfo(pair, MODE_BID);
            if(OrderSend(pair, type, lot, p, 10, sl, tp, (comment == "" ? "SAC" : comment), 0, 0, (type == OP_BUY ? clrBlue : clrRed)) < 0) {
               Print("Entry Err:", GetLastError());
            }
         }
      }
      FileClose(h);
      FileDelete(SignalFile);
   }
}

void ProcessModifications() {
   int handle = FileOpen(ModifyFile, FILE_READ|FILE_CSV|FILE_ANSI, '|');
   if(handle != INVALID_HANDLE) {
      while(!FileIsEnding(handle)) {
         int ticket = (int)FileReadNumber(handle);
         double nsl = FileReadNumber(handle);
         double ntp = FileReadNumber(handle);
         if(OrderSelect(ticket, SELECT_BY_TICKET)) {
            if(OrderSymbol() == Symbol() && (OrderStopLoss() != nsl || OrderTakeProfit() != ntp)) {
               if(!OrderModify(ticket, OrderOpenPrice(), nsl, ntp, 0, clrBlue)) Print("Mod Err");
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
         if(pair == Symbol()) {
            for(int i=OrdersTotal()-1; i>=0; i--) {
               if(OrderSelect(i, SELECT_BY_POS)) {
                  if(OrderSymbol() == pair) {
                     if(OrderType() > 1) { if(!OrderDelete(OrderTicket())) Print("Del Err"); }
                     else { 
                        double p = (OrderType() == OP_BUY) ? MarketInfo(pair, MODE_BID) : MarketInfo(pair, MODE_ASK);
                        if(!OrderClose(OrderTicket(), OrderLots(), p, 10, clrRed)) Print("Cls Err"); 
                     }
                  }
               }
            }
         }
      }
      FileClose(handle);
      FileDelete(CloseFile);
   }
}
