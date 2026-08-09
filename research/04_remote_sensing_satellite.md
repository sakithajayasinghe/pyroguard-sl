# Satellite Remote Sensing for Wildfire Detection: A Comprehensive Review

## Executive Summary
Satellite remote sensing is a cornerstone of modern wildfire management, offering critical capabilities for active fire detection, risk assessment, and post-fire analysis. This report provides a deep dive into the various satellite systems, algorithms, and indices used to monitor wildfires globally, with specific considerations for building an early detection system in Sri Lanka. By leveraging a multi-sensor approach—combining the high temporal resolution of geostationary satellites with the high spatial resolution of polar-orbiting satellites—practitioners can develop robust, near real-time fire monitoring systems.

---

## 1. Key Satellite Systems for Fire Monitoring

### MODIS (Terra & Aqua)
The Moderate Resolution Imaging Spectroradiometer (MODIS) on NASA’s Terra and Aqua satellites has provided a foundational global fire data record since 2000.
*   **Spatial Resolution:** 1 km x 1 km at nadir (pixel size increases toward the swath edges).
*   **Temporal Resolution:** Sub-daily to daily global coverage (when combining Terra and Aqua).
*   **Bands Used:** The active fire detection algorithm primarily uses the **4-μm (mid-infrared)** bands (Bands 21 and 22, sensitive to thermal emissions) and the **11-μm (thermal infrared)** band (Band 31, for background temperature). Reflectance bands are used to filter out false alarms like sun glint.
*   **Products:** **MOD14** (Terra), **MYD14** (Aqua), and **MCD14** (Combined) provide thermal anomaly and active fire data, including Fire Radiative Power (FRP).

### VIIRS (Suomi NPP & NOAA-20)
The Visible Infrared Imaging Radiometer Suite (VIIRS) represents a significant advancement over MODIS.
*   **Spatial Resolution:** 375 meters (I-bands) and 750 meters (M-bands).
*   **Product:** The **VNP14IMG** is the primary 375m active fire product.
*   **Advantages over MODIS:** The finer 375m resolution allows for the detection of smaller, cooler, and fragmented fires that MODIS 1km pixels often miss. VIIRS provides highly detailed and coherent fire perimeter mapping, better nighttime performance, and a more robust response for early-stage fire activity.

### Sentinel-2 (ESA Copernicus)
Sentinel-2 is a high-resolution multispectral mission vital for detailed wildfire management, especially for mapping burned areas.
*   **Spatial Resolution:** 10m, 20m, and 60m depending on the band.
*   **Temporal Resolution (Revisit Time):** 5 days at the equator with two satellites in constellation; 2–3 days at mid-latitudes due to overlapping swaths.
*   **Key Bands:** The **Shortwave Infrared (SWIR)** bands (B11 and B12 at 20m resolution) are critical as they can penetrate smoke and haze to identify active fire fronts. SWIR bands are widely used with Near-Infrared (NIR) bands to calculate burn indices.

### Landsat 8 & 9
Landsat missions offer essential data for high-resolution post-fire analysis and small fire detection.
*   **Spatial Resolution:** 30m for reflective bands, 100m (resampled to 30m) for thermal bands.
*   **Bands Used:** The Thermal Infrared Sensor (TIRS/TIRS-2) provides thermal bands (Bands 10 and 11) capable of detecting thermal anomalies down to ~4m² during the day.
*   **Capabilities:** Landsat is heavily utilized for **burn scar mapping** using spectral indices based on its Operational Land Imager (OLI) reflective bands.

### GOES & Himawari (Geostationary)
Geostationary satellites like GOES-R (Americas) and Himawari (Asia-Pacific) provide continuous monitoring from fixed positions above the equator.
*   **Temporal Resolution:** Exceptionally high, providing new imagery every **5 to 10 minutes**.
*   **Monitoring Capabilities:** This rapid refresh rate enables **near real-time (NRT)** monitoring of fire ignition and rapid spread. They utilize multispectral sensors (visible, NIR, TIR) to run Fire Detection and Characterization algorithms. While spatial resolution is lower than polar orbiters, their ability to catch ephemeral fires instantly is unmatched.

---

## 2. Detection Mechanisms and Algorithms

### Thermal Anomaly Detection
Active fire detection relies on identifying pixels that are significantly hotter than their surroundings.
*   **Brightness Temperature Thresholds:** Fixed threshold methods compare a pixel's temperature to a global constant, which often leads to false alarms or missed fires due to natural variations in background heat.
*   **Contextual Algorithms:** Modern algorithms are adaptive. They analyze a target pixel in relation to a surrounding neighborhood of non-fire background pixels. By calculating the local mean and standard deviation of brightness temperatures, these algorithms create dynamic thresholds. This allows for the detection of smaller or lower-intensity fires and minimizes false positives caused by bare soil or urban heat islands.

