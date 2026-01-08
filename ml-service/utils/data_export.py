#!/usr/bin/env python3
"""
Export training data from PostgreSQL database for ML model training
"""

import psycopg2
import pandas as pd
import json
import os
from dotenv import load_dotenv

# Load environment variables
# Try multiple paths to find .env
env_paths = [
    '../../application/.env',
    '../application/.env',
    os.path.join(os.path.dirname(__file__), '../../application/.env'),
    '/home/mirza/fabric-workspace/agricultural-supply-chain/application/.env'
]

for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"✅ Loaded environment from: {env_path}")
        break

def get_db_connection():
    """Create database connection"""
    DATABASE_URL = os.getenv('DATABASE_URL')

    if not DATABASE_URL:
        # Fallback: try reading directly from .env file
        env_file = '/home/mirza/fabric-workspace/agricultural-supply-chain/application/.env'
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL'):
                        DATABASE_URL = line.split('=')[1].strip().strip('"')
                        break

    if not DATABASE_URL:
        raise Exception("DATABASE_URL not found in environment variables")

    conn = psycopg2.connect(DATABASE_URL)
    return conn

def export_batch_data():
    """Export batch data with all features for training"""

    query = """
    SELECT
        b."batchId",
        b."productType" as crop,
        b."cropType",
        b.quantity,
        b.unit,
        b."qualityGrade",
        b."pricePerUnit",
        b.currency,
        b."totalBatchValue",
        b."moistureContent",
        b."proteinContent",
        b.certifications,
        b.status,
        b."harvestDate",
        EXTRACT(MONTH FROM b."harvestDate") as harvest_month,
        EXTRACT(YEAR FROM b."harvestDate") as harvest_year,
        EXTRACT(DOY FROM b."harvestDate") as harvest_day_of_year,

        -- Farm location data
        fl.latitude,
        fl.longitude,
        fl.temperature,
        fl.humidity,
        fl."weather_main",
        fl."weather_desc",
        fl."soilType",
        fl."soilPh",
        fl.elevation,

        -- Farmer profile data
        fp."farmingType",
        fp."primaryCrops",
        fp.certifications as farmer_certifications,
        fp."farmSize",

        -- Additional metadata
        b."cultivationMethod",
        b."irrigationMethod",
        b.fertilizers,
        b.pesticides,

        -- Processing info if available
        COUNT(pr.id) as processing_count,
        AVG(pr."outputQuantity"::float / NULLIF(pr."inputQuantity"::float, 0)) as avg_yield_ratio,

        -- Quality tests if available
        COUNT(qt.id) as quality_test_count,
        STRING_AGG(DISTINCT qt."passFailStatus", ', ') as quality_test_results,

        -- Created timestamp
        b."createdAt"

    FROM batches b
    LEFT JOIN farm_locations fl ON b."farmLocationId" = fl.id
    LEFT JOIN farmer_profiles fp ON b."farmerId" = fp.id
    LEFT JOIN processing_records pr ON b.id = pr."batchId"
    LEFT JOIN quality_tests qt ON b.id = qt."batchId"

    WHERE b.status NOT IN ('RECALLED')

    GROUP BY
        b.id, b."batchId", b."productType", b."cropType", b.quantity, b.unit,
        b."qualityGrade", b."pricePerUnit", b.currency, b."totalBatchValue",
        b."moistureContent", b."proteinContent", b.certifications, b.status,
        b."harvestDate", b."cultivationMethod", b."irrigationMethod",
        b.fertilizers, b.pesticides, b."createdAt",
        fl.latitude, fl.longitude, fl.temperature, fl.humidity,
        fl."weather_main", fl."weather_desc", fl."soilType", fl."soilPh", fl.elevation,
        fp."farmingType", fp."primaryCrops", fp.certifications, fp."farmSize"

    ORDER BY b."createdAt" DESC
    """

    try:
        conn = get_db_connection()
        print("✅ Connected to database")

        # Execute query and load into pandas DataFrame
        df = pd.read_sql_query(query, conn)
        print(f"✅ Exported {len(df)} batch records")

        conn.close()

        # Display summary statistics
        print("\n📊 Data Summary:")
        print(f"   Total batches: {len(df)}")
        print(f"   Date range: {df['harvestDate'].min()} to {df['harvestDate'].max()}")
        print(f"   Unique crops: {df['crop'].nunique()}")
        print(f"   Batches with quality grade: {df['qualityGrade'].notna().sum()}")
        print(f"   Batches with pricing: {df['pricePerUnit'].notna().sum()}")
        print(f"   Batches with location data: {df['latitude'].notna().sum()}")

        print("\n🌾 Crop Distribution:")
        print(df['crop'].value_counts().head(10))

        print("\n⭐ Quality Grade Distribution:")
        print(df['qualityGrade'].value_counts())

        return df

    except Exception as e:
        print(f"❌ Error exporting data: {e}")
        raise

def save_training_data(df, output_path='data/training_data.json'):
    """Save DataFrame to JSON for ML training"""

    # Convert DataFrame to JSON
    # Handle array columns (certifications, fertilizers, pesticides) properly
    df_copy = df.copy()

    # Convert lists to strings for JSON serialization
    for col in ['certifications', 'farmer_certifications', 'fertilizers', 'pesticides', 'farmingType', 'primaryCrops']:
        if col in df_copy.columns:
            df_copy[col] = df_copy[col].apply(lambda x: json.dumps(x) if isinstance(x, (list, dict)) else x)

    # Save to JSON
    output_file = os.path.join(os.path.dirname(__file__), '..', output_path)
    df_copy.to_json(output_file, orient='records', date_format='iso', indent=2)
    print(f"\n✅ Training data saved to: {output_file}")
    print(f"   File size: {os.path.getsize(output_file) / 1024:.2f} KB")

    # Also save as CSV for easy inspection
    csv_file = output_file.replace('.json', '.csv')
    df.to_csv(csv_file, index=False)
    print(f"✅ CSV backup saved to: {csv_file}")

    return output_file

def export_location_history():
    """Export batch location history for spatial anomaly detection"""

    query = """
    SELECT
        blh."batchId",
        blh."eventType",
        blh.latitude,
        blh.longitude,
        blh.timestamp,
        blh.metadata,
        b."productType" as crop,
        b.quantity
    FROM batch_location_history blh
    JOIN batches b ON blh."batchId" = b."batchId"
    ORDER BY blh.timestamp DESC
    LIMIT 10000
    """

    try:
        conn = get_db_connection()
        df = pd.read_sql_query(query, conn)
        conn.close()

        print(f"\n✅ Exported {len(df)} location history records")

        # Save to JSON
        output_file = os.path.join(os.path.dirname(__file__), '..', 'data/location_history.json')
        df.to_json(output_file, orient='records', date_format='iso', indent=2)
        print(f"✅ Location history saved to: {output_file}")

        return df

    except Exception as e:
        print(f"⚠️  Warning: Could not export location history: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Starting data export for ML training...\n")

    # Export main batch data
    df_batches = export_batch_data()

    if len(df_batches) > 0:
        save_training_data(df_batches)

        # Export location history if available
        export_location_history()

        print("\n✅ Data export completed successfully!")
        print("\nNext steps:")
        print("1. Review data/training_data.csv to inspect the data")
        print("2. Run training scripts to build ML models")

    else:
        print("❌ No data found in database. Please ensure batches exist.")
