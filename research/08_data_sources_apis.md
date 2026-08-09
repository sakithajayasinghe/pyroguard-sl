# Free Data Sources & APIs for Wildfire Detection in Sri Lanka

## Executive Summary
This research document compiles comprehensive details on free data sources and APIs essential for building a wildfire early detection and monitoring system in Sri Lanka. It covers satellite data providers, meteorological APIs, terrain and GIS datasets, and ML training archives. A key takeaway is that leveraging cloud-native processing (like Google Earth Engine and Copernicus Data Space) is much more efficient than downloading raw satellite data. Combining NASA's active fire anomalies with real-time weather data and high-resolution ML smoke detection offers the most robust path forward.

---

## 1. NASA FIRMS API (Fire Information for Resource Management System)
*   **Description**: Provides near real-time (NRT) active fire data from MODIS and VIIRS.
*   **Endpoint URLs**:
    *   `https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/[SOURCE]/[COORDINATES]/[DAY_RANGE]`
    *   Sri Lanka Bounding Box: `79.5,5.8,81.9,9.9` (Approximate for `[COORDINATES]` formatted as `West,South,East,North`)
*   **Authentication**: Requires a free `MAP_KEY` obtained via the FIRMS API portal.
*   **Data Format**: CSV, JSON.
*   **Rate Limits**: 5,000 transactions per 10-minute interval per MAP_KEY (independent of standard api.nasa.gov limits).

## 2. NASA Earthdata (MODIS/VIIRS)
*   **Description**: Archive of thermal anomalies and fire products (MOD14, MYD14).
*   **Access**: Available through the Earthdata Search portal or programmatic API.
*   **Registration**: Requires registering for an Earthdata Login profile.
*   **Usage**: Better suited for historical data analysis and training sets than NRT detection.

## 3. Copernicus Data Space Ecosystem (Formerly Open Access Hub)
*   **Status Update**: The old SciHub is closed; operations have migrated to the Copernicus Data Space Ecosystem (CDSE).
*   **Sentinel-2 Data**: Available for download via the CDSE portal.
*   **Sentinel Hub API**: Robust RESTful APIs (Process, Catalog, Statistical) available via CDSE.
*   **Code Access**: Use `sentinelhub-py` library (`pip install sentinelhub`). Cloud processing avoids downloading large `.SAFE` granules.

## 4. Google Earth Engine (GEE)
*   **Description**: Cloud computing platform for processing satellite imagery.
*   **API**: JavaScript (Code Editor) and Python API (`ee` library).
*   **Datasets**: Landsat, Sentinel, MODIS, ERA5 weather data, terrain mapping.
*   **Free Usage Limits**: Non-commercial tiers (Community: 150 EECU-hours/month; Contributor: 1,000 EECU-hours/month).
*   **Limits**: 40 concurrent requests, 100 requests/sec.

## 5. OpenWeatherMap API
*   **Description**: Real-time and forecasted weather data.
*   **Free Tier Limits**: 60 calls/minute, up to 1,000,000 calls/month.
*   **Available Data**: Current weather, 5-day/3-hour forecast, Air Pollution API (AQI, PM2.5), Geocoding.
*   **Note**: One Call API requires a payment method but allows 1,000 free calls/day.

## 6. Open-Meteo API
*   **Description**: Open-source weather API with no commercial requirements for the free tier.
*   **Free Tier Limits**: 10,000 API calls per day. Complex queries count as multiple calls.
*   **Data Access**: Current weather, forecasts, and historical weather data dating back to 1940 (reanalysis).

## 7. NOAA Weather Data
*   **Description**: Global historical climatology network and weather datasets.
*   **Access**: Through NOAA NCEI (National Centers for Environmental Information) APIs. Typically free for public datasets.

## 8. Sri Lanka Meteorological Department
*   **Description**: Official national weather data.
*   **Access**: Limited open data / API access natively. Best combined with global models like Open-Meteo or ERA5 (via GEE) for programmatic access.

