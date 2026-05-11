from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from routes.auth_routes import get_current_active_user
from models.user import User
from services.stock_service import stock_service
from schemas.stock_schema import StockResponse

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("/")
async def get_watchlist(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's watchlist with real-time prices"""
    stocks = await stock_service.get_watchlist_stocks(db, current_user.id)
    return {"success": True, "data": stocks}


@router.post("/{symbol}")
async def add_to_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add stock to watchlist"""
    watchlist = await stock_service.add_to_watchlist(db, current_user.id, symbol)
    return {"success": True, "message": f"Added {symbol} to watchlist"}


@router.delete("/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove stock from watchlist"""
    result = await stock_service.remove_from_watchlist(db, current_user.id, symbol)
    
    if not result:
        raise HTTPException(status_code=404, detail="Stock not in watchlist")
    
    return {"success": True, "message": f"Removed {symbol} from watchlist"}