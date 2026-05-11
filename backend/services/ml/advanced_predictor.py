import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import MinMaxScaler, RobustScaler
from sklearn.linear_model import Ridge, Lasso, ElasticNet
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
import joblib
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')
from typing import List, Dict


class AdvancedStockPredictor:
    def __init__(self):
        self.models = {
            'xgboost': XGBRegressor(
                n_estimators=300,
                max_depth=8,
                learning_rate=0.01,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            ),
            'lightgbm': LGBMRegressor(
                n_estimators=300,
                max_depth=8,
                learning_rate=0.01,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            ),
            'random_forest': RandomForestRegressor(
                n_estimators=300,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            ),
            'gradient_boosting': GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.05,
                max_depth=5,
                subsample=0.8,
                random_state=42
            ),
            'neural_network': MLPRegressor(
                hidden_layer_sizes=(128, 64, 32, 16),
                activation='relu',
                solver='adam',
                max_iter=1000,
                early_stopping=True,
                validation_fraction=0.1,
                random_state=42
            )
        }
        
        self.scaler = RobustScaler()  # More robust to outliers
        self.feature_scaler = MinMaxScaler()
        self.model_weights = None
        self.model_path = "models/advanced"
        os.makedirs(self.model_path, exist_ok=True)
    
    def create_advanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create comprehensive technical indicators"""
        df = df.copy()
        
        # Price-based features
        df['returns'] = df['Close'].pct_change()
        df['log_returns'] = np.log1p(df['returns'])
        df['high_low_ratio'] = (df['High'] - df['Low']) / df['Close']
        df['close_open_ratio'] = (df['Close'] - df['Open']) / df['Open']
        
        # Multiple moving averages
        for period in [3, 5, 10, 20, 50, 100, 200]:
            df[f'SMA_{period}'] = df['Close'].rolling(window=period).mean()
            df[f'EMA_{period}'] = df['Close'].ewm(span=period, adjust=False).mean()
        
        # Moving average crossovers
        df['SMA_5_20_ratio'] = df['SMA_5'] / df['SMA_20']
        df['SMA_20_50_ratio'] = df['SMA_20'] / df['SMA_50']
        df['EMA_12_26_ratio'] = df['EMA_12'] / df['EMA_26']
        
        # Volatility indicators
        for period in [5, 10, 20, 50]:
            df[f'volatility_{period}'] = df['returns'].rolling(window=period).std()
            df[f'atr_{period}'] = self._calculate_atr(df, period)
        
        # Volume indicators
        df['volume_sma'] = df['Volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['Volume'] / df['volume_sma']
        df['volume_ma_ratio'] = df['Volume'] / df['Volume'].rolling(window=50).mean()
        df['obv'] = self._calculate_obv(df)  # On-Balance Volume
        
        # Momentum indicators
        for period in [5, 10, 20, 50]:
            df[f'momentum_{period}'] = df['Close'] / df['Close'].shift(period) - 1
            df[f'roc_{period}'] = (df['Close'] - df['Close'].shift(period)) / df['Close'].shift(period) * 100
        
        # RSI with multiple periods
        for period in [7, 14, 21]:
            df[f'RSI_{period}'] = self._calculate_rsi(df, period)
        
        # MACD
        df['MACD'], df['Signal_Line'], df['MACD_Histogram'] = self._calculate_macd(df)
        
        # Bollinger Bands
        df['BB_Middle'], df['BB_Upper'], df['BB_Lower'], df['BB_Width'], df['BB_Position'] = self._calculate_bollinger_bands(df)
        
        # Stochastic Oscillator
        df['Stoch_K'], df['Stoch_D'] = self._calculate_stochastic(df)
        
        # Ichimoku Cloud
        df['Ichimoku_A'], df['Ichimoku_B'], df['Ichimoku_CS'] = self._calculate_ichimoku(df)
        
        # Price position features
        df['price_position_20'] = (df['Close'] - df['Low'].rolling(20).min()) / (df['High'].rolling(20).max() - df['Low'].rolling(20).min())
        df['price_position_50'] = (df['Close'] - df['Low'].rolling(50).min()) / (df['High'].rolling(50).max() - df['Low'].rolling(50).min())
        
        # Trend strength
        df['trend_strength'] = abs(df['SMA_20'] - df['SMA_50']) / df['SMA_50']
        
        # Distance from moving averages
        df['distance_from_SMA_20'] = (df['Close'] - df['SMA_20']) / df['SMA_20']
        df['distance_from_SMA_50'] = (df['Close'] - df['SMA_50']) / df['SMA_50']
        
        # Support and Resistance levels
        df['resistance'] = df['High'].rolling(window=20).max()
        df['support'] = df['Low'].rolling(window=20).min()
        df['sr_distance'] = (df['Close'] - df['support']) / (df['resistance'] - df['support'])
        
        # Time-based features
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month
        df['quarter'] = df.index.quarter
        
        return df.dropna()
    
    def _calculate_atr(self, df: pd.DataFrame, period: int) -> pd.Series:
        """Calculate Average True Range"""
        high_low = df['High'] - df['Low']
        high_close = abs(df['High'] - df['Close'].shift())
        low_close = abs(df['Low'] - df['Close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return tr.rolling(window=period).mean()
    
    def _calculate_obv(self, df: pd.DataFrame) -> pd.Series:
        """Calculate On-Balance Volume"""
        obv = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
        return obv
    
    def _calculate_rsi(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Calculate RSI"""
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_macd(self, df: pd.DataFrame):
        """Calculate MACD"""
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        histogram = macd - signal
        return macd, signal, histogram
    
    def _calculate_bollinger_bands(self, df: pd.DataFrame, period: int = 20):
        """Calculate Bollinger Bands"""
        middle = df['Close'].rolling(window=period).mean()
        std = df['Close'].rolling(window=period).std()
        upper = middle + (std * 2)
        lower = middle - (std * 2)
        width = (upper - lower) / middle
        position = (df['Close'] - lower) / (upper - lower)
        return middle, upper, lower, width, position
    
    def _calculate_stochastic(self, df: pd.DataFrame, period: int = 14):
        """Calculate Stochastic Oscillator"""
        low_min = df['Low'].rolling(window=period).min()
        high_max = df['High'].rolling(window=period).max()
        k = 100 * ((df['Close'] - low_min) / (high_max - low_min))
        d = k.rolling(window=3).mean()
        return k, d
    
    def _calculate_ichimoku(self, df: pd.DataFrame):
        """Calculate Ichimoku Cloud"""
        period9 = 9
        period26 = 26
        period52 = 52
        
        # Tenkan-sen (Conversion Line)
        high_9 = df['High'].rolling(window=period9).max()
        low_9 = df['Low'].rolling(window=period9).min()
        tenkan = (high_9 + low_9) / 2
        
        # Kijun-sen (Base Line)
        high_26 = df['High'].rolling(window=period26).max()
        low_26 = df['Low'].rolling(window=period26).min()
        kijun = (high_26 + low_26) / 2
        
        # Senkou Span A (Leading Span A)
        senkou_a = ((tenkan + kijun) / 2).shift(period26)
        
        # Senkou Span B (Leading Span B)
        high_52 = df['High'].rolling(window=period52).max()
        low_52 = df['Low'].rolling(window=period52).min()
        senkou_b = ((high_52 + low_52) / 2).shift(period26)
        
        # Chikou Span (Lagging Span)
        chikou = df['Close'].shift(-period26)
        
        return senkou_a, senkou_b, chikou
    
    def prepare_features(self, df: pd.DataFrame, lookback_days: int = 60) -> tuple:
        """Prepare features with time series cross-validation"""
        # Create advanced features
        feature_df = self.create_advanced_features(df)
        
        # Create target (next day's price)
        feature_df['target'] = feature_df['Close'].shift(-1)
        feature_df = feature_df.dropna()
        
        # Feature selection (exclude price columns)
        exclude_cols = ['target', 'Open', 'High', 'Low', 'Close', 'Volume']
        feature_cols = [col for col in feature_df.columns if col not in exclude_cols]
        
        X = feature_df[feature_cols].values
        y = feature_df['target'].values
        
        # Scale features
        X_scaled = self.feature_scaler.fit_transform(X)
        
        # Create time series sequences
        X_seq, y_seq = [], []
        for i in range(lookback_days, len(X_scaled)):
            X_seq.append(X_scaled[i-lookback_days:i])
            y_seq.append(y[i])
        
        return np.array(X_seq), np.array(y_seq), feature_cols
    
    def train_with_cross_validation(self, df: pd.DataFrame, lookback_days: int = 60):
        """Train models with time series cross-validation"""
        X, y, feature_cols = self.prepare_features(df, lookback_days)
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        results = {}
        cv_scores = {name: [] for name in self.models.keys()}
        
        # Flatten X for models that don't take sequences
        X_flat = X.reshape(X.shape[0], -1)
        
        for train_idx, val_idx in tscv.split(X_flat):
            X_train, X_val = X_flat[train_idx], X_flat[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            for name, model in self.models.items():
                model.fit(X_train, y_train)
                y_pred = model.predict(X_val)
                mape = np.mean(np.abs((y_val - y_pred) / y_val)) * 100
                cv_scores[name].append(mape)
        
        # Calculate average performance and set weights
        performance = {}
        for name in self.models.keys():
            avg_mape = np.mean(cv_scores[name])
            performance[name] = avg_mape
            results[name] = {'cv_mape': avg_mape}
        
        # Inverse performance for weights (lower MAPE = higher weight)
        inv_performance = {k: 1/v for k, v in performance.items()}
        total = sum(inv_performance.values())
        self.model_weights = {k: v/total for k, v in inv_performance.items()}
        
        # Train final models on all data
        for name, model in self.models.items():
            model.fit(X_flat, y)
            self.save_model(model, name)
            results[name]['weight'] = self.model_weights[name]
        
        results['feature_importance'] = self._get_feature_importance(feature_cols)
        results['weights'] = self.model_weights
        
        return results
    
    def _get_feature_importance(self, feature_cols: List[str]) -> Dict:
        """Get feature importance from Random Forest"""
        rf_model = self.models['random_forest']
        if hasattr(rf_model, 'feature_importances_'):
            importance = dict(zip(feature_cols, rf_model.feature_importances_))
            return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10])
        return {}
    
    def predict(self, df: pd.DataFrame, days_ahead: int = 7) -> Dict:
        """Make ensemble prediction"""
        # Prepare features
        feature_df = self.create_advanced_features(df)
        
        # Get last lookback_days of features
        lookback_days = 60
        exclude_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
        feature_cols = [col for col in feature_df.columns if col not in exclude_cols]
        
        last_features = feature_df[feature_cols].iloc[-lookback_days:].values
        last_features_scaled = self.feature_scaler.transform(last_features)
        
        predictions = {}
        individual_predictions = {}
        
        # Make predictions with each model
        for name, weight in self.model_weights.items():
            model = self.load_model(name)
            if model:
                last_features_flat = last_features_scaled.reshape(1, -1)
                pred = model.predict(last_features_flat)[0]
                individual_predictions[name] = float(pred)
                predictions[name] = pred * weight
        
        # Ensemble prediction
        ensemble_pred = sum(predictions.values())
        
        # Calculate confidence based on model agreement
        pred_values = list(individual_predictions.values())
        if len(pred_values) > 1:
            std_dev = np.std(pred_values)
            mean_pred = np.mean(pred_values)
            cv = std_dev / mean_pred if mean_pred != 0 else 1
            confidence = max(0, min(1, 1 - cv))
        else:
            confidence = 0.7
        
        # Calculate target range
        current_price = df['Close'].iloc[-1]
        price_target_low = ensemble_pred * 0.95
        price_target_high = ensemble_pred * 1.05
        
        return {
            'current_price': float(current_price),
            'predicted_price': float(ensemble_pred),
            'confidence_score': float(confidence),
            'price_target_low': float(price_target_low),
            'price_target_high': float(price_target_high),
            'models_used': list(self.model_weights.keys()),
            'model_weights': self.model_weights,
            'individual_predictions': individual_predictions
        }
    
    def save_model(self, model, name: str):
        """Save model to disk"""
        path = f"{self.model_path}/{name}.pkl"
        joblib.dump(model, path)
    
    def load_model(self, name: str):
        """Load model from disk"""
        path = f"{self.model_path}/{name}.pkl"
        if os.path.exists(path):
            return joblib.load(path)
        return None

advanced_predictor = AdvancedStockPredictor()