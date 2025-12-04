// src/components/gis-map/testMap.js (Refined logic)

'use client'; 

import React, { useEffect, useRef, useState } from 'react';
import { loadModules } from 'esri-loader'; 

const TestMap = ({ webMapId, dragable }: any) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
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
    loadModules(['esri/views/MapView', 'esri/WebMap','esri/widgets/Legend','esri/identity/IdentityManager'], { css: true }).then(
      ([MapView, WebMapModule,LegendModule,IdentityManager]) => { 
        
        const WebMap = WebMapModule;

        IdentityManager.registerToken({
        server: "https://www.arcgis.com",
        token: token,   
        });
        
        // 3. Initialize WebMap with the ID
        const webmap = new WebMap({
          portalItem: {
            id: webMapId, 
          }
        });

        webmap.load().then(() =>{
        const view = new MapView({
          container: mapRef.current,
          map: webmap, 
          center: [101.5210, 3.6891], 
          zoom: 7,
        });

        const Legend = LegendModule;

        view.when(() =>{
          const legend = new Legend({
            view :view,
          })
          view.ui.add(legend, "top-right");
        });

        viewRef.current = view;
        view.when(function() {
          view.ui.components =[];
          if(dragable){
            view.navigation.mouseWheelZoomEnabled = false; // Disable mouse scroll zoom
            view.navigation.browserTouchPanEnabled = false; // Disable mobile touch drag/pan
            view.navigation.keyboardNavigationEnabled = false; // Disable keyboard arrow movement
              // Disables the default drag-to-pan behavior on the map
              view.on('drag', function(event:any) {
                event.stopPropagation();
            });            
          }                   
        });          
        })
        // 4. Initialize the Map View
        console.log("Map View Initialized, authenticating via API Key.");
      }
    ).catch(error => {
      console.error("Map Initialization Error:", error);
    });

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [webMapId,token]);

  return (
    <>
      {/* 5. Map Container - Ensure sufficient height is set */}
      <div 
        ref={mapRef} 
        className="map-view-container" 
        style={{ height: '70vh', width: '100%' }}
      />
    </>
  );
};

export default TestMap;