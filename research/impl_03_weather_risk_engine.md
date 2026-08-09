# IMPLEMENTATION RESEARCH: Open-Meteo Weather API + Fire Weather Index (FWI) Risk Engine

## Executive Summary
This document details the complete methodology and implementation plan for building a weather-based wildfire risk scoring engine tailored for Sri Lanka. By combining the Open-Meteo API for real-time and historical weather data, the Canadian Fire Weather Index (FWI) for physical fire behavior modeling, and a composite risk index integrating environmental and human factors, we can generate a 0-100 risk score for all 25 districts in Sri Lanka.

---

## 1. Open-Meteo API Overview
The Open-Meteo API provides high-resolution weather data without requiring an API key for non-commercial usage. 

### Endpoints
*   **Forecast API:** `https://api.open-meteo.com/v1/forecast`
*   **Historical API:** `https://archive-api.open-meteo.com/v1/archive`

### Parameters for Sri Lanka
To calculate the FWI, the following daily parameters (measured at noon local standard time) are required:
*   `temperature_2m_max` or `temperature_2m` (at noon)
*   `relative_humidity_2m` (at noon)
*   `wind_speed_10m`
*   `precipitation_sum` (over the preceding 24 hours)

### Batch Processing and Free Tier Limits
Open-Meteo supports batching multiple coordinates into a single request. 
*   **Batching Syntax:** Use comma-separated values for `latitude` and `longitude`. E.g., `latitude=7.29,6.92&longitude=81.67,79.86`. 
*   **Limits:** The free tier allows **10,000 calls/day**, **5,000 calls/hour**, and **600 calls/minute** per IP. By batching all 25 Sri Lankan districts into a single request, the API limit is highly optimal (a 30-minute refresh rate is just 48 requests/day).

---

## 2. Python Code for Fetching Batch Weather Data

```python
import httpx
import pandas as pd

def fetch_weather_batch(districts: list[dict]) -> pd.DataFrame:
    lats = ",".join([str(d['lat']) for d in districts])
    lons = ",".join([str(d['lon']) for d in districts])
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lats,
        "longitude": lons,
        "daily": ["temperature_2m_max", "precipitation_sum", "wind_speed_10m_max"],
        "timezone": "Asia/Colombo",
        "forecast_days": 1
    }
    
    # We also need relative humidity, typically at 12:00 or 14:00 PM for FWI
    # Since daily max RH isn't accurate for noon, hourly interpolation is often used.
    # For simplicity, Open-Meteo allows fetching hourly and grabbing the 12:00 index.
    
    response = httpx.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    # Process batch response (Open-Meteo returns an array of locations if lat/lon > 1)
    results = []
    if isinstance(data, list):
        for i, loc_data in enumerate(data):
            results.append({
                "district": districts[i]["name"],
                "temperature": loc_data["daily"]["temperature_2m_max"][0],
                "precipitation": loc_data["daily"]["precipitation_sum"][0],
                "wind_speed": loc_data["daily"]["wind_speed_10m_max"][0],
                # Assuming RH is calculated or fetched via hourly data for 12:00 PM
                "humidity": 60 # Placeholder
            })
    return pd.DataFrame(results)
```

---

## 3. Canadian Fire Weather Index (FWI) Mathematics
The FWI system consists of six components based on Van Wagner (1987). It relies on "bookkeeping", meaning today's value depends on yesterday's value. 

1.  **Fine Fuel Moisture Code (FFMC):** Represents the moisture content of litter and fine fuels. Fast response to weather changes.
2.  **Duff Moisture Code (DMC):** Represents loosely compacted organic layers. Moderate response.
3.  **Drought Code (DC):** Represents deep, compact organic layers. Slow response (seasonal).
4.  **Initial Spread Index (ISI):** Combines FFMC and Wind Speed to estimate fire spread rate.
5.  **Buildup Index (BUI):** Combines DMC and DC to estimate total fuel available.
6.  **Fire Weather Index (FWI):** Combines ISI and BUI to estimate the intensity of a spreading fire.

---

## 4. Python FWI Implementation
While `xclim.indices.fire` is good for gridded data, for single-point district calculations, using the ported `cffdrs` library (or an explicit Python adaptation like `pyfwi`) is best.

*Implementation Note: Since full FWI requires sequential daily history for the DC and DMC, we use the historical API to burn-in the model for 30 days before calculating the current day.*

```python
# Utilizing a simplified or ported version of FWI (e.g., from cffdrs Python port)
def calculate_fwi(temp, humidity, wind, rain, prev_ffmc=85, prev_dmc=6, prev_dc=15):
    """
    Conceptual implementation of the FWI step-by-step logic.
    For production, `cffdrs` python port should be used to ensure mathematical fidelity.
    """
    # 1. Calculate FFMC
    # Employs drying/wetting phases based on rain and temp
    mo = 147.27 * (101 - prev_ffmc) / (59.5 + prev_ffmc)
    
    # ... (omitted complex Van Wagner empirical formulas for brevity) ...
    # Returns a dictionary of the updated codes
    ffmc_new, dmc_new, dc_new, isi, bui, fwi = 90.0, 10.0, 20.0, 8.0, 15.0, 25.0
    
    return {
        "FFMC": ffmc_new, "DMC": dmc_new, "DC": dc_new,
        "ISI": isi, "BUI": bui, "FWI": fwi
    }
```

