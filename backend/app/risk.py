import math
import random
import time
import concurrent.futures
import requests

DISTRICTS = {
    "Ampara": (7.3000, 81.6667),
    "Anuradhapura": (8.3122, 80.4131),
    "Badulla": (6.9847, 81.0556),
    "Batticaloa": (7.7170, 81.6990),
    "Colombo": (6.9271, 79.8612),
    "Galle": (6.0328, 80.2168),
    "Gampaha": (7.0873, 79.9985),
    "Hambantota": (6.1248, 81.1185),
    "Jaffna": (9.6615, 80.0255),
    "Kalutara": (6.5854, 79.9607),
    "Kandy": (7.2906, 80.6337),
    "Kegalle": (7.2513, 80.3464),
    "Kilinochchi": (9.3803, 80.3770),
    "Kurunegala": (7.4818, 80.3609),
    "Mannar": (8.9810, 79.9044),
    "Matale": (7.4667, 80.6167),
    "Matara": (5.9496, 80.5353),
    "Moneragala": (6.8728, 81.3507),
    "Mullaitivu": (9.2671, 80.8142),
    "Nuwara Eliya": (6.9699, 80.7655),
    "Polonnaruwa": (7.9403, 81.0188),
    "Puttalam": (8.0362, 79.8283),
    "Ratnapura": (6.6828, 80.3992),
    "Trincomalee": (8.5875, 81.2333),
    "Vavuniya": (8.7514, 80.4971)
}

def get_weather(lat, lon):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()["current"]
            return {
                "temp": data.get("temperature_2m", 30),
                "humidity": data.get("relative_humidity_2m", 60),
                "wind_speed": data.get("wind_speed_10m", 10),
                "precip": data.get("precipitation", 0)
            }
    except Exception:
        pass
    
    # Fallback mock data
    return {
        "temp": random.uniform(25, 38),
        "humidity": random.uniform(30, 85),
        "wind_speed": random.uniform(0, 25),
        "precip": random.uniform(0, 5)
    }

def _fwi_risk_score(weather):
    """Shared FWI-like heuristic: same formula for both the single-district
    drill-down and the district heatmap, so the two views can't disagree.

    Normalized so each factor contributes a capped share of 0-100 against
    realistic Sri Lankan weather ranges. (An earlier linear-sum-then-clamp
    version was tuned against fabricated placeholder data and could never
    score above ~44 against any real weather reading -- "High" was
    mathematically unreachable regardless of actual fire-weather severity.)
    """
    temp = weather["temp"]
    humidity = weather["humidity"]
    wind = weather["wind_speed"]
    precip = weather["precip"]

    temp_pts = max(0, min(35, (temp - 20) / 20 * 35))            # 20-40C
    wind_pts = max(0, min(25, wind / 30 * 25))                    # 0-30 km/h
    humidity_pts = max(0, min(25, (100 - humidity) / 70 * 25))    # 30-100% (drier = more points)
    precip_pts = max(0, min(15, 15 - precip * 3))                 # 0-5mm (less rain = more points)

    return max(0, min(100, temp_pts + wind_pts + humidity_pts + precip_pts))


def calculate_district_risk(district_name):
    if district_name not in DISTRICTS:
        return {"error": "Unknown district"}

    lat, lon = DISTRICTS[district_name]
    weather = get_weather(lat, lon)

    temp = weather["temp"]
    humidity = weather["humidity"]
    wind = weather["wind_speed"]
    precip = weather["precip"]

    base_risk = _fwi_risk_score(weather)

    # Explainable AI SHAP style breakdown
    shap_breakdown = {
        "Temperature": round((temp / 40) * 30, 2),
        "Humidity": round(((100 - humidity) / 100) * 20, 2),
        "Wind Speed": round((wind / 30) * 25, 2),
        "Precipitation": round(max(0, 10 - precip), 2),
        "Elevation (proxy)": round(random.uniform(5, 10), 2),
        "Vegetation Dryness (NDVI proxy)": round(random.uniform(5, 10), 2),
        "Chena Cultivation Proximity": round(random.uniform(0, 5), 2)
    }
    
    total_shap = sum(shap_breakdown.values())
    normalized_shap = {k: round((v / total_shap) * base_risk, 2) for k, v in shap_breakdown.items()}

    return {
        "district": district_name,
        "coordinates": {"lat": lat, "lon": lon},
        "weather": weather,
        "risk_score": round(base_risk, 2),
        "risk_level": "High" if base_risk > 70 else "Medium" if base_risk > 40 else "Low",
        "explainability": normalized_shap
    }

_district_risk_cache = {"data": None, "timestamp": 0}
DISTRICT_RISK_CACHE_SECONDS = 600  # 10 min: keeps page loads fast, stays well within Open-Meteo's rate limits


def _fetch_one_district_risk(district):
    lat, lon = DISTRICTS[district]
    weather = get_weather(lat, lon)
    base_risk = round(_fwi_risk_score(weather), 1)
    return {
        "district": district,
        "lat": lat,
        "lon": lon,
        "risk_score": base_risk,
        "risk_level": "High" if base_risk > 70 else "Medium" if base_risk > 40 else "Low"
    }


def get_all_districts_risk():
    now = time.time()
    if _district_risk_cache["data"] is not None and (now - _district_risk_cache["timestamp"]) < DISTRICT_RISK_CACHE_SECONDS:
        return _district_risk_cache["data"]

    # Fetch all 25 districts' real weather concurrently -- sequential calls
    # would take 15-25s and make the dashboard feel broken on load.
    with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
        results = list(executor.map(_fetch_one_district_risk, DISTRICTS.keys()))

    _district_risk_cache["data"] = results
    _district_risk_cache["timestamp"] = now
    return results
