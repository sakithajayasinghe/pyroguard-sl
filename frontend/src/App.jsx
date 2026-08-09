import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Flame, CloudRain, Wind, Thermometer, AlertTriangle, 
  Upload, Play, Info, Activity, Bell, Map as MapIcon, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend 
} from 'recharts';
import { useDropzone } from 'react-dropzone';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Mock Data
const MOCK_HOTSPOTS = [
  { id: 1, lat: 7.8731, lng: 80.7718, temp: 45, frp: 120, time: '10 mins ago' },
  { id: 2, lat: 6.9271, lng: 79.8612, temp: 38, frp: 90, time: '1 hour ago' },
  { id: 3, lat: 8.3114, lng: 80.4037, temp: 52, frp: 210, time: '2 mins ago' }
];

const MOCK_SENSORS = [
  { id: 101, lat: 7.9, lng: 80.7, temp: 28, smoke: 12, status: 'safe' }, // green
  { id: 102, lat: 6.95, lng: 79.9, temp: 35, smoke: 45, status: 'warning' }, // yellow
  { id: 103, lat: 8.35, lng: 80.45, temp: 60, smoke: 85, status: 'danger' } // red
];

const XAI_DATA = [
  { name: 'Wind', impact: 85 },
  { name: 'Dryness', impact: 65 },
  { name: 'Temp', impact: 70 },
  { name: 'Veg', impact: 40 },
];

const WEATHER_TRENDS = [
  { time: '00:00', temp: 24, humidity: 80 },
  { time: '06:00', temp: 26, humidity: 75 },
  { time: '12:00', temp: 32, humidity: 55 },
  { time: '18:00', temp: 29, humidity: 65 },
  { time: '24:00', temp: 25, humidity: 78 },
];

const SriLankaCenter = [7.8731, 80.7718];

// Map Effects Component
const FireSpreadAnimation = ({ hotspots, isSimulating }) => {
  const map = useMap();
  const animRef = useRef(null);

  useEffect(() => {
    if (!isSimulating) {
      if (animRef.current) {
        animRef.current.forEach(c => map.removeLayer(c));
        animRef.current = null;
      }
      return;
    }

    const circles = hotspots.map(h => {
      const circle = L.circle([h.lat, h.lng], {
        color: '#ff4444',
        fillColor: '#f03',
        fillOpacity: 0.2,
        radius: 1000
      }).addTo(map);
      return circle;
    });
    animRef.current = circles;

    let radius = 1000;
    const interval = setInterval(() => {
      radius += 500;
      if (radius > 10000) radius = 1000;
      circles.forEach(c => c.setRadius(radius));
    }, 200);

    return () => {
      clearInterval(interval);
      circles.forEach(c => map.removeLayer(c));
    };
  }, [isSimulating, hotspots, map]);

  return null;
};