---

## 5. Composite Risk Score
The FWI represents weather/fuel conditions, but true risk includes topography and human factors.

*   **FWI (Normalized):** FWI usually ranges from 0-50+. We cap at 50 and normalize to 0-1.
*   **NDVI (Fuel Density):** Normalized Difference Vegetation Index (-1 to 1). We map positive NDVI (0.2 to 0.8) to a 0-1 scale.
*   **Elevation:** Inversely related to risk (higher altitude = cooler/wetter). Scale 0-2500m to 1-0.
*   **Human Proximity:** Distance to roads/settlements. Scale 0-1.

**Weighted Sum Formulation:**
```python
def composite_risk_score(fwi_norm, ndvi_norm, elevation_norm, human_norm):
    w_fwi = 0.50     # Weather is the primary driver
    w_ndvi = 0.20    # Fuel load
    w_elev = 0.10    # Topography
    w_human = 0.20   # Ignition probability
    
    score = (w_fwi * fwi_norm) + (w_ndvi * ndvi_norm) + \
            (w_elev * elevation_norm) + (w_human * human_norm)
            
    return score * 100 # Returns a 0-100 score
```

---

## 6. District-Level Aggregation
To assign risk to Sri Lanka's 25 districts, we:
1. Treat the district centroid (or District Secretariat) as the primary weather point.
2. Average the NDVI and Elevation across the district polygon using GIS (or pre-calculate a static modifier).
3. Compute the daily FWI at the centroid.
4. Calculate the Final Composite Score per district.

---

## 7. Sri Lanka District Centroids (Reference)
These are the approximate latitudes/longitudes for the 25 administrative centers:

| District | Latitude | Longitude | District | Latitude | Longitude |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ampara** | 7.2978 | 81.6790 | **Kurunegala** | 7.4860 | 80.3644 |
| **Anuradhapura** | 8.3350 | 80.4106 | **Mannar** | 8.9800 | 79.9000 |
| **Badulla** | 6.8990 | 81.0571 | **Matale** | 7.4700 | 80.6225 |
| **Batticaloa** | 7.7356 | 81.6942 | **Matara** | 5.9485 | 80.5353 |
| **Colombo** | 6.9271 | 79.8612 | **Monaragala** | 6.8700 | 81.3500 |
| **Galle** | 6.0535 | 80.2210 | **Mullaitivu** | 9.2742 | 80.8119 |
| **Gampaha** | 7.0917 | 79.9997 | **Nuwara Eliya** | 6.9497 | 80.7891 |
| **Hambantota** | 6.1246 | 81.1185 | **Polonnaruwa** | 7.9383 | 81.0003 |
| **Jaffna** | 9.6615 | 80.0255 | **Puttalam** | 8.0387 | 79.8247 |
| **Kalutara** | 6.5854 | 79.9607 | **Ratnapura** | 6.6932 | 80.3992 |
| **Kandy** | 7.2906 | 80.6337 | **Trincomalee** | 8.5874 | 81.2152 |
| **Kegalle** | 7.2513 | 80.3464 | **Vavuniya** | 8.7542 | 80.4982 |
| **Kilinochchi** | 9.3803 | 80.4002 | | | |

---

## 8. Explainable Risk Breakdown
To provide user transparency (similar to SHAP values), we can calculate the percentage contribution of each feature to the final score.

```python
def explain_score(fwi_norm, ndvi_norm, elevation_norm, human_norm):
    w_fwi, w_ndvi, w_elev, w_human = 0.50, 0.20, 0.10, 0.20
    
    components = {
        "Weather/FWI": w_fwi * fwi_norm,
        "Vegetation/NDVI": w_ndvi * ndvi_norm,
        "Topography": w_elev * elevation_norm,
        "Human Impact": w_human * human_norm
    }
    
    total = sum(components.values())
    
    # Calculate percentage contribution
    breakdown = {k: (v / total) * 100 for k, v in components.items()}
    return breakdown
```

---

## 9. Caching Weather Data
Because district weather forecasts don't change by the second, we can drastically reduce API calls by employing a 30-minute Time-To-Live (TTL) cache. 

```python
from cachetools import cached, TTLCache

# Cache up to 100 API responses for 1800 seconds (30 minutes)
cache = TTLCache(maxsize=100, ttl=1800)

@cached(cache)
def get_cached_weather(district_lats, district_lons):
    return fetch_weather_batch(district_lats, district_lons)
```

---

## 10. Historical Weather for Training/Validation
To validate the model or to calculate the FWI "burn-in" values (since FWI relies on previous days' values), the Open-Meteo Historical API is used.

**Endpoint:** `https://archive-api.open-meteo.com/v1/archive`
**Usage:** You can request up to decades of daily data for the 25 district coordinates in a single batch, allowing you to train ML models or validate your risk scores against historical Sri Lankan fire incidents (e.g., from MODIS/VIIRS thermal anomaly datasets).
