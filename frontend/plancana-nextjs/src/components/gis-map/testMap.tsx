"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import {
  MapPin,
  Factory,
  Truck,
  Store,
  CheckCircle,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";

interface MapProps {
  webMapId: any;
  dragable: any;
  height: string;
  zoom?: number;
}

const TestMap = ({ webMapId, dragable, height, zoom }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const locationsLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilter, setShowFilter] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to map eventType to role
  function getRole(eventType: string): string {
    switch (eventType) {
      case "FARM_REGISTRATION":
      case "REGISTERED":
        return "FARMER";
      case "PROCESSING":
      case "PROCESSED":
        return "PROCESSOR";
      case "WAREHOUSE_ARRIVAL":
      case "DISTRIBUTION_ARRIVAL":
        return "DISTRIBUTOR";
      case "RETAIL_READY":
        return "RETAILER";
      default:
        return "OTHER";
    }
  }

  function iconToSvgString(
    IconComponent: any,
    color: string,
    size: number = 24,
    opacity: number = 1.0
  ) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" style="opacity: ${opacity};" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getIconPath(IconComponent)}
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  function getIconPath(IconComponent: any) {
    switch (IconComponent) {
      case MapPin:
        return '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
      case Factory:
        return '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>';
      case Truck:
        return '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>';
      case Store:
        return '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>';
      case CheckCircle:
        return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
      default:
        return '<circle cx="12" cy="12" r="10"/>';
    }
  }

  // const applyFilters = () => {
  //   const startTime = startDate ? new Date(startDate).getTime() : null;
  //   const endTime = endDate ? new Date(endDate).getTime() + 86400000 : null;

  //   if (!locationsLayerRef.current || !routesLayerRef.current) return;

  //   let expressions: string[] = [];
  //   if (selectedBatchId) {
  //     // BATCH-2026-05-A
  //     const parts = selectedBatchId.split("-"); // ["BATCH", "2026", "05", "A"]
  //     const isChildBatch = parts.length > 3; // true if more than 3 parts // this chase is true
  //     if (isChildBatch) {
  //       //true
  //       const parentBatchId = parts.slice(0, 3).join("-"); // "BATCH-2026-05"
  //       expressions.push(
  //         `((batchId = '${parentBatchId}' AND isParentPath = 'true' AND timestampNum <= splitTimestamp) OR batchId = '${selectedBatchId}')`
  //       );
  //     } else {
  //       expressions.push(`batchId = '${selectedBatchId}'`);
  //     }
  //   }
  //   if (startDate) expressions.push(`timestampNum >= ${startTime}`);
  //   if (endDate) expressions.push(`timestampNum <= ${endTime}`);

  //   locationsLayerRef.current.definitionExpression =
  //     expressions.length > 0 ? expressions.join(" AND ") : "1=1";

  //   routesLayerRef.current.graphics.forEach((graphic: any) => {
  //     const attr = graphic.attributes;
  //     let isPathValid = true;
  //     if (selectedBatchId) {
  //       const isDirectBatch = attr.batchIdName === selectedBatchId;

  //       const isParentOfSelected =
  //         attr.isParentPath === true &&
  //         selectedBatchId.startsWith(attr.batchIdName + "-") &&
  //         attr.splitTimestamp !== null &&
  //         attr.splitTimestamp !== undefined &&
  //         attr.timestamp !== null &&
  //         attr.timestamp !== undefined &&
  //         attr.timestamp <= attr.splitTimestamp;

  //       isPathValid = isDirectBatch || isParentOfSelected;
  //     } else {
  //       isPathValid = attr.isParentPath !== true;
  //     }

  //     const afterStart =
  //       !startTime || !attr.timestamp || attr.timestamp >= startTime;
  //     const beforeEnd =
  //       !endTime || !attr.timestamp || attr.timestamp <= endTime;

  //     graphic.visible = isPathValid && afterStart && beforeEnd;
  //   });
  // };
  const applyFilters = () => {
    const startTime = startDate ? new Date(startDate).getTime() : null;
    const endTime = endDate ? new Date(endDate).getTime() + 86400000 : null;

    if (!locationsLayerRef.current || !routesLayerRef.current) return;

    let expressions: string[] = [];

    if (selectedBatchId) {
      const parts = selectedBatchId.split("-");

      const batchExpressions: string[] = [];

      batchExpressions.push(`batchId = '${selectedBatchId}'`);

      for (let i = 3; i < parts.length; i++) {
        const ancestorBatch = parts.slice(0, i).join("-");
        batchExpressions.push(
          `(batchId = '${ancestorBatch}' AND isParentPath = 'true' AND timestampNum <= splitTimestamp)`
        );
      }

      expressions.push(`(${batchExpressions.join(" OR ")})`);
    }

    if (startDate) expressions.push(`timestampNum >= ${startTime}`);
    if (endDate) expressions.push(`timestampNum <= ${endTime}`);

    const finalExpression =
      expressions.length > 0 ? expressions.join(" AND ") : "1=1";
    console.log("Applying filter expression:", finalExpression); // Debug log

    locationsLayerRef.current.definitionExpression = finalExpression;

    routesLayerRef.current.graphics.forEach((graphic: any) => {
      const attr = graphic.attributes;
      let isPathValid = true;

      if (selectedBatchId) {
        const isDirectBatch = attr.batchIdName === selectedBatchId;

        const isAncestor =
          selectedBatchId.startsWith(attr.batchIdName + "-") &&
          attr.isParentPath === true;

        const isValidParentPath =
          isAncestor &&
          attr.splitTimestamp != null &&
          attr.timestamp != null &&
          attr.timestamp <= attr.splitTimestamp;

        isPathValid = isDirectBatch || isValidParentPath;
      } else {
        isPathValid = attr.isParentPath !== true;
      }

      const afterStart =
        !startTime || !attr.timestamp || attr.timestamp >= startTime;
      const beforeEnd =
        !endTime || !attr.timestamp || attr.timestamp <= endTime;

      graphic.visible = isPathValid && afterStart && beforeEnd;
    });

    // Force layer refresh
    if (locationsLayerRef.current) {
      locationsLayerRef.current.refresh();
    }
  };

  const clearFilters = () => {
    setSelectedBatchId("");
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    applyFilters();
  }, [selectedBatchId, startDate, endDate]);

  // Fetch token with retry and error handling
  async function fetchToken(retryCount = 0): Promise<string | null> {
    const MAX_RETRIES = 3;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/refresh-token", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Token fetch failed: ${res.status}`);
      }

      const data = await res.json();

      if (!data.access_token) {
        throw new Error("No access token in response");
      }

      return data.access_token;
    } catch (error) {
      console.error(`Token fetch attempt ${retryCount + 1} failed:`, error);

      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 * (retryCount + 1))
        );
        return fetchToken(retryCount + 1);
      }

      setMapError(
        "Failed to authenticate with ArcGIS. Please refresh the page."
      );
      return null;
    }
  }

  // Initialize token with proper error handling
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout;

    async function initTokenCycle() {
      const newToken = await fetchToken();

      if (!isMounted) return;

      if (newToken) {
        setToken(newToken);
        setMapError(null);

        // Refresh token every 55 minutes
        refreshInterval = setInterval(async () => {
          const refreshed = await fetchToken();
          if (isMounted && refreshed) {
            setToken(refreshed);
          }
        }, 55 * 60 * 1000);
      }
    }

    initTokenCycle();

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Initialize map only when token is available
  useEffect(() => {
    if (!token || !mapRef.current) return;

    let view: any;
    let isMounted = true;

    setIsLoading(true);
    setMapError(null);

    loadModules(
      [
        "esri/views/MapView",
        "esri/WebMap",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/layers/FeatureLayer",
        "esri/geometry/Point",
        "esri/widgets/Legend",
        "esri/identity/IdentityManager",
        "esri/renderers/UniqueValueRenderer",
        "esri/config",
      ],
      { css: true }
    )
      .then(
        ([
          MapViewModule,
          WebMapModule,
          GraphicModule,
          GraphicsLayerModule,
          FeatureLayerModule,
          PointModule,
          LegendModule,
          IdentityManager,
          UniqueValueRendererModule,
          esriConfig,
        ]: any[]) => {
          if (!isMounted) return;

          // Configure ArcGIS with token
          try {
            IdentityManager.registerToken({
              server: "https://www.arcgis.com/sharing/rest",
              token: token,
            });

            // Also set the API key if available
            if (process.env.NEXT_PUBLIC_ARCGIS_API_KEY) {
              esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
            }
          } catch (error) {
            console.error("Token registration error:", error);
            setMapError(
              "Authentication failed. Please check your credentials."
            );
            setIsLoading(false);
            return;
          }

          const WebMap = WebMapModule;
          const Graphic = GraphicModule;
          const GraphicsLayer = GraphicsLayerModule;
          const FeatureLayer = FeatureLayerModule;
          const UniqueValueRenderer = UniqueValueRendererModule;

          const size = 20;

          // Create renderer for location types
          const locationRenderer = new UniqueValueRenderer({
            field: "role",
            defaultLabel: "Other",
            legendOptions: {
              title: " ",
            },
            uniqueValueInfos: [
              {
                value: "FARMER",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(MapPin, "#228B22", size, 1.0),
                  width: `${size}px`,
                  height: `${size}px`,
                },
                label: "Farmer",
              },
              {
                value: "PROCESSOR",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Factory, "#C86400", size, 1.0),
                  width: `${size}px`,
                  height: `${size}px`,
                },
                label: "Processor",
              },
              {
                value: "DISTRIBUTOR",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Store, "#0032C8", size, 1.0),
                  width: `${size}px`,
                  height: `${size}px`,
                },
                label: "Distributor",
              },
              {
                value: "RETAILER",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(CheckCircle, "#B40000", size, 1.0),
                  width: `${size}px`,
                  height: `${size}px`,
                },
                label: "Retailer",
              },
            ],
          });

          // Create renderer for routes
          const routeRenderer = new UniqueValueRenderer({
            field: "routeStatus",
            defaultLabel: "Other",
            legendOptions: {
              title: " ",
            },
            uniqueValueInfos: [
              {
                value: "PLANNED",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Truck, "#FFC800", 30),
                  width: "30px",
                  height: "30px",
                },
                label: "Planned",
              },
              {
                value: "IN_TRANSIT",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Truck, "#0064FF", 30),
                  width: "30px",
                  height: "30px",
                },
                label: "In Transit",
              },
              {
                value: "DELIVERED",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Truck, "#009600", 30),
                  width: "30px",
                  height: "30px",
                },
                label: "Delivered",
              },
              {
                value: "DELAYED",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Truck, "#FF0000", 30),
                  width: "30px",
                  height: "30px",
                },
                label: "Delayed",
              },
            ],
          });

          // Create feature layers
          const locationsLayer = new FeatureLayer({
            title: "Batch Locations",
            source: [],
            objectIdField: "ObjectID",
            fields: [
              { name: "ObjectID", type: "oid" },
              { name: "role", type: "string" },
              { name: "eventType", type: "string" },
              { name: "batchId", type: "string" },
              { name: "status", type: "string" },
              { name: "cropType", type: "string" },
              { name: "productType", type: "string" },
              { name: "quantity", type: "string" },
              { name: "location", type: "string" },
              { name: "temperature", type: "string" },
              { name: "humidity", type: "string" },
              { name: "weather_main", type: "string" },
              { name: "weather_desc", type: "string" },
              { name: "timestamp", type: "string" },
              { name: "timestampNum", type: "double" },
              { name: "isParentPath", type: "string" },
              { name: "splitTimestamp", type: "double" },
              { name: "parentBatch", type: "string" },
            ],
            renderer: locationRenderer,
            geometryType: "point",
            popupEnabled: true,
            popupTemplate: {
              title: "{expression/dynamic-title}",
              content: `
                <b>Crop Type:</b> {cropType}<br>
                <b>Product Name:</b> {productType}<br>
                <b>Quantity:</b> {quantity}<br>
                <b>Status:</b> {status}<br>
                <b>Location:</b> {location}<br>
                <b>Temperature:</b> {temperature}<br>
                <b>Humidity:</b> {humidity}<br>
                <b>Weather:</b> {weather_main} - {weather_desc}<br>
                <b>Timestamp:</b> {timestamp}
              `,
              expressionInfos: [
                {
                  name: "dynamic-title",
                  title: "Batch ID Logic",
                  expression: `
                  // Check if the point is part of the parent's lineage
                  if ($feature.isParentPath == 'true' && !IsEmpty($feature.parentBatch)) {
                    return "Parent Batch: " + $feature.parentBatch;
                  } else {
                    return "Batch: " + $feature.batchId;
                  }
                `,
                },
              ],
            },
          });

          // const routesLayer = new FeatureLayer({
          //   title: "Active Routes",
          //   source: [],
          //   objectIdField: "ObjectID",
          //   fields: [
          //     { name: "ObjectID", type: "oid" },
          //     { name: "routeStatus", type: "string" },
          //     { name: "batchId", type: "string" },
          //   ],
          //   renderer: routeRenderer,
          //   geometryType: "point",
          //   popupEnabled: true,
          // });

          const routesGraphicsLayer = new GraphicsLayerModule({
            title: "Route Lines",
          });

          // Create WebMap with error handling
          const map = new WebMapModule({
            portalItem: {
              id: webMapId,
            },
            layers: [routesGraphicsLayer, locationsLayer],
          });

          locationsLayerRef.current = locationsLayer;
          routesLayerRef.current = routesGraphicsLayer;

          // Handle map load errors
          map.load().catch((error: any) => {
            console.error("WebMap load error:", error);
            if (!isMounted) return;

            if (
              error.message?.includes("403") ||
              error.message?.includes("401")
            ) {
              setMapError(
                "Access denied. Please check your ArcGIS credentials."
              );
            } else if (error.message?.includes("404")) {
              setMapError("Map not found. Please check the Web Map ID.");
            } else {
              setMapError("Failed to load map. Please refresh and try again.");
            }
            setIsLoading(false);
          });

          const view = new MapViewModule({
            container: mapRef.current,
            map: map,
            center: [102.591212, 2.767333],
            zoom: zoom || 6,
          });

          viewRef.current = view;

          view
            .when()
            .then(() => {
              if (!isMounted) return;

              setIsLoading(false);

              // Add legend
              Promise.all([
                locationsLayer.when(),
                routesGraphicsLayer.when(),
              ]).then(() => {
                if (!isMounted) return;

                const legend = new LegendModule({
                  view: view,
                  layerInfos: [
                    {
                      layer: locationsLayer,
                      title: "Batch Locations",
                      hideLayers: false,
                    },
                  ],
                  style: "card",
                  respectLayerVisibility: true,
                });
                view.ui.add(legend, "top-right");
              });

              // Fetch and display data
              Promise.all([
                locationsLayer.when(),
                routesGraphicsLayer.when(),
              ]).then(() => {
                if (!isMounted) return;

                fetch("/api/batches/active-locations")
                  .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                  })
                  .then((data) => {
                    if (!isMounted) return;

                    const batchesData = data.batchesData || [];

                    const uniqueBatchIds = Array.from(
                      new Set(batchesData.map((batch: any) => batch.batchId))
                    ) as string[];
                    setBatchIds(uniqueBatchIds);

                    const locationFeatures: any[] = [];
                    const routeFeatures: any[] = [];
                    let objectId = 1;

                    batchesData.forEach((batch: any) => {
                      const batchId = batch.batchId;

                      batch.historyPoints.forEach((pointData: any) => {
                        const point = new PointModule({
                          longitude: pointData.longitude,
                          latitude: pointData.latitude,
                        });

                        const role = getRole(pointData.eventType);
                        const timestamp = new Date(
                          pointData.timestamp
                        ).getTime();

                        locationFeatures.push({
                          geometry: point,
                          attributes: {
                            ObjectID: objectId++,
                            role: role,
                            eventType: pointData.eventType,
                            batchId: batchId,
                            status: batch.status,
                            cropType: batch.cropType,
                            productType: batch.productType,
                            quantity: batch.quantity,
                            location: pointData.metadata.location || "N/A",
                            temperature:
                              pointData.metadata.temperature || "N/A",
                            humidity: pointData.metadata.humidity || "N/A",
                            weather_main:
                              pointData.metadata.weather_main || "N/A",
                            weather_desc:
                              pointData.metadata.weather_desc || "N/A",
                            timestamp: new Date(
                              pointData.timestamp
                            ).toLocaleString(),
                            splitTimestamp:
                              pointData.metadata.splitTimestamp || 0,
                            timestampNum: new Date(
                              pointData.timestamp
                            ).getTime(),
                            isParentPath: pointData.metadata?.isParentPath
                              ? "true"
                              : "false",
                            parentBatch:
                              pointData.metadata?.parentBatch || null,
                          },
                        });
                      });

                      batch.activeRoutes.forEach((route: any) => {
                        if (route.routePolyline) {
                          try {
                            const geojson = JSON.parse(route.routePolyline);
                            const polyline = {
                              type: "polyline",
                              paths: geojson.coordinates,
                            };

                            const routeSymbol = {
                              type: "simple-line",
                              color: [11, 156, 49, 1], // change route colour here
                              width: 3,
                              style: "solid",
                            };

                            const routeGraphic = new Graphic({
                              geometry: polyline,
                              symbol: routeSymbol,
                              attributes: {
                                batchIdName: route.isParentPath
                                  ? route.batchIdName
                                  : batch.batchId,
                                isParentPath: route.isParentPath ? true : false,
                                splitTimestamp: route.splitTimestamp || 0,
                                timestamp: route.timestamp || 0,
                                TotalTime: route.TotalTime,
                                distance: route.distance,
                                eta: route.estimatedTime,
                              },
                              popupTemplate: {
                                title: "Transport Route: {batchIdName}",
                                content: `
                                  <b>Distance:</b> {distance} km<br>
                                  <b>ETA between points:</b> {eta} minutes<br>
                                `,
                              },
                            });

                            if (routesLayerRef.current) {
                              routesLayerRef.current.add(routeGraphic);
                            }
                          } catch (e) {
                            console.error("Error parsing route geometry:", e);
                          }
                        }
                      });
                    });

                    if (locationFeatures.length > 0) {
                      locationsLayer.applyEdits({
                        addFeatures: locationFeatures,
                      });
                    }

                    if (routeFeatures.length > 0) {
                      routesGraphicsLayer.applyEdits({
                        addFeatures: routeFeatures,
                      });
                    }
                  })
                  .catch((err) => {
                    console.error("Error fetching batch data:", err);
                    if (isMounted) {
                      setMapError("Failed to load batch data.");
                    }
                  });
              });

              view.ui.components = [];
              if (dragable) {
                view.navigation.mouseWheelZoomEnabled = false;
                view.navigation.browserTouchPanEnabled = false;
                view.navigation.keyboardNavigationEnabled = false;
                view.on("drag", function (event: any) {
                  event.stopPropagation();
                });
              }
            })
            .catch((error: any) => {
              console.error("View initialization error:", error);
              if (isMounted) {
                setMapError("Failed to initialize map view.");
                setIsLoading(false);
              }
            });
        }
      )
      .catch((error) => {
        console.error("Map Module Load Error:", error);
        if (isMounted) {
          setMapError("Failed to load map modules. Please refresh.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [webMapId, token, dragable, zoom]);

  return (
    <>
      <div className="relative w-full" style={{ height: height }}>
        {/* Error Display */}
        {mapError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Map Error</h4>
                <p className="text-sm text-red-700">{mapError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && !mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading map...</p>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} />
            <span className="font-medium">Filters</span>
            {(selectedBatchId || startDate || endDate) && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>

          {showFilter && (
            <div className="absolute top-16 left-4 z-10 bg-white p-4 rounded-lg shadow-xl w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filter Options</h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch ID
                  </label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Batches</option>
                    {batchIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {(selectedBatchId || startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          className="map-view-container"
          style={{ height: height, width: "100%" }}
        />
      </div>
    </>
  );
};

export default TestMap;
