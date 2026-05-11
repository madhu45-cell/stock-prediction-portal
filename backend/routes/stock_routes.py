from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from routes.auth_routes import get_current_active_user
from models.user import User
from services.stock_service import stock_service
from utils.yahoo_finance import yahoo_service

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("/search")
async def search_stocks(
    query: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_active_user)
):
    """Search for stocks by symbol or name - Returns REAL data from Yahoo Finance"""
    results = await yahoo_service.search_stocks(query)
    return {"success": True, "results": results}


@router.get("/trending")
async def get_trending_stocks(
    current_user: User = Depends(get_current_active_user)
):
    """Get trending stocks with real-time data"""
    results = await yahoo_service.get_all_trending_stocks()
    return {"success": True, "data": results}


@router.get("/{symbol}")
async def get_stock_detail(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed stock information from Yahoo Finance"""
    stock_data = await yahoo_service.get_quote(symbol)
    
    if not stock_data:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Get historical data for chart
    history_df = await yahoo_service.get_historical_prices(symbol, period="1mo")
    
    history = []
    if not history_df.empty:
        history_df = history_df.reset_index()
        for _, row in history_df.iterrows():
            history.append({
                'date': row['Date'].isoformat(),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume'])
            })
    
    stock_data['price_history'] = history
    
    return {"success": True, "data": stock_data}


@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", regex="^(1m|5m|15m|30m|1h|1d|1wk)$"),
    current_user: User = Depends(get_current_active_user)
):
    """Get historical price data from Yahoo Finance"""
    df = await yahoo_service.get_historical_prices(symbol, period, interval)
    
    if df.empty:
        return {"success": True, "data": []}
    
    df = df.reset_index()
    history = []
    for _, row in df.iterrows():
        history.append({
            'date': row['Date'].isoformat(),
            'open': float(row['Open']),
            'high': float(row['High']),
            'low': float(row['Low']),
            'close': float(row['Close']),
            'volume': int(row['Volume'])
        })
    
    return {"success": True, "data": history}


@router.get("/{symbol}/realtime")
async def get_realtime_price(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get real-time stock price from Yahoo Finance"""
    data = await yahoo_service.get_quote(symbol)
    
    if not data:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    return {"success": True, "data": data}