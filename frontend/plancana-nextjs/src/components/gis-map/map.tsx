'use client';

import { useEffect, useRef, useState } from 'react';
import { loadModules } from 'esri-loader';

interface ArcGISMapProps {
  apiKey: string;
  center: [number, number];
  zoom: number;
  basemap: string;
  cropId?: string; 
  primary?: boolean;
}

interface WeatherData {
  id: number;
  temperature: number;
  main: string;
  description: string;
  humidity: number;
  windSpeed: number;
  recordedAt: string;
}

interface LocationData {
  address: string;
  longitude: number;
  latitude: number;
  visible: boolean;
  weather?: WeatherData[];
  cropStageId?: number;
}

interface CropStage {
  id: number;
  role: string;
  lat: number;
  lng: number;
  order: number;
  weather?: WeatherData[];
}

interface Crop {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  stages: CropStage[];
}

interface QueryFilter {
  cropType?: string;
  role?: string;
  distanceKm?: number;
  dateRange?: [string, string];
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({
  apiKey,
  center,
  zoom,
  basemap,
  cropId,
  primary = true
}) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const featureLayerRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const cropMarkersRef = useRef<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingCrop, setIsLoadingCrop] = useState(false);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [queryFilter, setQueryFilter] = useState<QueryFilter>({});
  const [locationInfo, setLocationInfo] = useState<LocationData>({
    address: '',
    longitude: 0,
    latitude: 0,
    visible: false,
    weather: [],
    cropStageId: undefined
  });

  // Query modules references
  const queryRef = useRef<any>(null);

  // Fetch weather data for a specific crop stage
  const fetchWeatherData = async (cropStageId: number): Promise<WeatherData[]> => {
    try {
      console.log('Fetching weather for crop stage:', cropStageId);
      setIsLoadingWeather(true);
      const response = await fetch(`/api/weather/${cropStageId}`);
      if (response.ok) {
        const weatherData = await response.json();
        console.log('Weather API response:', weatherData);
        return weatherData;
      } else {
        console.error('Failed to fetch weather data:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return [];
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Query crops based on filters
  const queryCrops = async (filters: QueryFilter) => {
    if (!queryRef.current || !featureLayerRef.current) {
      console.log('Query modules not ready');
      return;
    }

    try {
      const Query = queryRef.current;
      const query = new Query({
        returnGeometry: true,
        outFields: ["*"],
        where: buildWhereClause(filters)
      });

      // Add spatial query if distance filter is set
      if (filters.distanceKm && viewRef.current) {
        const centerPoint = viewRef.current.center;
        query.geometry = centerPoint;
        query.distance = filters.distanceKm * 1000; // Convert km to meters
        query.units = "meters";
        query.spatialRelationship = "within";
      }

      console.log('Executing query with filters:', filters);
      console.log('Query WHERE clause:', query.where);

      const results = await featureLayerRef.current.queryFeatures(query);
      console.log('Query results:', results);

      // Convert query results back to crop format
      const queriedCrops = convertQueryResultsToCrops(results.features);
      setFilteredCrops(queriedCrops);
      
      // Update map display
      updateMapWithFilteredCrops(queriedCrops);

    } catch (error) {
      console.error('Error querying crops:', error);
    }
  };

  // Build WHERE clause for SQL query
  const buildWhereClause = (filters: QueryFilter): string => {
    const clauses: string[] = [];

    if (filters.cropType) {
      clauses.push(`crop_name = '${filters.cropType}'`);
    }

    if (filters.role) {
      clauses.push(`role = '${filters.role}'`);
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      clauses.push(`created_at >= '${filters.dateRange[0]}' AND created_at <= '${filters.dateRange[1]}'`);
    }

    return clauses.length > 0 ? clauses.join(' AND ') : '1=1';
  };

  // Convert ArcGIS query results back to crop format
  const convertQueryResultsToCrops = (features: any[]): Crop[] => {
    const cropMap = new Map<number, Crop>();

    features.forEach(feature => {
      const attrs = feature.attributes;
      const cropId = attrs.crop_id;

      if (!cropMap.has(cropId)) {
        cropMap.set(cropId, {
          id: cropId,
          name: attrs.crop_name,
          description: attrs.crop_description,
          createdAt: attrs.created_at,
          stages: []
        });
      }

      const crop = cropMap.get(cropId)!;
      crop.stages.push({
        id: attrs.stage_id,
        role: attrs.role,
        lat: feature.geometry.latitude,
        lng: feature.geometry.longitude,
        order: attrs.stage_order || 0
      });
    });

    return Array.from(cropMap.values());
  };

  // Update map display with filtered crops
  const updateMapWithFilteredCrops = async (filteredCrops: Crop[]) => {
    if (!viewRef.current) return;

    console.log('Adding markers for:', filteredCrops.map(c => c.stages));
    try {
      const [Graphic] = await loadModules(['esri/Graphic']);
      
      // Clear existing crop markers
      cropMarkersRef.current.forEach(marker => {
        if (viewRef.current && viewRef.current.graphics) {
          viewRef.current.graphics.remove(marker);
        }
      });
      cropMarkersRef.current = [];

      // Add filtered crop markers
      filteredCrops.forEach(crop => {
        if (crop.stages && Array.isArray(crop.stages)) {
          crop.stages.forEach(stage => {
            const symbol = {
              type: "simple-marker",
              size: cropId ? "24px" : "18px",
              color: stage.role === "farmer" ? "#228B22" : "#FF6347",
              outline: {
                color: "white",
                width: "3px"
              }
            };

            const marker = new Graphic({
              geometry: {
                type: "point",
                longitude: stage.lng,
                latitude: stage.lat
              },
              symbol: symbol,
              attributes: {
                cropName: crop.name,
                cropDescription: crop.description,
                role: stage.role,
                lat: stage.lat,
                lng: stage.lng,
                cropStageId: stage.id
              }
            });

            if (viewRef.current && viewRef.current.graphics) {
              viewRef.current.graphics.add(marker);
              cropMarkersRef.current.push(marker);
            }
          });
        }
      });

      console.log('Updated map with', cropMarkersRef.current.length, 'filtered markers');
    } catch (error) {
      console.error('Error updating map with filtered crops:', error);
    }
  };

  // Spatial query: Find crops within radius
  const findCropsWithinRadius = async (centerPoint: any, radiusKm: number) => {
    if (!queryRef.current || !featureLayerRef.current) return [];

    try {
      const Query = queryRef.current;
      const query = new Query({
        geometry: centerPoint,
        distance: radiusKm * 1000, // Convert to meters
        units: "meters",
        spatialRelationship: "within",
        returnGeometry: true,
        outFields: ["*"]
      });

      const results = await featureLayerRef.current.queryFeatures(query);
      return convertQueryResultsToCrops(results.features);
    } catch (error) {
      console.error('Error in spatial query:', error);
      return [];
    }
  };

  // Statistical query: Get crop counts by type
  const getCropStatistics = async () => {
    if (!queryRef.current || !featureLayerRef.current) return {};

    try {
      const Query = queryRef.current;
      const query = new Query({
        where: "1=1",
        outStatistics: [
          {
            statisticType: "count",
            onStatisticField: "crop_id",
            outStatisticFieldName: "total_crops"
          }
        ],
        groupByFieldsForStatistics: ["crop_name"]
      });

      const results = await featureLayerRef.current.queryFeatures(query);
      const stats: { [key: string]: number } = {};
      
      results.features.forEach((feature: any) => {
        const cropName = feature.attributes.crop_name;
        const count = feature.attributes.total_crops;
        stats[cropName] = count;
      });

      return stats;
    } catch (error) {
      console.error('Error getting crop statistics:', error);
      return {};
    }
  };

  // Fetch crops data - either all crops or a specific crop
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setIsLoadingCrop(true);
        let url = '/api/crop';
        
        if (cropId) {
          url = `/api/crop/${cropId}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const cropsData = await response.json();
          console.log('Fetched crops data:', cropsData);
          
          if (cropId) {
            setCrops([cropsData]);
            setFilteredCrops([cropsData]);
          } else {
            setCrops(cropsData);
            setFilteredCrops(cropsData);
          }
        } else {
          console.error('Failed to fetch crops:', response.status);
          setCrops([]);
          setFilteredCrops([]);
        }
      } catch (error) {
        console.error('Error fetching crops:', error);
        setCrops([]);
        setFilteredCrops([]);
      } finally {
        setIsLoadingCrop(false);
      }
    };

    fetchCrops();
  }, [cropId]);

  // Calculate map center based on crop stages
  const calculateMapCenter = (crops: Crop[]): [number, number] => {
    if (!crops.length || !crops[0].stages?.length) {
      return center;
    }

    const stages = crops.flatMap(crop => crop.stages);
    const totalLat = stages.reduce((sum, stage) => sum + stage.lat, 0);
    const totalLng = stages.reduce((sum, stage) => sum + stage.lng, 0);
    
    return [
      totalLng / stages.length,
      totalLat / stages.length
    ];
  };

  // Create feature layer from crop data
  const createFeatureLayer = async (crops: Crop[]) => {
    try {
      const [FeatureLayer, Field] = await loadModules([
        'esri/layers/FeatureLayer',
        'esri/layers/support/Field'
      ]);

      const fields = [
        new Field({ name: "OBJECTID", type: "oid" }),
        new Field({ name: "crop_id", type: "integer" }),
        new Field({ name: "crop_name", type: "string" }),
        new Field({ name: "crop_description", type: "string" }),
        new Field({ name: "created_at", type: "date" }),
        new Field({ name: "stage_id", type: "integer" }),
        new Field({ name: "role", type: "string" }),
        new Field({ name: "stage_order", type: "integer" })
      ];

      // Convert crops to features
      const features: any[] = [];
      let objectId = 1;

      crops.forEach(crop => {
        crop.stages.forEach(stage => {
          features.push({
            attributes: {
              OBJECTID: objectId++,
              crop_id: crop.id,
              crop_name: crop.name,
              crop_description: crop.description,
              created_at: new Date(crop.createdAt).getTime(),
              stage_id: stage.id,
              role: stage.role,
              stage_order: stage.order
            },
            geometry: {
              type: "point",
              longitude: stage.lng,
              latitude: stage.lat
            }
          });
        });
      });

      const featureLayer = new FeatureLayer({
        source: features,
        fields: fields,
        objectIdField: "OBJECTID",
        geometryType: "point",
        spatialReference: { wkid: 4326 }
      });

      return featureLayer;
    } catch (error) {
      console.error('Error creating feature layer:', error);
      return null;
    }
  };

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).esriConfig = {
        apiKey: apiKey
      };
    }

    const modulesToLoad = [
      'esri/Map',
      'esri/views/MapView',
      'esri/widgets/Track',
      'esri/widgets/Zoom',
      'esri/rest/locator',
      'esri/Graphic',
      'esri/rest/support/Query',
    ];

    if (primary) {
      modulesToLoad.push('esri/widgets/Directions', 'esri/layers/RouteLayer');
    }

    loadModules(modulesToLoad, {
      css: true,
      version: '4.32'
    }).then(async (modules) => {
      const [Map, MapView, Track, Zoom, locator, Graphic, Query, Directions, RouteLayer] = modules;
      
      // Store query modules for later use
      queryRef.current = Query;

      if (mapDiv.current && !mapRef.current) {
        const map = new Map({
          basemap: basemap
        });

        const mapCenter = crops.length > 0 ? calculateMapCenter(crops) : center;
        const mapZoom = cropId ? 13 : zoom;

        const view = new MapView({
          container: mapDiv.current,
          map: map,
          center: mapCenter,
          zoom: mapZoom
        });

        mapRef.current = map;
        viewRef.current = view;

        // Create feature layer from crop data
        if (crops.length > 0) {
          const featureLayer = await createFeatureLayer(crops);
          if (featureLayer) {
            featureLayerRef.current = featureLayer;
            // Don't add to map - we'll use graphics for display
          }
        }

        view.when(() => {
          console.log('Map view is ready');
          setIsMapReady(true);

          // Add Track widget
          const trackElement = document.createElement('arcgis-track');
          // Optionally set attributes, e.g. position
          trackElement.setAttribute('position', 'top-left');
          // Append to the map container

          // Add directions widget for primary maps
          if (primary) {
            const routeLayer = new RouteLayer();
            map.add(routeLayer);

            const directionsWidget = new Directions({
              view: view,
              layer: routeLayer,
              routeServiceUrl: "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
            });
            view.ui.add(directionsWidget, 'top-right');
          }

          // Reverse geocoding service URL
          const serviceUrl = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

          // Function to show location info
          const showLocationInfo = (address: string, mapPoint: any) => {
            const longitude = Math.round(mapPoint.longitude * 100000) / 100000;
            const latitude = Math.round(mapPoint.latitude * 100000) / 100000;
            
            if (currentMarkerRef.current) {
              view.graphics.remove(currentMarkerRef.current);
            }
            
            const marker = new Graphic({
              geometry: mapPoint,
              symbol: {
                type: "simple-marker",
                color: "red",
                size: "16px",
                outline: {
                  color: "white",
                  width: "3px"
                }
              }
            });
            
            view.graphics.add(marker);
            currentMarkerRef.current = marker;
            
            setLocationInfo({
              address,
              longitude,
              latitude,
              visible: true,
              weather: [],
              cropStageId: undefined
            });
          };

          // Click event listener
          view.on("click", (event: any) => {
            view.hitTest(event).then(async (response: any) => {
              if (response.results.length > 0) {
                const graphic = response.results[0].graphic;
                if (graphic.attributes && graphic.attributes.cropName) {
                  const longitude = Math.round(graphic.attributes.lng * 100000) / 100000;
                  const latitude = Math.round(graphic.attributes.lat * 100000) / 100000;
                  
                  let weatherData: WeatherData[] = [];
                  if (graphic.attributes.cropStageId) {
                    weatherData = await fetchWeatherData(graphic.attributes.cropStageId);
                  }
                  
                  setLocationInfo({
                    address: `${graphic.attributes.cropName} (${graphic.attributes.role})`,
                    longitude,
                    latitude,
                    visible: true,
                    weather: weatherData,
                    cropStageId: graphic.attributes.cropStageId
                  });
                  return;
                }
              }
              
              // Regular reverse geocoding
              const params = { location: event.mapPoint };
              locator.locationToAddress(serviceUrl, params).then(
                (response: any) => {
                  showLocationInfo(response.address, event.mapPoint);
                },
                (error: any) => {
                  showLocationInfo("No address found.", event.mapPoint);
                }
              );
            });
          });

          // Add query panel button
          if (primary && !cropId) {
            const queryButton = document.createElement("div");
            queryButton.innerHTML = "🔍 Query Crops";
            queryButton.className = "esri-widget esri-component";
            queryButton.style.padding = "8px 12px";
            queryButton.style.cursor = "pointer";
            queryButton.style.backgroundColor = "#0079c1";
            queryButton.style.color = "white";
            queryButton.style.border = "1px solid #0079c1";
            queryButton.style.borderRadius = "3px";
            queryButton.style.fontSize = "14px";
            queryButton.style.marginBottom = "5px";
            
            queryButton.addEventListener("click", () => {
              setShowQueryPanel(!showQueryPanel);
            });
            
            view.ui.add(queryButton, "bottom-left");
          }

          if (primary) {
            // Clear button
            const clearButton = document.createElement("div");
            clearButton.innerHTML = "Clear Markers";
            clearButton.className = "esri-widget esri-component";
            clearButton.style.padding = "8px 12px";
            clearButton.style.cursor = "pointer";
            clearButton.style.backgroundColor = "#fff";
            clearButton.style.border = "1px solid #ccc";
            clearButton.style.borderRadius = "3px";
            clearButton.style.fontSize = "14px";
            
            clearButton.addEventListener("click", () => {
              if (currentMarkerRef.current) {
                view.graphics.remove(currentMarkerRef.current);
                currentMarkerRef.current = null;
              }
              setLocationInfo(prev => ({ ...prev, visible: false }));
            });
            
            view.ui.add(clearButton, "bottom-right");
          }

          // View All Crops button for single crop view
          if (cropId) {
            const viewAllButton = document.createElement("div");
            viewAllButton.innerHTML = "View All Crops";
            viewAllButton.className = "esri-widget esri-component";
            viewAllButton.style.padding = "8px 12px";
            viewAllButton.style.cursor = "pointer";
            viewAllButton.style.backgroundColor = "#0079c1";
            viewAllButton.style.color = "white";
            viewAllButton.style.border = "1px solid #0079c1";
            viewAllButton.style.borderRadius = "3px";
            viewAllButton.style.fontSize = "14px";
            viewAllButton.style.marginBottom = "5px";
            
            viewAllButton.addEventListener("click", () => {
              window.location.href = '/map';
            });
            
            view.ui.add(viewAllButton, "bottom-left");
          }
        });
      }
    }).catch((error) => {
      console.error('Error loading ArcGIS modules:', error);
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
        mapRef.current = null;
      }
    };
  }, [apiKey, center, zoom, basemap, cropId, crops]);

  // Update feature layer when crops change
  useEffect(() => {
    const updateFeatureLayer = async () => {
      if (crops.length > 0 && isMapReady) {
        const featureLayer = await createFeatureLayer(crops);
        if (featureLayer) {
          featureLayerRef.current = featureLayer;
        }
      }
    };

    updateFeatureLayer();
  }, [crops, isMapReady]);

  // Add crop markers when ready
  useEffect(() => {
    const addCropMarkers = async () => {
      if (!isMapReady || !viewRef.current || filteredCrops.length === 0) {
        return;
      }

      updateMapWithFilteredCrops(filteredCrops);

      // Center map on crop markers if showing specific crop
      if (cropId && filteredCrops.length > 0) {
        const mapCenter = calculateMapCenter(filteredCrops);
        viewRef.current.goTo({
          center: mapCenter,
          zoom: 13
        });
      }
    };

    addCropMarkers();
  }, [filteredCrops, isMapReady, cropId]);

  // Handle query form submission
  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryCrops(queryFilter);
    setShowQueryPanel(false);
  };

  // Reset filters
  const resetFilters = () => {
    setQueryFilter({});
    setFilteredCrops(crops);
    setShowQueryPanel(false);
  };

  // Get unique crop types for filter dropdown
  const uniqueCropTypes = Array.from(new Set(crops.map(crop => crop.name)));

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={mapDiv} 
        style={{ 
          height: '100%', 
          width: '100%',
          padding: 0,
          margin: 0
        }}
      />
      
      {/* Loading indicator */}
      {(!isMapReady || isLoadingCrop) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          {isLoadingCrop ? 'Loading crop data...' : 'Loading map...'}
        </div>
      )}

      {/* Query Panel */}
      {showQueryPanel && primary && !cropId && (
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          backgroundColor: 'white',
          border: '2px solid #0079c1',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          minWidth: '300px',
          zIndex: 1000,
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0079c1' }}>🔍 Query Crops</h3>
          <form onSubmit={handleQuerySubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Crop Type:
              </label>
              <select
                value={queryFilter.cropType || ''}
                onChange={(e) => setQueryFilter(prev => ({ ...prev, cropType: e.target.value || undefined }))}
                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">All Types</option>
                {uniqueCropTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Role:
              </label>
              <select
                value={queryFilter.role || ''}
                onChange={(e) => setQueryFilter(prev => ({ ...prev, role: e.target.value || undefined }))}
                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">All Roles</option>
                <option value="farmer">Farmer</option>
                <option value="processor">Processor</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Distance from center (km):
              </label>
              <input
                type="number"
                value={queryFilter.distanceKm || ''}
                onChange={(e) => setQueryFilter(prev => ({ ...prev, distanceKm: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="e.g. 50"
                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0079c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Apply Query
              </button>
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowQueryPanel(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Query Results Info */}
      {filteredCrops.length !== crops.length && primary && !cropId && (
        <div style={{
          position: 'absolute',
          top:'85vh',
          right: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #28a745',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          fontSize: '12px',
          fontFamily: 'Arial, sans-serif',
          color: '#28a745',
          fontWeight: 'bold'
        }}>
          📊 Showing {filteredCrops.length} of {crops.length} crops
        </div>
      )}

      {/* Crop Info Header - Show only when viewing specific crop */}
      {cropId && crops.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '80vh',
          right: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #0079c1',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          maxWidth: '300px',
          zIndex: 999,
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#0079c1',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🌾 {crops[0].name}
          </h3>
          <p style={{ 
            margin: '0 0 8px 0', 
            color: '#333',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            {crops[0].description}
          </p>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {crops[0].stages?.length || 0} stage(s) shown
          </div>
        </div>
      )}

      {/* Location Info Widget */}
      {locationInfo.visible && primary && (
        <div
          style={{
            position: 'fixed',
            top: '15px',
            left: '50%',
            right: '15px',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            border: '2px solid #0079c1',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            minWidth: '300px',
            maxWidth: '500px',
            zIndex: 1000,
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h4 style={{ 
              margin: 0, 
              color: '#0079c1',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              📍 Location Information
            </h4>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: locationInfo.weather && locationInfo.weather.length > 0 ? '1fr' : '1fr 1fr', 
            gap: '12px',
            fontSize: '13px'
          }}>
            <div>
              <strong style={{ color: '#0079c1' }}>Address:</strong>
              <div style={{ marginTop: '4px', color: '#333', wordBreak: 'break-word' }}>
                {locationInfo.address}
              </div>
            </div>
            
            {(!locationInfo.weather || locationInfo.weather.length === 0) && (
              <div>
                <strong style={{ color: '#0079c1' }}>Coordinates:</strong>
                <div style={{ marginTop: '4px', color: '#333' }}>
                  <div>Lng: {locationInfo.longitude}</div>
                  <div>Lat: {locationInfo.latitude}</div>
                </div>
              </div>
            )}

            {locationInfo.weather && locationInfo.weather.length > 0 && (
              <>
                <div>
                  <strong style={{ color: '#0079c1' }}>Coordinates:</strong>
                  <div style={{ marginTop: '4px', color: '#333' }}>
                    <div>Lng: {locationInfo.longitude}</div>
                    <div>Lat: {locationInfo.latitude}</div>
                  </div>
                </div>
                
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <strong style={{ color: '#0079c1' }}>
                    🌤️ Weather Information
                    {isLoadingWeather && <span style={{ marginLeft: '8px', fontSize: '12px' }}>Loading...</span>}
                  </strong>
                  <div style={{ 
                    marginTop: '8px', 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    padding: '8px'
                  }}>
                    {locationInfo.weather.map((weather, index) => (
                      <div key={weather.id} style={{ 
                        marginBottom: index < locationInfo.weather!.length - 1 ? '12px' : '0',
                        paddingBottom: index < locationInfo.weather!.length - 1 ? '8px' : '0',
                        borderBottom: index < locationInfo.weather!.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>{weather.main}</span>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            color: weather.temperature > 25 ? '#ff6b6b' : weather.temperature < 10 ? '#4dabf7' : '#51cf66' 
                          }}>
                            {weather.temperature}°C
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          {weather.description}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#888' }}>
                          <span>💧 {weather.humidity}%</span>
                          <span>💨 {weather.windSpeed} km/h</span>
                          <span>📅 {new Date(weather.recordedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '8px', 
            borderTop: '1px solid #eee',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#228B22', 
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div>
                <span>Farmer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#FF6347', 
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div>
                <span>Processor</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: 'red', 
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArcGISMap;