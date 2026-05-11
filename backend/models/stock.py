from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.sql import func
from core.database import Base

class Stock(Base):
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    sector = Column(String(100), nullable=True)
    industry = Column(String(100), nullable=True)
    market_cap = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    prev_close = Column(Float, nullable=True)
    day_high = Column(Float, nullable=True)
    day_low = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    change = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    last_updated = Column(DateTime, onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        Index('idx_symbol', 'symbol'),
    )

class StockPrice(Base):
    __tablename__ = "stock_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, nullable=False, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    date = Column(DateTime, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        Index('idx_stock_date', 'stock_id', 'date'),
        Index('idx_symbol_date', 'symbol', 'date'),
    )