### Vegetation Indices for Fire Risk
*   **NDVI (Normalized Difference Vegetation Index):** Measures vegetation density and health (greenness). It tracks seasonal growth and fuel load, but can saturate in dense forests.
*   **EVI (Enhanced Vegetation Index):** Similar to NDVI but corrects for atmospheric and canopy background noise. It is more sensitive in dense forests, making it useful for structural biomass mapping.
*   **NDWI (Normalized Difference Water Index):** Uses NIR and SWIR bands to measure vegetation and soil water content. **Low NDWI values are primary indicators of vegetation dryness**, making it a critical metric for predicting wildfire ignition potential.

### Land Surface Temperature (LST)
*   **Derivation & Role:** Derived from thermal infrared sensors (like on MODIS, Landsat, or ECOSTRESS), LST measures the skin temperature of the earth.
*   **Fire Prediction:** Elevated LST serves as a proxy for vegetation stress and low fuel moisture. By combining LST anomalies with indices like NDWI, predictive models (including machine learning approaches like Random Forests or LSTMs) can map high-risk zones before ignition occurs. LST is also used post-fire to study changes in surface energy balance.

### Burn Severity Mapping (dNBR)
*   **NBR (Normalized Burn Ratio):** Calculated using NIR and SWIR bands. Healthy vegetation has high NIR and low SWIR reflectance; burned areas show the opposite.
*   **dNBR (differenced NBR):** The standard method for assessing fire damage, calculated by subtracting post-fire NBR from pre-fire NBR. Higher dNBR values indicate high-severity burns, while negative values can indicate post-fire regrowth. These maps are often classified into severity tiers (e.g., low, moderate, high) and validated with field data.

---

## 3. Data Access

*   **NASA Earthdata & FIRMS:** Provides access to MODIS and VIIRS active fire data (often in near real-time), as well as MOD14/VNP14 products. APIs and download portals are available.
*   **Copernicus Open Access Hub / Copernicus Data Space Ecosystem:** The primary portal for downloading Sentinel-2 multispectral imagery.
*   **USGS EarthExplorer:** The main repository for Landsat 8 and 9 data, including surface reflectance and thermal products.
*   **Google Earth Engine (GEE):** A powerful cloud-computing platform that hosts MODIS, VIIRS, Sentinel, and Landsat datasets, allowing for rapid, large-scale processing and index calculation (like dNBR and NDWI) without downloading raw files.

---

## 4. Limitations of Satellite Remote Sensing

*   **Cloud Cover and Smoke:** Optical and thermal sensors cannot penetrate thick clouds. While SWIR bands can see through thin smoke, heavy cloud cover leads to data gaps and missed detections.
*   **Revisit Gaps (Latency):** Polar-orbiting satellites like Landsat (16 days) or Sentinel-2 (5 days) have significant gaps between observations, making them unsuitable for real-time tracking unless combined with other sources.
*   **False Positives:** Sun glint over water, hot bare soils, and industrial heat sources can trick algorithms. Contextual algorithms mitigate this, but cannot eliminate it entirely.
*   **Spatial Resolution Constraints:** Geostationary satellites provide rapid updates but lack the spatial resolution to detect small fires. Conversely, high-resolution satellites pass over too infrequently.

---

## 5. Sri Lanka Specific Coverage & Considerations

For developing a wildfire early detection system tailored to Sri Lanka's geography:
*   **Satellite Availability:** 
    *   **MODIS and VIIRS** provide daily coverage over Sri Lanka. VIIRS (via FIRMS) is highly recommended for active monitoring due to its 375m resolution, which is better suited for the smaller, localized fires typical of Sri Lankan agriculture and scrublands.
    *   **Himawari-8/9** covers the Asia-Pacific region and can provide the rapid geostationary data needed for near real-time alerts in Sri Lanka.
    *   **Sentinel-2** is ideal for detailed fuel load monitoring (NDVI/NDWI) and post-fire burn severity mapping across the island.
*   **Challenges:** Sri Lanka experiences significant cloud cover, especially during the monsoon seasons, which can blind optical/thermal satellites. Additionally, dense forest canopies in parts of the island can obscure understory fires.
*   **System Design Recommendation:** An effective Sri Lankan system should ingest **Himawari** data for real-time ignition alerts, validate hotspots using **VIIRS 375m** data, and utilize **Sentinel-2** data to maintain a continuous, high-resolution map of vegetation dryness (NDWI) to identify high-risk zones proactively. Ground-validation networks and local GIS data (topography, settlement proximity) must be integrated to filter out false alarms and agricultural burns.

---
*Research conducted via comprehensive review of NASA, ESA Copernicus, USGS, and academic remote sensing literature.*
