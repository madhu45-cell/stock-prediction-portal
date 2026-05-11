import asyncio
import pandas as pd
import yfinance as yf
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from models.stock import Stock, StockPrice
from models.watchlist import Watchlist
from models.prediction import Prediction
from utils.yahoo_finance import yahoo_service
from utils.redis_cache import redis_cache
from utils.logger import logger

class StockService:
    
    CACHE_PREFIX = "stock:"
    CACHE_TTL = 60  # 1 minute for real-time data
    
    # ============ EXISTING METHODS ============
    
    async def get_or_create_stock(self, db: Session, symbol: str) -> Optional[Stock]:
        """Get stock from DB or create if not exists using Yahoo Finance API"""
        
        stock = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
        
        if stock:
            return stock
        
        quote_data = await yahoo_service.get_quote(symbol)
        
        if quote_data:
            stock = Stock(
                symbol=quote_data['symbol'],
                name=quote_data.get('name', symbol),
                sector=quote_data.get('sector'),
                industry=quote_data.get('industry'),
                market_cap=quote_data.get('market_cap'),
                current_price=quote_data.get('current_price'),
                prev_close=quote_data.get('prev_close'),
                day_high=quote_data.get('day_high'),
                day_low=quote_data.get('day_low'),
                volume=quote_data.get('volume'),
                change=quote_data.get('change'),
                change_percent=quote_data.get('change_percent')
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
            logger.info(f"Added new stock to database: {symbol}")
            return stock
        
        logger.warning(f"Could not fetch stock data for {symbol}")
        return None
    
    async def get_extended_historical_data(self, symbol: str, period: str = "2y") -> pd.DataFrame:
        """Get extended historical data for accurate predictions"""
        try:
            loop = asyncio.get_event_loop()
            ticker = await loop.run_in_executor(
                None,
                lambda: yf.Ticker(symbol.upper())
            )
            
            # Get historical data - 2 years for better training
            history = await loop.run_in_executor(
                None,
                lambda: ticker.history(period=period, interval="1d")
            )
            
            if history.empty:
                logger.warning(f"No historical data found for {symbol}")
                return pd.DataFrame()
            
            # Ensure column names are standardized
            history.columns = [col.capitalize() for col in history.columns]
            
            logger.info(f"Retrieved {len(history)} days of historical data for {symbol}")
            return history
            
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            return pd.DataFrame()
    
    async def get_real_time_price(self, symbol: str) -> Optional[Dict]:
        """Get real-time stock price with caching"""
        cache_key = f"{self.CACHE_PREFIX}{symbol}"
        
        cached = redis_cache.get(cache_key)
        if cached:
            return cached
        
        data = await yahoo_service.get_quote(symbol)
        if data:
            redis_cache.set(cache_key, data, self.CACHE_TTL)
        
        return data
    
    async def update_stock_prices(self, db: Session, symbols: List[str]):
        """Update stock prices in database"""
        for symbol in symbols:
            data = await self.get_real_time_price(symbol)
            if data:
                stock = await self.get_or_create_stock(db, symbol)
                if stock:
                    stock.current_price = data.get('current_price')
                    stock.prev_close = data.get('prev_close')
                    stock.day_high = data.get('day_high')
                    stock.day_low = data.get('day_low')
                    stock.volume = data.get('volume')
                    stock.change = data.get('change')
                    stock.change_percent = data.get('change_percent')
                    stock.last_updated = datetime.utcnow()
                    
                    price_history = StockPrice(
                        stock_id=stock.id,
                        symbol=stock.symbol,
                        date=datetime.utcnow(),
                        open=data.get('current_price'),
                        high=data.get('day_high'),
                        low=data.get('day_low'),
                        close=data.get('current_price'),
                        volume=data.get('volume')
                    )
                    db.add(price_history)
            
            db.commit()
    
    async def get_price_history(
        self, 
        db: Session, 
        symbol: str, 
        period: str = "1mo",
        interval: str = "1d"
    ) -> List[Dict]:
        """Get historical price data from Yahoo Finance"""
        cache_key = f"{self.CACHE_PREFIX}history:{symbol}:{period}:{interval}"
        
        cached = redis_cache.get(cache_key)
        if cached:
            return cached
        
        df = await yahoo_service.get_historical_prices(symbol, period, interval)
        
        if df.empty:
            stock = await self.get_or_create_stock(db, symbol)
            if stock:
                prices = db.query(StockPrice).filter(
                    StockPrice.stock_id == stock.id
                ).order_by(desc(StockPrice.date)).limit(100).all()
                
                history = [{
                    'date': p.date,
                    'open': p.open,
                    'high': p.high,
                    'low': p.low,
                    'close': p.close,
                    'volume': p.volume
                } for p in prices]
            else:
                history = []
        else:
            df = df.reset_index()
            history = []
            for _, row in df.iterrows():
                history.append({
                    'date': row['Date'].isoformat() if hasattr(row['Date'], 'isoformat') else str(row['Date']),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                })
        
        redis_cache.set(cache_key, history, 3600)
        return history
    
    async def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks using Yahoo Finance"""
        return await yahoo_service.search_stocks(query)
    
    async def get_watchlist_stocks(self, db: Session, user_id: int) -> List[Dict]:
        """Get user's watchlist with real-time prices"""
        watchlist = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.is_active == True
        ).all()
        
        stocks = []
        for item in watchlist:
            stock = db.query(Stock).filter(Stock.id == item.stock_id).first()
            if stock:
                price_data = await self.get_real_time_price(stock.symbol)
                if price_data:
                    stocks.append(price_data)
        
        return stocks
    
    async def add_to_watchlist(
        self, 
        db: Session, 
        user_id: int, 
        symbol: str
    ) -> Optional[Watchlist]:
        """Add stock to user's watchlist"""
        stock = await self.get_or_create_stock(db, symbol)
        
        if not stock:
            return None
        
        existing = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.stock_id == stock.id
        ).first()
        
        if existing:
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            db.commit()
            return existing
        
        watchlist = Watchlist(
            user_id=user_id,
            stock_id=stock.id,
            symbol=stock.symbol
        )
        db.add(watchlist)
        db.commit()
        db.refresh(watchlist)
        
        return watchlist
    
    async def remove_from_watchlist(
        self, 
        db: Session, 
        user_id: int, 
        symbol: str
    ) -> bool:
        """Remove stock from user's watchlist"""
        stock = await self.get_or_create_stock(db, symbol)
        
        if not stock:
            return False
        
        result = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.stock_id == stock.id
        ).update({"is_active": False})
        
        db.commit()
        return result > 0
    
    # ============ SYNC METHODS FOR CELERY ============
    
    def get_price_history_sync(self, db: Session, symbol: str, period: str = "1y") -> List[Dict]:
        """Synchronous version for Celery tasks"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            self.get_price_history(db, symbol, period)
        )
    
    def update_stock_prices_sync(self, db: Session, symbols: List[str]):
        """Synchronous version for Celery tasks"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            self.update_stock_prices(db, symbols)
        )


stock_service = StockService()