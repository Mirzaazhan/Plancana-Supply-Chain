'use client';

import { useEffect, useRef, useState } from 'react';
import { loadModules } from 'esri-loader';

interface ArcGISMapProps {
  lat: number;
  lng: number;
  onLatitudeChange : (lat :number) => void;
  onLongitudeChange : (lng :number) => void;
}

export default function ArcGISMap({ lat, lng, onLatitudeChange, onLongitudeChange }: ArcGISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const [form, setForm] = useState({ lat: 0.0, lng: 0.0 });

  useEffect(() => {
    let Graphic: any;

    loadModules(['esri/Map', 'esri/views/MapView', 'esri/widgets/Search', 'esri/Graphic'], { css: true }).then(
      ([Map, MapView, Search, GraphicModule]) => {
        Graphic = GraphicModule;

        const map = new Map({ basemap: 'streets-navigation-vector' });
        const view = new MapView({
          container: mapRef.current!,
          map,
          center: [lng || 101.6869, lat || 3.139],
          zoom: 10,
        });

        viewRef.current = view;

        // Wait until the view is fully ready
        view.when(() => {
          const search = new Search({ view });
          view.ui.add(search, 'top-right');

          // Handle search result
          search.on('select-result', (event: any) => {
            const { latitude, longitude } = event.result.feature.geometry;
            setForm({
              lat: latitude.toFixed(6),
              lng: longitude.toFixed(6),
            });

            // Add marker
            const graphic = new Graphic({
              geometry: { type: 'point', latitude, longitude },
              symbol: { type: 'simple-marker', color: 'blue', size: '8px' },
            });
            view.graphics.removeAll();
            view.graphics.add(graphic);
          });

          // Handle manual click
          view.on('click', (event: any) => {
            const { latitude, longitude } = event.mapPoint;

            setForm({
              lat: latitude.toFixed(6),
              lng: longitude.toFixed(6),
            });

            const graphic = new Graphic({
              geometry: { type: 'point', latitude, longitude },
              symbol: { type: 'simple-marker', color: 'blue', size: '8px' },
            });
            view.graphics.removeAll();
            view.graphics.add(graphic);
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
  }, []);

  // Send data back to parent
  useEffect(() => {
    onLatitudeChange(form.lat);
    onLongitudeChange(form.lng);
  }, [form]);

  return (
    <div className='mb-5'>
      <div ref={mapRef} className="h-64 w-full border rounded" />
      {/* <div className="mt-2 flex gap-2 text-sm text-gray-600">
        <span>Lat: {form.lat}</span>
        <span>Lng: {form.lng}</span>
      </div> */}
    </div>
  );
}
