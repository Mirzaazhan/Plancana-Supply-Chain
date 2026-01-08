#!/usr/bin/env python3
"""
Flask API for ML-powered Agricultural Supply Chain Fraud Detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add models directory to path
sys.path.append(os.path.dirname(__file__))

from models.anomaly_detector import AnomalyDetector

app = Flask(__name__)
CORS(app)

# Load trained models
print("🚀 Starting ML Service...")
print("📂 Loading trained models...")

anomaly_detector = AnomalyDetector()
model_path = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/saved_models/anomaly_detector.pkl'

if os.path.exists(model_path):
    anomaly_detector.load(model_path)
    print("✅ Anomaly detection model loaded successfully")
else:
    print("⚠️  Warning: Anomaly detection model not found. Please train the model first.")
    anomaly_detector = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-service',
        'version': '1.0.0',
        'models_loaded': {
            'anomaly_detector': anomaly_detector is not None
        }
    })

@app.route('/api/ml/anomaly-check', methods=['POST'])
def check_anomaly():
    """
    Check if a batch is anomalous

    Request body:
    {
        "batchId": "BAT-2025-001",
        "crop": "Rice",
        "quantity": 1000,
        "pricePerUnit": 3.5,
        "latitude": 3.1234,
        "longitude": 101.5678,
        "temperature": 28.5,
        "humidity": 75.0,
        "moistureContent": 14.0,
        "qualityGrade": "A",
        "weather_main": "Clear"
    }

    Response:
    {
        "isAnomaly": false,
        "anomalyScore": 0.23,
        "confidence": 0.77,
        "riskLevel": "LOW",
        "recommendation": "APPROVE",
        "flags": []
    }
    """
    try:
        if anomaly_detector is None:
            return jsonify({'error': 'Anomaly detection model not loaded'}), 503

        batch_data = request.json

        # Validate required fields
        required_fields = ['crop', 'quantity', 'pricePerUnit', 'latitude', 'longitude']
        missing_fields = [f for f in required_fields if f not in batch_data]

        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Set defaults for optional fields
        batch_data.setdefault('temperature', 28.0)
        batch_data.setdefault('humidity', 75.0)
        batch_data.setdefault('moistureContent', 12.0)
        batch_data.setdefault('qualityGrade', 'B')
        batch_data.setdefault('weather_main', 'Clear')

        # Make prediction
        result = anomaly_detector.predict(batch_data)

        # Add detailed flags if anomaly detected
        flags = []
        if result['isAnomaly']:
            # Analyze which factors contributed to anomaly
            if abs(batch_data['latitude']) < 0.1 and abs(batch_data['longitude']) < 0.1:
                flags.append({
                    'type': 'GPS_ANOMALY',
                    'message': 'GPS coordinates suspicious (near Null Island)',
                    'severity': 'HIGH'
                })

            if batch_data['temperature'] > 40 or batch_data['temperature'] < 15:
                flags.append({
                    'type': 'WEATHER_ANOMALY',
                    'message': f'Temperature {batch_data["temperature"]}°C outside normal range for Malaysia',
                    'severity': 'HIGH'
                })

            if batch_data.get('moistureContent', 50) > 100 or batch_data.get('moistureContent', 50) < 0:
                flags.append({
                    'type': 'MOISTURE_ANOMALY',
                    'message': 'Moisture content physically impossible',
                    'severity': 'CRITICAL'
                })

            # Price anomaly check (very rough heuristic)
            if batch_data['pricePerUnit'] > 100:
                flags.append({
                    'type': 'PRICE_ANOMALY',
                    'message': f'Price RM{batch_data["pricePerUnit"]}/kg unusually high',
                    'severity': 'MEDIUM'
                })

        result['flags'] = flags

        return jsonify(result)

    except Exception as e:
        print(f"Error in anomaly-check: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/fraud-score', methods=['POST'])
def fraud_score():
    """
    Calculate comprehensive fraud score for a batch

    Similar to anomaly-check but with more detailed factor breakdown
    """
    try:
        if anomaly_detector is None:
            return jsonify({'error': 'Anomaly detection model not loaded'}), 503

        batch_data = request.json

        # Get anomaly prediction
        anomaly_result = anomaly_detector.predict(batch_data)

        # Calculate individual factor scores
        factors = []

        # GPS factor
        lat, lng = batch_data.get('latitude', 0), batch_data.get('longitude', 0)
        gps_score = 0.0
        if abs(lat) < 0.1 and abs(lng) < 0.1:
            gps_score = 0.9
        elif lat < 0 or lat > 8 or lng < 99 or lng > 120:  # Outside Malaysia
            gps_score = 0.7
        else:
            gps_score = 0.1

        factors.append({
            'factor': 'gps_location',
            'score': gps_score,
            'status': 'SUSPICIOUS' if gps_score > 0.5 else 'NORMAL'
        })

        # Price factor
        price = batch_data.get('pricePerUnit', 0)
        price_score = 0.1 if 1 < price < 50 else 0.6

        factors.append({
            'factor': 'pricing',
            'score': price_score,
            'status': 'SUSPICIOUS' if price_score > 0.5 else 'NORMAL'
        })

        # Weather factor
        temp = batch_data.get('temperature', 28)
        weather_score = 0.1 if 20 < temp < 36 else 0.7

        factors.append({
            'factor': 'weather_conditions',
            'score': weather_score,
            'status': 'SUSPICIOUS' if weather_score > 0.5 else 'NORMAL'
        })

        # Combined fraud score (weighted average)
        fraud_score = (
            anomaly_result['anomalyScore'] * 0.5 +
            gps_score * 0.2 +
            price_score * 0.2 +
            weather_score * 0.1
        )

        return jsonify({
            'fraudScore': float(fraud_score),
            'riskLevel': anomaly_result['riskLevel'],
            'factors': factors,
            'recommendation': 'BLOCK' if fraud_score > 0.8 else 'REVIEW' if fraud_score > 0.6 else 'APPROVE'
        })

    except Exception as e:
        print(f"Error in fraud-score: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/batch-stats', methods=['GET'])
def batch_stats():
    """Get model statistics"""
    if anomaly_detector is None:
        return jsonify({'error': 'Model not loaded'}), 503

    return jsonify({
        'model': 'Isolation Forest',
        'contamination': anomaly_detector.contamination,
        'features_used': len(anomaly_detector.all_features),
        'feature_types': {
            'numeric': len(anomaly_detector.numeric_features),
            'categorical': len(anomaly_detector.categorical_features),
            'engineered': len(anomaly_detector.engineered_features)
        }
    })

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("  🤖 ML SERVICE FOR AGRICULTURAL SUPPLY CHAIN")
    print("=" * 70)
    print("\n📡 Endpoints available:")
    print("   GET  /health                    - Health check")
    print("   POST /api/ml/anomaly-check      - Check if batch is anomalous")
    print("   POST /api/ml/fraud-score        - Calculate fraud risk score")
    print("   GET  /api/ml/batch-stats        - Get model statistics")
    print("\n🌐 Starting Flask server on http://0.0.0.0:5000")
    print("=" * 70 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
