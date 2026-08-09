import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Flame, CloudRain, Wind, Thermometer, AlertTriangle, 
  Upload, Play, Info, Activity, Bell, Map as MapIcon, RefreshCw, Layers, ShieldAlert, Cpu
} from 'lucide-react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
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
        color: '#f97316', // orange-500
        fillColor: '#ea580c', // orange-600
        fillOpacity: 0.15,
        weight: 1,
        radius: 1000
      }).addTo(map);
      return circle;
    });
    animRef.current = circles;

    let radius = 1000;
    const interval = setInterval(() => {
      radius += 400;
      if (radius > 12000) radius = 1000;
      circles.forEach(c => c.setRadius(radius));
    }, 150);

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

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-3 rounded-lg shadow-xl text-xs text-slate-800">
        <p className="font-semibold text-slate-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const getDistrictStyle = (feature) => {
    return {
      fillColor: '#f59e0b',
      weight: 1,
      opacity: 0.8,
      color: '#cbd5e1',
      fillOpacity: 0.1
    };
  };

  const handleDistrictClick = (e, feature) => {
    setSelectedDistrict(feature.properties.ADM2_EN || feature.properties.name || "Unknown District");
    setSelectedHotspot(null);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Sidebar Panel - Always visible, displays default dashboard when nothing is selected */}
      <div className="w-[420px] shrink-0 bg-white border-r border-slate-200/80 flex flex-col z-[1001] shadow-sm text-slate-800 transition-all duration-300">
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Flame size={28} className="text-orange-500" />
              PyroGuard SL
            </h1>
            {(selectedDistrict || selectedHotspot) && (
              <button 
                onClick={() => {setSelectedDistrict(null); setSelectedHotspot(null);}} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors"
                title="Back to Dashboard"
              >
                ✕
              </button>
            )}
          </div>

          {selectedHotspot ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.05)] text-rose-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={22} className="drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]" /> 
                  Active Hotspot Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-medium">Temperature</p>
                    <p className="text-2xl font-bold text-orange-400">{selectedHotspot.temp}°C</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-medium">Fire Radiative Power</p>
                    <p className="text-2xl font-bold text-red-600">{selectedHotspot.frp} MW</p>
                  </div>
                </div>
                
                <button 
                  className={`mt-5 w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all duration-300 shadow-lg ${isSimulating ? 'bg-[#c96245] text-white shadow-[#c96245]/50' : 'bg-gradient-to-r from-[#d97757] to-[#c96245] hover:from-[#c96245] hover:to-[#b7563c] text-white shadow-xl shadow-[#c96245]/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                  onClick={() => setIsSimulating(!isSimulating)}
                >
                  {isSimulating ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} className="ml-1" />}
                  {isSimulating ? 'Simulating Cellular Automata...' : 'Predict Spread (AI)'}
                </button>
              </div>
            </div>
          ) : selectedDistrict ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <h2 className="text-2xl font-bold border-b border-slate-200 pb-3 flex items-center gap-2">
                <MapIcon className="text-slate-600" size={24}/>
                {selectedDistrict} Region
              </h2>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-100/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center hover:bg-slate-100/60 transition-colors shadow-sm">
                  <Thermometer className="text-orange-400 mb-2 drop-shadow-[0_0_5px_rgba(251,146,60,0.6)]" size={26} />
                  <span className="text-lg font-bold">32°C</span>
                  <span className="text-xs text-slate-500 font-medium">Avg Temp</span>
                </div>
                <div className="bg-slate-100/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center hover:bg-slate-100/60 transition-colors shadow-sm">
                  <Wind className="text-sky-400 mb-2 drop-shadow-[0_0_5px_rgba(56,189,248,0.6)]" size={26} />
                  <span className="text-lg font-bold">15 km/h</span>
                  <span className="text-xs text-slate-500 font-medium">Wind Spd</span>
                </div>
                <div className="bg-slate-100/40 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center hover:bg-slate-100/60 transition-colors shadow-sm">
                  <CloudRain className="text-emerald-400 mb-2 drop-shadow-[0_0_5px_rgba(52,211,153,0.6)]" size={26} />
                  <span className="text-lg font-bold">45%</span>
                  <span className="text-xs text-slate-500 font-medium">Humidity</span>
                </div>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-md">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Activity size={16} className="text-indigo-400" /> SHAP Risk Explainability
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={XAI_DATA} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                      <RechartsTooltip cursor={{fill: 'rgba(51, 65, 85, 0.4)'}} content={<CustomTooltip />} />
                      <Bar dataKey="impact" radius={[0, 6, 6, 0]} barSize={24}>
                        {XAI_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3ecf8e" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shadow-md">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <CloudRain size={16} className="text-sky-400" /> 24h Micro-climate Trend
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={WEATHER_TRENDS} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line yAxisId="left" type="monotone" dataKey="temp" name="Temp (°C)" stroke="#f97316" strokeWidth={3} dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      <Line yAxisId="left" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            /* Default Dashboard View */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-600" /> System Threat Level
                  </h3>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200">ELEVATED</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Active Wildfires</span>
                    <span className="font-bold text-rose-500 text-lg">3</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Districts at Risk</span>
                    <span className="font-bold text-orange-400 text-lg">5</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Sensors Online</span>
                    <span className="font-bold text-emerald-400 text-lg">1,248</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Cpu size={16} className="text-slate-700" /> Recent AI Detections
                </h3>
                <div className="flex flex-col">
                  {[
                    { time: '2 mins ago', loc: 'Badulla Region', conf: '94%', type: 'Satellite' },
                    { time: '15 mins ago', loc: 'Kandy Region', conf: '88%', type: 'Drone' },
                    { time: '1 hr ago', loc: 'Monaragala', conf: '91%', type: 'Sensor' }
                  ].map((alert, idx) => (
                    <div key={idx} className="flex flex-col py-3 border-t border-slate-100 first:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm text-slate-800">{alert.loc}</span>
                        <span className="text-xs text-slate-500">{alert.time}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Source: {alert.type}</span>
                        <span className="font-medium text-[#3ecf8e]">Conf: {alert.conf}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                  <Activity size={20} className="text-slate-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    System Nominal <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">All ingestion pipelines and inference engines are operational.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Content Area */}
      <div className="flex-1 relative flex flex-col min-w-0">
        
        {/* Top Navbar / Floating Overlays */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-[1000] pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
             <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 flex items-center shadow-md">
                <button 
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isLiveMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                  onClick={() => setIsLiveMode(true)}
                >
                  LIVE DATA
                </button>
                <button 
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${!isLiveMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'}`}
                  onClick={() => setIsLiveMode(false)}
                >
                  HISTORICAL SIM
                </button>
              </div>
          </div>

          <div className="pointer-events-auto">
            <button 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-2xl shadow-md font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-emerald-700/50"
              onClick={() => setShowReportModal(true)}
            >
              <Upload size={18} /> REPORT FIRE (YOLOv8)
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="absolute inset-0 bg-slate-950 z-0">
          <MapContainer 
            center={SriLankaCenter} 
            zoom={7} 
            zoomControl={false}
            className="w-full h-full"
            style={{ background: '#f8fafc' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
                  <div className="custom-popup-header">
                    ⚠️ HIGH RISK HOTSPOT
                  </div>
                  <div className="custom-popup-body">
                    <div className="mb-2"><span className="text-slate-600">Detected:</span> <span className="text-white font-medium">{h.time}</span></div>
                    <div className="mb-2"><span className="text-slate-600">Temp:</span> <span className="text-orange-400 font-bold">{h.temp}°C</span></div>
                    <div><span className="text-slate-600">Est. FRP:</span> <span className="text-red-600 font-bold">{h.frp} MW</span></div>
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
                  color: s.status === 'safe' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fillColor: s.status === 'safe' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fillOpacity: 0.8,
                  weight: 2
                }}
                radius={7}
              >
                <Popup className="custom-popup">
                  <div className="custom-popup-header" style={{ background: s.status === 'safe' ? '#059669' : s.status === 'warning' ? '#d97706' : '#dc2626' }}>
                    📡 IoT SENSOR #{s.id}
                  </div>
                  <div className="custom-popup-body">
                    <div className="mb-1"><span className="text-slate-600">Status:</span> <span className="text-white font-bold uppercase">{s.status}</span></div>
                    <div className="mb-1"><span className="text-slate-600">Ground Temp:</span> <span className="text-white font-medium">{s.temp}°C</span></div>
                    <div><span className="text-slate-600">Smoke (AQI):</span> <span className="text-white font-medium">{s.smoke}</span></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            <FireSpreadAnimation hotspots={MOCK_HOTSPOTS} isSimulating={isSimulating} />
          </MapContainer>
        </div>

        {/* Trilingual Alert Ticker - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900 text-white z-[1000] border-t border-slate-800 flex items-center overflow-hidden shadow-sm">
           <div className="px-4 h-full bg-slate-950 flex items-center justify-center font-bold text-white z-10 border-r border-slate-800 uppercase tracking-widest text-xs shrink-0 gap-2">
             <AlertTriangle size={16} className="animate-pulse text-amber-500" /> LIVE ALERTS
           </div>
           <div className="flex-1 overflow-hidden relative h-full flex items-center">
             <div className="ticker-content text-sm font-medium text-slate-300">
               [EN] WILD FIRE WARNING IN EFFECT FOR BADULLA DISTRICT • [SI] බදුල්ල දිස්ත්‍රික්කයට ලැව්ගිනි අනතුරු ඇඟවීමක් • [TA] பதுளை மாவட்டத்திற்கு காட்டுத்தீ எச்சரிக்கை • [EN] EVACUATION ORDERS IN EFFECT FOR SECTOR 4
             </div>
           </div>
        </div>

      </div>

      {/* Report Fire Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[2000] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white border-slate-200 p-8 rounded-3xl w-full max-w-2xl shadow-2xl shadow-black">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Upload className="text-blue-400" size={20} />
                </div>
                Analyze Image (YOLOv8)
              </h2>
              <button onClick={() => {setShowReportModal(false); setUploadedImage(null);}} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-700 transition-colors">✕</button>
            </div>
            
            {!uploadedImage ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-6">
                  <Upload size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Drag & drop a satellite or drone image</h3>
                <p className="text-slate-500 text-sm">Supports high-res PNG, JPG, TIFF for inference</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video flex items-center justify-center border border-slate-700/50 shadow-inner">
                  <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-full object-contain opacity-90" />
                  
                  {isDetecting ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                      <div className="relative w-16 h-16 mb-4">
                         <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-blue-400 font-bold tracking-widest text-sm animate-pulse">RUNNING TENSORRT OPTIMIZED INFERENCE...</p>
                    </div>
                  ) : (
                    // Fake bounding box result
                    <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 absolute -top-6 left-[-2px] rounded-t-md">🔥 Fire 96.4%</span>
                    </div>
                  )}
                </div>
                
                {!isDetecting && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-4">
                    <div className="bg-emerald-500/20 p-2 rounded-full mt-0.5">
                      <Activity className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-400 text-sm mb-1">Detection Pipeline Complete</h4>
                      <p className="text-sm text-slate-700">Isolated 1 thermal anomaly. Coordinates automatically logged and synced with decentralized alert mesh.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button onClick={() => setUploadedImage(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-white hover:bg-slate-100 transition-colors">Discard</button>
                  <button disabled={isDetecting} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-900/50">
                    CONFIRM & BROADCAST
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
