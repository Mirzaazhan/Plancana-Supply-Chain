#!/usr/bin/env python3
"""
Combine real and synthetic training data
"""

import pandas as pd
import json

def combine_datasets():
    """Combine real exported data with synthetic data"""

    print("🔗 Combining real and synthetic datasets...")

    # Load real data
    real_data_path = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/training_data.csv'
    df_real = pd.read_csv(real_data_path)
    print(f"✅ Loaded {len(df_real)} real batch records")

    # Add is_anomaly column to real data (assume all real data is normal)
    df_real['is_anomaly'] = False

    # Load synthetic data
    synthetic_data_path = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/synthetic_training_data.csv'
    df_synthetic = pd.read_csv(synthetic_data_path)
    print(f"✅ Loaded {len(df_synthetic)} synthetic batch records")

    # Ensure columns match (add anomaly_reason to real data if it doesn't exist)
    if 'anomaly_reason' not in df_real.columns:
        df_real['anomaly_reason'] = None

    # Combine datasets
    df_combined = pd.concat([df_real, df_synthetic], ignore_index=True)

    print(f"\n📊 Combined Dataset Statistics:")
    print(f"   Total batches: {len(df_combined)}")
    print(f"   Real batches: {len(df_real)}")
    print(f"   Synthetic batches: {len(df_synthetic)}")
    print(f"   Normal batches: {len(df_combined[df_combined['is_anomaly'] == False])}")
    print(f"   Anomalous batches: {len(df_combined[df_combined['is_anomaly'] == True])}")
    print(f"   Anomaly rate: {len(df_combined[df_combined['is_anomaly'] == True]) / len(df_combined) * 100:.1f}%")

    # Save combined dataset
    output_json = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/combined_training_data.json'
    output_csv = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/combined_training_data.csv'

    df_combined.to_json(output_json, orient='records', date_format='iso', indent=2)
    df_combined.to_csv(output_csv, index=False)

    print(f"\n✅ Combined dataset saved to:")
    print(f"   JSON: {output_json}")
    print(f"   CSV: {output_csv}")

    print(f"\n🌾 Crop Distribution:")
    print(df_combined['crop'].value_counts().head(10))

    print(f"\n💰 Price Range:")
    print(f"   Min: RM{df_combined['pricePerUnit'].min():.2f}")
    print(f"   Max: RM{df_combined['pricePerUnit'].max():.2f}")
    print(f"   Mean: RM{df_combined['pricePerUnit'].mean():.2f}")
    print(f"   Median: RM{df_combined['pricePerUnit'].median():.2f}")

    return df_combined

if __name__ == "__main__":
    df = combine_datasets()
    print("\n✅ Dataset combination complete! Ready for ML training.")
