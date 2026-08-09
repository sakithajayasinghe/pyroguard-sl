# Global Wildfire Detection & Monitoring Systems: Research Report

## Executive Summary
This report provides a deep-dive analysis of existing global, regional, and national wildfire detection systems. State-of-the-art platforms rely heavily on a combination of satellite remote sensing (MODIS, VIIRS, Sentinel), AI-powered visual camera networks, and predictive meteorological modeling. While global systems like NASA FIRMS and GWIS offer broad coverage, their limitations in temporal and spatial resolution necessitate hyper-local, rapid-response systems (like ALERTCalifornia). For Sri Lanka, a hybrid architecture combining free satellite data (FIRMS) with local IoT sensors or camera networks represents the most viable path forward to bridge the existing gaps in tropical/cloud-heavy environment monitoring.

---

## 1. Global & Regional Satellite-Based Systems

### NASA FIRMS (Fire Information for Resource Management System)
*   **How it works:** FIRMS distributes Near Real-Time (NRT) active fire data globally within 3 hours of satellite observation. It detects thermal anomalies using infrared sensors.
*   **Data Sources:** MODIS (Terra and Aqua satellites), VIIRS (Suomi-NPP, NOAA-20, NOAA-21), and Landsat.
*   **Capabilities:** Ultra Real-Time (URT) data available for US/Canada in <60 seconds. Provides global KMLs, Web Fire Mapper, and API access.
*   **Limitations:** Cloud cover obscures optical/thermal sensors. Small fires or those under dense canopy are often missed. Plagued by false positives (industrial heat sources, agricultural burns). Temporal gaps of 6-12 hours between satellite overpasses.

### Copernicus Emergency Management Service (CEMS) & GWIS
*   **GWIS (Global Wildfire Information System):** A joint initiative by GEO and Copernicus that aggregates regional data into a single global portal. 
*   **Key Components:** Integrates CEMS fire danger forecasts and Copernicus Atmosphere Monitoring Service (CAMS) Global Fire Assimilation System (GFAS) for estimating pollutant emissions.
*   **Forecasting:** Uses Global ECMWF Fire Forecast (GEFF) to predict fire danger 1-9 days in advance.

### EU EFFIS (European Forest Fire Information System)
*   **Architecture:** A modular web GIS operating within CEMS. Monitors the full fire cycle (pre-fire danger to post-fire recovery).
*   **Fire Danger Forecast:** Uses the Canadian Forest Fire Weather Index (FWI) system fed by ECMWF and Météo-France meteorological models. Maps danger into six standardized classes.
*   **Rapid Damage Assessment (RDA):** Maps burned areas in near-real-time using MODIS/VIIRS. Since 2018, the integration of high-resolution Sentinel-2 imagery has allowed EFFIS to detect small fires (<30 hectares).

---

## 2. National & Hyper-Local Monitoring Systems

### CAL FIRE / ALERTCalifornia
*   **Architecture:** Moving away from purely satellite-driven detection to AI-powered optical surveillance. Uses a network of 1,200+ high-definition, pan-tilt-zoom (PTZ) cameras deployed in high-risk zones.
*   **AI Detection:** AI software continuously scans 24/7 video feeds for visual anomalies (smoke). It calculates a "percentage of certainty" and estimates the location.
*   **Human-in-the-Loop:** Alerts are sent to watchstanders who visually verify the anomaly. This effectively eliminates false positives before dispatching crews.
*   **Advantage:** Detects fires in their incipient stage, often triggering responses before 911 calls are even made. Extremely effective at night.

### Australia's Bushfire Monitoring
*   **Digital Earth Australia (DEA) Hotspots:** Uses AVHRR, MODIS, and VIIRS to detect land surface temperature anomalies.
*   **Emergency Alert Systems:** Distinguishes between scientific monitoring and public alerting. Uses the Australian Warning System (AWS) with 3 tiers (Advice, Watch and Act, Emergency Warning). Moving towards AusAlert (cell-broadcast technology) to ping phones in geofenced danger zones.

### South & Southeast Asian Systems (Similar Climate to Sri Lanka)
*   **Regional:** ASEAN Specialised Meteorological Centre (ASMC) handles transboundary haze and runs the regional Fire Danger Rating System (FDRS).
*   **Indonesia:** Uses Sipongi (Ministry of Environment) and Nusantara Atlas (independent). Heavily reliant on VIIRS (375m resolution) due to peatland fires.
*   **Thailand:** Land Fire Alerts web app (Kasetsart University) providing near real-time alerts.
*   **India:** Forest Survey of India (FSI) Forest Fire Alerts System. Pushes alerts based on satellite passes (6 times daily) directly to state forest departments.

