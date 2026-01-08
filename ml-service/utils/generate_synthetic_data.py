#!/usr/bin/env python3
"""
Generate synthetic agricultural batch data for ML training
Includes both normal and anomalous data for fraud detection
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import random

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

# Malaysian agricultural context
CROPS = {
    'Rice': {
        'price_range': (1.5, 3.5),
        'quality_grades': ['A', 'B', 'C'],
        'typical_quantity': (500, 5000),
        'moisture_range': (12, 15),
        'regions': ['Kedah', 'Perlis', 'Perak', 'Selangor']
    },
    'Palm Oil': {
        'price_range': (2.5, 5.0),
        'quality_grades': ['Premium', 'Grade A', 'Grade B'],
        'typical_quantity': (1000, 10000),
        'moisture_range': (5, 10),
        'regions': ['Johor', 'Pahang', 'Sabah', 'Sarawak']
    },
    'Banana': {
        'price_range': (2.0, 6.0),
        'quality_grades': ['A', 'B', 'C'],
        'typical_quantity': (50, 500),
        'moisture_range': (70, 80),
        'regions': ['Johor', 'Pahang', 'Perak', 'Selangor']
    },
    'Pineapple': {
        'price_range': (3.0, 7.0),
        'quality_grades': ['Premium', 'A', 'B'],
        'typical_quantity': (100, 1000),
        'moisture_range': (80, 87),
        'regions': ['Johor', 'Pahang', 'Sarawak']
    },
    'Rubber': {
        'price_range': (4.0, 8.0),
        'quality_grades': ['RSS1', 'RSS2', 'RSS3'],
        'typical_quantity': (200, 2000),
        'moisture_range': (0, 5),
        'regions': ['Perak', 'Negeri Sembilan', 'Johor']
    },
    'Cocoa': {
        'price_range': (5.0, 12.0),
        'quality_grades': ['Premium', 'Grade 1', 'Grade 2'],
        'typical_quantity': (100, 800),
        'moisture_range': (6, 8),
        'regions': ['Sabah', 'Sarawak', 'Pahang']
    },
    'Durian': {
        'price_range': (15.0, 40.0),
        'quality_grades': ['Musang King', 'D24', 'Red Prawn'],
        'typical_quantity': (50, 300),
        'moisture_range': (65, 75),
        'regions': ['Penang', 'Pahang', 'Johor']
    },
    'Corn': {
        'price_range': (1.8, 4.0),
        'quality_grades': ['A', 'B', 'C'],
        'typical_quantity': (300, 3000),
        'moisture_range': (13, 16),
        'regions': ['Kedah', 'Perlis', 'Perak']
    }
}

# Malaysian regions with approximate GPS coordinates
REGION_COORDINATES = {
    'Kedah': {'lat': (5.9, 6.5), 'lng': (100.2, 100.8)},
    'Perlis': {'lat': (6.4, 6.7), 'lng': (100.1, 100.3)},
    'Perak': {'lat': (4.0, 5.5), 'lng': (100.5, 101.5)},
    'Selangor': {'lat': (2.8, 3.5), 'lng': (101.2, 101.8)},
    'Johor': {'lat': (1.4, 2.5), 'lng': (103.0, 104.5)},
    'Pahang': {'lat': (3.0, 4.5), 'lng': (102.0, 103.5)},
    'Sabah': {'lat': (4.5, 7.5), 'lng': (115.0, 119.0)},
    'Sarawak': {'lat': (1.0, 5.0), 'lng': (109.5, 115.5)},
    'Penang': {'lat': (5.2, 5.5), 'lng': (100.1, 100.5)},
    'Negeri Sembilan': {'lat': (2.5, 3.0), 'lng': (101.5, 102.5)}
}

CERTIFICATIONS = [
    ['Organic Certified'],
    ['Halal Certified'],
    ['MyGAP Certified'],
    ['Fair Trade Certified'],
    ['Rainforest Alliance'],
    ['Organic Certified', 'Halal Certified'],
    ['MyGAP Certified', 'Halal Certified'],
    ['Organic Certified', 'Fair Trade Certified'],
    []
]

CULTIVATION_METHODS = ['Conventional', 'Organic', 'Integrated Pest Management', 'Sustainable']
IRRIGATION_METHODS = ['Drip', 'Sprinkler', 'Flood', 'Rain-fed']
FARMING_TYPES = [['organic'], ['conventional'], ['hydroponic'], ['organic', 'sustainable']]

WEATHER_CONDITIONS = [
    {'main': 'Clear', 'desc': 'clear sky', 'temp_range': (28, 35), 'humidity_range': (60, 75)},
    {'main': 'Clouds', 'desc': 'few clouds', 'temp_range': (26, 32), 'humidity_range': (65, 80)},
    {'main': 'Clouds', 'desc': 'scattered clouds', 'temp_range': (25, 30), 'humidity_range': (70, 85)},
    {'main': 'Rain', 'desc': 'light rain', 'temp_range': (24, 28), 'humidity_range': (80, 95)},
    {'main': 'Thunderstorm', 'desc': 'thunderstorm with rain', 'temp_range': (23, 27), 'humidity_range': (85, 98)}
]

STATUSES = ['REGISTERED', 'PROCESSING', 'PROCESSED', 'IN_TRANSIT', 'DELIVERED', 'RETAIL_READY', 'SOLD']

def generate_gps_coordinates(region):
    """Generate GPS coordinates within a region"""
    coords = REGION_COORDINATES[region]
    lat = np.random.uniform(coords['lat'][0], coords['lat'][1])
    lng = np.random.uniform(coords['lng'][0], coords['lng'][1])
    return round(lat, 6), round(lng, 6)

def generate_anomalous_gps():
    """Generate obviously fake GPS coordinates"""
    anomaly_types = [
        (0.0, 0.0),  # Null island
        (90.0, 0.0),  # North pole
        (-90.0, 0.0),  # South pole
        (40.7128, -74.0060),  # New York (impossible for Malaysia)
        (random.uniform(-10, 50), random.uniform(50, 150))  # Random far location
    ]
    return random.choice(anomaly_types)

def generate_weather_data(temp_anomaly=False):
    """Generate weather data"""
    weather = random.choice(WEATHER_CONDITIONS)

    if temp_anomaly:
        # Impossible weather conditions
        temp = random.choice([50, 60, -10, -5, 0])  # Too hot or too cold for Malaysia
        humidity = random.uniform(0, 100)
    else:
        temp = round(np.random.uniform(weather['temp_range'][0], weather['temp_range'][1]), 2)
        humidity = round(np.random.uniform(weather['humidity_range'][0], weather['humidity_range'][1]), 1)

    return {
        'temperature': temp,
        'humidity': humidity,
        'weather_main': weather['main'],
        'weather_desc': weather['desc']
    }

def generate_batch_id(index):
    """Generate batch ID"""
    return f"BAT-2025-{str(index).zfill(4)}"

def generate_normal_batch(index, base_date):
    """Generate a normal (legitimate) batch"""
    crop = random.choice(list(CROPS.keys()))
    crop_info = CROPS[crop]

    # Select region appropriate for crop
    region = random.choice(crop_info['regions'])
    lat, lng = generate_gps_coordinates(region)

    # Generate quality grade and pricing
    quality_grade = random.choice(crop_info['quality_grades'])

    # Price influenced by quality (premium quality = higher price)
    price_multiplier = 1.0
    if 'Premium' in quality_grade or quality_grade == 'A' or 'King' in quality_grade:
        price_multiplier = 1.2
    elif quality_grade in ['B', 'Grade 2']:
        price_multiplier = 0.9
    elif quality_grade in ['C', 'Grade 3']:
        price_multiplier = 0.75

    base_price = np.random.uniform(crop_info['price_range'][0], crop_info['price_range'][1])
    price_per_unit = round(base_price * price_multiplier, 2)

    # Generate quantity
    quantity = round(np.random.uniform(crop_info['typical_quantity'][0], crop_info['typical_quantity'][1]), 1)
    total_value = round(quantity * price_per_unit, 2)

    # Moisture content
    moisture = round(np.random.uniform(crop_info['moisture_range'][0], crop_info['moisture_range'][1]), 1)

    # Protein content (for applicable crops)
    protein = round(np.random.uniform(2, 15), 1) if crop in ['Rice', 'Corn'] else None

    # Harvest date (random date in past 6 months)
    days_ago = random.randint(1, 180)
    harvest_date = base_date - timedelta(days=days_ago)

    # Weather data
    weather = generate_weather_data()

    # Status (older batches more likely to be in later stages)
    if days_ago > 120:
        status = random.choice(['SOLD', 'DELIVERED', 'RETAIL_READY'])
    elif days_ago > 60:
        status = random.choice(['IN_TRANSIT', 'DELIVERED', 'PROCESSED'])
    else:
        status = random.choice(['REGISTERED', 'PROCESSING', 'PROCESSED'])

    # Certifications
    certifications = random.choice(CERTIFICATIONS)

    # Processing data (simplified)
    processing_count = random.randint(0, 3) if status != 'REGISTERED' else 0
    avg_yield_ratio = round(np.random.uniform(0.85, 0.99), 4) if processing_count > 0 else None

    batch = {
        'batchId': generate_batch_id(index),
        'crop': crop,
        'cropType': 'fruit' if crop in ['Banana', 'Pineapple', 'Durian'] else 'cash_crop',
        'quantity': quantity,
        'unit': 'kg',
        'qualityGrade': quality_grade,
        'pricePerUnit': price_per_unit,
        'currency': 'MYR',
        'totalBatchValue': total_value,
        'moistureContent': moisture,
        'proteinContent': protein,
        'certifications': json.dumps(certifications),
        'status': status,
        'harvestDate': harvest_date.strftime('%Y-%m-%d'),
        'harvest_month': harvest_date.month,
        'harvest_year': harvest_date.year,
        'harvest_day_of_year': harvest_date.timetuple().tm_yday,
        'latitude': lat,
        'longitude': lng,
        'temperature': weather['temperature'],
        'humidity': weather['humidity'],
        'weather_main': weather['weather_main'],
        'weather_desc': weather['weather_desc'],
        'soilType': random.choice(['Clay', 'Loam', 'Sandy', 'Peat']),
        'soilPh': round(np.random.uniform(5.5, 7.5), 1),
        'elevation': round(np.random.uniform(10, 500), 1),
        'farmingType': json.dumps(random.choice(FARMING_TYPES)),
        'primaryCrops': json.dumps([crop]),
        'farmer_certifications': json.dumps(certifications),
        'farmSize': round(np.random.uniform(1, 100), 1),
        'cultivationMethod': random.choice(CULTIVATION_METHODS),
        'irrigationMethod': random.choice(IRRIGATION_METHODS),
        'fertilizers': json.dumps([]),
        'pesticides': json.dumps([]),
        'processing_count': processing_count,
        'avg_yield_ratio': avg_yield_ratio,
        'quality_test_count': random.randint(0, 2),
        'quality_test_results': 'PASS' if random.random() > 0.1 else None,
        'createdAt': (base_date - timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S'),
        'is_anomaly': False  # Label for ML training
    }

    return batch

def generate_anomalous_batch(index, base_date, anomaly_type):
    """Generate an anomalous (fraudulent/suspicious) batch"""
    # Start with a normal batch
    batch = generate_normal_batch(index, base_date)
    batch['is_anomaly'] = True

    if anomaly_type == 'gps_spoofing':
        # GPS coordinates don't match region
        batch['latitude'], batch['longitude'] = generate_anomalous_gps()
        batch['anomaly_reason'] = 'GPS spoofing - coordinates impossible or far from declared region'

    elif anomaly_type == 'price_manipulation':
        # Unrealistic pricing
        manipulation_factor = random.choice([0.2, 0.3, 3.0, 5.0, 10.0])
        batch['pricePerUnit'] = round(batch['pricePerUnit'] * manipulation_factor, 2)
        batch['totalBatchValue'] = round(batch['quantity'] * batch['pricePerUnit'], 2)
        batch['anomaly_reason'] = 'Price manipulation - price extremely high/low compared to market'

    elif anomaly_type == 'impossible_quantity':
        # Unrealistic quantity for crop type
        crop_info = CROPS[batch['crop']]
        batch['quantity'] = random.choice([
            crop_info['typical_quantity'][0] * 0.01,  # Too small
            crop_info['typical_quantity'][1] * 10     # Too large
        ])
        batch['totalBatchValue'] = round(batch['quantity'] * batch['pricePerUnit'], 2)
        batch['anomaly_reason'] = 'Impossible quantity - too small or too large for typical operations'

    elif anomaly_type == 'weather_inconsistency':
        # Quality grade doesn't match weather conditions
        batch['qualityGrade'] = CROPS[batch['crop']]['quality_grades'][0]  # Premium grade
        weather_bad = generate_weather_data(temp_anomaly=True)
        batch['temperature'] = weather_bad['temperature']
        batch['humidity'] = weather_bad['humidity']
        batch['anomaly_reason'] = 'Weather inconsistency - premium quality claimed despite poor conditions'

    elif anomaly_type == 'temporal_anomaly':
        # Impossible timestamps (harvest after processing)
        batch['harvestDate'] = (base_date + timedelta(days=30)).strftime('%Y-%m-%d')
        batch['status'] = 'SOLD'  # Already sold but harvest is in future
        batch['anomaly_reason'] = 'Temporal anomaly - batch sold before harvest date'

    elif anomaly_type == 'moisture_anomaly':
        # Impossible moisture content
        batch['moistureContent'] = random.choice([150, 200, -10, -5])
        batch['anomaly_reason'] = 'Impossible moisture content - outside physical limits'

    return batch

def generate_synthetic_dataset(n_normal=150, n_anomalous=30):
    """Generate complete synthetic dataset"""

    print(f"🎲 Generating synthetic dataset...")
    print(f"   Normal batches: {n_normal}")
    print(f"   Anomalous batches: {n_anomalous}")
    print(f"   Total batches: {n_normal + n_anomalous}")

    base_date = datetime.now()
    batches = []

    # Generate normal batches
    for i in range(n_normal):
        batch = generate_normal_batch(i, base_date)
        batches.append(batch)

    # Generate anomalous batches
    anomaly_types = ['gps_spoofing', 'price_manipulation', 'impossible_quantity',
                     'weather_inconsistency', 'temporal_anomaly', 'moisture_anomaly']

    for i in range(n_anomalous):
        anomaly_type = random.choice(anomaly_types)
        batch = generate_anomalous_batch(n_normal + i, base_date, anomaly_type)
        batches.append(batch)

    # Convert to DataFrame
    df = pd.DataFrame(batches)

    # Shuffle the data
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print("\n✅ Synthetic dataset generated!")
    print(f"\n📊 Dataset Statistics:")
    print(f"   Total batches: {len(df)}")
    print(f"   Normal batches: {len(df[df['is_anomaly'] == False])}")
    print(f"   Anomalous batches: {len(df[df['is_anomaly'] == True])}")
    print(f"   Anomaly rate: {len(df[df['is_anomaly'] == True]) / len(df) * 100:.1f}%")
    print(f"\n🌾 Crop Distribution:")
    print(df['crop'].value_counts())
    print(f"\n⭐ Quality Grade Distribution:")
    print(df['qualityGrade'].value_counts().head(10))
    print(f"\n💰 Price Statistics:")
    print(f"   Mean price: RM{df['pricePerUnit'].mean():.2f}")
    print(f"   Min price: RM{df['pricePerUnit'].min():.2f}")
    print(f"   Max price: RM{df['pricePerUnit'].max():.2f}")

    return df

if __name__ == "__main__":
    # Generate synthetic data
    df = generate_synthetic_dataset(n_normal=150, n_anomalous=30)

    # Save to files
    output_json = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/synthetic_training_data.json'
    output_csv = '/home/mirza/fabric-workspace/agricultural-supply-chain/ml-service/data/synthetic_training_data.csv'

    df.to_json(output_json, orient='records', date_format='iso', indent=2)
    df.to_csv(output_csv, index=False)

    print(f"\n✅ Synthetic data saved to:")
    print(f"   JSON: {output_json}")
    print(f"   CSV: {output_csv}")

    # Show sample anomalies
    print(f"\n🚨 Sample Anomalous Batches:")
    anomalies = df[df['is_anomaly'] == True].head(5)
    for idx, row in anomalies.iterrows():
        print(f"\n   Batch {row['batchId']}:")
        print(f"   - Crop: {row['crop']}")
        print(f"   - Reason: {row.get('anomaly_reason', 'Unknown')}")
        print(f"   - Price: RM{row['pricePerUnit']}/kg")
        print(f"   - Location: ({row['latitude']}, {row['longitude']})")