## 9. USGS Earth Explorer & M2M API
*   **Description**: Primary source for Landsat archives.
*   **API**: Machine-to-Machine (M2M) RESTful JSON API.
*   **Authentication**: Requires USGS EROS account and requesting API access to generate application tokens.
*   **Alternative**: Access via AWS (s3://usgs-landsat/) as Cloud Optimized GeoTIFFs (COGs) is often faster.

## 10. Fire Datasets for ML Training
*   **Kaggle Images**:
    *   *D-Fire Dataset*: >21k images annotated for YOLO fire/smoke detection.
    *   *FASDD*: >120k heterogeneous images (ground, UAV, satellite).
*   **MODIS Archives**: Useful for extracting historical brightness temperatures to correlate with visual smoke to reduce false positives.

## 11. Elevation / Terrain Data
*   **SRTM (Shuttle Radar Topography Mission)**: 30m resolution globally.
*   **ASTER GDEM**: 30m resolution.
*   **Access**: Both easily accessible programmatically via Google Earth Engine (`ee.Image('USGS/SRTMGL1_003')`).

## 12. Land Cover & Vegetation Maps
*   **ESA WorldCover**: 10m resolution mapping (based on Sentinel-1/2).
*   **Access**: Download via AWS S3 (`s3://esa-worldcover/`), Google Earth Engine (`ESA/WorldCover/v200`), or Copernicus Data Space.

## 13. Sri Lanka GIS Data
*   **Administrative Boundaries**: Available via Humanitarian Data Exchange (HDX) or SL Foresters (ESRI Shapefiles/KML).
*   **Forest Cover**: NSDI Geoportal (gisapps.nsdi.gov.lk) and SL Foresters provide specific range and beat boundaries.
*   **OpenStreetMap**: Geofabrik offers free shapefile dumps for Sri Lanka.

## 14. API Code Examples (Python)

### NASA FIRMS API Example
```python
import requests
import pandas as pd
from io import StringIO

MAP_KEY = "YOUR_MAP_KEY"
# Sri Lanka bounding box: West,South,East,North
bbox = "79.5,5.8,81.9,9.9"
url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{bbox}/1"

response = requests.get(url)
if response.status_code == 200:
    df = pd.read_csv(StringIO(response.text))
    print(df.head())
```

### Google Earth Engine Example
```python
import ee
ee.Authenticate()
ee.Initialize(project='your-project-id')

# Sri Lanka geometry
sri_lanka = ee.Geometry.Rectangle([79.5, 5.8, 81.9, 9.9])
# Get SRTM Elevation
srtm = ee.Image('USGS/SRTMGL1_003').clip(sri_lanka)
print(srtm.getInfo())
```

---

## Key Takeaways for Sri Lanka Wildfire System
1. **Satellite vs. Image Detection**: Rely on NASA FIRMS (VIIRS/MODIS) for broad thermal anomaly detection (NRT), but use Sentinel-2 (Copernicus API) for post-fire burn scar mapping or high-res verification. 
2. **Weather Integration**: Open-Meteo is superior for historical weather data correlations (dryness, wind speed) due to its generous 10k/day limit without payment gates.
3. **Terrain Analytics**: Google Earth Engine is the best hub to overlay Sri Lanka's HDX administrative boundaries, ESA 10m WorldCover, and SRTM elevation without managing massive local downloads.
4. **Machine Learning Approach**: To prevent false positives (like agricultural burns), the system should ingest FIRMS data, cross-reference with Open-Meteo wind/humidity, and check against ESA WorldCover to ensure the anomaly is within a forest boundary.

## References
* NASA FIRMS: https://firms.modaps.eosdis.nasa.gov/api/
* Copernicus CDSE: https://dataspace.copernicus.eu/
* Earth Engine Limits: https://developers.google.com/earth-engine/guides/usage_limits
* OpenWeatherMap: https://openweathermap.org/price
* Open-Meteo: https://open-meteo.com/en/features
* HDX Sri Lanka Data: https://data.humdata.org/dataset/cod-ab-lka
