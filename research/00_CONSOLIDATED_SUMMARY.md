# Consolidated Wildfire Research Summary

## 1. Executive Summary
Wildfires in Sri Lanka present a unique and growing challenge, primarily driven by human activities like slash-and-burn agriculture, hunting, and land clearing, exacerbated by climate change and prolonged dry seasons. Annually, 100 to 2,500 hectares of forest and grassland are destroyed, significantly impacting the country’s rich biodiversity and carbon sinks. While traditional reactive responses involve the Disaster Management Centre (DMC) and the Forest Department, there is a critical gap in proactive, technology-driven early warning systems.

Recent advancements in AI, machine learning, and remote sensing offer unprecedented opportunities to bridge this gap. A combination of low-cost, edge-deployed IoT sensor networks, UAV-based visual detection, and continuous satellite monitoring (using free resources like NASA FIRMS and Sentinel-2) can provide near real-time, highly localized alerts. Multimodal approaches that fuse meteorological data with computer vision are particularly effective in reducing false alarms caused by cloud cover and agricultural burns common in tropical environments like Sri Lanka.

By integrating these modern technologies with existing local infrastructure—such as the Dialog DEWN cell broadcast system and WhatsApp—we can build an end-to-end, people-centered early warning system. Such a solution not only addresses the immediate technical gaps but also strongly aligns with the United Nations Sustainable Development Goals (SDG 13: Climate Action, and SDG 15: Life on Land) by protecting vulnerable ecosystems and enhancing disaster resilience.

## 2. Key Insights Per Area
*   **01 Sri Lanka Wildfire Context:**
    *   Over 95% of forest fires in Sri Lanka are human-induced (slash-and-burn, poaching, negligence).
    *   Most affected districts are Badulla, Monaragala, and central highlands.
    *   Fire seasons strictly follow dry spells (June-September for dry zone, Feb-March for wet zone).
    *   Current detection is largely manual, visual, and reactive, leading to severe delays in response.
*   **02 Detection Technologies:**
    *   Relying on a single technology is insufficient; hybrid approaches are the modern standard.
    *   Satellites provide macro-level coverage but suffer from cloud obscuration and low temporal resolution.
    *   IoT gas/smoke sensors (via LoRaWAN) offer low-cost, rapid ground-level detection under the canopy.
    *   Camera and drone systems are highly accurate but face infrastructure and line-of-sight constraints.
*   **03 AI & ML Methods:**
    *   YOLOv8 is the state-of-the-art for real-time computer vision detection (UAVs/cameras).
    *   LSTM/XGBoost excel at predicting fire risk from temporal weather data.
    *   TinyML enables running lightweight AI models directly on low-power edge IoT devices.
    *   Multi-modal fusion (vision + weather + terrain) significantly reduces false positives.
*   **04 Remote Sensing & Satellite:**
    *   NASA's VIIRS (375m) is superior to MODIS (1km) for detecting small, localized fires in Sri Lanka.
    *   Geostationary satellites (Himawari) offer high-frequency monitoring (every 10 mins).
    *   Sentinel-2 provides essential high-resolution data for mapping vegetation dryness (NDWI) and burn severity.
*   **05 Fire Risk Models:**
    *   Traditional indices like the Canadian FWI provide a solid meteorological baseline.
    *   Modern ML risk models combine these weather variables with satellite indices (NDVI/NDWI) and topography.
    *   In Sri Lanka, proximity to human settlements/roads is as crucial a risk factor as weather.
*   **06 Existing Systems:**
    *   Global systems (NASA FIRMS, GWIS) provide broad coverage but lack local context and suffer from false positives.
    *   National systems (like ALERTCalifornia) use AI-powered PTZ cameras for rapid visual verification.
    *   Sri Lanka needs a localized "false alarm mask" to distinguish agricultural burns from forest fires.
*   **07 Research Papers:**
    *   Recent focus is on edge-optimized models (like YOLO variants) for UAV-based early detection.
    *   Transformer models (ViT) and 3D-CNNs are being used to differentiate smoke from fog/clouds.
    *   Multimodal approaches fusing weather and terrain data are standard for spread prediction.
