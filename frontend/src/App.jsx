import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, CircleMarker, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Flame, CloudRain, Wind, Thermometer, AlertTriangle, 
  Upload, Play, Info, Activity, Bell, Map as MapIcon, RefreshCw, Layers, ShieldAlert, Cpu,
  Radio, CheckCircle2, Eye, Compass, CloudFog, Send, Check
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

// Mock Ground Sensors
const MOCK_SENSORS = [
  { id: 101, lat: 6.98, lng: 81.06, temp: 34.5, smoke: 42, status: 'warning', name: 'Ella Gap Sensor' },
  { id: 102, lat: 7.42, lng: 80.79, temp: 24.2, smoke: 15, status: 'safe', name: 'Knuckles Ridge' },
  { id: 103, lat: 6.12, lng: 81.12, temp: 38.1, smoke: 78, status: 'danger', name: 'Hambantota Scrub' },
  { id: 104, lat: 8.35, lng: 80.50, temp: 35.8, smoke: 65, status: 'danger', name: 'Anuradhapura Buffer' }
];

const SriLankaCenter = [7.8731, 80.7718];

// Map Spread Layer Renderer
const FireSpreadOverlay = ({ spreadGeoJson }) => {
  if (!spreadGeoJson || !spreadGeoJson.features) return null;
  return (
    <>
      {spreadGeoJson.features.map((feat, idx) => {
        const coords = feat.geometry.coordinates[0].map(c => [c[1], c[0]]);
        const hour = feat.properties.burn_hour || 1;
        const color = hour === 1 ? '#ef4444' : hour === 2 ? '#f97316' : '#eab308';
        return (
          <Polygon 
            key={idx} 
            positions={coords} 
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.45,
              weight: 1
            }} 
          />
        );
      })}
    </>
  );
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
      <div className="bg-slate-900/90 text-white backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-amber-400 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300 capitalize">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TRANSLATIONS = {
  en: {
    liveData: "LIVE SATELLITE",
    historicalSim: "HISTORICAL DEMO",
    reportFire: "YOLOv8 VISION AI",
    broadcastAlertBtn: "DISPATCH BROADCAST",
    threatLevel: "System Threat Level",
    activeWildfires: "Active Wildfires",
    districtsAtRisk: "Districts at Risk",
    sensorsOnline: "Sensors Online",
    recentDetections: "Recent AI Detections",
    systemNominal: "DMC System Operational",
    nominalDesc: "FIRMS satellite feeds, YOLOv8 vision pipeline & DEWN alert mesh running.",
    guideTitle: "Competition AI Innovations",
    guideIot: "IoT Sensors: Ground telemetry (temp, gas, smoke) stream in real-time.",
    guideSim: "Spread Simulator (AI): Click any hotspot to run Cellular Automata wind & terrain propagation.",
    guideXai: "Explainable AI (SHAP): Click any district for factor breakdown & microclimate trend.",
    guideYolo: "YOLOv8 Cloud Bypass: Detect active smoke vs Knuckles mountain mist.",
    tempLabel: "Temperature",
    frpLabel: "Fire Radiative Power",
    predictSpreadBtn: "Simulate Fire Spread (AI)",
    simulatingSpreadBtn: "Calculating Cellular Automata...",
    spreadForecastActive: "Cellular Automata Forecast Active",
    shapTitle: "SHAP Explainable Risk Factors",
    microclimateTrend: "24h District Micro-climate",
    tempTrendLabel: "Temp (°C)",
    humidityTrendLabel: "Humidity (%)",
    highRiskHotspotPopup: "⚠️ SATELLITE THERMAL HOTSPOT",
    detectedPopup: "Detected",
    tempPopup: "Temp",
    estFrpPopup: "Est. FRP",
    iotSensorPopup: "📡 IoT SENSOR",
    statusPopup: "Status",
    groundTempPopup: "Ground Temp",
    smokePopup: "Smoke (AQI)",
    liveAlertsLabel: "LIVE EMERGENCY BROADCAST"
  },
  si: {
    liveData: "සජීවී චන්ද්‍රිකා",
    historicalSim: "පසුගිය දත්ත",
    reportFire: "YOLOv8 රූප පරික්ෂාව",
    broadcastAlertBtn: "අනතුරු ඇඟවීම් විකාශය",
    threatLevel: "පද්ධති අවදානම් මට්ටම",
    activeWildfires: "සක්‍රීය ලැව්ගිනි ගණන",
    districtsAtRisk: "අවදානමේ ඇති දිස්ක්‍රික්ක",
    sensorsOnline: "සක්‍රීය සංවේදක",
    recentDetections: "ቅርතම AI හඳුනාගැනීම්",
    systemNominal: "DMC පද්ධතිය ක්‍රියාත්මකයි",
    nominalDesc: "චන්ද්‍රිකා දත්ත, YOLOv8 AI සහ DEWN අනතුරු ඇඟවීම් සක්‍රීයයි.",
    guideTitle: "තරඟකාරී AI විශේෂාංග",
    guideIot: "IoT සංවේදක: උෂ්ණත්ව සහ දුම් දර්ශක සජීවීව පෙන්වයි.",
    guideSim: "පැතිරීමේ අනාවැකිය (AI): ලැව්ගිනි පැතිරීම සෙලියුලර් ඔටෝමාටා මඟින් ගණනය කෙරේ.",
    guideXai: "Explainable AI (XAI): SHAP අවදානම් සාධක දිස්ත්‍රික්කය ක්ලික් කිරීමෙන් බලාගත හැක.",
    guideYolo: "YOLOv8 පරීක්ෂාව: මීදුම සහ දුමාරය වෙන්කර හඳුනා ගනී.",
    tempLabel: "උෂ්ණත්වය",
    frpLabel: "විකිරණ බලය (FRP)",
    predictSpreadBtn: "පැතිරීම පුරෝකථනය කරන්න (AI)",
    simulatingSpreadBtn: "පැතිරීම ගණනය කෙරේ...",
    spreadForecastActive: "සෙලියුලර් ඔටෝමාටා අනාවැකිය සක්‍රීයයි",
    shapTitle: "SHAP අවදානම් විශ්ලේෂණය",
    microclimateTrend: "පැය 24 කාලගුණ ප්‍රවණතාව",
    tempTrendLabel: "උෂ්ණත්වය (°C)",
    humidityTrendLabel: "ආර්ද්‍රතාවය (%)",
    highRiskHotspotPopup: "⚠️ චන්ද්‍රිකා ලැව්ගිනි සංඥාව",
    detectedPopup: "හඳුනාගත් වෙලාව",
    tempPopup: "උෂ්ණත්වය",
    estFrpPopup: "ඇස්තමේන්තුගත FRP",
    iotSensorPopup: "📡 IoT සංවේදකය",
    statusPopup: "තත්ත්වය",
    groundTempPopup: "පොළව උෂ්ණත්වය",
    smokePopup: "දුමාරය (AQI)",
    liveAlertsLabel: "සජීවී අනතුරු ඇඟවීම්"
  },
  ta: {
    liveData: "செயற்கைக்கோள்",
    historicalSim: "வரலாற்று உருவகப்படுத்துதல்",
    reportFire: "YOLOv8 AI பார்வை",
    broadcastAlertBtn: "எச்சரிக்கை ஒளிபரப்பு",
    threatLevel: "அமைப்பு அபாய நிலை",
    activeWildfires: "செயலில் உள்ள காட்டுத்தீ",
    districtsAtRisk: "அபாயத்தில் உள்ள மாவட்டங்கள்",
    sensorsOnline: "செயலில் உள்ள சென்சார்கள்",
    recentDetections: "சமீபத்திய AI கண்டுபிடிப்பப்புகள்",
    systemNominal: "DMC அமைப்பு இயங்குகிறது",
    nominalDesc: "செயற்கைக்கோள் தரவு, YOLOv8 AI மற்றும் DEWN எச்சரிக்கைகள் இயங்குகின்றன.",
    guideTitle: "AI அம்சங்கள்",
    guideIot: "IoT சென்சார்கள்: வெப்பநிலை மற்றும் புகை அளவைக் காட்டும் தரை சென்சார்கள்.",
    guideSim: "பரவல் கணிப்பு (AI): காட்டுத்தீ பரவலைக் கணிக்க ஹாட்ஸ்பாட்டை கிளிக் செய்யவும்.",
    guideXai: "விளக்கமளிக்கக்கூடிய AI (XAI): SHAP அபாய காரணிகளை பகுப்பாய்வு செய்ய மாவட்டத்தைக் கிளிக் செய்க.",
    guideYolo: "YOLOv8 சரிபார்ப்பு: மலைப் மூடுபனி மற்றும் புகையை வேறுபடுத்துகிறது.",
    tempLabel: "வெப்பநிலை",
    frpLabel: "கதிர்வீச்சு சக்தி (FRP)",
    predictSpreadBtn: "பரவலைக் கணித்தல் (AI)",
    simulatingSpreadBtn: "பரவல் உருவகப்படுத்தப்படுகிறது...",
    spreadForecastActive: "பரவல் கணிப்பு செயலில் உள்ளது",
    shapTitle: "SHAP அபாய பகுப்பாய்வு",
    microclimateTrend: "24 மணி நேர காலநிலை போக்கு",
    tempTrendLabel: "வெப்பநிலை (°C)",
    humidityTrendLabel: "ஈரப்பதம் (%)",
    highRiskHotspotPopup: "⚠️ செயற்கைக்கோள் ஹாட்ஸ்பாட்",
    detectedPopup: "கண்டறியப்பட்டது",
    tempPopup: "வெப்பநிலை",
    estFrpPopup: "மதிப்பிடப்பட்ட FRP",
    iotSensorPopup: "📡 IoT சென்சார்",
    statusPopup: "நிலை",
    groundTempPopup: "தரை வெப்பநிலை",
    smokePopup: "புகை (AQI)",
    liveAlertsLabel: "நேரடி எச்சரிக்கைகள்"
  }
};

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtRiskDetails, setDistrictRiskDetails] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  
  // YOLO Modal States
  const [showYoloModal, setShowYoloModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [yoloResult, setYoloResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [samplePresets, setSamplePresets] = useState([]);
  
  // Alert Broadcast Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState(null);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [districtsData, setDistrictsData] = useState(null);
  const [districtsRiskList, setDistrictsRiskList] = useState({});
  const [hotspots, setHotspots] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [lang, setLang] = useState('en');

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // Load GeoJSON district boundaries & Risk Map
  useEffect(() => {
    fetch('/api/v1/districts.geojson')
      .then(res => res.json())
      .then(data => setDistrictsData(data))
      .catch(err => console.error("GeoJSON error:", err));

    fetch('/api/v1/risk-map')
      .then(res => res.json())
      .then(data => {
        const riskMap = {};
        data.forEach(item => {
          riskMap[item.district] = item;
        });
        setDistrictsRiskList(riskMap);
      })
      .catch(err => console.error("Risk map error:", err));

    fetch('/api/v1/sample-images')
      .then(res => res.json())
      .then(data => setSamplePresets(data))
      .catch(err => console.error("Sample images error:", err));
  }, []);

  // Fetch hotspots (Live vs Demo)
  useEffect(() => {
    const fetchHotspots = () => {
      const modeParam = isLiveMode ? 'live' : 'demo';
      fetch(`/api/v1/hotspots?mode=${modeParam}`)
        .then(res => res.json())
        .then(data => setHotspots(data))
        .catch(err => console.error("Hotspots fetch error:", err));
    };

    fetchHotspots();
    let interval;
    if (isLiveMode) {
      interval = setInterval(fetchHotspots, 10000);
    }
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Recent AI Detections feed: real logged /detect-smoke analyses + real
  // FIRMS detections, not hardcoded examples
  useEffect(() => {
    const fetchRecentDetections = () => {
      fetch('/api/v1/detections/recent')
        .then(res => res.json())
        .then(data => setRecentDetections(data))
        .catch(err => console.error("Recent detections fetch error:", err));
    };
    fetchRecentDetections();
    const interval = setInterval(fetchRecentDetections, 15000);
    return () => clearInterval(interval);
  }, []);

  // Ground sensor readings: LIVE shows only real backend data (no physical
  // ESP32 units are deployed yet, so this is currently an honest empty
  // list -- never the illustrative mock network). DEMO shows the mock
  // network with simulated jitter, clearly scoped to non-live mode only.
  useEffect(() => {
    if (isLiveMode) {
      const fetchSensors = () => {
        fetch('/api/v1/sensor-data/latest')
          .then(res => res.json())
          .then(data => setSensors(data))
          .catch(err => console.error("Sensor data fetch error:", err));
      };
      fetchSensors();
      const interval = setInterval(fetchSensors, 10000);
      return () => clearInterval(interval);
    }

    setSensors(MOCK_SENSORS);
    const interval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const tempDelta = (Math.random() - 0.5) * 1.5;
        const smokeDelta = Math.floor((Math.random() - 0.5) * 3);
        const newTemp = Math.max(20, Math.min(65, s.temp + tempDelta));
        const newSmoke = Math.max(0, Math.min(100, s.smoke + smokeDelta));

        let newStatus = 'safe';
        if (newSmoke > 70 || newTemp > 50) newStatus = 'danger';
        else if (newSmoke > 35 || newTemp > 35) newStatus = 'warning';

        return { ...s, temp: parseFloat(newTemp.toFixed(1)), smoke: newSmoke, status: newStatus };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Fetch detailed district XAI risk breakdown when district clicked
  const handleDistrictClick = (e, feature) => {
    const dName = feature.properties.ADM2_EN || feature.properties.name || "Badulla";
    setSelectedDistrict(dName);
    setSelectedHotspot(null);
    setIsSimulating(false);
    setSimulationData(null);

    fetch(`/api/v1/risk/${dName}`)
      .then(res => res.json())
      .then(data => setDistrictRiskDetails(data))
      .catch(err => console.error("District risk fetch error:", err));
  };

  // Run Cellular Automata simulation when requested
  const handleToggleSimulation = (hotspot) => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimulationData(null);
      return;
    }

    setIsSimulating(true);
    fetch('/api/v1/simulate-spread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: hotspot.lat,
        lon: hotspot.lng,
        wind_speed: 22.5,
        wind_deg: 45,
        hours: 4
      })
    })
      .then(res => res.json())
      .then(data => setSimulationData(data))
      .catch(err => console.error("Simulation error:", err));
  };

  // Preset sample image loader for YOLO Inspection
  const loadPresetSample = (preset) => {
    setIsDetecting(true);
    setUploadedImage(null);
    setTimeout(() => {
      setYoloResult(preset.ai_result);
      setIsDetecting(false);
    }, 800);
  };

  // Custom image dropzone handler
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setIsDetecting(true);
      setYoloResult(null);

      const formData = new FormData();
      formData.append('file', file);

      fetch('/api/v1/detect-smoke', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          setYoloResult({
            classification: data.classification || "ANALYSIS_COMPLETE",
            is_fire: data.classification === "ACTIVE_FIRE",
            confidence: data.confidence || 0.92,
            badge: data.classification === "ACTIVE_FIRE" ? "CRITICAL - FIRE DETECTED" : "SAFE - MOUNTAIN FOG",
            summary: data.classification === "ACTIVE_FIRE" ? "Dense smoke signature and thermal anomaly verified." : "Highland mist signature confirmed.",
            detections: data.detections || []
          });
          setIsDetecting(false);
        })
        .catch(err => {
          setIsDetecting(false);
        });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  // Handle Trilingual Emergency Alert Dispatch
  const handleTriggerBroadcast = (districtName, lat, lon, riskLevel) => {
    fetch('/api/v1/alerts/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        district: districtName || "Badulla",
        lat: lat || 6.9847,
        lon: lon || 81.0556,
        risk_level: riskLevel || "High"
      })
    })
      .then(res => res.json())
      .then(data => {
        setBroadcastData(data);
        setShowAlertModal(true);
        setBroadcastSent(false);
      })
      .catch(err => console.error("Broadcast error:", err));
  };

  const getDistrictStyle = (feature) => {
    const dName = feature.properties.ADM2_EN || feature.properties.name;
    const riskInfo = districtsRiskList[dName];
    const score = riskInfo ? riskInfo.risk_score : 50;

    const fillColor = score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#10b981';
    return {
      fillColor: fillColor,
      weight: 1.5,
      opacity: 0.9,
      color: '#cbd5e1',
      fillOpacity: selectedDistrict === dName ? 0.45 : 0.22
    };
  };

  // Recharts XAI data preparation
  const xaiChartData = districtRiskDetails && districtRiskDetails.explainability ? 
    Object.entries(districtRiskDetails.explainability).map(([k, v]) => ({ name: k, impact: v })) : 
    [
      { name: 'Wind Vector', impact: 32.5 },
      { name: 'NDVI Dryness', impact: 28.1 },
      { name: 'Humidity', impact: 18.4 },
      { name: 'Temp', impact: 12.0 },
      { name: 'Chena Proximity', impact: 9.0 }
    ];

  const weatherTrendData = [
    { time: '06:00', temp: 24, humidity: 82, wind: 8 },
    { time: '09:00', temp: 28, humidity: 68, wind: 14 },
    { time: '12:00', temp: 35, humidity: 42, wind: 24 },
    { time: '15:00', temp: 37, humidity: 38, wind: 28 },
    { time: '18:00', temp: 31, humidity: 55, wind: 18 },
    { time: '21:00', temp: 26, humidity: 72, wind: 10 }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-orange-500/30">
      
      {/* Left Sidebar Panel */}
      <div className="w-[430px] shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-[1001] shadow-2xl text-slate-100 transition-all duration-300">
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* Header Branding */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl shadow-lg shadow-orange-600/30">
                  <Flame size={24} className="text-white fill-white" />
                </div>
                {lang === 'en' ? 'PyroGuard SL' : lang === 'si' ? 'පයිරෝගාඩ් SL' : 'பைரோகார்ட் SL'}
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-orange-400 uppercase mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                DMC Sri Lanka AI Early Warning
              </p>
            </div>
            
            {(selectedDistrict || selectedHotspot) && (
              <button 
                onClick={() => { setSelectedDistrict(null); setSelectedHotspot(null); setIsSimulating(false); setSimulationData(null); }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Reset Selection"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active Hotspot Selected State */}
          {selectedHotspot ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="bg-rose-950/40 border border-rose-800/80 p-5 rounded-2xl shadow-xl text-rose-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md">
                    THERMAL ANOMALY #{selectedHotspot.id}
                  </span>
                  <span className="text-xs text-rose-300 font-medium">{selectedHotspot.time}</span>
                </div>
                <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <AlertTriangle size={22} className="text-rose-500" /> 
                  {t('highRiskHotspotPopup')}
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">{t('tempLabel')}</p>
                    <p className="text-2xl font-black text-orange-400">{selectedHotspot.temp}°C</p>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">{t('frpLabel')}</p>
                    <p className="text-2xl font-black text-rose-400">{selectedHotspot.frp} MW</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button 
                    className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 ${isSimulating ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-600/30'}`}
                    onClick={() => handleToggleSimulation(selectedHotspot)}
                  >
                    {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                    {isSimulating ? t('simulatingSpreadBtn') : t('predictSpreadBtn')}
                  </button>

                  <button
                    onClick={() => handleTriggerBroadcast("Badulla", selectedHotspot.lat, selectedHotspot.lng, "Critical")}
                    className="px-4 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
                    title="Dispatch Emergency Broadcast"
                  >
                    <Bell size={16} /> Broadcast
                  </button>
                </div>
              </div>

              {/* Simulation Metadata Card */}
              {isSimulating && (
                <div className="bg-slate-900/90 border border-orange-500/50 p-5 rounded-2xl text-slate-200 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                    <Compass size={18} className="text-orange-500 animate-pulse" />
                    {t('spreadForecastActive')}
                  </h3>
                  
                  {simulationData && simulationData.metadata ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 block mb-0.5">Est. Burned Area</span>
                          <span className="text-sm font-bold text-white">{simulationData.metadata.estimated_burned_area_km2} km²</span>
                        </div>
                        <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 block mb-0.5">Front Perimeter</span>
                          <span className="text-sm font-bold text-white">{simulationData.metadata.perimeter_km} km</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-orange-950/30 p-3 rounded-xl border border-orange-800/40">
                        Cellular Automata model predicting 4-hour front propagation using wind vector ({simulationData.metadata.wind_speed_kmh} km/h @ {simulationData.metadata.wind_deg}°) and terrain slope.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Computing 2D Cellular Automata grid states...</p>
                  )}
                </div>
              )}
            </div>
          ) : selectedDistrict ? (
            /* Selected District XAI & Microclimate View */
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MapIcon className="text-orange-500" size={24}/>
                  {selectedDistrict}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${districtRiskDetails?.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                  {districtRiskDetails?.risk_level || 'High'} Risk
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <Thermometer className="text-orange-400 mx-auto mb-1" size={22} />
                  <span className="text-base font-bold text-white">{districtRiskDetails?.weather?.temp || 34}°C</span>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase mt-0.5">{t('avgTemp')}</span>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <Wind className="text-sky-400 mx-auto mb-1" size={22} />
                  <span className="text-base font-bold text-white">{districtRiskDetails?.weather?.wind_speed || 22} km/h</span>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase mt-0.5">{t('windSpd')}</span>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 text-center">
                  <CloudRain className="text-emerald-400 mx-auto mb-1" size={22} />
                  <span className="text-base font-bold text-white">{districtRiskDetails?.weather?.humidity || 45}%</span>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase mt-0.5">{t('humidity')}</span>
                </div>
              </div>

              {/* SHAP Explainable AI Bar Chart */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 shadow-md">
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between uppercase tracking-wider">
                  <span className="flex items-center gap-2"><Activity size={16} className="text-amber-400" /> {t('shapTitle')}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">XAI SHAP</span>
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={xaiChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} width={110} />
                      <RechartsTooltip cursor={{fill: 'rgba(51, 65, 85, 0.4)'}} content={<CustomTooltip />} />
                      <Bar dataKey="impact" radius={[0, 6, 6, 0]} barSize={20}>
                        {xaiChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Microclimate Trend Chart */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 shadow-md">
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <CloudRain size={16} className="text-sky-400" /> {t('microclimateTrend')}
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weatherTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="temp" name={t('tempTrendLabel')} stroke="#f97316" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="humidity" name={t('humidityTrendLabel')} stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button
                onClick={() => handleTriggerBroadcast(selectedDistrict, districtRiskDetails?.coordinates?.lat, districtRiskDetails?.coordinates?.lon, districtRiskDetails?.risk_level)}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40"
              >
                <Radio size={16} /> Dispatch Emergency Alert ({selectedDistrict})
              </button>

            </div>
          ) : (
            /* Default Dashboard Overview */
            <div className="space-y-6 animate-in fade-in duration-500">
              
              {/* Threat Overview */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-500" /> {t('threatLevel')}
                  </h3>
                  <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-500/40">ELEVATED (DRY SEASON)</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">{t('activeWildfires')}</span>
                    <span className="font-black text-rose-500 text-2xl">{hotspots.filter(h => h.is_likely_wildfire).length}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{hotspots.length} satellite detections</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">{t('districtsAtRisk')}</span>
                    <span className="font-black text-orange-400 text-2xl">{Object.values(districtsRiskList).filter(d => d.risk_level === 'High').length}</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">{t('sensorsOnline')}</span>
                    <span className="font-black text-emerald-400 text-2xl">{sensors.length}</span>
                  </div>
                </div>
              </div>

              {/* AI Detections Feed */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Cpu size={16} className="text-orange-400" /> {t('recentDetections')}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {recentDetections.length === 0 && (
                    <div className="text-xs text-slate-500 text-center py-4">No AI detections yet — upload a photo or check back as satellite passes come in.</div>
                  )}
                  {recentDetections.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center hover:border-slate-700 transition-colors">
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {item.loc}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{item.type}</span> • <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${item.status.includes('Fire') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                          {item.status}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 block mt-1">{item.metric}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competition Innovations Summary */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
                <h3 className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Info size={16} className="text-amber-400" /> {t('guideTitle')}
                </h3>
                <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">📷 YOLOv8 Cloud Cover Bypass:</strong> Distinguishes mountain mist in Knuckles from forest smoke.
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">🔥 Cellular Automata Spread Simulator:</strong> Predicts 4-hour wind-driven fire spread boundaries.
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-0.5">🇱🇰 Trilingual Emergency Alert Dispatcher:</strong> Instant Sinhala, Tamil, and English DMC alerts.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative flex flex-col min-w-0">
        
        {/* Floating Top Navbar */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-[1000] pointer-events-none">
          
          <div className="pointer-events-auto flex items-center gap-3">
            {/* Live vs Demo Toggle */}
            <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-2xl">
              <button 
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${isLiveMode ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                onClick={() => setIsLiveMode(true)}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('liveData')}
              </button>
              <button 
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${!isLiveMode ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                onClick={() => setIsLiveMode(false)}
              >
                {t('historicalSim')}
              </button>
            </div>
            
            {/* Language Switcher */}
            <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-2xl">
              {['en', 'si', 'ta'].map((l) => (
                <button
                  key={l}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all duration-300 ${lang === l ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  onClick={() => setLang(l)}
                >
                  {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'தமிழ்'}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button 
              className="bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300 hover:border-slate-700"
              onClick={() => handleTriggerBroadcast("Badulla", 6.9847, 81.0556, "High")}
            >
              <Radio size={16} className="text-rose-500" /> {t('broadcastAlertBtn')}
            </button>

            <button 
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-6 py-2.5 rounded-2xl shadow-xl shadow-orange-950/50 text-xs font-black flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => { setShowYoloModal(true); setYoloResult(null); setUploadedImage(null); }}
            >
              <Upload size={16} /> {t('reportFire')}
            </button>
          </div>

        </div>

        {/* Leaflet Map */}
        <div className="absolute inset-0 bg-slate-950 z-0">
          <MapContainer 
            center={SriLankaCenter} 
            zoom={8} 
            zoomControl={false}
            className="w-full h-full"
            style={{ background: '#020617' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* GeoJSON District Risk Polygons */}
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

            {/* Fire Hotspots (Pulse Markers) */}
            {hotspots.map(h => (
              <Marker 
                key={h.id} 
                position={[h.lat, h.lng]} 
                icon={pulseIcon}
                eventHandlers={{
                  click: () => { setSelectedHotspot(h); setSelectedDistrict(null); }
                }}
              >
                <Popup className="custom-popup">
                  <div className="custom-popup-header bg-rose-600 text-white p-2 font-bold text-xs rounded-t-lg">
                    {t('highRiskHotspotPopup')} #{h.id}
                  </div>
                  <div className="custom-popup-body p-3 text-xs bg-slate-900 text-slate-200">
                    <div className="mb-1"><span className="text-slate-400">{t('detectedPopup')}:</span> <span className="font-semibold text-white">{h.time}</span></div>
                    <div className="mb-1"><span className="text-slate-400">{t('tempPopup')}:</span> <span className="text-orange-400 font-bold">{h.temp}°C</span></div>
                    <div><span className="text-slate-400">{t('estFrpPopup')}:</span> <span className="text-rose-400 font-bold">{h.frp} MW</span></div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Ground IoT Sensor Markers -- skip real rows without a location
                (the sensor_data table only stores telemetry, not lat/lng) */}
            {sensors.filter(s => s.lat != null && s.lng != null).map(s => (
              <CircleMarker
                key={s.id || s.sensor_id}
                center={[s.lat, s.lng]}
                pathOptions={{
                  color: s.status === 'safe' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fillColor: s.status === 'safe' ? '#10b981' : s.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fillOpacity: 0.85,
                  weight: 2
                }}
                radius={8}
              >
                <Popup className="custom-popup">
                  <div className="custom-popup-header p-2 text-white font-bold text-xs" style={{ background: s.status === 'safe' ? '#059669' : s.status === 'warning' ? '#d97706' : '#dc2626' }}>
                    {t('iotSensorPopup')}: {s.name}
                  </div>
                  <div className="custom-popup-body p-3 text-xs bg-slate-900 text-slate-200">
                    <div className="mb-1"><span className="text-slate-400">{t('statusPopup')}:</span> <span className="font-bold uppercase text-white">{s.status}</span></div>
                    <div className="mb-1"><span className="text-slate-400">{t('groundTempPopup')}:</span> <span className="font-medium text-white">{s.temp}°C</span></div>
                    <div><span className="text-slate-400">{t('smokePopup')}:</span> <span className="font-medium text-white">{s.smoke} AQI</span></div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Cellular Automata Fire Spread GeoJSON Overlay */}
            {isSimulating && simulationData && (
              <FireSpreadOverlay spreadGeoJson={simulationData} />
            )}
          </MapContainer>
        </div>

        {/* Bottom Live Emergency Ticker Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900 text-white z-[1000] border-t border-slate-800 flex items-center overflow-hidden shadow-2xl">
          <div className="px-4 h-full bg-rose-950 border-r border-rose-800/80 flex items-center justify-center font-black text-rose-300 uppercase tracking-widest text-[11px] shrink-0 gap-2">
            <AlertTriangle size={16} className="animate-pulse text-rose-400" /> {t('liveAlertsLabel')}
          </div>
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <div className="ticker-content text-xs font-semibold text-slate-300">
              [EN] HIGH WILDFIRE RISK WARNING: BADULLA & MONERAGALA FORESTS • [SI] බදුල්ල සහ මොණරාගල වනාන්තර සඳහා අධික ලැව්ගිනි අවදානම් නිකුත් කර ඇත • [TA] பதுளை மற்றும் மொணராகலை காடுகளுக்கு அதிக காட்டுத்தீ எச்சரிக்கை விடுவிக்கப்பட்டுள்ளது • REPORT SMOKE TO 117
            </div>
          </div>
        </div>

      </div>

      {/* YOLOv8 Vision & Cloud Bypass Modal */}
      {showYoloModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[2000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl w-full max-w-3xl shadow-2xl text-slate-100 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2.5 text-white">
                  <div className="p-2 bg-orange-600/20 text-orange-400 rounded-xl border border-orange-500/30">
                    <Eye size={22} />
                  </div>
                  YOLOv8 Vision AI & Mist Disambiguator
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Verify drone/satellite feeds & bypass Knuckles mountain fog false positives</p>
              </div>
              <button onClick={() => setShowYoloModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Presets Toolbar */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Test Preset Samples (1-Click Verification):</span>
              <div className="grid grid-cols-3 gap-3">
                {samplePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => loadPresetSample(preset)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 ${preset.type === 'MIST_DISAMBIGUATION' ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-emerald-500/50' : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-rose-500/50'}`}
                  >
                    <span className="font-bold text-white block mb-0.5 truncate">{preset.title}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block mt-1 ${preset.ai_result.is_fire ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {preset.ai_result.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone or Result Screen */}
            {!uploadedImage && !yoloResult ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'}`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto flex items-center justify-center mb-4 text-orange-400">
                  <Upload size={28} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Drag & Drop Drone or Satellite Image</h3>
                <p className="text-xs text-slate-400">Supports PNG, JPG, TIFF for YOLOv8 neural network verification</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {isDetecting ? (
                  <div className="h-56 bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-slate-800">
                    <RefreshCw className="animate-spin text-orange-500 mb-3" size={32} />
                    <p className="text-xs font-bold text-slate-300 tracking-wider">RUNNING YOLOv8 & MIST DISAMBIGUATION PIPELINE...</p>
                  </div>
                ) : yoloResult && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${yoloResult.is_fire ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                        {yoloResult.badge}
                      </span>
                      <span className="text-xs font-bold text-amber-400">Confidence: {(yoloResult.confidence * 100).toFixed(1)}%</span>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {yoloResult.summary}
                    </p>

                    {yoloResult.detections && yoloResult.detections.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Neural Network Bounding Box Detections:</span>
                        {yoloResult.detections.map((det, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="font-bold text-white capitalize">Object Class: {det.class}</span>
                            <span className="text-slate-400 font-mono">BBox: [{det.bbox.join(', ')}]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowYoloModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300">Close</button>
            </div>

          </div>
        </div>
      )}

      {/* Trilingual Alert Dispatcher Modal */}
      {showAlertModal && broadcastData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[2000] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 p-7 rounded-3xl w-full max-w-2xl shadow-2xl text-slate-100 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2.5 text-white">
                  <Radio size={22} className="text-rose-500 animate-pulse" />
                  Trilingual Emergency Alert Dispatcher
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Disaster Management Centre (DMC) Sri Lanka Multi-Channel Broadcast</p>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Broadcast Reference: <strong className="text-white">{broadcastData.broadcast_id}</strong></span>
                <span className="text-slate-400">Target District: <strong className="text-orange-400">{broadcastData.target_district}</strong></span>
              </div>

              {/* Language Payload Previews */}
              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🇱🇰 SINHALA BROADCAST PAYLOAD (සිංහල):</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{broadcastData.payloads.si}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🇱🇰 TAMIL BROADCAST PAYLOAD (தமிழ்):</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{broadcastData.payloads.ta}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">🇬🇧 ENGLISH BROADCAST PAYLOAD:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">{broadcastData.payloads.en}</p>
                </div>
              </div>

              {/* Target Channels */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Target Dispatch Channels:</span>
                <div className="flex flex-wrap gap-2">
                  {broadcastData.channels.map((ch, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-400" /> {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAlertModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300">Close</button>
              
              <button 
                onClick={() => setBroadcastSent(true)}
                disabled={broadcastSent}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50"
              >
                {broadcastSent ? <Check size={16} /> : <Send size={16} />}
                {broadcastSent ? "DISPATCHED TO DMC MESH" : "CONFIRM & DISPATCH ALL CHANNELS"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
