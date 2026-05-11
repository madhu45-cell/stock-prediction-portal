import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from typing import List, Dict, Tuple

class XGBoostModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.feature_columns = [
            'close', 'volume', 'high', 'low', 
            'returns', 'volatility', 'sma_5', 'sma_20',
            'ema_12', 'ema_26', 'rsi'
        ]
        self.model_path = "models/xgboost"
        
        os.makedirs(self.model_path, exist_ok=True)
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create technical indicators as features"""
        df = df.copy()
        
        # Returns
        df['returns'] = df['close'].pct_change()
        
        # Volatility (rolling std of returns)
        df['volatility'] = df['returns'].rolling(window=20).std()
        
        # Simple Moving Averages
        df['sma_5'] = df['close'].rolling(window=5).mean()
        df['sma_20'] = df['close'].rolling(window=20).mean()
        
        # Exponential Moving Averages
        df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
        df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
        
        # RSI (Relative Strength Index)
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # Price range
        df['high_low_ratio'] = (df['high'] - df['low']) / df['close']
        
        # Fill NaN values
        df = df.fillna(method='bfill').fillna(method='ffill').fillna(0)
        
        return df
    
    def prepare_data(
        self, 
        data: pd.DataFrame,
        target_col: str = 'close',
        test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Prepare data for XGBoost training"""
        # Create features
        df = self._create_features(data)
        
        # Use only available feature columns
        available_features = [col for col in self.feature_columns if col in df.columns]
        
        # Prepare features and target
        X = df[available_features].values
        y = df[target_col].shift(-1).values  # Predict next day's price
        
        # Remove last row (no target)
        X = X[:-1]
        y = y[:-1]
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, shuffle=False
        )
        
        return X_train, X_test, y_train, y_test
    
    def train(
        self, 
        data: pd.DataFrame,
        params: Dict = None
    ) -> Dict:
        """Train XGBoost model"""
        X_train, X_test, y_train, y_test = self.prepare_data(data)
        
        # Default parameters
        if params is None:
            params = {
                'n_estimators': 200,
                'max_depth': 6,
                'learning_rate': 0.01,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'random_state': 42
            }
        
        # Create and train model
        self.model = xgb.XGBRegressor(**params)
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False,
            early_stopping_rounds=20
        )
        
        # Calculate metrics
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)
        
        train_rmse = np.sqrt(np.mean((y_train - train_pred) ** 2))
        test_rmse = np.sqrt(np.mean((y_test - test_pred) ** 2))
        
        # Save model and scaler
        self.save_model(f"{self.model_path}/xgboost_model.pkl")
        joblib.dump(self.scaler, f"{self.model_path}/xgboost_scaler.pkl")
        
        return {
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'feature_importance': dict(zip(
                self.feature_columns, 
                self.model.feature_importances_.tolist()
            )),
            'n_estimators': self.model.get_params()['n_estimators']
        }
    
    def predict(self, data: pd.DataFrame, days_ahead: int = 7) -> List[float]:
        """Predict future prices"""
        # Load model if not loaded
        if self.model is None:
            self.load_model(f"{self.model_path}/xgboost_model.pkl")
            self.scaler = joblib.load(f"{self.model_path}/xgboost_scaler.pkl")
        
        predictions = []
        current_data = data.copy()
        
        for _ in range(days_ahead):
            # Create features for current data
            df_features = self._create_features(current_data)
            
            # Get last row
            available_features = [col for col in self.feature_columns if col in df_features.columns]
            last_row = df_features[available_features].iloc[-1:].values
            
            # Scale
            last_row_scaled = self.scaler.transform(last_row)
            
            # Predict
            next_price = self.model.predict(last_row_scaled)[0]
            predictions.append(next_price)
            
            # Append prediction for next iteration
            new_row = current_data.iloc[-1:].copy()
            new_row.index = [new_row.index[0] + pd.Timedelta(days=1)]
            new_row['close'] = next_price
            new_row['high'] = next_price * 1.02
            new_row['low'] = next_price * 0.98
            new_row['volume'] = current_data['volume'].iloc[-1] * 0.95
            
            current_data = pd.concat([current_data, new_row])
        
        return predictions
    
    def save_model(self, path: str):
        """Save model to disk"""
        if self.model:
            joblib.dump(self.model, path)
    
    def load_model(self, path: str):
        """Load model from disk"""
        if os.path.exists(path):
            self.model = joblib.load(path)