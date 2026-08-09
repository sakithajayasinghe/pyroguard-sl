# Fire Risk Prediction Models & Indices: Deep Research Report

## Executive Summary
This report synthesizes extensive web research on fire risk prediction models, classical fire danger indices, environmental variables, and modern machine learning (ML) approaches. By understanding foundational systems like the Canadian Fire Weather Index (FWI) alongside modern geospatial data and ML, we can build a robust composite fire risk score. This is particularly relevant for developing early warning and prediction systems in tropical environments like Sri Lanka, where climate change and human activity are increasing wildfire vulnerabilities.

---

## 1. Classical Fire Danger Rating Systems

### 1.1 Fire Weather Index (FWI) System (Canada)
The Canadian FWI is one of the most widely adopted systems globally. It relies entirely on weather observations (temperature, relative humidity, wind speed, precipitation) and consists of 6 components:
- **Fine Fuel Moisture Code (FFMC):** Represents moisture in litter and fine fuels (1-2 days lag). Indicates ease of ignition.
- **Duff Moisture Code (DMC):** Represents moisture in loosely compacted organic layers (moderate depth). Indicates fuel consumption in medium woody materials.
- **Drought Code (DC):** Represents moisture in deep, compact organic layers. Reflects long-term seasonal drought and deep smoldering potential.
- **Initial Spread Index (ISI):** Combines FFMC and wind speed to predict the initial rate of fire spread.
- **Buildup Index (BUI):** Combines DMC and DC to represent the total fuel available for combustion.
- **Fire Weather Index (FWI):** Integrates ISI and BUI to provide a general, unitless rating of potential frontal fire intensity.

### 1.2 McArthur Forest Fire Danger Index (FFDI) (Australia)
Developed for Australian eucalypt forests, the FFDI combines temperature, wind speed, relative humidity, and a drought factor (often KBDI) to measure the likelihood of ignition, spread rate, and suppression difficulty. Although superseded in 2022 by the Australian Fire Danger Rating System (AFDRS), it remains a foundational model in fire science.

### 1.3 Keetch-Byram Drought Index (KBDI)
Developed in the US, KBDI is a soil moisture deficit indicator. It operates on a scale of 0 to 800 (representing 0 to 8 inches of water deficit). It heavily influences long-term fuel dryness assessments and is often nested inside other systems (like the McArthur FFDI) as a "Drought Factor."

### 1.4 Nesterov Index (Russia)
A cumulative meteorological index used in the USSR/Russia. It uses daily air temperature, dew point, and precipitation. It accumulates over dry periods and resets to zero when daily precipitation exceeds 3 mm, serving as a simple yet effective ignition probability index, especially useful in regions with sparse data.

---

## 2. Environmental and Physical Factors

### 2.1 NDVI and Vegetation Health
The Normalized Difference Vegetation Index (NDVI) is a remote sensing metric that evaluates vegetation health. Healthy plants absorb red light and reflect near-infrared (NIR). Low or declining NDVI indicates water stress, dryness, and higher fire susceptibility. For fire modeling, NDVI is often used to map dynamic fuel dryness, usually supplemented by moisture-specific indices like NDWI (Normalized Difference Water Index) to combat NDVI saturation in dense forests.

### 2.2 Weather Variables
Weather acts as the primary dynamic driver of fire behavior:
- **Temperature:** Heats fuels, making them easier to ignite.
- **Relative Humidity (RH):** Low RH extracts moisture from dead fuels. The "crossover" condition (e.g., Temp > 30°C and RH < 30%) flags extreme danger.
- **Wind Speed:** Supplies oxygen, preheats fuels ahead of the front, and carries embers (spotting).
- **Precipitation:** Increases fuel moisture. Long-term deficits drive seasonal fire seasons.

