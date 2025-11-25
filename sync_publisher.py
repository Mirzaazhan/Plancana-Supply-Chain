# sync_publisher.py

import psycopg2
import pandas as pd
import geopandas as gpd
from arcgis.gis import GIS
from arcgis.features import FeatureLayerCollection
import os
import tempfile
import atexit

# --- 1. DATABASE CONFIG (Match your Docker setup) ---
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "agricultural_supply_chain"
DB_USER = "postgres"
DB_PASSWORD = "postgres" # Ensure this matches your Docker container password

# --- 2. ARCGIS ONLINE CONFIG ---
AGOL_USERNAME = os.environ.get("AGOL_USERNAME", "iqbalUM03")
AGOL_PASSWORD = os.environ.get("AGOL_PASSWORD", "Iqbal220306@") # Use password or generate a token

def fetch_and_convert_locations():
    """Fetches locations data and converts it into a GeoDataFrame (Points)."""
    
    # SQL query must select all attributes and coordinates
    sql_locations = """
        SELECT
            f.id AS object_id, 
            f.latitude, 
            f.longitude, 
            'FARMER' AS role,
            b."batchId" AS associated_batch, 
            f."farmName" AS name, 
            fp.address,
            b.status AS batch_status 
        FROM 
            "farm_locations" f
        JOIN 
            "batches" b ON b."farmLocationId" = f.id
        JOIN
            "farmer_profiles" fp ON fp.id = f."farmerId" 
        WHERE b.status IN ('REGISTERED', 'PROCESSING')
        -- NOTE: Include UNION ALLs for Processors, Distributors, Retailers here
        UNION ALL
        SELECT
            pf.id AS object_id, 
            pf.latitude, 
            pf.longitude, 
            'PROCESSOR' AS role,
            pr."batchId" AS associated_batch, 
            pf."facilityName" AS name, 
            pf.address,
            b.status AS batch_status 
        FROM 
            "processing_facilities" pf
        JOIN
            "processing_records" pr ON pr."facilityId" = pf.id
        JOIN 
            "batches" b ON b.id = pr."batchId"
        WHERE b.status IN ('PROCESSING', 'PROCESSED')
        
    """
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT
        )
        # Use Pandas to read the SQL results directly
        df = pd.read_sql(sql_locations, conn)
        conn.close()
        
        if df.empty:
            print("⚠️ No active location data found to publish.")
            return gpd.GeoDataFrame()

        # ⭐ CRITICAL STEP: Convert standard Lat/Long columns into a GeoDataFrame
        gdf = gpd.GeoDataFrame(
            df, 
            geometry=gpd.points_from_xy(df.longitude, df.latitude),
            crs="EPSG:4326" # WGS 84 spatial reference
        )
        return gdf
    
    except Exception as e:
        print(f"❌ Failed to fetch/convert locations data: {e}")
        return gpd.GeoDataFrame()


def fetch_routes_for_publishing():
    """Fetches transport routes data."""
    # We rely on the 'routePolyline' string, which the ArcGIS API handles during publishing.
    sql_routes = """
        SELECT
            tr.id AS object_id, 
            tr."batchId" AS associated_batch,
            tr.status AS route_status, 
            tr.distance AS distance_km,
            tr."routePolyline",
            -- ⭐ Add start/end coordinates for better data processing (optional but helpful)
            tr."originLat",
            tr."originLng"
        FROM 
            "transport_routes" tr
        WHERE 
            tr.status IN ('PLANNED', 'IN_TRANSIT', 'DELIVERED');
    """
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT
        )
        # Fetching as a regular DataFrame (we treat the polyline as an attribute string)
        df = pd.read_sql(sql_routes, conn)
        conn.close()
        return df
    except Exception as e:
        print(f"❌ Failed to fetch routes data: {e}")
        return pd.DataFrame()


def publish_or_overwrite_layer(gis, data_to_publish, title, item_id=None):
    # ... (definition and setup remains the same) ...

    # Determine file type based on data object
    is_spatial = isinstance(data_to_publish, gpd.GeoDataFrame)
    file_type = 'GeoJson' if is_spatial else 'CSV'
    file_ext = '.geojson' if is_spatial else '.csv'

    temp_file_path = None
    try:
        # Create temporary file path and save data
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as tmp:
            temp_file_path = tmp.name
        
        if is_spatial:
            data_to_publish.to_file(temp_file_path, driver='GeoJSON')
        else:
            data_to_publish.to_csv(temp_file_path, index=False, encoding='utf-8')

        # --- PUBLISH NEW LAYER (Initial Creation) ---
        if item_id is None:
            print("--- Running Low-Level Publish ---")
            
            # Step 1: Upload the file as an item
            uploaded_item = gis.content.add({
                'title': title,
                'tags': ["plancana", "live", "sync"],
                'type': 'CSV' if file_type == 'CSV' else 'GeoJson'
            }, data=temp_file_path)
            
            # Step 2: Publish the uploaded item as a Hosted Feature Layer (HFL)
            hfl_item = uploaded_item.publish(
                publish_parameters=None, 
                overwrite=True
            )
            
            # Clean up the intermediate item
            uploaded_item.delete()

            print(f"✅ SUCCESSFULLY PUBLISHED NEW LAYER: {title}. ID: {hfl_item.id}")
            return hfl_item

        # 3. --- OVERWRITE EXISTING LAYER (Synchronization) ---
        else:
            item = gis.content.get(item_id)
            
            # Overwrite logic uses the Item ID and the path to the updated file
            item.manager.overwrite(temp_file_path)
            
            print(f"✅ Successfully OVERWROTE existing layer: {title}")
            return item
            
    except Exception as e:
        print(f"❌ FAILED TO PUBLISH/OVERWRITE LAYER {title}. Error: {e}")
        return None
        
    finally:
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# --- MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    print("--- Starting Plancana GIS Publisher ---")
    
    try:
        # 1. Connect to ArcGIS Online
        gis = GIS(username=AGOL_USERNAME, password=AGOL_PASSWORD)
        print(f"Connected to AGOL as {gis.properties.user.username}")
    except Exception as e:
        print(f"❌ Failed to connect to AGOL. Check AGOL_USERNAME/PASSWORD. Error: {e}")
        exit()

    # 2. Fetch and Prepare Data
    locations_gdf = fetch_and_convert_locations()
    routes_df = fetch_routes_for_publishing()
    
    # 3. Publish/Overwrite Locations Layer (Points)
    # ⚠️ Replace None with the actual Item ID on subsequent runs:
    locations_hfl = publish_or_overwrite_layer(
        gis, 
        locations_gdf, # <-- This must be a GeoDataFrame
        "Plancana Active Locations (Points)", 
        item_id="caaa2cf0dd934a179274ecc5962ca1f5" 
    )

    # 4. Publish/Overwrite Routes Layer (Lines)
    # NOTE: Publishing routes requires GeoJSON. Since we have a polyline string, 
    # we publish the routes as a standard table and rely on the string attribute
    # being used by the Web Map. For true line geometry, the polyline must be decoded to GeoJSON.
    routes_hfl = publish_or_overwrite_layer(
        gis, 
        routes_df, # <-- This is a standard DataFrame
        "Plancana Active Routes (Lines)", 
        item_id="e215c4676a4f462d83c6192268ab2811"
    )
    
    print("\n--- Publisher Run Complete ---")