---

## 3. NASA FIRMS API Documentation & Integration

*   **Authentication:** Requires a free `MAP_KEY` from the FIRMS portal.
*   **Rate Limits:** 5,000 transactions per 10-minute interval per MAP_KEY.
*   **Core Endpoints:**
    *   `/api/area`: Retrieves active fires within a bounding box (CSV format). Parameters: MAP_KEY, source (e.g., VIIRS_SNPP_NRT), coordinates, day range (1-10).
    *   `/api/country`: Retrieves data by country code.
    *   `/api/data_availability`: Checks if NRT data is available for specific dates/sensors.
*   **Integration Strategy:** Use a scheduled cron job or Apache Airflow pipeline to query the `/api/area` endpoint with Sri Lanka's bounding box every 3 hours. Store results in a spatial database (PostGIS) to filter out known industrial false positives.

---

## 4. Open Source Fire Monitoring Platforms

Several GitHub repositories offer starting points for custom dashboards:
*   **Satellite/AI Pipelines:** NASA-IMPACT/FEDS (Fire Event Data Suite) extracts fire perimeters from VIIRS data.
*   **Optical AI Detection:** Numerous YOLOv8 implementations (e.g., `Forest-fire-detection-using-YOLOv8`) exist for processing drone or fixed-camera feeds.
*   **IoT Sensor Dashboards:** Projects utilizing ESP32 mesh networks to send localized temperature/humidity/smoke data to Next.js/Firebase dashboards.

---

## 5. Architectural Patterns

Modern systems utilize a three-tier architecture:
1.  **Ingestion/Sensing Layer:**
    *   *Macro:* Satellite APIs (FIRMS, Sentinel Hub) fetched via scheduled jobs.
    *   *Micro:* IoT sensor arrays (LoRaWAN/MQTT) and optical cameras (RTSP streams).
2.  **Processing & AI Layer:**
    *   Thermal anomaly clustering (DBSCAN).
    *   Computer Vision (YOLO/CNNs) applied to camera streams or high-res satellite imagery.
    *   Geospatial filtering (masking out cities, factories, and agricultural zones).
3.  **Alerting & Dissemination Layer:**
    *   Web GIS Dashboards (React + Mapbox/Leaflet + PostGIS backend).
    *   Multichannel alerting (SMS, push notifications, Telegram bots) using geofencing.

---

## 6. Limitations of Current Systems

1.  **Detection Delay:** Low Earth Orbit satellites (MODIS/VIIRS) only pass over a given location a few times a day. A fire could burn for 6-12 hours before a satellite detects it.
2.  **Cloud Cover:** Sri Lanka is heavily clouded during monsoon seasons. Optical and thermal satellite sensors cannot see through thick clouds, leading to complete blind spots.
3.  **Spatial Resolution & Canopy Cover:** MODIS (1km) and VIIRS (375m) struggle to detect small ground fires, especially those burning under Sri Lanka's dense tropical forest canopies.
4.  **False Positives:** Sun glint off water, hot rocks, industrial plants (e.g., brick kilns), and agricultural clearing burns are routinely flagged as wildfires.

---

## 7. Strategic Gaps & Opportunities for Sri Lanka

Based on the research, here is what a Sri Lankan solution can uniquely provide to fill the gaps left by global systems:

*   **Hybrid Ground-Space Verification:** Relying solely on FIRMS will yield false positives and slow response times. The system should use FIRMS as a baseline, but integrate a localized, low-cost IoT sensor network (smoke/humidity) in known high-risk reserves (e.g., Knuckles, Sinharaja edge) for instant verification.
*   **Localized False-Positive Masking:** Global systems don't know the exact locations of Sri Lankan agricultural burning zones or industrial kilns. Our system can use machine learning on historical FIRMS data combined with local GIS zoning to create a highly accurate Sri Lanka-specific "false alarm mask."
*   **Mobile Crowdsourcing:** Similar to the ALERTCalifornia human-in-the-loop, the Sri Lankan app could feature a crowdsourced verification mechanism where local forest rangers or villagers can upload a photo to confirm a satellite-detected hotspot, triggering the official emergency response.
*   **Hyper-Local Fire Weather Index:** Instead of relying on global ECMWF models, the Sri Lankan system can integrate directly with the Department of Meteorology to create a localized Fire Danger Rating System tailored to Sri Lanka's unique dry and wet zone micro-climates.
