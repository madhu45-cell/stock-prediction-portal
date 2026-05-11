from celery import Task
from tasks.celery_app import celery_app
from services.ml.ensemble_model import ensemble_model
from services.stock_service import stock_service
from utils.redis_cache import redis_cache
from core.database import SessionLocal
from models.stock import Stock
from models.prediction import Prediction, TrainingJob
import pandas as pd
from datetime import datetime
import numpy as np

class PredictionTask(Task):
    _model = None
    
    @property
    def model(self):
        if self._model is None:
            self._model = ensemble_model
        return self._model

@celery_app.task(base=PredictionTask, bind=True)
def train_model_task(self, symbol: str, job_id: int):
    """Train AI model for a stock"""
    db = SessionLocal()
    
    try:
        # Update job status
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if job:
            job.status = "running"
            job.started_at = datetime.utcnow()
            db.commit()
            
            print(f"Training started for {symbol}")
        
        # Get historical data
        history = stock_service.get_price_history_sync(db, symbol, period="2y")
        
        if len(history) < 100:
            raise Exception(f"Insufficient data for training: {len(history)} points")
        
        # Prepare DataFrame
        df = pd.DataFrame(history)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # Update progress
        if job:
            job.progress = 30
            db.commit()
        
        # Train model
        results = ensemble_model.train_all(df)
        
        # Update progress
        if job:
            job.progress = 100
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            
            # Calculate overall accuracy
            accuracies = []
            for model, result in results.items():
                if 'test_rmse' in result:
                    accuracies.append(1 / (result['test_rmse'] + 1))
                elif 'final_val_loss' in result:
                    accuracies.append(1 / (result['final_val_loss'] + 1))
            
            if accuracies:
                job.accuracy = float(np.mean(accuracies))
            
            db.commit()
            
            print(f"Training completed for {symbol}")
        
        # Clear cache
        redis_cache.clear_pattern(f"prediction:{symbol}:*")
        
        return {"success": True, "symbol": symbol, "results": results}
        
    except Exception as e:
        print(f"Training failed for {symbol}: {str(e)}")
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
        raise e
    finally:
        db.close()


@celery_app.task(bind=True)
def predict_stock_task(self, symbol: str, days_ahead: int = 7):
    """Run prediction for a stock"""
    db = SessionLocal()
    
    try:
        # Get stock data
        stock = db.query(Stock).filter(Stock.symbol == symbol).first()
        if not stock:
            raise Exception(f"Stock {symbol} not found")
        
        # Get historical data
        history = stock_service.get_price_history_sync(db, symbol, period="1y")
        
        if len(history) < 60:
            raise Exception(f"Insufficient historical data for {symbol}")
        
        # Prepare DataFrame
        df = pd.DataFrame(history)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        
        # Get prediction
        result = ensemble_model.predict(df, days_ahead)
        
        # Save prediction
        prediction = Prediction(
            symbol=symbol,
            current_price=stock.current_price or 0,
            predicted_price=result['ensemble_predictions'][-1],
            confidence_score=result['confidence_score'],
            model_used="ensemble",
            days_ahead=days_ahead,
            prediction_date=datetime.utcnow(),
            expires_at=datetime.utcnow() + pd.Timedelta(days=7)
        )
        
        if stock.id:
            prediction.stock_id = stock.id
        
        db.add(prediction)
        db.commit()
        
        # Cache result
        cache_key = f"prediction:{symbol}"
        redis_cache.set(cache_key, result, 3600)
        
        return {
            "success": True,
            "symbol": symbol,
            "prediction": result
        }
        
    except Exception as e:
        print(f"Prediction failed for {symbol}: {str(e)}")
        raise e
    finally:
        db.close()


@celery_app.task
def update_all_stock_prices():
    """Update prices for all stocks in database"""
    db = SessionLocal()
    try:
        from services.stock_service import stock_service
        
        stocks = db.query(Stock).all()
        symbols = [s.symbol for s in stocks]
        
        updated_count = 0
        for symbol in symbols:
            try:
                stock_service.update_stock_prices_sync(db, [symbol])
                updated_count += 1
            except Exception as e:
                print(f"Error updating {symbol}: {e}")
        
        print(f"Updated {updated_count}/{len(symbols)} stocks")
        
        return {"success": True, "updated_count": updated_count}
    finally:
        db.close()