### 2.3 Topographic Factors
Topography is the most static and predictable leg of the "fire triangle":
- **Slope:** Fire spreads exponentially faster uphill due to convective preheating of fuels. A 10% slope increase can double the spread rate.
- **Aspect:** Sun-facing slopes (South/West in the Northern hemisphere, North/West in the Southern hemisphere) are drier, warmer, and ignite easier. Shaded slopes retain more fuel, leading to higher intensity if ignited.
- **Elevation:** Influences micro-climates, temperature, and vegetation density.

### 2.4 Fuel Load Assessment
Fuel acts as the combustible material. Assessment includes:
- **Type:** Grass, shrubs, timber litter.
- **Biomass Density:** Volume of fuel available.
- **Moisture Content:** Categorized into live vs. dead fuel moisture. Dead fuel moisture responds strictly to atmospheric changes, while live fuel moisture relies on soil water and plant phenology.

---

## 3. Advanced Modeling & Spread Simulation

### 3.1 Machine Learning Risk Models
Modern ML approaches (Random Forests, XGBoost, Neural Networks) outperform linear systems by capturing non-linear interactions. They map input variables (climate, topography, NDVI, human proximity) to historical fire occurrences (e.g., MODIS/VIIRS hotspots) to generate probabilistic risk maps. Explainable AI (XAI) using SHAP values is increasingly utilized to interpret these models for decision-makers.

### 3.2 Tropical and South Asian Context (Sri Lanka)
In Sri Lanka, fire modeling is evolving from GIS-based indexing to ML models.
- **Risk Drivers:** A distinct dry season, rising temperatures, and anthropogenic activities (slash-and-burn agriculture, accidental ignitions near settlements).
- **Peak Seasons:** February–March and July–August.
- **Current State:** Models combine satellite data with GIS terrain layers to build localized Forest Fire Indices (FFI). Researchers recommend adopting ML and Explainable AI (XAI), leveraging lessons from similar tropical terrains in South and Southeast Asia.

### 3.3 Fire Spread Simulation
Simulators predict how an already ignited fire will move:
- **FARSITE (US) / Prometheus (Canada):** Deterministic, wave-propagation models using Huygens' principle. Highly accurate and widely validated for operational use, but computationally heavy.
- **Cellular Automata (CA):** Divides the landscape into a grid where cell states change based on neighboring cells and transition rules. CA models (like Cell2Fire) are computationally efficient and easily integrated with ML, making them ideal for rapid, large-scale simulations.

---

## 4. Building a Composite Fire Risk Score

To build an actionable, modern fire risk index (especially for a system in Sri Lanka), follow a tiered, ML-integrated approach:

1. **Feature Engineering (Data Aggregation):**
   - *Dynamic:* Weather forecasts (Temp, RH, Wind, Precip) and satellite indices (NDVI, NDWI).
   - *Static:* DEM derivatives (Slope, Aspect, Elevation) and infrastructure proximity (roads, settlements).
2. **Sub-Indexing:** Group variables into thematic risk layers (e.g., Topographic Risk, Weather Danger, Fuel Susceptibility) to reduce noise.
3. **Ensemble ML Meta-Model:** Train algorithms like Random Forest or Gradient Boosting on historical fire hotspots using the sub-indices as features. 
4. **Standardization:** Map the probabilistic output of the ML model to a clear 1-5 scale (e.g., Low to Extreme) to create a daily, high-resolution composite score.

---

## Key Takeaways for a Sri Lankan Wildfire System
1. **Focus on Anthropogenic Features:** Human proximity is just as critical as weather in Sri Lanka.
2. **Hybridize Indices:** Use a base like FWI for weather, modified by NDVI/NDWI for tropical fuel moisture, and Topography for spatial context.
3. **Use Grid-Based Machine Learning:** Given the complex terrain, deploying a raster-based Random Forest or XGBoost model validated against MODIS data will yield the highest accuracy for early warning risk maps.
4. **Cellular Automata for Spread:** If spread prediction is needed, CA models offer the computational speed required for real-time web dashboards over complex tropical topologies.
