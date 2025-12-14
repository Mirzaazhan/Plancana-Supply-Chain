// src/components/gis-map/testMap.js (Using Lucide Icons with Proper Legend)

"use client";

<<<<<<< Updated upstream
import React, { useEffect, useRef, useState } from 'react';
import { loadModules } from 'esri-loader';
import config from '@arcgis/core/config'; 
=======
import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import config from "@arcgis/core/config";
import { MapPin, Factory, Truck, Store, CheckCircle } from "lucide-react";
>>>>>>> Stashed changes

interface MapProps {
  webMapId: any;
  dragable: any;
  height: string;
  zoom?: number;
}

const TestMap = ({ webMapId, dragable, height, zoom }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [token, setToken] = useState(null);

  async function fetchToken() {
    const res = await fetch("/api/refresh-token");
    const data = await res.json();
    return data.access_token;
  }

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
        return "WAREHOUSE";
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
    // FIX: Replace the incorrect React function call with the established getIconPath helper.
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" style="opacity: ${opacity};" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getIconPath(IconComponent)}
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Helper to get SVG path for each icon
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

  // function getSymbolForEventType(eventType: string, batchStatus: string) {
  //   const isCompleted = batchStatus === "SOLD";
  //   let color = "#000000";
  //   let icon = MapPin;
  //   let size = 24;

  //   const opacity = isCompleted ? 0.5 : 1.0;

  //   switch (eventType) {
  //     case "FARM_REGISTRATION":
  //     case "REGISTERED":
  //       color = isCompleted ? "#228B2280" : "#228B22"; // Forest Green
  //       icon = MapPin;
  //       break;
  //     case "PROCESSED":
  //     case "PROCESSING":
  //       color = isCompleted ? "#C8640080" : "#C86400"; // Orange
  //       icon = Factory;
  //       break;
  //     case "DISTRIBUTION_ARRIVAL":
  //     case "WAREHOUSE_ARRIVAL":
  //       color = isCompleted ? "#0032C880" : "#0032C8"; // Dark Blue
  //       icon = Store;
  //       break;
  //     case "RETAIL_READY":
  //       color = isCompleted ? "#B4000080" : "#B40000"; // Red
  //       icon = CheckCircle;
  //       break;
  //     default:
  //       color = "#646464"; // Grey
  //       icon = MapPin;
  //   }

  //   return {
  //     type: "picture-marker",
  //     url: iconToSvgString(icon, color, size, opacity),
  //     width: `${size}px`,
  //     height: `${size}px`,
  //   };
  // }

  // function getRouteSymbol(routeStatus: string) {
  //   let color = "#000000";
  //   let size = 30;

  //   switch (routeStatus) {
  //     case "PLANNED":
  //       color = "#FFC800"; // Yellow
  //       break;
  //     case "IN_TRANSIT":
  //       color = "#0064FF"; // Bright Blue
  //       break;
  //     case "DELIVERED":
  //       color = "#009600"; // Dark Green
  //       break;
  //     case "DELAYED":
  //       color = "#FF0000"; // Red
  //       break;
  //     default:
  //       color = "#646464"; // Grey
  //   }

  //   return {
  //     type: "picture-marker",
  //     url: iconToSvgString(Truck, color, size),
  //     width: `${size}px`,
  //     height: `${size}px`,
  //   };
  // }

  // Auto-refresh token every 55 minutes
  useEffect(() => {
    async function initTokenCycle() {
      const newToken = await fetchToken();
      setToken(newToken);

      const interval = setInterval(async () => {
        const refreshed = await fetchToken();
        setToken(refreshed);
      }, 55 * 60 * 1000);

      return () => clearInterval(interval);
    }

    initTokenCycle();
  }, []);

  useEffect(() => {
    if (!token) return;

    let view: any;

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
        ]: any[]) => {
          const WebMap = WebMapModule;
          const Graphic = GraphicModule;
          const GraphicsLayer = GraphicsLayerModule;
          const FeatureLayer = FeatureLayerModule;
          const UniqueValueRenderer = UniqueValueRendererModule;

          IdentityManager.registerToken({
            server: "https://www.arcgis.com",
            token: token,
          });

          const size = 20;

          // Create renderer for location types
          const locationRenderer = new UniqueValueRenderer({
            field: "role",
            defaultLabel: "Other",
            legendOptions: {
              title: " ", // Empty title to hide field name
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
                value: "WAREHOUSE",
                symbol: {
                  type: "picture-marker",
                  url: iconToSvgString(Store, "#0032C8", size, 1.0),
                  width: `${size}px`,
                  height: `${size}px`,
                },
                label: "Warehouse",
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
              title: " ", // Empty title to hide field name
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

          // Create feature layers with renderers
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
            ],
            renderer: locationRenderer,
            geometryType: "point",
            popupEnabled: true,
            popupTemplate: {
              title: "Batch: {batchId}",
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
            },
          });

          const routesLayer = new FeatureLayer({
            title: "Active Routes",
            source: [],
            objectIdField: "ObjectID",
            fields: [
              { name: "ObjectID", type: "oid" },
              { name: "routeStatus", type: "string" },
              { name: "batchId", type: "string" },
            ],
            renderer: routeRenderer,
            geometryType: "point",
            popupEnabled: true,
          });

          const map = new WebMapModule({
            portalItem: {
              id: webMapId,
            },
            layers: [locationsLayer, routesLayer],
          });

          const view = new MapViewModule({
            container: mapRef.current,
            map: map,
            center: [102.591212, 2.767333],
            zoom: zoom || 6,
          });

          viewRef.current = view;
          view.when(function () {
            // Wait for layers to load before adding legend
            Promise.all([locationsLayer.when(), routesLayer.when()]).then(
              () => {
                // Add legend after layers are ready
                const legend = new LegendModule({
                  view: view,
                  layerInfos: [
                    {
                      layer: locationsLayer,
                      title: "Batch Locations",
                      hideLayers: false,
                    },
                    // {
                    //   layer: routesLayer,
                    //   title: "Active Routes",
                    //   hideLayers: false,
                    // },
                  ],
                  style: "card", // Use card style for better appearance
                  respectLayerVisibility: true,
                });
                view.ui.add(legend, "top-right");
              }
            );

            // Fetch data
            Promise.all([locationsLayer.when(), routesLayer.when()]).then(
              () => {
                fetch("/api/batches/active-locations")
                  .then((res) => res.json())
                  .then((data) => {
                    const batchesData = data.batchesData || [];

                    const locationFeatures: any[] = [];
                    const routeFeatures: any[] = [];
                    let objectId = 1;

                    batchesData.forEach((batch: any) => {
                      const batchId = batch.batchId;

                      // Create location features
                      batch.historyPoints.forEach((pointData: any) => {
                        const point = new PointModule({
                          longitude: pointData.longitude,
                          latitude: pointData.latitude,
                        });

                        const role = getRole(pointData.eventType);

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
                          },
                        });
                      });

                      // Create route features
                      batch.activeRoutes.forEach((route: any) => {
                        const endPoint = new PointModule({
                          longitude: route.destinationLng,
                          latitude: route.destinationLat,
                        });

                        routeFeatures.push({
                          geometry: endPoint,
                          attributes: {
                            ObjectID: objectId++,
                            routeStatus: route.status,
                            batchId: batchId,
                          },
                        });
                      });
                    });

                    // Apply features to layers
                    locationsLayer
                      .applyEdits({
                        addFeatures: locationFeatures,
                      })
                      .catch((err: any) =>
                        console.error("Error adding locations:", err)
                      );

                    routesLayer
                      .applyEdits({
                        addFeatures: routeFeatures,
                      })
                      .catch((err: any) =>
                        console.error("Error adding routes:", err)
                      );
                  })
                  .catch((err) =>
                    console.error("Error fetching all batch data:", err)
                  );
              }
            ); // End of Promise.all

            view.ui.components = [];
            if (dragable) {
              view.navigation.mouseWheelZoomEnabled = false;
              view.navigation.browserTouchPanEnabled = false;
              view.navigation.keyboardNavigationEnabled = false;
              view.on("drag", function (event: any) {
                event.stopPropagation();
              });
            }
          });
          console.log("Map View Initialized, authenticating via API Key.");
        }
      )
      .catch((error) => {
        console.error("Map Initialization Error:", error);
      });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [webMapId, token]);

  return (
    <>
      <div
        ref={mapRef}
        className="map-view-container"
        style={{ height: height, width: "100%" }}
      />
    </>
  );
};

export default TestMap;
