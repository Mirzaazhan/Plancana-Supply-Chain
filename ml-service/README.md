# ML Fraud Detection Service

## Overview
This is a Python-based ML service that provides real-time fraud detection and anomaly detection for agricultural batches using Isolation Forest algorithm.

## System Behavior (Important!)

### ✅ System Works WITHOUT ML Service
The main application is designed to work perfectly fine even if the ML service is not running:
- Batch creation will continue normally
- No errors or crashes
- ML validation is simply skipped
- You'll see: `ℹ️  ML validation skipped - service not available` in logs

### 🤖 System Enhanced WITH ML Service
When the ML service is running, you get:
- Real-time fraud detection during batch creation
- Anomaly scoring for suspicious batches
- Risk level assessment (LOW, MEDIUM, HIGH)
- ML Dashboard with flagged batches
- Automated quality checks

---

## Quick Start (For Your Friend After Pulling)

### Step 1: Navigate to ML Service Directory
```bash
cd /path/to/agricultural-supply-chain/ml-service
```

### Step 2: Create Python Virtual Environment
```bash
python3 -m venv venv
```

### Step 3: Activate Virtual Environment
```bash
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Verify Model Exists
```bash
ls -la saved_models/
# You should see: anomaly_detector.pkl (744KB)
```

### Step 6: Start the ML Service
```bash
python app.py
```

You should see:
```
🚀 Starting ML Service...
📂 Loading trained models...
✅ Anomaly detection model loaded successfully

======================================================================
  🤖 ML SERVICE FOR AGRICULTURAL SUPPLY CHAIN
======================================================================

📡 Endpoints available:
   GET  /health                    - Health check
   POST /api/ml/anomaly-check      - Check if batch is anomalous
   POST /api/ml/fraud-score        - Calculate fraud risk score
   GET  /api/ml/batch-stats        - Get model statistics

🌐 Starting Flask server on http://0.0.0.0:5000
======================================================================
```

### Step 7: Verify ML Service is Running
Open a new terminal and test:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ml-service",
  "version": "1.0.0",
  "models_loaded": {
    "anomaly_detector": true
  }
}
```

### Step 8: Enable ML Service in Main Application
Make sure your `.env` file in `application/` directory has:
```env
ML_SERVICE_URL=http://localhost:5000
ML_SERVICE_ENABLED=true
```

### Step 9: Restart Main Application
```bash
cd ../application
# Restart your Node.js server
npm start
# or
node server.js
```

---

## Testing the ML Integration

### Test 1: Create a Normal Batch
Create a batch with normal values - should pass ML validation

### Test 2: Create a Suspicious Batch
Try creating a batch with:
- Very high price (e.g., RM 200/kg)
- Unusual coordinates (e.g., 0.0, 0.0)
- Extreme temperature values

This should trigger ML flags and appear in the ML Dashboard.

### Test 3: Check ML Dashboard
Visit: `http://localhost:3001/admin/ml-dashboard`
- Should show ML service as "Active"
- Display any flagged batches
- Show risk levels and anomaly scores

---

## Troubleshooting

### ML Service Won't Start

**Problem:** `ImportError: No module named 'flask'`
**Solution:** Make sure virtual environment is activated and dependencies installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Problem:** `Model file not found`
**Solution:** The model file should be in `saved_models/anomaly_detector.pkl`. If missing:
```bash
# Retrain the model
python training/train_anomaly_detector.py
```

**Problem:** `Port 5000 already in use`
**Solution:** Change port in `app.py` or kill existing process:
```bash
# Find process using port 5000
lsof -ti:5000
# Kill it
kill -9 <PID>
```

### Main Application Shows "ML Service Offline"

**Check 1:** Is ML service running?
```bash
curl http://localhost:5000/health
```

**Check 2:** Is `ML_SERVICE_ENABLED=true` in `.env`?
```bash
grep ML_SERVICE application/.env
```

**Check 3:** Check main application logs for ML warnings
```
⚠️  ML Service not available: connect ECONNREFUSED
```

---

## How to Disable ML Service (If Not Needed)

If you don't want to use ML features, simply set in `application/.env`:
```env
ML_SERVICE_ENABLED=false
```

The system will work perfectly fine without ML validation.

---

## Architecture

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend        │
│  (Node.js)      │──────┐
└────────┬────────┘      │
         │               │ Optional
         ▼               │
┌─────────────────┐      │
│  Blockchain     │      │
│  (Fabric)       │      │
└─────────────────┘      │
                         │
                         ▼
                  ┌─────────────────┐
                  │  ML Service     │
                  │  (Python/Flask) │
                  └─────────────────┘
```

---

## API Endpoints

### GET /health
Health check endpoint
```bash
curl http://localhost:5000/health
```

### POST /api/ml/anomaly-check
Check if batch data is anomalous
```bash
curl -X POST http://localhost:5000/api/ml/anomaly-check \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BAT-2025-001",
    "crop": "Rice",
    "quantity": 1000,
    "pricePerUnit": 3.5,
    "latitude": 3.1390,
    "longitude": 101.6869,
    "temperature": 28.5,
    "humidity": 75.0,
    "moistureContent": 14.0,
    "qualityGrade": "A",
    "weather_main": "Clear"
  }'
```

### POST /api/ml/fraud-score
Get detailed fraud risk score
```bash
curl -X POST http://localhost:5000/api/ml/fraud-score \
  -H "Content-Type: application/json" \
  -d '{ ... same payload as anomaly-check ... }'
```

### GET /api/ml/batch-stats
Get ML model statistics
```bash
curl http://localhost:5000/api/ml/batch-stats
```

---

## Files Structure

```
ml-service/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── models/
│   └── anomaly_detector.py     # Isolation Forest model class
├── saved_models/
│   └── anomaly_detector.pkl    # Trained model (744KB)
├── training/
│   └── train_anomaly_detector.py  # Model training script
├── utils/
│   ├── generate_synthetic_data.py  # Generate training data
│   ├── combine_datasets.py         # Combine datasets
│   └── data_export.py              # Export utilities
└── data/
    └── (training datasets)
```

---

## Dependencies

- Flask 3.0.0 - Web framework
- Flask-CORS 4.0.0 - CORS support
- scikit-learn 1.4.0 - ML algorithms (Isolation Forest)
- pandas 2.1.4 - Data manipulation
- numpy 1.26.3 - Numerical computing
- joblib 1.3.2 - Model serialization
- xgboost 2.0.3 - Gradient boosting (optional)
- psycopg2-binary 2.9.9 - PostgreSQL adapter
- python-dotenv 1.0.0 - Environment variables

---

## Production Deployment

For production, consider:

1. **Use production WSGI server** (Gunicorn instead of Flask dev server):
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

2. **Run as a service** (systemd on Linux)
3. **Add authentication** for API endpoints
4. **Monitor with logging** and error tracking
5. **Scale horizontally** if needed

---

## Support

If you encounter issues:
1. Check this README troubleshooting section
2. Check application logs
3. Verify all environment variables
4. Ensure virtual environment is activated
5. Contact the development team

Remember: **The system works fine without ML service** - it's an optional enhancement!
