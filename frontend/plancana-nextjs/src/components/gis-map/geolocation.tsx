"use client";

import { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import { log } from "console";

interface ArcGISMapProps {
  lat: number;
  lng: number;
  onLatitudeChange?: (lat: number) => void;
  onLongitudeChange?: (lng: number) => void;
  onLocationChange?: (locationName: string) => void;
}

export default function ArcGISMap({
  lat,
  lng,
  onLocationChange,
  onLatitudeChange,
  onLongitudeChange,
}: ArcGISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [form, setForm] = useState({ lat: 0.0, lng: 0.0, loc: "" });
  const [token, setToken] = useState(null);

  async function fetchToken() {
    const res = await fetch("/api/refresh-token");
    const data = await res.json();
    return data.access_token;
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

  useEffect(() => {
    if (!token) return;

    let view;

    let Graphic: any;
    const locatorUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

    loadModules(
      [
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/Search",
        "esri/Graphic",
        "esri/WebMap",
        "esri/rest/locator",
        "esri/identity/IdentityManager",
      ],
      { css: true }
    ).then(
      ([
        Map,
        MapView,
        Search,
        GraphicModule,
        WebMapModule,
        locator,
        IdentityManager,
      ]) => {
        const WebMap = WebMapModule;
        Graphic = GraphicModule;

        IdentityManager.registerToken({
          server: "https://www.arcgis.com",
          token: token,
        });
        const map = new Map({ basemap: "streets-navigation-vector" });
        const view = new MapView({
          container: mapRef.current!,
          map: map,
          center: [lng || 101.6869, lat || 3.139],
          zoom: 10,
        });

        viewRef.current = view;

        // Wait until the view is fully ready
        view.when(() => {
          const search = new Search({ view });
          view.ui.add(search, "top-right");

          // Handle search result
          search.on("select-result", (event: any) => {
            const { latitude, longitude } = event.result.feature.geometry;
            const locationName = event.result.name;
            onLocationChange?.(locationName);
            setForm({
              lat: parseFloat(latitude.toFixed(6)),
              lng: parseFloat(longitude.toFixed(6)),
              loc: locationName,
            });

            // Add marker
            const graphic = new Graphic({
              geometry: { type: "point", latitude, longitude },
              symbol: { type: "simple-marker", color: "blue", size: "8px" },
            });
            view.graphics.removeAll();
            view.graphics.add(graphic);
          });

          // Handle manual click
          view.on("click", async (event: any) => {
            const { latitude, longitude } = event.mapPoint;

            try {
              const requestOptions = {
                query: {
                  token: token, // Pass the token here
                },
              };
              const res = await locator.locationToAddress(
                locatorUrl,
                {
                  location: event.mapPoint,
                  outFields: ["*"], // Request all fields for a detailed address
                  featureTypes: ["PointAddress", "StreetAddress", "POI"],
                  returnIntersection: false,
                },
                requestOptions
              );
              const locationName = res.address;

              console.log("Full address object:", res.address);
              setForm({
                lat: parseFloat(latitude.toFixed(6)),
                lng: parseFloat(longitude.toFixed(6)),
                loc: locationName,
              });
              const graphic = new Graphic({
                geometry: { type: "point", latitude, longitude },
                symbol: { type: "simple-marker", color: "blue", size: "8px" },
              });
              view.graphics.removeAll();
              view.graphics.add(graphic);
              console.log("Reverse GeoCoding success:", locationName);
            } catch (error) {
              console.log("Reverse GeoCoding failed:", error);
            }
          });
        });
      }
    );

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [token]);

  // Send data back to parent
  useEffect(() => {
    // Only call the functions if they are defined
    onLatitudeChange?.(form.lat);
    onLongitudeChange?.(form.lng);
    onLocationChange?.(form.loc);
  }, [form, onLatitudeChange, onLongitudeChange, onLocationChange]);

  return (
    <div className="mb-5">
      <div ref={mapRef} className="h-64 w-full border rounded" />
      {/* <div className="mt-2 flex gap-2 text-sm text-gray-600">
          <span>Lat: {form.lat}</span>
          <span>Lng: {form.lng}</span>
        </div> */}
    </div>
  );
}
