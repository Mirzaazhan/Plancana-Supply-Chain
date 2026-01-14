@echo off
REM Quick start script for ML Service (Windows)

echo 🤖 Starting ML Fraud Detection Service...
echo ==========================================

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Virtual environment not found. Creating...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if dependencies are installed
if not exist "venv\installed.flag" (
    echo 📥 Installing dependencies...
    pip install -r requirements.txt
    type nul > venv\installed.flag
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Check if model exists
if not exist "saved_models\anomaly_detector.pkl" (
    echo ⚠️  WARNING: Trained model not found!
    echo    Run: python training\train_anomaly_detector.py
    echo    Continuing anyway (will show warning)...
)

REM Start the service
echo.
echo 🚀 Launching ML Service...
echo ==========================================
python app.py
