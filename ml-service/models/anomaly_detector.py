#!/usr/bin/env python3
"""
Anomaly Detection Model for Agricultural Supply Chain Fraud Detection
Uses Isolation Forest algorithm to detect suspicious batch entries
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
import joblib
import json

class AnomalyDetector:
    """
    Detects anomalous batch entries that may indicate fraud or data tampering
    """

    def __init__(self, contamination=0.15):
        """
        Initialize anomaly detector

        Args:
            contamination: Expected proportion of anomalies in dataset (default 0.15 = 15%)
        """
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.contamination = contamination

        # Features to use for anomaly detection
        self.numeric_features = [
            'latitude', 'longitude', 'quantity', 'pricePerUnit',
            'temperature', 'humidity', 'moistureContent'
        ]

        self.categorical_features = [
            'crop', 'qualityGrade', 'weather_main'
        ]

        self.engineered_features = [
            'distance_from_region_center',
            'price_deviation_from_median',
            'quantity_deviation',
            'temp_anomaly_score',
            'moisture_anomaly_score'
        ]

        self.all_features = self.numeric_features + self.categorical_features + self.engineered_features

        # Region centers for distance calculation (Malaysia)
        self.region_centers = {
            'north': (6.0, 100.5),   # Kedah/Perlis area
            'central': (3.2, 101.5),  # Selangor/KL area
            'south': (1.9, 103.5),    # Johor area
            'east': (3.8, 103.0),     # Pahang/Terengganu area
            'borneo': (5.5, 116.0)    # Sabah/Sarawak area
        }

    def engineer_features(self, df):
        """
        Create engineered features for better anomaly detection

        Args:
            df: DataFrame with batch data

        Returns:
            DataFrame with additional engineered features
        """
        df = df.copy()

        # 1. Distance from regional centers (detect GPS spoofing)
        def calculate_min_distance_to_regions(row):
            lat, lng = row['latitude'], row['longitude']
            min_dist = float('inf')

            for region, (center_lat, center_lng) in self.region_centers.items():
                # Haversine-like distance (simplified)
                dist = np.sqrt((lat - center_lat)**2 + (lng - center_lng)**2) * 111  # Convert to km
                min_dist = min(min_dist, dist)

            return min_dist

        df['distance_from_region_center'] = df.apply(calculate_min_distance_to_regions, axis=1)

        # 2. Price deviation from median per crop type (detect price manipulation)
        median_prices = df.groupby('crop')['pricePerUnit'].transform('median')
        df['price_deviation_from_median'] = abs(df['pricePerUnit'] - median_prices) / (median_prices + 0.01)

        # 3. Quantity deviation (detect impossible quantities)
        median_quantity = df.groupby('crop')['quantity'].transform('median')
        df['quantity_deviation'] = abs(df['quantity'] - median_quantity) / (median_quantity + 0.01)

        # 4. Temperature anomaly score (detect weather inconsistencies)
        # Malaysia typical temp range: 23-35°C
        df['temp_anomaly_score'] = df['temperature'].apply(
            lambda x: 0 if 23 <= x <= 35 else abs(x - 29) / 10
        )

        # 5. Moisture anomaly score (detect impossible moisture values)
        # Typical range: 0-100%
        df['moisture_anomaly_score'] = df['moistureContent'].apply(
            lambda x: 0 if 0 <= x <= 100 else abs(x - 50) / 50
        )

        return df

    def prepare_features(self, df, training=True):
        """
        Prepare features for model training or prediction

        Args:
            df: DataFrame with batch data
            training: Whether this is for training (True) or prediction (False)

        Returns:
            Numpy array of prepared features
        """
        df = df.copy()

        # Engineer features
        df = self.engineer_features(df)

        # Handle missing values in numeric features
        for col in self.numeric_features:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if training else 0)

        # Handle missing engineered features
        for col in self.engineered_features:
            if col in df.columns:
                df[col] = df[col].fillna(0)

        # Encode categorical features
        for col in self.categorical_features:
            if col in df.columns:
                if training:
                    self.label_encoders[col] = LabelEncoder()
                    df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    # Use existing encoder, handle unknown labels
                    df[col] = df[col].astype(str).apply(
                        lambda x: self.label_encoders[col].transform([x])[0]
                        if x in self.label_encoders[col].classes_
                        else -1
                    )

        # Select features that exist in dataframe
        available_features = [f for f in self.all_features if f in df.columns]
        X = df[available_features].values

        return X

    def train(self, df, test_size=0.2, random_state=42):
        """
        Train the anomaly detection model

        Args:
            df: DataFrame with batch data (must include 'is_anomaly' column for evaluation)
            test_size: Proportion of data for testing
            random_state: Random seed for reproducibility

        Returns:
            Dictionary with training results and metrics
        """
        print("🤖 Training Anomaly Detection Model...")
        print(f"   Dataset size: {len(df)} batches")
        print(f"   Normal batches: {len(df[df['is_anomaly'] == False])}")
        print(f"   Anomalous batches: {len(df[df['is_anomaly'] == True])}")

        # Prepare features
        X = self.prepare_features(df, training=True)
        y_true = df['is_anomaly'].values

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_true, test_size=test_size, random_state=random_state, stratify=y_true
        )

        print(f"\n📊 Training Data Split:")
        print(f"   Training set: {len(X_train)} batches")
        print(f"   Test set: {len(X_test)} batches")

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train Isolation Forest
        print(f"\n⚙️  Training Isolation Forest...")
        print(f"   Contamination: {self.contamination}")

        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples='auto',
            max_features=1.0,
            bootstrap=False
        )

        self.model.fit(X_train_scaled)

        # Evaluate on test set
        print(f"\n📈 Evaluating Model...")

        # Predictions (-1 = anomaly, 1 = normal)
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)

        # Convert to boolean (True = anomaly)
        y_pred_train_bool = (y_pred_train == -1)
        y_pred_test_bool = (y_pred_test == -1)

        # Calculate metrics
        train_precision, train_recall, train_f1, _ = precision_recall_fscore_support(
            y_train, y_pred_train_bool, average='binary', zero_division=0
        )

        test_precision, test_recall, test_f1, _ = precision_recall_fscore_support(
            y_test, y_pred_test_bool, average='binary', zero_division=0
        )

        print(f"\n✅ Training Set Performance:")
        print(f"   Precision: {train_precision:.2%}")
        print(f"   Recall: {train_recall:.2%}")
        print(f"   F1-Score: {train_f1:.2%}")

        print(f"\n✅ Test Set Performance:")
        print(f"   Precision: {test_precision:.2%}")
        print(f"   Recall: {test_recall:.2%}")
        print(f"   F1-Score: {test_f1:.2%}")

        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred_test_bool)
        print(f"\n📊 Confusion Matrix (Test Set):")
        print(f"   True Negatives:  {cm[0,0]} (correctly identified normal batches)")
        print(f"   False Positives: {cm[0,1]} (normal batches flagged as anomalies)")
        print(f"   False Negatives: {cm[1,0]} (anomalies missed)")
        print(f"   True Positives:  {cm[1,1]} (correctly identified anomalies)")

        # Classification report
        print(f"\n📋 Classification Report (Test Set):")
        print(classification_report(y_test, y_pred_test_bool, target_names=['Normal', 'Anomaly']))

        results = {
            'train_precision': float(train_precision),
            'train_recall': float(train_recall),
            'train_f1': float(train_f1),
            'test_precision': float(test_precision),
            'test_recall': float(test_recall),
            'test_f1': float(test_f1),
            'confusion_matrix': cm.tolist(),
            'n_features': X.shape[1],
            'contamination': self.contamination
        }

        print(f"\n✅ Model training complete!")

        return results

    def predict(self, batch_data):
        """
        Predict if a batch is anomalous

        Args:
            batch_data: Dictionary or DataFrame with batch information

        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise Exception("Model not trained yet. Call train() first.")

        # Convert dict to DataFrame if needed
        if isinstance(batch_data, dict):
            df = pd.DataFrame([batch_data])
        else:
            df = batch_data.copy()

        # Prepare features
        X = self.prepare_features(df, training=False)
        X_scaled = self.scaler.transform(X)

        # Predict
        prediction = self.model.predict(X_scaled)[0]
        anomaly_score = self.model.score_samples(X_scaled)[0]

        # Convert anomaly score to 0-1 range (lower score = more anomalous)
        # Isolation Forest scores are typically in range [-1, 1]
        normalized_score = float(1 / (1 + np.exp(anomaly_score)))  # Sigmoid transformation

        is_anomaly = (prediction == -1)

        # Determine risk level
        if normalized_score > 0.7:
            risk_level = 'HIGH'
        elif normalized_score > 0.5:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'

        result = {
            'isAnomaly': bool(is_anomaly),
            'anomalyScore': float(normalized_score),
            'confidence': float(1 - normalized_score) if not is_anomaly else float(normalized_score),
            'riskLevel': risk_level,
            'recommendation': 'REVIEW' if is_anomaly else 'APPROVE'
        }

        return result

    def get_feature_importance(self, df):
        """
        Analyze which features contribute most to anomaly detection

        Args:
            df: DataFrame with batch data

        Returns:
            Dictionary with feature importance scores
        """
        X = self.prepare_features(df, training=False)
        X_scaled = self.scaler.transform(X)

        # Get anomaly scores for each feature individually
        feature_scores = {}

        for i, feature_name in enumerate(self.all_features):
            # Create dataset with only this feature
            X_single = X_scaled[:, i:i+1]

            # Calculate variance in predictions
            scores = self.model.score_samples(X_single)
            feature_scores[feature_name] = {
                'mean_score': float(np.mean(scores)),
                'std_score': float(np.std(scores))
            }

        return feature_scores

    def save(self, path):
        """Save trained model and preprocessing objects"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'contamination': self.contamination,
            'numeric_features': self.numeric_features,
            'categorical_features': self.categorical_features,
            'engineered_features': self.engineered_features
        }, path)
        print(f"✅ Model saved to {path}")

    def load(self, path):
        """Load trained model and preprocessing objects"""
        data = joblib.load(path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.label_encoders = data['label_encoders']
        self.contamination = data['contamination']
        self.numeric_features = data['numeric_features']
        self.categorical_features = data['categorical_features']
        self.engineered_features = data['engineered_features']
        self.all_features = self.numeric_features + self.categorical_features + self.engineered_features
        print(f"✅ Model loaded from {path}")
        return self
