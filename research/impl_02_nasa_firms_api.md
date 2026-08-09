# NASA FIRMS API Integration Guide

## 1. Executive Summary
This document provides a complete guide for integrating the NASA Fire Information for Resource Management System (FIRMS) API to fetch active fire hotspots for Sri Lanka. It covers endpoint usage, parameter formatting, error handling, rate limits, and actual Python code for integrating the data into the PyroGuard system.

## 2. MAP_KEY Registration Process
Before using the FIRMS API, you need a free `MAP_KEY`.
1. **Visit the FIRMS Portal:** Go to [https://firms.modaps.eosdis.nasa.gov/api/](https://firms.modaps.eosdis.nasa.gov/api/)
2. **Register Email:** Click on "Get a MAP_KEY" and enter your email address.
3. **Verify:** You will receive a verification link or the key directly in your email.
4. **Usage:** Pass the generated `MAP_KEY` in the URL path of your API requests.

## 3. FIRMS API Endpoints
The primary endpoint for retrieving active fire data by bounding box is the **Area Fire Detections** endpoint.

**Base URL:** `https://firms.modaps.eosdis.nasa.gov/api/`
**Endpoint Format:**
`GET /api/area/csv/{map_key}/{source}/{area_coordinates}/{day_range}`

### Available Sources for NRT (Near Real-Time) Data
*   `VIIRS_SNPP_NRT` (Suomi NPP VIIRS, 375m resolution - Recommended)
*   `VIIRS_NOAA20_NRT` (NOAA-20 VIIRS)
*   `VIIRS_NOAA21_NRT` (NOAA-21 VIIRS)
*   `MODIS_NRT` (Terra and Aqua MODIS, 1km resolution)

## 4. API Parameters for Sri Lanka
To query data specifically for Sri Lanka using the Area endpoint:
*   **`map_key`**: Your registered API key.
*   **`source`**: `VIIRS_SNPP_NRT` (Provides the best resolution at 375m).
*   **`area_coordinates`**: Bounding box for Sri Lanka. Format is `longitude_min,latitude_min,longitude_max,latitude_max`.
    *   **Sri Lanka BBox:** `79.5,5.9,82.0,9.9`
*   **`day_range`**: Number of days to look back (1 to 10 for NRT data). Use `1` for the most recent day.

**Example Request URL:**
`https://firms.modaps.eosdis.nasa.gov/api/area/csv/YOUR_MAP_KEY/VIIRS_SNPP_NRT/79.5,5.9,82.0,9.9/1`

## 5. Response Format
The FIRMS API natively returns data in **CSV** format for area queries (using the `/api/area/csv/` endpoint). There isn't a direct JSON endpoint for the area query, so the standard approach is to request CSV and parse it into JSON/Dictionaries in Python.

**Key Fields in Response:**
*   `latitude`: Fire hotspot latitude
*   `longitude`: Fire hotspot longitude
*   `brightness`: Brightness temperature of the fire pixel (in Kelvin)
*   `scan`: Along-scan pixel size
*   `track`: Along-track pixel size
*   `acq_date`: Acquisition date (YYYY-MM-DD)
*   `acq_time`: Acquisition time (HHMM, UTC)
*   `satellite`: Satellite identifier (e.g., N for Suomi NPP)
*   `instrument`: Sensor (e.g., VIIRS)
*   `confidence`: Confidence level (n=nominal, l=low, h=high)
*   `version`: Processing version
*   `bright_t31`: Brightness temperature of channel 31 (Kelvin)
*   `frp`: Fire Radiative Power (MW)
*   `daynight`: D=Daytime, N=Nighttime

### Sample Response Data (CSV)
```csv
latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
8.35,80.51,335.2,0.4,0.4,2024-03-15,0815,N,VIIRS,n,2.0,301.1,5.4,D
7.89,81.02,340.1,0.5,0.4,2024-03-15,0815,N,VIIRS,h,2.0,298.5,12.1,D
```

## 6. Rate Limits & Restrictions
*   **Rate Limit:** 5,000 transactions per 10-minute interval per `MAP_KEY`.
*   **Transaction Counting:** A single request for a 1-day range is 1 transaction. Larger day ranges or complex queries may count as multiple transactions.
*   **Exceeding Limits:** Returns HTTP 429 Too Many Requests.

## 7. Data Freshness & Caching Strategy
*   **Latency:** NRT data is globally available within **1 to 3 hours** of a satellite observation.
*   **Update Frequency:** Polar-orbiting satellites (like Suomi NPP) pass over Sri Lanka roughly twice a day (once daytime, once nighttime).
*   **Caching/Polling Strategy:** Polling the API every minute is unnecessary and wasteful.
    *   **Recommended Polling:** Poll the API every **2 to 3 hours**.
    *   **Caching:** Store the fetched results in a local database (e.g., PostgreSQL/PostGIS) or cache (Redis) keyed by `acq_date` and `acq_time` to prevent duplicate processing.

## 8. Python Code (httpx) to Fetch FIRMS Data

```python
import httpx
import csv
from io import StringIO
from typing import List, Dict

FIRMS_API_KEY = "YOUR_MAP_KEY"
BBOX_SRI_LANKA = "79.5,5.9,82.0,9.9"
SOURCE = "VIIRS_SNPP_NRT"
DAY_RANGE = 1

def fetch_firms_data() -> List[Dict]:
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_API_KEY}/{SOURCE}/{BBOX_SRI_LANKA}/{DAY_RANGE}"
    
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url)
            response.raise_for_status()  # Check for 4xx/5xx errors
            
            # The API returns CSV. Sometimes it returns an empty string if no fires.
            if not response.text.strip():
                return []
                
            # Parse CSV to list of dictionaries
            csv_reader = csv.DictReader(StringIO(response.text))
            data = [row for row in csv_reader]
            return data
            
    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred: {e.response.status_code}")
        # Handle 429 Too Many Requests, 401 Unauthorized, etc.
        return []
    except httpx.RequestError as e:
        print(f"Request error occurred: {e}")
        return []
```

## 9. FastAPI Integration
Here is how you can expose the fetched FIRMS data via a FastAPI endpoint.

```python
from fastapi import FastAPI, HTTPException
import httpx
import csv
from io import StringIO
import os

app = FastAPI(title="PyroGuard FIRMS API Integration")

FIRMS_API_KEY = os.getenv("FIRMS_MAP_KEY", "DEMO_KEY")
BBOX_SRI_LANKA = "79.5,5.9,82.0,9.9"

@app.get("/api/v1/fires/active")
async def get_active_fires(days: int = 1):
    if days < 1 or days > 10:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 10")
        
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_API_KEY}/VIIRS_SNPP_NRT/{BBOX_SRI_LANKA}/{days}"
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.get(url)
            
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="FIRMS API Rate Limit Exceeded")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid FIRMS MAP_KEY")
            elif response.status_code != 200:
                raise HTTPException(status_code=502, detail="Error fetching data from NASA FIRMS")
                
            content = response.text.strip()
            if not content:
                return {"status": "success", "count": 0, "data": []}
                
            csv_reader = csv.DictReader(StringIO(content))
            fires = [row for row in csv_reader]
            
            return {
                "status": "success",
                "count": len(fires),
                "data": fires
            }
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Service Unavailable: {str(e)}")
```

## 10. Historical Data Download (For Demo Mode)
Since active fires might not be occurring at the exact moment of a demo, historical data is necessary.
1. **Source:** Go to the FIRMS Archive Download page: [https://firms.modaps.eosdis.nasa.gov/download/](https://firms.modaps.eosdis.nasa.gov/download/)
2. **Account:** You need a free **NASA Earthdata Login**.
3. **Download:** You can select "Country" -> "Sri Lanka", choose the VIIRS 375m dataset, and select the years you want (e.g., 2022, 2023). 
4. **Format:** Download the data as a CSV.
5. **Usage in Demo Mode:** You can load this CSV file into your database or read it directly in Python to simulate an active fire response when no real NRT data is present.

## 11. Error Handling & Edge Cases
*   **Empty Response:** If there are no fires in the specified bounding box for the given time range, the API may return an empty string or just the CSV headers. Check `if not response.text.strip()` or handle an empty `DictReader`.
*   **API Down/Timeout:** Set a reasonable timeout (e.g., 15-20 seconds). Catch `httpx.RequestError` and gracefully fallback to cached data or return an empty list to the frontend rather than crashing the service.
*   **Rate Limiting (429):** If your service receives a 429 status code, implement exponential backoff or simply wait until the 10-minute window expires. Ensure you are not polling unnecessarily fast (every 2-3 hours is sufficient for NRT).
