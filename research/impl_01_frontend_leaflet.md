# Frontend Implementation Research: Vite, React & Leaflet Dashboard

## Executive Summary
Building a high-performance wildfire early detection dashboard requires a modern frontend stack. The recommended 2024-2026 approach uses **Vite** for fast builds, **React** for UI composition, **Tailwind CSS v4** for styling, and **React-Leaflet** for interactive mapping. This document outlines the technical implementation details, complete with working code snippets, for building the Sri Lanka Wildfire Risk Dashboard.

## 1. Project Setup: Vite + React + Tailwind CSS (2024+)

The modern approach to setting up Tailwind CSS uses the new `@tailwindcss/vite` plugin, removing the need for `postcss.config.js` and `tailwind.config.js`.

**Commands:**
```bash
npm create vite@latest wildfire-dashboard -- --template react-ts
cd wildfire-dashboard
npm install
npm install tailwindcss @tailwindcss/vite
npm install leaflet react-leaflet @types/leaflet
npm install react-dropzone recharts lucide-react
npm install leaflet.heat
npm install -D @types/leaflet.heat
```

**Vite Configuration (`vite.config.ts`):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

**Global CSS (`src/index.css`):**
```css
@import "tailwindcss";

/* Leaflet map base styles */
.leaflet-container {
  width: 100%;
  height: 100vh;
  background: #000; /* Dark matter tile matching */
}
```

## 2. React-Leaflet Setup with Dark Tiles

Using CartoDB Dark Matter tiles creates a dramatic effect suitable for a risk dashboard.

**`src/components/MapDashboard.tsx`:**
```tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapDashboard = () => {
  // Center of Sri Lanka
  const position: [number, number] = [7.8731, 80.7718];

  return (
    <div className="w-full h-screen relative">
      <MapContainer center={position} zoom={7} zoomControl={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {/* Additional Layers Go Here */}
      </MapContainer>
    </div>
  );
};

export default MapDashboard;
```

## 3. Sri Lanka GeoJSON Choropleth

**Where to find Sri Lanka GeoJSON:**
*   **Best Source:** Humanitarian Data Exchange (HDX) - geoBoundaries for Sri Lanka.
*   **Link:** [HDX Sri Lanka Data](https://data.humdata.org/dataset/geoboundaries-admin-boundaries-for-sri-lanka)
*   **Simplified SVG/GeoJSON:** [Simplemaps](https://simplemaps.com/resources/svg-lk)

**Choropleth Implementation:**
```tsx
import { GeoJSON } from 'react-leaflet';
import { Feature } from 'geojson';
// import sriLankaData from '../assets/lk_districts.json';

const getColor = (riskScore: number) => {
  return riskScore > 80 ? '#b91c1c' : // Red 700
         riskScore > 50 ? '#c2410c' : // Orange 700
         riskScore > 20 ? '#eab308' : // Yellow 500
         '#15803d';                   // Green 700
};

const RiskChoropleth = ({ data, onDistrictClick }: { data: any, onDistrictClick: (name: string) => void }) => {
  const style = (feature?: Feature) => {
    // Assuming feature.properties.riskScore exists
    const risk = feature?.properties?.riskScore || 0;
    return {
      fillColor: getColor(risk),
      weight: 1,
      opacity: 1,
      color: '#1f2937', // dark border
      fillOpacity: 0.6
    };
  };

  const onEachFeature = (feature: Feature, layer: any) => {
    layer.on({
      click: () => {
        onDistrictClick(feature?.properties?.shapeName || 'Unknown');
      },
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({ weight: 3, fillOpacity: 0.9, color: '#fff' });
      },
      mouseout: (e: any) => {
        layer.setStyle(style(feature));
      }
    });
  };

  return <GeoJSON data={data} style={style} onEachFeature={onEachFeature} />;
};
```

## 4. Leaflet Heatmap Layer (2024 Approach)

Outdated wrappers like `react-leaflet-heatmap-layer` are deprecated. Use `leaflet.heat` directly via the `useMap` hook.

```tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

const HeatmapLayer = ({ points }: HeatmapProps) => {
  const map = useMap();

  useEffect(() => {
    // @ts-ignore - leaflet.heat adds heatLayer to L
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};
```

## 5. Pulsing Markers for Active Fires

Use CSS animations with Leaflet's `L.divIcon`.

**CSS (`index.css`):**
```css
@keyframes pulse-fire {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.fire-marker {
  width: 12px;
  height: 12px;
  background-color: #ef4444; /* tailwind red-500 */
  border-radius: 50%;
  animation: pulse-fire 1.5s infinite;
  border: 2px solid white;
}
```

**React Component:**
```tsx
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const fireIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div class="fire-marker"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const ActiveFires = ({ fires }: { fires: any[] }) => {
  return (
    <>
      {fires.map((fire, idx) => (
        <Marker key={idx} position={[fire.lat, fire.lng]} icon={fireIcon}>
          <Popup>
            <div className="text-slate-900 font-semibold">Active Fire</div>
            <div className="text-sm">Confidence: {fire.confidence}%</div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
```

## 6. Animated Canvas Overlays (Fire Spread)

For highly performant simulations, use a full-screen canvas rather than DOM elements.

```tsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FireSpreadSimulation = () => {
  const map = useMap();

  useEffect(() => {
    // Custom Canvas Layer Implementation
    const CanvasLayer = L.Layer.extend({
      onAdd: function (map: any) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
        
        const size = map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        
        map.getPanes().overlayPane.appendChild(this._canvas);
        map.on('moveend', this._reset, this);
        this._reset();
      },
      onRemove: function (map: any) {
        L.DomUtil.remove(this._canvas);
        map.off('moveend', this._reset, this);
      },
      _reset: function () {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this._draw();
      },
      _draw: function () {
        const ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        
        // Example: Draw a semi-transparent expanding circle for fire spread
        const center = this._map.latLngToContainerPoint([7.8731, 80.7718]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, 50, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fill();
        
        // Request animation frame for continuous simulation...
      }
    });

    const layer = new CanvasLayer();
    map.addLayer(layer);
    
    return () => { map.removeLayer(layer); };
  }, [map]);

  return null;
};
```

## 7. Responsive Sidebar Panel

A Tailwind-styled sliding panel for district details.

```tsx
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, district }: { isOpen: boolean, onClose: () => void, district: string | null }) => {
  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 text-white transform transition-transform duration-300 z-[1000] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{district || 'Select a District'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded"><X size={20} /></button>
        </div>
        
        {district && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-slate-400 text-sm">Risk Level</div>
              <div className="text-2xl font-bold text-red-500">High (85%)</div>
            </div>
            {/* Charts go here */}
          </div>
        )}
      </div>
    </div>
  );
};
```

## 8. Recharts Integration

Example line chart for weather trends in the sidebar.

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '10:00', temp: 32 },
  { time: '12:00', temp: 35 },
  { time: '14:00', temp: 36 },
  { time: '16:00', temp: 34 },
];

const TrendChart = () => (
  <div className="h-48 w-full mt-4">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
        <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
```

## 9. Image Upload Component (Drag & Drop)

Using `react-dropzone` for uploading drone/satellite imagery.

```tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

const ImageUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className={`mb-3 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} size={32} />
      {file ? (
        <p className="text-sm text-green-400">Selected: {file.name}</p>
      ) : (
        <p className="text-sm text-slate-300">
          {isDragActive ? "Drop image here" : "Drag & drop satellite image, or click to select"}
        </p>
      )}
    </div>
  );
};
```