*   **08 Data Sources & APIs:**
    *   NASA FIRMS API offers free near real-time thermal anomaly data.
    *   Open-Meteo provides a generous free tier (10k calls/day) for historical and forecast weather.
    *   Google Earth Engine is essential for cloud-based processing of terrain and satellite imagery without heavy downloads.
*   **09 Alert & Warning Systems:**
    *   Systems must be multi-hazard, people-centered, and utilize the Common Alerting Protocol (CAP).
    *   Integrating with local telco infrastructure (Dialog DEWN) for cell broadcasting reaches offline phones.
    *   WhatsApp Business API is highly effective for trilingual community alerts and crowdsourcing in Sri Lanka.
*   **10 Policy & Infrastructure:**
    *   There is no dedicated national budget for forest fires; solutions must be extremely cost-effective.
    *   Telecom coverage is spotty in deep forests, necessitating LoRaWAN/Mesh networks for edge devices.
    *   Key stakeholders include the Forest Department, DMC, Dialog Axiata, and local communities.

## 3. The Sri Lanka Problem
Sri Lanka faces a unique wildfire challenge that differs from mega-fires in Australia or the US. Here, over 95% of fires are anthropogenic, driven by slash-and-burn agriculture, grazing, and hunting. Annually, 100-2,500 hectares burn, primarily in the dry zones (Badulla, Monaragala) during distinct dry seasons (Feb-Mar, Jun-Sep). Climate change is prolonging these droughts, increasing fuel flammability. The core issue is that current detection is almost entirely reactive, relying on manual patrols and visual reports. By the time the Disaster Management Centre (DMC) or Forest Department is notified, fires have often grown out of control, destroying valuable biodiversity and threatening the island's carbon sinks. Furthermore, Sri Lanka’s dense canopies and frequent cloud cover render standard global satellite systems (like MODIS) less effective or prone to false positives from agricultural burning.

## 4. Recommended Technical Approach
The optimal solution for Sri Lanka is a **Hybrid Edge-Cloud System with Multi-Modal AI**. 
*   **Macro Level:** Ingest NASA FIRMS (VIIRS 375m) data and Google Earth Engine (Sentinel-2 NDWI) via the cloud to map daily high-risk zones and detect broad thermal anomalies. Use an XGBoost model trained on local weather (Open-Meteo) and terrain to filter out false positives.
*   **Micro Level (High-Risk Hotspots):** Deploy low-cost, TinyML-powered IoT sensor nodes (temperature, humidity, smoke) and lightweight camera setups in specific high-risk peripheries (e.g., Knuckles Range). Run quantized YOLOv8 models directly on edge devices (Raspberry Pi/ESP32) to visually confirm smoke, bypassing cloud cover constraints.
*   **Communication:** Edge devices transmit alerts via LoRaWAN to a central gateway, which then relays the verified alert to the cloud.

## 5. Recommended Architecture
*   **Layer 1: Sensing & Ingestion**
    *   Space: Scheduled fetching of FIRMS APIs (VIIRS) and GEE data.
    *   Ground: LoRaWAN network of IoT edge sensors (smoke, temp) and cameras running TinyML.
    *   Community: WhatsApp/App crowdsourcing (photo uploads).
*   **Layer 2: AI Processing & Fusion**
    *   Cloud Engine: Fuses satellite data with Open-Meteo weather data using an XGBoost risk model.
    *   Edge Engine: Local YOLO object detection on camera feeds to verify smoke vs. fog.
*   **Layer 3: Command & Alerting**
    *   EOC Dashboard: Web-based GIS dashboard for DMC/Forest Dept showing live risk maps and verified hotspots.
    *   Dissemination: Integration with Dialog DEWN (Cell Broadcast) and trilingual WhatsApp API for community alerts.

## 6. Available Free Resources
*   **APIs & Data:** 
    *   NASA FIRMS API (Active fire NRT data)
    *   Open-Meteo API (Weather data, 10k free calls/day)
    *   Copernicus Data Space Ecosystem (Sentinel-2 imagery)
    *   Google Earth Engine (Terrain, LULC, satellite processing)
*   **Machine Learning:**
    *   Pre-trained YOLOv8 models (ultralytics)
    *   D-Fire / FLAME Datasets (Kaggle)
    *   Edge Impulse (TinyML model training)
*   **Infrastructure:**
    *   Firebase Cloud Messaging (FCM) for push notifications
    *   Mailgun (100 free emails/day for system alerts)

