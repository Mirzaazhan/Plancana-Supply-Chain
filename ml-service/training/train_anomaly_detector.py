#!/usr/bin/env python3
"""
Training script for Anomaly Detection Model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
from models.anomaly_detector import AnomalyDetector

def main():
    print("=" * 70)
    print("  AGRICULTURAL SUPPLY CHAIN - ANOMALY DETECTION MODEL TRAINING")
    print("=" * 70)

    # Load combined training data
    data_path = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/combined_training_data.csv'
    print(f"\n📂 Loading training data from: {data_path}")

    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} batch records")

    # Display dataset info
    print(f"\n📊 Dataset Overview:")
    print(f"   Total batches: {len(df)}")
    print(f"   Normal batches: {len(df[df['is_anomaly'] == False])} ({len(df[df['is_anomaly'] == False])/len(df)*100:.1f}%)")
    print(f"   Anomalous batches: {len(df[df['is_anomaly'] == True])} ({len(df[df['is_anomaly'] == True])/len(df)*100:.1f}%)")

    print(f"\n🌾 Crop Distribution:")
    print(df['crop'].value_counts().head(5))

    print(f"\n💰 Price Statistics:")
    print(f"   Mean: RM{df['pricePerUnit'].mean():.2f}")
    print(f"   Std: RM{df['pricePerUnit'].std():.2f}")
    print(f"   Min: RM{df['pricePerUnit'].min():.2f}")
    print(f"   Max: RM{df['pricePerUnit'].max():.2f}")

    # Initialize and train model
    print("\n" + "=" * 70)
    detector = AnomalyDetector(contamination=0.165)  # Match our dataset's 16.5% anomaly rate

    results = detector.train(df, test_size=0.2, random_state=42)

    # Save trained model
    model_path = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/saved_models/anomaly_detector.pkl'
    print(f"\n💾 Saving model...")
    detector.save(model_path)

    # Test predictions on some samples
    print("\n" + "=" * 70)
    print("  TESTING MODEL ON SAMPLE BATCHES")
    print("=" * 70)

    # Test on known normal batch
    print("\n🟢 Test 1: Known NORMAL Batch")
    normal_batch = df[df['is_anomaly'] == False].iloc[0].to_dict()
    print(f"   Batch: {normal_batch['batchId']}")
    print(f"   Crop: {normal_batch['crop']}")
    print(f"   Price: RM{normal_batch['pricePerUnit']}/kg")
    print(f"   Location: ({normal_batch['latitude']:.4f}, {normal_batch['longitude']:.4f})")

    prediction = detector.predict(normal_batch)
    print(f"\n   🔍 Prediction:")
    print(f"      Is Anomaly: {prediction['isAnomaly']}")
    print(f"      Anomaly Score: {prediction['anomalyScore']:.2%}")
    print(f"      Risk Level: {prediction['riskLevel']}")
    print(f"      Recommendation: {prediction['recommendation']}")

    # Test on known anomalous batch
    print("\n🔴 Test 2: Known ANOMALOUS Batch")
    anomalous_batch = df[df['is_anomaly'] == True].iloc[0].to_dict()
    print(f"   Batch: {anomalous_batch['batchId']}")
    print(f"   Crop: {anomalous_batch['crop']}")
    print(f"   Price: RM{anomalous_batch['pricePerUnit']}/kg")
    print(f"   Location: ({anomalous_batch['latitude']:.4f}, {anomalous_batch['longitude']:.4f})")
    if 'anomaly_reason' in anomalous_batch and pd.notna(anomalous_batch['anomaly_reason']):
        print(f"   Reason: {anomalous_batch['anomaly_reason']}")

    prediction = detector.predict(anomalous_batch)
    print(f"\n   🔍 Prediction:")
    print(f"      Is Anomaly: {prediction['isAnomaly']}")
    print(f"      Anomaly Score: {prediction['anomalyScore']:.2%}")
    print(f"      Risk Level: {prediction['riskLevel']}")
    print(f"      Recommendation: {prediction['recommendation']}")

    # Test on extreme anomaly (manually created)
    print("\n🚨 Test 3: EXTREME Anomaly (Manual Test)")
    extreme_anomaly = {
        'batchId': 'TEST-001',
        'crop': 'Durian',
        'quantity': 10000,  # Impossibly large
        'pricePerUnit': 500.0,  # Impossibly expensive
        'latitude': 0.0,  # Null Island
        'longitude': 0.0,
        'temperature': 60.0,  # Impossibly hot
        'humidity': 5.0,  # Impossibly dry
        'moistureContent': 200.0,  # Impossible moisture
        'qualityGrade': 'Premium',
        'weather_main': 'Clear'
    }
    print(f"   Batch: {extreme_anomaly['batchId']}")
    print(f"   Crop: {extreme_anomaly['crop']} @ RM{extreme_anomaly['pricePerUnit']}/kg")
    print(f"   Quantity: {extreme_anomaly['quantity']} kg (EXTREME)")
    print(f"   Location: ({extreme_anomaly['latitude']}, {extreme_anomaly['longitude']}) [Null Island]")
    print(f"   Temperature: {extreme_anomaly['temperature']}°C (IMPOSSIBLE)")

    prediction = detector.predict(extreme_anomaly)
    print(f"\n   🔍 Prediction:")
    print(f"      Is Anomaly: {prediction['isAnomaly']}")
    print(f"      Anomaly Score: {prediction['anomalyScore']:.2%}")
    print(f"      Risk Level: {prediction['riskLevel']}")
    print(f"      Recommendation: {prediction['recommendation']}")

    # Summary
    print("\n" + "=" * 70)
    print("  TRAINING SUMMARY")
    print("=" * 70)
    print(f"\n✅ Model Training Complete!")
    print(f"\n📈 Performance Metrics:")
    print(f"   Test Precision: {results['test_precision']:.2%}")
    print(f"   Test Recall: {results['test_recall']:.2%}")
    print(f"   Test F1-Score: {results['test_f1']:.2%}")
    print(f"\n💾 Model saved to: {model_path}")
    print(f"\n🎯 Ready for deployment!")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
