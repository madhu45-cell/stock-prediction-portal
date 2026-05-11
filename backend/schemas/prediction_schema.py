from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class PredictionRequest(BaseModel):
    symbol: str
    days_ahead: int = 7
    model: str = "ensemble"  # lstm, xgboost, prophet, ensemble

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_price: float
    confidence_score: float
    price_target_low: Optional[float] = None
    price_target_high: Optional[float] = None
    model_used: str
    days_ahead: int
    prediction_date: datetime
    historical_prices: Optional[List[float]] = None
    predicted_prices: Optional[List[float]] = None

class TrainingStatusResponse(BaseModel):
    symbol: str
    model_type: str
    status: str
    progress: int
    accuracy: Optional[float] = None
    error_message: Optional[str] = None