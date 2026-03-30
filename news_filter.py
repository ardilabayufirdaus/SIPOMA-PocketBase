#!/usr/bin/env python3
"""
SAC-NEWS-FILTER-V13.1: News Blackout Guardian
- Forex Factory High Impact (Red) Events
- Block 30min BEFORE + 5min AFTER
- USD/JPY/EUR/GBP/AUD/CAD/CHF + XAUUSD focus
"""

import os
import logging
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import time
import json
from typing import Tuple

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - NEWS - %(message)s')
logger = logging.getLogger(__name__)

class NewsFilter:
    def __init__(self):
        self.blocked_until = None
        self.high_impact_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'XAU']
        self.block_window_pre = timedelta(minutes=30)
        self.block_window_post = timedelta(minutes=5)
        
    def is_high_impact(self, event):
        """Check if event is High Impact (red)"""
        impact_selectors = [
            'high-impact', 'impact_high', '.highImpact', 
            'impact-high', 'red', 'high'
        ]
        soup = BeautifulSoup(event, 'html.parser')
        for selector in impact_selectors:
            if soup.select_one(selector):
                return True
        # Fallback: check text/color
        text = soup.get_text().lower()
        if any(word in text for word in ['high', 'red', 'high impact']):
            return True
        return False

    def parse_forex_factory(self) -> list:
        """Scrape today's high impact events"""
        try:
            url = 'https://www.forexfactory.com/calendar'
            headers = {
                'User-Agent': 'Mozilla/5.0 (SAC-NewsFilter/13.1)'
            }
            resp = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            events = []
            calendar_table = soup.find('table', class_='calendar__table')
            if calendar_table:
                rows = calendar_table.find_all('tr', class_='calendar__row')
                now = datetime.utcnow()
                
                for row in rows:
                    impact_cell = row.find('td', class_='calendar__impact')
                    if impact_cell and self.is_high_impact(impact_cell):
                        currency = row.find('td', class_='calendar__currency').get_text().strip()
                        time_str = row.find('td', class_='calendar__time').get_text().strip()
                        event_name = row.find('td', class_='calendar__event').get_text().strip()
                        
                        # Parse time (simplified)
                        try:
                            event_time = datetime.strptime(time_str, '%H:%M').replace(
                                year=now.year, month=now.month, day=now.day
                            )
                            if any(curr in currency for curr in self.high_impact_currencies):
                                events.append({
                                    'currency': currency,
                                    'time': event_time,
                                    'name': event_name,
                                    'impact': 'HIGH'
                                })
                        except:
                            pass
            
            logger.info(f"Found {len(events)} high impact events")
            return events
            
        except Exception as e:
            logger.error(f"Forex Factory scrape failed: {e}")
            return []

    def should_block_trading(self) -> Tuple[bool, str]:
        """Main filter logic"""
        events = self.parse_forex_factory()
        now = datetime.utcnow()
        
        for event in events:
            event_start = event['time']
            block_start = event_start - self.block_window_pre
            block_end = event_start + self.block_window_post
            
            if block_start <= now <= block_end:
                reason = f"News Blackout: {event['name']} ({event['currency']}) until {block_end}"
                self.blocked_until = block_end
                logger.warning(reason)
                return True, reason
        
        self.blocked_until = None
        return False, "Trading OK"

    def get_status(self) -> dict:
        """Status for BRAIN integration"""
        blocked, reason = self.should_block_trading()
        return {
            'blocked': blocked,
            'until': self.blocked_until.isoformat() if self.blocked_until else None,
            'reason': reason
        }

# Global instance
news_filter = NewsFilter()

if __name__ == "__main__":
    blocked, reason = news_filter.should_block_trading()
    print(f"BLOCKED: {blocked} - {reason}")
    print(json.dumps(news_filter.get_status(), indent=2))