from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StockBase(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class StockResponse(StockBase):
    id: int
    current_price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    market_cap: Optional[float] = None
    volume: Optional[int] = None
    last_updated: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StockPriceHistory(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockDetailResponse(StockResponse):
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    prev_close: Optional[float] = None
    price_history: Optional[List[StockPriceHistory]] = None

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    type: str
    exchange: str