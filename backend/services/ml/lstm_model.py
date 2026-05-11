import numpy as np
import pandas as pd
from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
from datetime import datetime, timedelta
from typing import Tuple, List, Dict

class LSTMModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.sequence_length = 60
        self.model_path = "models/lstm"
        
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_data(
        self, 
        data: pd.DataFrame, 
        target_col: str = 'close'
    ) -> Tuple[np.ndarray, np.ndarray, MinMaxScaler]:
        """Prepare data for LSTM training"""
        # Use closing prices
        prices = data[target_col].values.reshape(-1, 1)
        
        # Scale data
        scaled_data = self.scaler.fit_transform(prices)
        
        # Create sequences
        X, y = [], []
        for i in range(self.sequence_length, len(scaled_data)):
            X.append(scaled_data[i - self.sequence_length:i, 0])
            y.append(scaled_data[i, 0])
        
        X = np.array(X)
        y = np.array(y)
        
        # Reshape for LSTM [samples, time steps, features]
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        return X, y, self.scaler
    
    def build_model(self, input_shape: Tuple) -> Sequential:
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(units=50, return_sequences=True),
            Dropout(0.2),
            LSTM(units=50),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    
    def train(
        self, 
        data: pd.DataFrame, 
        epochs: int = 100,
        batch_size: int = 32
    ) -> Dict:
        """Train LSTM model"""
        X, y, scaler = self.prepare_data(data)
        
        # Split into train and validation
        split = int(0.8 * len(X))
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]
        
        # Build model
        self.model = self.build_model((X.shape[1], 1))
        
        # Early stopping
        early_stop = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_val, y_val),
            callbacks=[early_stop],
            verbose=0
        )
        
        # Save model and scaler
        self.save_model(f"{self.model_path}/lstm_model.h5")
        joblib.dump(scaler, f"{self.model_path}/lstm_scaler.pkl")
        
        return {
            'final_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1]),
            'epochs_trained': len(history.history['loss'])
        }
    
    def predict(self, data: pd.DataFrame, days_ahead: int = 7) -> List[float]:
        """Predict future prices"""
        # Load model if not loaded
        if self.model is None:
            self.load_model(f"{self.model_path}/lstm_model.h5")
            self.scaler = joblib.load(f"{self.model_path}/lstm_scaler.pkl")
        
        # Prepare last sequence
        prices = data['close'].values[-self.sequence_length:].reshape(-1, 1)
        scaled_prices = self.scaler.transform(prices)
        
        predictions = []
        current_batch = scaled_prices.reshape(1, self.sequence_length, 1)
        
        for _ in range(days_ahead):
            # Predict next value
            next_pred = self.model.predict(current_batch, verbose=0)[0, 0]
            predictions.append(next_pred)
            
            # Update batch
            current_batch = np.append(
                current_batch[:, 1:, :],
                [[[next_pred]]],
                axis=1
            )
        
        # Inverse transform
        predictions = self.scaler.inverse_transform(
            np.array(predictions).reshape(-1, 1)
        ).flatten()
        
        return predictions.tolist()
    
    def save_model(self, path: str):
        """Save model to disk"""
        if self.model:
            self.model.save(path)
    
    def load_model(self, path: str):
        """Load model from disk"""
        from keras.models import load_model
        self.model = load_model(path)