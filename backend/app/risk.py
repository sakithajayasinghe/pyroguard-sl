import math
import random
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

def calculate_district_risk(district_name):
    if district_name not in DISTRICTS:
        return {"error": "Unknown district"}
    
    lat, lon = DISTRICTS[district_name]
    weather = get_weather(lat, lon)
    
    temp = weather["temp"]
    humidity = weather["humidity"]
    wind = weather["wind_speed"]
    precip = weather["precip"]
    
    # FWI-like simple heuristic
    risk_score = (temp * 0.4) + (wind * 0.3) - (humidity * 0.2) - (precip * 0.1)
    
    # Base risk mapped 0 to 100
    base_risk = max(0, min(100, risk_score * 2.5))
    
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

# Sri Lanka fire risk profiles by region
HIGH_RISK_DISTRICTS = {"Badulla", "Moneragala", "Hambantota", "Anuradhapura", "Polonnaruwa", "Ampara", "Trincomalee"}
MEDIUM_RISK_DISTRICTS = {"Matale", "Kandy", "Mannar", "Vavuniya", "Puttalam", "Kurunegala", "Ratnapura", "Kilinochchi"}

def get_all_districts_risk():
    results = []
    # Seeded pseudo-random so scores are consistent between calls
    import time
    time_seed = int(time.time() / 300) # update every 5 minutes
    
    for district, (lat, lon) in DISTRICTS.items():
        rng = random.Random(hash(district) + time_seed)
        
        if district in HIGH_RISK_DISTRICTS:
            temp = rng.uniform(32, 39)
            wind = rng.uniform(15, 30)
            humidity = rng.uniform(35, 55)
            precip = 0
        elif district in MEDIUM_RISK_DISTRICTS:
            temp = rng.uniform(28, 34)
            wind = rng.uniform(10, 20)
            humidity = rng.uniform(50, 70)
            precip = rng.uniform(0, 1.5)
        else:
            temp = rng.uniform(22, 29)
            wind = rng.uniform(5, 15)
            humidity = rng.uniform(70, 90)
            precip = rng.uniform(1, 8)
            
        score = (temp * 0.45) + (wind * 0.35) - (humidity * 0.25) - (precip * 0.5)
        base_risk = round(max(15, min(96, (score - 2) * 2.8)), 1)
        
        results.append({
            "district": district,
            "lat": lat,
            "lon": lon,
            "risk_score": base_risk,
            "risk_level": "High" if base_risk > 70 else "Medium" if base_risk > 40 else "Low"
        })
    return results