## 7. Key Research Papers to Reference
1.  *Hybrid SE-ResNet + SVM for Smoke/Fog Ambiguity (MDPI, 2024)* - Critical for Sri Lanka's misty hill country.
2.  *DFE-YOLO: Dynamic Frequency Domain Enhancement for UAVs (MDPI, 2025)* - Optimal for small drone-based early detection.
3.  *Real-time Multimodal Transformer Neural Networks (arXiv, 2024)* - Best approach for fusing weather and topography for risk prediction.
4.  *FireNet-KD: Swin Transformers on Edge (MDPI, 2025)* - State-of-the-art for running advanced models on cheap hardware like Raspberry Pi.
5.  *PyroNear: Scrapping The Web For Early Wildfire Detection (arXiv, 2024)* - Utilizes diverse real-world smoke datasets, improving generalization.

## 8. Competitive Advantages
Existing global systems (NASA FIRMS, GWIS) provide a one-size-fits-all approach. Our solution uniquely fills these gaps:
*   **Sri Lanka Specific False-Positive Masking:** By integrating local GIS data, we can filter out known agricultural burns and industrial heat, a major flaw in FIRMS.
*   **Edge-First Operation:** Works in deep forests without 4G by utilizing LoRaWAN and TinyML, overcoming local telecom limitations.
*   **Human-in-the-Loop Trilingual Alerting:** Integrates directly with WhatsApp and local systems (DEWN) in Sinhala, Tamil, and English, making it culturally adopted rather than just a scientific tool.
*   **Cloud-Piercing Verification:** Combines satellite data with under-canopy ground sensors to detect fires when satellites are blinded by monsoon clouds.

## 9. Risk & Feasibility Matrix
| Feature | Feasibility (Hackathon) | Aspirational (Post-Hackathon) |
| :--- | :--- | :--- |
| **Detection** | Ingesting FIRMS API & mapping onto a dashboard. Basic weather-based risk scoring. | Deploying actual physical LoRaWAN IoT nodes with TinyML in forests. |
| **AI Modeling** | Using a pre-trained YOLO model on a static webcam stream or sample video. | Training a custom Multimodal Transformer for dynamic fire spread prediction. |
| **Alerting** | Sending automated emails (Mailgun) or basic FCM push notifications. | Integration with Dialog DEWN cell broadcast and official WhatsApp Business API. |
| **Architecture** | Cloud-based fusion of satellite (API) and weather (API) data on a web UI. | Full edge-to-cloud pipeline with drone swarms and automated PTZ cameras. |

## 10. SDG Alignment Evidence
*   **SDG 13 (Climate Action):** The system enhances resilience and adaptive capacity to climate-related hazards (Target 13.1). By detecting fires early, it prevents massive releases of CO2 and black carbon, supporting Sri Lanka's pledge to reduce GHG emissions by 14.5% by 2030.
*   **SDG 15 (Life on Land):** Directly addresses the protection of terrestrial ecosystems and halts biodiversity loss (Targets 15.1, 15.2). Early detection protects Key Biodiversity Areas (like Knuckles and Yala) from devastating habitat destruction and topsoil degradation caused by severe burns.

## 11. Cross-references
*   [01 Sri Lanka Wildfire Context](file:///data/AI-Challenge/research/01_srilanka_wildfire_context.md)
*   [02 Detection Technologies](file:///data/AI-Challenge/research/02_detection_technologies.md)
*   [03 AI & ML Methods](file:///data/AI-Challenge/research/03_ai_ml_methods.md)
*   [04 Remote Sensing & Satellite](file:///data/AI-Challenge/research/04_remote_sensing_satellite.md)
*   [05 Fire Risk Models](file:///data/AI-Challenge/research/05_fire_risk_models.md)
*   [06 Existing Systems](file:///data/AI-Challenge/research/06_existing_systems.md)
*   [07 Research Papers](file:///data/AI-Challenge/research/07_research_papers.md)
*   [08 Data Sources & APIs](file:///data/AI-Challenge/research/08_data_sources_apis.md)
*   [09 Alert & Warning Systems](file:///data/AI-Challenge/research/09_alert_warning_systems.md)
*   [10 Policy & Infrastructure](file:///data/AI-Challenge/research/10_srilanka_policy_infrastructure.md)
