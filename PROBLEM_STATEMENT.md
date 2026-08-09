# 📚 PyroGuard SL — Problem Statement & Solution Overview
## IEEE AI Challenge Sri Lanka 2026 (Phase 1 Submission)

---

## 1. Problem Statement

Sri Lanka is home to diverse forest ecosystems, ranging from wet montane rainforests to dry-zone scrublands. However, these vital natural resources are under threat. **Over 95% of forest fires in Sri Lanka are human-induced**, caused primarily by:
- **Slash-and-burn (Chena) agriculture**: Land clearing that escapes boundary lines.
- **Poaching and hunting**: Deliberately setting fires to trap wildlife.
- **Cattle grazing**: Burning dry grass to stimulate new growth.
- **Public negligence**: Discarded cigarettes and campfires in dry mountain corridors.

Annually, **between 100 and 2,500 hectares of forest and grassland are destroyed**. High-risk areas like the Knuckles Forest Range, Ella Rock, and dry-zone national parks (Yala, Wilpattu) suffer catastrophic losses. These fires degrade soil health, cause severe erosion, accelerate biodiversity loss, and destroy critical carbon sinks.

### The Technological Gap
1. **Reactive Fire Detection**: Current operations rely on physical forest patrols or public phone reports. By the time a fire is noticed and reported, it has typically grown beyond control.
2. **Cloud Cover Blindness**: Global satellite systems (like NASA's MODIS/VIIRS) are heavily obscured by cloud cover during monsoon seasons, rendering them blind.
3. **High False-Alarms**: Existing satellite hotspot detection cannot distinguish between normal chena agricultural burns and actual forest fires, leading to resource misallocation.
4. **No Localized Alerts**: There is no integrated channel delivering alerts to the local Forest Department, Disaster Management Centre (DMC), or nearby communities in their native languages.

---

## 2. The Solution: PyroGuard SL

**PyroGuard SL** is a hybrid edge-cloud wildfire early warning and risk prediction system designed specifically for Sri Lankan conditions. It introduces a **three-layer AI engine** that bridges the gap between satellite limitations and ground reality:

### Three-Layer AI Engine
1. **Explainable AI Risk Engine (Layer 1)**: Computes a daily composite risk score (0-100) per district using real-time Open-Meteo weather inputs (temperature, humidity, wind, rainfall), elevation models, and vegetation index (NDVI) proxies. It includes a **SHAP-style explainability panel** that tells operators exactly *why* a district's risk score is high (e.g., wind speed vs. dryness).
2. **Interactive Computer Vision Verification (Layer 2)**: Integrates an edge-optimized, pre-trained **YOLOv8 object detection model** fine-tuned on fire and smoke images. Users and field officers can upload images of suspected smoke to get instant verification, bypassing satellite cloud-blindness and providing visual confirmation.
3. **Fire Spread Simulation (Layer 3)**: Implements a wind-driven and terrain-aware **cellular automata simulation**. When a hotspot is detected, operators can project the fire's path over the next 1 to 4 hours, identifying villages and ecosystems in the line of fire.

### Key Differentiators & Competitive Edge
- **Chena Cultivation Filter**: Applies a land-use classification mask to filter out known agricultural burns, drastically reducing false positives.
- **Trilingual Notifications**: Auto-generates alerts in **Sinhala, Tamil, and English** and dispatches them via email, dashboard notifications, and webhook channels to reach local officers.
- **Offline Edge-Ready Architecture**: Features a simulator endpoint for IoT ground sensors, demonstrating how low-cost $15 ESP32 sensor networks can detect ground-level anomalies under dense canopies.

---

## 3. UN Sustainable Development Goal (SDG) Alignment

PyroGuard SL contributes directly to the following United Nations Sustainable Development Goals:

### 🌍 SDG 13: Climate Action
- **Target 13.1**: Strengthen resilience and adaptive capacity to climate-related hazards and natural disasters.
- **Impact**: Early warning reduces fire spread, preventing the release of massive carbon dioxide (CO₂) and black carbon emissions. This supports Sri Lanka's climate pledge to reduce greenhouse gas emissions by 14.5% by 2030.

### 🌲 SDG 15: Life on Land
- **Target 15.1 & 15.2**: Ensure conservation, restoration, and sustainable use of terrestrial ecosystems; halt biodiversity loss and deforestation.
- **Impact**: Rapid containment of forest fires protects endangered endemic species in Key Biodiversity Areas (KBAs) like the Knuckles Range and Sinharaja Rainforest.

---

## 4. Deployed Prototype Details

- **Hosted URL**: [https://calit.online](https://calit.online) (Secured with Let's Encrypt HTTPS)
- **Code Repository**: [https://github.com/sakithajayasinghe/pyroguard-sl](https://github.com/sakithajayasinghe/pyroguard-sl)
- **Tech Stack**: Vite + React + Tailwind CSS (Frontend), FastAPI + YOLOv8 + SQLite (Backend), Docker Compose, Nginx Reverse Proxy.
- **Demo Features**:
  - Live District Risk Heatmap.
  - NASA FIRMS satellite active hotspots (Live & historical Demo Mode).
  - YOLOv8 image upload smoke verification.
  - Wind-driven Fire Spread Simulation.
  - Trilingual alert logs.
  - IoT ground sensor simulator.
