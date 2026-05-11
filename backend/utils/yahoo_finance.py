import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor
import aiohttp
import json

class YahooFinanceService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.base_url = "https://query1.finance.yahoo.com/v1/finance/search"
    
    async def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks by symbol or name using Yahoo Finance API"""
        cache_key = f"stock_search:{query}"
        
        try:
            # Use Yahoo Finance search API
            url = f"{self.base_url}?q={query}&lang=en-US&region=US"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
                    
                    results = []
                    if 'quotes' in data:
                        for quote in data['quotes'][:20]:  # Limit to 20 results
                            if quote.get('quoteType') in ['EQUITY', 'ETF', 'MUTUALFUND']:
                                results.append({
                                    'symbol': quote.get('symbol', ''),
                                    'name': quote.get('longname') or quote.get('shortname', ''),
                                    'type': quote.get('quoteType', 'EQUITY'),
                                    'exchange': quote.get('exchange', 'NASDAQ'),
                                    'sector': quote.get('sector', 'Unknown'),
                                    'industry': quote.get('industry', 'Unknown')
                                })
                    return results
        except Exception as e:
            print(f"Search error for {query}: {e}")
            return []
    
    async def get_all_trending_stocks(self) -> List[Dict]:
        """Get trending stocks from Yahoo Finance"""
        cache_key = "trending_stocks"
        
        try:
            # Get trending stocks using Yahoo Finance
            url = "https://finance.yahoo.com/trending-tickers"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    html = await response.text()
                    
                    # Parse trending symbols from HTML (simplified)
                    # For production, use proper HTML parsing
                    trending_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 
                                       'NVDA', 'JPM', 'V', 'WMT', 'JNJ', 'PG', 'HD', 
                                       'DIS', 'NFLX', 'ADBE', 'CRM', 'AMD', 'INTC', 'PYPL']
                    
                    results = []
                    for symbol in trending_symbols:
                        quote = await self.get_quote(symbol)
                        if quote:
                            results.append(quote)
                    
                    return results
        except Exception as e:
            print(f"Error getting trending stocks: {e}")
            return []
    
    async def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get real-time quote for a stock"""
        cache_key = f"stock_quote:{symbol}"
        
        try:
            loop = asyncio.get_event_loop()
            ticker = await loop.run_in_executor(
                self.executor,
                lambda: yf.Ticker(symbol.upper())
            )
            
            info = await loop.run_in_executor(
                self.executor,
                lambda: ticker.info
            )
            
            if info:
                # Get current price
                history = await loop.run_in_executor(
                    self.executor,
                    lambda: ticker.history(period="1d")
                )
                
                current_price = info.get('currentPrice') or info.get('regularMarketPrice')
                previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
                
                change = None
                change_percent = None
                if current_price and previous_close:
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100
                
                return {
                    'symbol': symbol.upper(),
                    'name': info.get('longName') or info.get('shortName') or symbol,
                    'current_price': current_price,
                    'change': change,
                    'change_percent': change_percent,
                    'day_high': info.get('dayHigh'),
                    'day_low': info.get('dayLow'),
                    'volume': info.get('volume'),
                    'market_cap': info.get('marketCap'),
                    'sector': info.get('sector'),
                    'industry': info.get('industry'),
                    'exchange': info.get('exchange'),
                    'prev_close': previous_close
                }
            return None
        except Exception as e:
            print(f"Error getting quote for {symbol}: {e}")
            return None
    
    async def get_historical_prices(
        self, 
        symbol: str, 
        period: str = "1mo",
        interval: str = "1d"
    ) -> pd.DataFrame:
        """Get historical price data"""
        try:
            loop = asyncio.get_event_loop()
            ticker = await loop.run_in_executor(
                self.executor,
                lambda: yf.Ticker(symbol.upper())
            )
            
            history = await loop.run_in_executor(
                self.executor,
                lambda: ticker.history(period=period, interval=interval)
            )
            
            return history
        except Exception as e:
            print(f"Error getting historical data for {symbol}: {e}")
            return pd.DataFrame()
    
    async def get_multiple_quotes(self, symbols: List[str]) -> Dict:
        """Get quotes for multiple stocks"""
        results = {}
        tasks = [self.get_quote(symbol) for symbol in symbols]
        quotes = await asyncio.gather(*tasks)
        
        for symbol, quote in zip(symbols, quotes):
            if quote:
                results[symbol] = quote
        
        return results

yahoo_service = YahooFinanceService()