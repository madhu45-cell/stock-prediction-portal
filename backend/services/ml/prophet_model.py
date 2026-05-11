import pandas as pd
import numpy as np
from prophet import Prophet
from typing import List, Dict
import joblib
import os
from datetime import datetime, timedelta

class ProphetModel:
    def __init__(self):
        self.model = None
        self.model_path = "models/prophet"
        
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for Prophet (needs ds and y columns)"""
        df = data.reset_index()
        
        # Prophet requires column names 'ds' and 'y'
        if 'date' in df.columns:
            prophet_df = pd.DataFrame({
                'ds': pd.to_datetime(df['date']),
                'y': df['close']
            })
        elif df.index.name == 'date' or 'date' in df.columns:
            prophet_df = pd.DataFrame({
                'ds': df.index if 'date' not in df.columns else df['date'],
                'y': df['close']
            })
        else:
            prophet_df = pd.DataFrame({
                'ds': df.index if 'date' not in df.columns else df.index,
                'y': df['close']
            })
        
        # Remove NaN values
        prophet_df = prophet_df.dropna()
        
        return prophet_df
    
    def train(self, data: pd.DataFrame, periods: int = 365) -> Dict:
        """Train Prophet model"""
        prophet_df = self.prepare_data(data)
        
        # Create and fit model
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0
        )
        
        self.model.fit(prophet_df)
        
        # Make future dataframe
        future = self.model.make_future_dataframe(periods=periods)
        forecast = self.model.predict(future)
        
        # Calculate metrics on training data
        train_forecast = forecast.iloc[:len(prophet_df)]
        y_true = prophet_df['y'].values
        y_pred = train_forecast['yhat'].values
        
        # Calculate RMSE
        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
        
        # Calculate MAE
        mae = np.mean(np.abs(y_true - y_pred))
        
        # Calculate MAPE
        mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        
        # Save model
        self.save_model(f"{self.model_path}/prophet_model.pkl")
        
        return {
            'train_rmse': float(rmse),
            'train_mae': float(mae),
            'train_mape': float(mape),
            'training_days': len(prophet_df),
            'seasonalities': {
                'yearly': self.model.yearly_seasonality,
                'weekly': self.model.weekly_seasonality
            }
        }
    
    def predict(self, data: pd.DataFrame, days_ahead: int = 7) -> List[Dict]:
        """Predict future prices"""
        # Load model if not loaded
        if self.model is None:
            self.load_model(f"{self.model_path}/prophet_model.pkl")
        
        # Prepare data
        prophet_df = self.prepare_data(data)
        
        # Create future dataframe
        last_date = prophet_df['ds'].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )
        
        future_df = pd.DataFrame({'ds': future_dates})
        
        # Predict
        forecast = self.model.predict(future_df)
        
        # Format results
        predictions = []
        for i, row in forecast.iterrows():
            predictions.append({
                'ds': row['ds'],
                'yhat': row['yhat'],
                'yhat_lower': row['yhat_lower'],
                'yhat_upper': row['yhat_upper']
            })
        
        return predictions
    
    def save_model(self, path: str):
        """Save model to disk"""
        if self.model:
            import pickle
            with open(path, 'wb') as f:
                pickle.dump(self.model, f)
    
    def load_model(self, path: str):
        """Load model from disk"""
        import pickle
        if os.path.exists(path):
            with open(path, 'rb') as f:
                self.model = pickle.load(f)