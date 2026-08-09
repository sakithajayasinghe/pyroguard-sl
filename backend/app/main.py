import os
import json
import sqlite3
import datetime
from fastapi import FastAPI, File, UploadFile, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np

# Absolute imports as requested
from app.risk import calculate_district_risk, get_all_districts_risk
from app.simulation import simulate_spread

app = FastAPI(title="PyroGuard SL Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://calit.online"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "pyroguard.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS hotspots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL,
        lon REAL,
        brightness REAL,
        timestamp TEXT
    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS district_risk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district TEXT,
        risk_score REAL,
        timestamp TEXT
    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        level TEXT,
        timestamp TEXT
    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id TEXT,
        temperature REAL,
        humidity REAL,
        gas_level REAL,
        timestamp TEXT
    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE
    )''')
    conn.commit()
    conn.close()

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Serve static files if exist
dist_path = os.path.join(os.path.dirname(__file__), "..", "..", "dist")
if os.path.exists(dist_path):
    app.mount("/static", StaticFiles(directory=dist_path), name="static")

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}

@app.get("/api/v1/hotspots")
def get_hotspots(mode: str = Query("live")):
    if mode == "demo":
        file_path = "/data/AI-Challenge/backend/app/data/historical_fires.json"
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
        return []
    
    # Mocking live data from FIRMS
    import random
    return [
        {"lat": 7.0 + random.random()*2, "lon": 80.0 + random.random()*1.5, "brightness": random.uniform(300, 350)}
        for _ in range(5)
    ]

@app.get("/api/v1/risk-map")
def risk_map():
    return get_all_districts_risk()

@app.get("/api/v1/districts.geojson")
def get_districts_geojson():
    file_path = os.path.join(os.path.dirname(__file__), "data", "sri_lanka_districts.geojson")
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="GeoJSON not found")

@app.get("/api/v1/risk/{district}")
def district_risk(district: str):
    risk_info = calculate_district_risk(district)
    if "error" in risk_info:
        raise HTTPException(status_code=404, detail="District not found")
    return risk_info

@app.post("/api/v1/detect-smoke")
async def detect_smoke(file: UploadFile = File(...)):
    # Try importing ultralytics, gracefully degrade if not available
    try:
        from ultralytics import YOLO
        import base64
        model_path = os.path.join(os.path.dirname(__file__), "models", "yolov8_fire.pt")
        if not os.path.exists(model_path):
            raise Exception("Model file not found")
        model = YOLO(model_path)
        
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        results = model(img)
        # Just mock returning original image as base64 for simplicity if real model doesn't run well
        _, buffer = cv2.imencode('.jpg', img)
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = box.conf[0].item()
                cls = box.cls[0].item()
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "confidence": conf,
                    "class": "smoke" if cls == 0 else "fire"
                })
        
        return {
            "coordinates": [],
            "image": img_str,
            "detections": detections
        }
    except Exception as e:
        # Fallback response for testing compilation
        return {"error": str(e), "message": "YOLO detection failed or model missing."}

class SimulationRequest(BaseModel):
    lat: float
    lon: float
    wind_speed: float
    wind_deg: float
    hours: int

@app.post("/api/v1/simulate-spread")
def run_simulation(req: SimulationRequest):
    result = simulate_spread(req.lat, req.lon, req.wind_speed, req.wind_deg, req.hours)
    return result

class SubscribeRequest(BaseModel):
    email: str

@app.post("/api/v1/alerts/subscribe")
def subscribe(req: SubscribeRequest):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO subscriptions (email) VALUES (?)", (req.email,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Subscribed"}
    except sqlite3.IntegrityError:
        return JSONResponse(status_code=400, content={"message": "Already subscribed"})

@app.get("/api/v1/alerts")
def get_alerts():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "message": r[1], "level": r[2], "timestamp": r[3]} for r in rows]

class SensorData(BaseModel):
    sensor_id: str
    temperature: float
    humidity: float
    gas_level: float

@app.post("/api/v1/sensor-data")
def post_sensor_data(data: SensorData):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO sensor_data (sensor_id, temperature, humidity, gas_level, timestamp) VALUES (?, ?, ?, ?, ?)",
        (data.sensor_id, data.temperature, data.humidity, data.gas_level, timestamp)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