// Pulse Icon
const pulseIcon = L.divIcon({
  className: 'pulse-marker',
  iconSize: [20, 20]
});

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [districtsData, setDistrictsData] = useState(null);

  // Fetch real district GeoJSON boundaries from our backend API
  useEffect(() => {
    fetch('/api/v1/districts.geojson')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load map boundaries");
        return res.json();
      })
      .then(data => setDistrictsData(data))
      .catch(err => {
        console.error("GeoJSON error:", err);
        setDistrictsData({
          type: "FeatureCollection",
          features: []
        });
      });
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsDetecting(true);
      setTimeout(() => setIsDetecting(false), 2000); // Simulate YOLOv8 inference
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/*' });

  const getDistrictStyle = (feature) => {
    return {
      fillColor: '#fb923c', // orange base
      weight: 1,
      opacity: 1,
      color: '#1e293b',
      fillOpacity: 0.3
    };
  };

  const handleDistrictClick = (e, feature) => {
    setSelectedDistrict(feature.properties.name || "Unknown District");
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar Panel */}
      <div className={`w-96 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-10 shadow-2xl relative ${selectedDistrict || selectedHotspot ? 'translate-x-0' : '-translate-x-full absolute h-full'}`}>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
              <Flame size={28} className="text-orange-500" />
              PyroGuard SL
            </h1>
            <button onClick={() => {setSelectedDistrict(null); setSelectedHotspot(null);}} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          {selectedHotspot ? (
            <div className="space-y-6 animate-in slide-in-from-left">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} /> Active Hotspot
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-950 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Temp</p>
                    <p className="text-lg font-bold text-orange-400">{selectedHotspot.temp}°C</p>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">FRP</p>
                    <p className="text-lg font-bold text-red-400">{selectedHotspot.frp} MW</p>
                  </div>
                </div>
                
                <button 
                  className={`mt-4 w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${isSimulating ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                  onClick={() => setIsSimulating(!isSimulating)}
                >
                  {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                  {isSimulating ? 'Simulating Spread...' : 'Predict Spread (AI)'}
                </button>
              </div>
            </div>
          ) : selectedDistrict ? (
            <div className="space-y-6 animate-in slide-in-from-left">
              <h2 className="text-2xl font-bold border-b border-gray-800 pb-2">{selectedDistrict}</h2>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                  <Thermometer className="text-orange-400 mb-1" size={24} />
                  <span className="text-sm font-semibold">32°C</span>
                  <span className="text-xs text-gray-400">Temp</span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                  <Wind className="text-blue-400 mb-1" size={24} />
                  <span className="text-sm font-semibold">15 km/h</span>
                  <span className="text-xs text-gray-400">Wind</span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                  <CloudRain className="text-cyan-400 mb-1" size={24} />
                  <span className="text-sm font-semibold">45%</span>
                  <span className="text-xs text-gray-400">Humid</span>
                </div>
              </div>

              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Activity size={16} /> Risk Factors (XAI)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={XAI_DATA} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}} />
                      <Bar dataKey="impact" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Activity size={16} /> 24h Weather Trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={WEATHER_TRENDS} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{backgroundColor: '#111827', border: '1px solid #374151'}} />
                      <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col">
        
        {/* Top Navbar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-[1000] pointer-events-none">
          {/* Left spacer if sidebar is closed, else menu button could go here */}
          {!selectedDistrict && !selectedHotspot && (
            <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-gray-800 flex items-center gap-3">
              <Flame size={24} className="text-orange-500" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                PyroGuard SL
              </h1>
            </div>
          )}
          <div className={selectedDistrict || selectedHotspot ? "ml-auto" : ""}></div>

          <div className="pointer-events-auto flex gap-3">
            <div className="bg-gray-900/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 flex items-center shadow-xl">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isLiveMode ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setIsLiveMode(true)}
              >
                Live Mode
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isLiveMode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setIsLiveMode(false)}
              >
                Demo (Historical)
              </button>
            </div>
            
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl shadow-xl shadow-red-900/20 font-medium flex items-center gap-2 transition-colors border border-red-500/50"
              onClick={() => setShowReportModal(true)}
            >
              <Upload size={18} /> Report Fire
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-gray-950 z-0">
          <MapContainer 
            center={SriLankaCenter} 
            zoom={7} 
            zoomControl={false}
            className="w-full h-full"
            style={{ background: '#0a0a0a' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {districtsData && (
              <GeoJSON 
                data={districtsData} 
                style={getDistrictStyle}
                onEachFeature={(feature, layer) => {
                  layer.on({
                    click: (e) => handleDistrictClick(e, feature)
                  });
                }}
              />
            )}

            {/* Fire Hotspots */}
            {MOCK_HOTSPOTS.map(h => (
              <Marker 
                key={h.id} 
                position={[h.lat, h.lng]} 
                icon={pulseIcon}
                eventHandlers={{
                  click: () => { setSelectedHotspot(h); setSelectedDistrict(null); }
                }}
              >
                <Popup className="custom-popup">
                  <div className="text-gray-900 p-1">
                    <strong>Active Hotspot</strong><br/>
                    Spotted: {h.time}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Ground Sensors */}
            {MOCK_SENSORS.map(s => (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                pathOptions={{
                  color: s.status === 'safe' ? '#22c55e' : s.status === 'warning' ? '#eab308' : '#ef4444',
                  fillColor: s.status === 'safe' ? '#22c55e' : s.status === 'warning' ? '#eab308' : '#ef4444',
                  fillOpacity: 0.7,
                  weight: 2
                }}
                radius={6}
              >
                <Popup>
                  <div className="text-gray-900">
                    <strong>Sensor #{s.id}</strong><br/>
                    Temp: {s.temp}°C<br/>
                    Smoke: {s.smoke} AQI
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            <FireSpreadAnimation hotspots={MOCK_HOTSPOTS} isSimulating={isSimulating} />
          </MapContainer>
        </div>

      </div>

      {/* Report Fire Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-blue-500" /> Report Wildfire (YOLOv8 Analysis)
              </h2>
              <button onClick={() => {setShowReportModal(false); setUploadedImage(null);}} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {!uploadedImage ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
              >
                <input {...getInputProps()} />
                <Upload size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-300">Drag & drop a drone/satellite image here</p>
                <p className="text-sm text-gray-500 mt-2">or click to select files</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-full object-contain opacity-80" />
                  
                  {isDetecting ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-blue-400 font-medium tracking-widest text-sm animate-pulse">RUNNING YOLOv8...</p>
                    </div>
                  ) : (
                    // Fake bounding box result
                    <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-red-500 bg-red-500/20">
                      <span className="bg-red-500 text-white text-xs px-1 absolute -top-4 left-[-2px]">Fire 92%</span>
                    </div>
                  )}
                </div>
                
                {!isDetecting && (
                  <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-start gap-3">
                    <Activity className="text-green-400 mt-0.5 shrink-0" size={18} />
                    <div>
                      <h4 className="font-semibold text-green-400 text-sm">Detection Complete</h4>
                      <p className="text-xs text-gray-400 mt-1">Found 1 active fire region. Coordinates logged and alerts dispatched to local authorities.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setUploadedImage(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Reset</button>
                  <button disabled={isDetecting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                    Confirm & Submit Alert
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Subscription Widget - Floating Bottom Right */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 p-4 rounded-2xl shadow-2xl w-72">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-yellow-500" />
            <h3 className="font-semibold text-sm">Get SMS Alerts</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">Receive instant notifications for wildfires in your area.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Phone Number" className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-blue-500" />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
