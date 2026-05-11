from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.sql import func
from core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    symbol = Column(String(10), nullable=False)
    
    # Prediction details
    model_used = Column(String(50), nullable=False)  # lstm, xgboost, prophet, ensemble
    predicted_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=True)
    
    # Price targets
    price_target_low = Column(Float, nullable=True)
    price_target_high = Column(Float, nullable=True)
    
    # Prediction period
    days_ahead = Column(Integer, default=7)
    prediction_date = Column(DateTime, nullable=False)
    
    # Additional data
    features_used = Column(JSON, nullable=True)
    model_metrics = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    progress = Column(Integer, default=0)
    accuracy = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())