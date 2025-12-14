// src/components/gis-map/testMap.js (Refined logic)

"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import config from "@arcgis/core/config";

interface MapProps {
  webMapId: any;
  dragable: any;
  height: string;
}

const TestMap = ({ webMapId, dragable, height }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [token, setToken] = useState(null);

  async function fetchToken() {
    const res = await fetch("/api/refresh-token");
    const data = await res.json();
    return data.access_token;
  }

  function getSymbolForEventType(eventType: string, batchStatus: string) {
    const isCompleted = batchStatus === "DELIVERED";
    let color = [0, 0, 0]; // Default Black
    let size = "10px";

    switch (eventType) {
      case "FARM_REGISTRATION":
      case "REGISTERED":
        color = [34, 139, 34]; // Forest Green (Origin)
        break;
      case "PROCESSOR_DEPARTURE":
      case "PROCESSED":
        color = [200, 100, 0]; // Orange (Processing Hub)
        break;
      case "DISTRIBUTOR_DEPARTURE":
      case "WAREHOUSE_ARRIVAL":
        color = [0, 50, 200]; // Dark Blue (Logistics Hub)
        break;
      case "FINAL_DESTINATION":
        color = [180, 0, 0]; // Red (Retail/Export)
        break;
      default:
        color = [100, 100, 100]; // Grey
    }

    // Dim the color if the stage is complete or delivered
    if (isCompleted && eventType !== "FINAL_DESTINATION") {
      color = color.map((c) => c * 0.5); // Dim the color by 50%
    }

    return {
      type: "simple-marker",
      color: color,
      size: size,
      outline: {
        color: [255, 255, 255],
        width: 1.5,
      },
    };
  }

  function getRouteSymbol(routeStatus: string) {
    let color = [0, 0, 0]; // Default Black
    let style = "solid";
    let width = 3;

    switch (routeStatus) {
      case "PLANNED":
        color = [255, 200, 0]; // Yellow (Planned/Pending)
        style = "dash";
        width = 2;
        break;
      case "IN_TRANSIT":
        color = [0, 100, 255]; // Bright Blue (Active Movement)
        style = "solid";
        width = 4;
        break;
      case "DELIVERED":
        color = [0, 150, 0]; // Dark Green (Completed)
        style = "dot";
        width = 2;
        break;
      case "DELAYED":
        color = [255, 0, 0]; // Red (Problem)
        style = "short-dash-dot";
        width = 3;
        break;
      default:
        color = [100, 100, 100]; // Grey
    }

    // Since you are drawing an ENDPOINT (simple-marker) for the line feedback:
    return {
      type: "simple-marker",
      color: color,
      size: "14px",
      style: "circle",
      outline: {
        color: [255, 255, 255],
        width: 2,
      },
    };

    /* If you were drawing the Polyline geometry itself, you would return this:
    return {
        type: "simple-line",
        color: color,
        width: width,
        style: style
    };
    */
  }

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

  // useEffect(()=>{
  //   const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
  //   if (typeof window !== 'undefined') {
  //     (window as any).esriConfig = {
  //       apiKey: apiKey
  //     };
  //   }
  // })
  useEffect(() => {
    if (!token) return;

    let view;

    // 2. Load modules using esri-loader
    loadModules(
      [
        "esri/views/MapView",
        "esri/WebMap",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/geometry/Point",
        "esri/widgets/Legend",
        "esri/identity/IdentityManager",
      ],
      { css: true }
    )
      .then(
        // Callback variable names must match the requested order
        ([
          MapViewModule,
          WebMapModule,
          GraphicModule,
          GraphicsLayerModule,
          PointModule,
          LegendModule,
          IdentityManager,
        ]) => {
          const WebMap = WebMapModule;
          const Graphic = GraphicModule;
          const GraphicsLayer = GraphicsLayerModule;
          const graphicsLayer = new GraphicsLayer({ title: "Batch Locations" });
          IdentityManager.registerToken({
            server: "https://www.arcgis.com",
            token: token,
          });
          const map = new WebMapModule({
            portalItem: {
              id: webMapId,
            },
            layers: [graphicsLayer],
          });

          const Legend = LegendModule;

          const view = new MapViewModule({
            container: mapRef.current,
            map: map,
            center: [101.521, 3.6891],
            zoom: 7,
          });

          viewRef.current = view;
          view.when(function () {
            const Legend = LegendModule;

            const legend = new Legend({
              view: view, // Pass the custom symbols
            });
            view.ui.add(legend, "top-right");

            fetch("/api/batches/active-locations")
              .then((res) => res.json())
              .then((data) => {
                const batchesData = data.batchesData || [];

                graphicsLayer.removeAll(); // Clear existing graphics/lines

                batchesData.forEach((batch: any) => {
                  const batchId = batch.batchId;

                  // 1. Draw Historical/Current Location Points
                  batch.historyPoints.forEach((pointData: any) => {
                    // Draw a graphic for each history point (FARM_REGISTRATION, etc.)

                    console.log("Point Data:", pointData);

                    const point = new PointModule({
                      longitude: pointData.longitude,
                      latitude: pointData.latitude,
                    });
                    const symbol = getSymbolForEventType(
                      pointData.eventType,
                      batch.status
                    ); // Define a symbol helper function
                    const graphic = new Graphic({
                      geometry: point,
                      symbol: symbol,
                      attributes: {
                        batchId: batchId,
                        event: pointData.eventType,
                        status: batch.status,
                      },
                      popupTemplate: {
                        title: `
                        Batch: ${batchId}<br>`,
                        content: `
                        Crop Type: ${pointData.metadata.cropType}<br>
                        Product Name: ${pointData.metadata.productName}<br>
                        Quality: ${pointData.metadata.quality}<br>
                        Status: ${batch.status}<br>
                        Location: ${pointData.metadata.location}<br>
                        Status: ${pointData.eventType}<br>
                        Temperature: ${batch.temperature}<br>
                        Humidity: ${batch.humidity}<br>
                        Weather: ${batch.weather_main} - ${
                          batch.weather_desc
                        }<br>
                        Timestamp: ${new Date(
                          pointData.timestamp
                        ).toLocaleString()}`,
                      },
                    });
                    graphicsLayer.add(graphic);
                  });

                  // 2. Draw Active Routes (Lines)
                  batch.activeRoutes.forEach((route: any) => {
                    // NOTE: Drawing the line requires decoding the Polyline string,
                    // which is complex, or using a dedicated Polyline geometry object.
                    // For simplicity in GraphicsLayer, we draw the START/END POINTS
                    // and rely on a label to indicate the route exists.

                    // For drawing the LINE, you must use the Polyline geometry object and pass the 'routePolyline' string.
                    // This usually requires a separate function to convert the encoded string to a Polyline geometry object.

                    // For the immediate visual feedback, draw the route ENDPOINT:
                    const endPoint = new PointModule({
                      longitude: route.destinationLng,
                      latitude: route.destinationLat,
                    });
                    const routeSymbol = getRouteSymbol(route.status);

                    graphicsLayer.add(
                      new Graphic({
                        geometry: endPoint,
                        symbol: routeSymbol, // Use a small truck icon or similar
                        attributes: { batchId: batchId, status: route.status },
                      })
                    );
                  });
                });
                // OPTIONAL: Zoom to the extent of all new graphics
                // view.goTo(graphicsLayer.graphics);
              })
              .catch((err) =>
                console.error("Error fetching all batch data:", err)
              );

            view.ui.components = [];
            if (dragable) {
              view.navigation.mouseWheelZoomEnabled = false; // Disable mouse scroll zoom
              view.navigation.browserTouchPanEnabled = false; // Disable mobile touch drag/pan
              view.navigation.keyboardNavigationEnabled = false; // Disable keyboard arrow movement
              // Disables the default drag-to-pan behavior on the map
              view.on("drag", function (event: any) {
                event.stopPropagation();
              });
            }
          });
          // 4. Initialize the Map View
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
      {/* 5. Map Container - Ensure sufficient height is set */}
      <div
        ref={mapRef}
        className="map-view-container"
        style={{ height: height, width: "100%" }}
      />
    </>
  );
};

export default TestMap;
