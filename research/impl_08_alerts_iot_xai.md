# IMPLEMENTATION RESEARCH: Trilingual Alert System, IoT Sensor Simulator, & XAI Visualization

## 1. Executive Summary
This document provides implementation research and concrete code solutions for three critical components of the PyroGuard Sri Lanka early wildfire detection system: 
1. **Trilingual Alert System**: Capable of sending HTML emails with accurate Sinhala and Tamil unicode rendering using Python and standard SMTP. 
2. **IoT Sensor Simulator**: A script that mocks LoRaWAN-style environmental payload data (Cayenne LPP or custom JSON) with anomaly injection.
3. **Explainable AI (XAI) Visualization**: A React component visualizing feature importance (using heuristic FWI calculations) in a SHAP-style horizontal bar chart.

## 2. Trilingual Alerts Implementation

### 2.1 Technical Findings
- **SMTP Library**: `smtplib` combined with `email.message.EmailMessage` is sufficient for most synchronous background workers, while `aiosmtplib` is ideal if running within a modern async framework (e.g., FastAPI).
- **Unicode Handling**: Standard UTF-8 encoding in Python handles Sinhala and Tamil seamlessly. The email header must define `<meta charset="UTF-8">` to ensure clients render it properly.
- **Font Support**: Using Google Fonts (`Noto Sans Sinhala`, `Noto Sans Tamil`) inside the HTML template improves cross-client consistency, though some desktop email clients block external web fonts. Standard unicode fallback works regardless.
- **Database**: SQLite can easily maintain a subscription list for the target districts.

### 2.2 Translations

| English | Sinhala (සිංහල) | Tamil (தமிழ்) |
| :--- | :--- | :--- |
| **Fire Alert Detected** | ගිනි අනතුරු ඇඟවීමක් හඳුනාගෙන ඇත | தீ எச்சரிக்கை கண்டறியப்பட்டுள்ளது |
| **High Risk Warning** | අධි අවදානම් අනතුරු ඇඟවීම | உயர் ஆபத்து எச்சரிக்கை |
| **Location** | ස්ථානය | இடம் |
| **Risk Level** | අවදානම් මට්ටම | ஆபத்து நிலை |
| **Recommended Action** | නිර්දේශිත ක්‍රියාමාර්ගය | பரிந்துரைக்கப்பட்ட நடவடிக்கை |
| **Evacuate / Monitor** | ඉවත් වන්න / නිරීක්ෂණය කරන්න | வெளியேறு / கண்காணிக்கவும் |

### 2.3 Working Code: Python Alert Sender

```python
import smtplib
from email.message import EmailMessage
import sqlite3
import os

# Connect to subscriber DB
def get_subscribers(district):
    conn = sqlite3.connect('subscribers.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE district=?", (district,))
    emails = [row[0] for row in cursor.fetchall()]
    conn.close()
    return emails

def send_trilingual_alert(district, risk_level, action):
    sender_email = os.environ.get("SMTP_EMAIL", "alerts@pyroguard.lk")
    sender_password = os.environ.get("SMTP_PASSWORD", "app-password-here")
    
    recipients = get_subscribers(district)
    if not recipients:
        return
        
    msg = EmailMessage()
    msg['Subject'] = f"FIRE ALERT / ගිනි අනතුරු ඇඟවීමක් / தீ எச்சரிக்கை - {district}"
    msg['From'] = sender_email
    msg['To'] = ", ".join(recipients)
    
    html_content = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }}
            .sinhala {{ font-family: 'Noto Sans Sinhala', sans-serif; }}
            .tamil {{ font-family: 'Noto Sans Tamil', sans-serif; }}
            .alert-box {{ border: 2px solid #dc3545; padding: 15px; border-radius: 8px; background-color: #fff3f3; }}
        </style>
    </head>
    <body>
        <div class="alert-box">
            <h2 style="color: #dc3545;">🔥 Fire Alert Detected | ගිනි අනතුරු ඇඟවීමක් හඳුනාගෙන ඇත | தீ எச்சரிக்கை கண்டறியப்பட்டுள்ளது</h2>
            
            <p><strong>Location | ස්ථානය | இடம்:</strong> {district}</p>
            <p><strong>Risk Level | අවදානම් මට්ටම | ஆபத்து நிலை:</strong> {risk_level}</p>
            
            <hr>
            
            <p><strong>Recommended Action:</strong> {action['en']}</p>
            <p class="sinhala"><strong>නිර්දේශිත ක්‍රියාමාර්ගය:</strong> {action['si']}</p>
            <p class="tamil"><strong>பரிந்துரைக்கப்பட்ட நடவடிக்கை:</strong> {action['ta']}</p>
        </div>
    </body>
    </html>
    """
    
    msg.add_alternative(html_content, subtype='html')
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(f"Successfully sent alerts for {district}")
    except Exception as e:
        print(f"Failed to send email: {e}")

# Example Usage
# action = {'en': 'Evacuate', 'si': 'ඉවත් වන්න', 'ta': 'வெளியேறு'}
# send_trilingual_alert("Badulla", "HIGH / අධි / உயர்", action)
```

---

## 3. IoT Sensor Simulator Implementation

### 3.1 Technical Findings
Real LoRaWAN sensors typically transmit payloads encoded in binary (like Cayenne LPP) to save airtime. Our simulator will mock the HTTP POST that the LoRa Network Server (e.g., TTN or ChirpStack) sends to our application backend (`/api/v1/sensor-data`). We need realistic baseline data that can periodically "spike" to simulate fire onset.

### 3.2 Working Code: Python Simulator

