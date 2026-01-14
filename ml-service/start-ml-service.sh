#!/bin/bash
# Quick start script for ML Service

echo "🤖 Starting ML Fraud Detection Service..."
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/installed.flag" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed.flag
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if model exists
if [ ! -f "saved_models/anomaly_detector.pkl" ]; then
    echo "⚠️  WARNING: Trained model not found!"
    echo "   Run: python training/train_anomaly_detector.py"
    echo "   Continuing anyway (will show warning)..."
fi

# Start the service
echo ""
echo "🚀 Launching ML Service..."
echo "=========================================="
python app.py
