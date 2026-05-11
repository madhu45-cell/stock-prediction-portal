from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, Boolean, String, Float
from sqlalchemy.sql import func
from core.database import Base

class Watchlist(Base):
    __tablename__ = "watchlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    symbol = Column(String(10), nullable=False)
    alert_price = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('user_id', 'stock_id', name='unique_user_stock'),
    )