```python
import time
import random
import requests
import json
from datetime import datetime

API_ENDPOINT = "http://localhost:8000/api/v1/sensor-data"

SENSORS = [
    {"id": "LORA-001", "lat": 6.982, "lng": 81.059, "loc": "Badulla-Forest-A"},
    {"id": "LORA-002", "lat": 7.291, "lng": 80.634, "loc": "Kandy-Reserve"}
]

def generate_sensor_data(sensor, anomaly=False):
    # Baseline normal values
    temp = round(random.uniform(22.0, 30.0), 1)
    hum = round(random.uniform(60.0, 85.0), 1)
    smoke = round(random.uniform(0.0, 0.5), 2)
    
    if anomaly:
        # Simulate fire conditions
        temp = round(random.uniform(45.0, 60.0), 1)
        hum = round(random.uniform(20.0, 35.0), 1)
        smoke = round(random.uniform(5.0, 10.0), 2)

    payload = {
        "sensor_id": sensor["id"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "location": {"lat": sensor["lat"], "lng": sensor["lng"]},
        "payload": {
            "temperature_c": temp,
            "humidity_percent": hum,
            "smoke_level_ppm": smoke,
            "battery_v": round(random.uniform(3.5, 4.2), 2)
        },
        "is_anomaly": anomaly
    }
    return payload

def run_simulation():
    print("Starting IoT Simulator...")
    tick = 0
    while True:
        tick += 1
        for sensor in SENSORS:
            # 5% chance of anomaly injection
            trigger_anomaly = (random.random() < 0.05)
            data = generate_sensor_data(sensor, anomaly=trigger_anomaly)
            
            try:
                res = requests.post(API_ENDPOINT, json=data, timeout=5)
                status = "🚨 ANOMALY" if trigger_anomaly else "NORMAL"
                print(f"[{datetime.now().time()}] {sensor['id']} -> {status} (HTTP {res.status_code})")
            except requests.exceptions.RequestException as e:
                print(f"Connection error to {API_ENDPOINT}")
                
        time.sleep(10) # Transmit every 10 seconds for demo

if __name__ == "__main__":
    run_simulation()
```

---

## 4. Explainable AI (XAI) Visualization

### 4.1 Technical Findings
A SHAP (SHapley Additive exPlanations) summary plot uses horizontal bars to show how much each feature pushes the model's output from the base value.
Without a live heavy backend running SHAP over an ML model, we can simulate this using the **Fire Weather Index (FWI) heuristic weights**. By calculating the delta between current feature values and normal baselines, and multiplying by a severity weight, we get a "contribution score".

### 4.2 Working Code: React Component with Recharts

```jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

/**
 * Calculates simulated SHAP/Contribution values based on FWI factors
 */
const calculateFeatureContributions = (currentData) => {
  // Baseline averages for a normal day
  const baselines = { temp: 28, humidity: 75, wind: 10, rain: 5 };
  
  // Weights (heuristics)
  const weights = { temp: 0.4, humidity: -0.3, wind: 0.2, rain: -0.4 };

  return [
    { 
      feature: 'Temperature', 
      contribution: (currentData.temp - baselines.temp) * weights.temp 
    },
    { 
      feature: 'Humidity (Low)', 
      // Invert because low humidity increases risk
      contribution: (baselines.humidity - currentData.humidity) * Math.abs(weights.humidity) 
    },
    { 
      feature: 'Wind Speed', 
      contribution: (currentData.wind - baselines.wind) * weights.wind 
    },
    { 
      feature: 'Recent Rainfall', 
      // Less rain increases risk
      contribution: (baselines.rain - currentData.rain) * Math.abs(weights.rain) 
    }
  ].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)); // Sort by impact magnitude
};

export default function XAIPanel({ currentSensorData }) {
  // Example currentData = { temp: 38, humidity: 30, wind: 25, rain: 0 }
  const data = calculateFeatureContributions(currentSensorData);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3>Risk Factors Analysis (Explainable AI)</h3>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Shows how much each factor contributes to the current fire risk level. Bars to the right (Red) increase risk; bars to the left (Green) decrease it.
      </p>
      
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="feature" type="category" width={90} tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [value.toFixed(2), 'Risk Contribution']}
              cursor={{fill: '#f5f5f5'}} 
            />
            <ReferenceLine x={0} stroke="#000" />
            <Bar dataKey="contribution">
              {
                data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.contribution > 0 ? '#ef4444' : '#22c55e'} 
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

## 5. Key Takeaways & Recommendations for Sri Lanka
1. **Localization is Critical**: Translating system output reliably ensures rapid response from local village officers (Grama Niladharis) who may not speak English fluently. The explicit HTML template guarantees formatting doesn't break in their mobile email clients.
2. **Network Resilience**: The IoT simulator logic demonstrates a "push" model. In rural Sri Lanka, cellular connectivity may be intermittent, so using LoRaWAN to bridge to a central gateway before POSTing to the cloud is essential.
3. **Trust through Transparency**: The Explainable AI panel demystifies the "Risk Level: HIGH" warning. By showing exactly *why* the system fired an alert (e.g., "Humidity dropped to 30% while Temperature rose to 38°C"), authorities are more likely to trust the system and dispatch resources rapidly.

## Sources
* **Python async SMTP**: `aiosmtplib` documentation (https://aiosmtplib.readthedocs.io/)
* **Recharts SHAP Visuals**: Recharts layout customization guides (https://recharts.org/en-US/api/BarChart)
* **LoRaWAN Standards**: Cayenne LPP standard specification.
