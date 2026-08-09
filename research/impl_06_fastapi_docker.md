# IMPLEMENTATION RESEARCH: FastAPI Backend + SQLite + Docker Setup

This document outlines the best practices, architecture, and working code skeletons for building a robust FastAPI backend for the PyroGuard Sri Lanka wildfire early detection system, utilizing SQLite as the database and deployed via Docker.

---

## 1. FastAPI Project Structure

For a medium-sized project involving ML models, background tasks, and multiple data sources, a domain-driven or layered architecture is recommended.

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application instance, lifespan events, CORS
│   ├── api/                    # API Routers
│   │   ├── __init__.py
│   │   ├── endpoints.py        # Route definitions
│   ├── core/                   # Configuration, logging, exception handlers
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   ├── logging_setup.py
│   ├── db/                     # Database setup and connection
│   │   ├── database.py
│   │   ├── schema.sql          # SQLite schema definitions
│   ├── services/               # Business logic, ML inference, external API calls
│   │   ├── firms_client.py
│   │   ├── ml_engine.py
│   │   ├── alert_manager.py
│   ├── tasks/                  # Background jobs (scheduler)
│   │   ├── scheduler.py
├── data/                       # Local volume for SQLite DB
│   └── pyroguard.db
├── ml_models/                  # Stored YOLOv8 or other model weights
│   └── best.pt
├── static/                     # Frontend Vite build output (dist/)
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Multi-stage Docker build
└── docker-compose.yml          # Container orchestration
```

---

## 2. SQLite with FastAPI & Schema Design

Using `aiosqlite` is highly recommended with FastAPI to prevent database I/O from blocking the asynchronous event loop.

### Schema Design (`app/db/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS fire_hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    brightness REAL,
    confidence REAL,
    acq_date TEXT NOT NULL,
    acq_time TEXT NOT NULL,
    satellite TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_name TEXT NOT NULL,
    risk_score REAL NOT NULL,
    risk_level TEXT NOT NULL, -- LOW, MODERATE, HIGH, EXTREME
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    co2_level REAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE,
    email TEXT UNIQUE,
    district_preference TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    alert_type TEXT,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT, -- SENT, FAILED
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
```

### Database Connection (`app/db/database.py`)
```python
import aiosqlite
import os
from app.core.config import settings

DB_PATH = settings.DATABASE_URL.replace("sqlite:///", "")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        with open("app/db/schema.sql", "r") as f:
            schema = f.read()
        await db.executescript(schema)
        await db.commit()

async def get_db_connection():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
```

---

## 3, 4, 10, 13. Application Setup (CORS, Static Files, Events, Errors)

Using FastAPI's new `lifespan` context manager ensures clean startup and shutdown of ML models, the database, and background schedulers.

### `app/main.py`
```python
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.db.database import init_db
from app.tasks.scheduler import start_scheduler, stop_scheduler
from app.services.ml_engine import ml_engine
from app.core.exceptions import setup_exception_handlers
from app.api import endpoints

START_TIME = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    global START_TIME
    START_TIME = time.time()
    
    # 1. Initialize Database
    await init_db()
    
    # 2. Load ML Models
    ml_engine.load_model()
    
    # 3. Start Background Tasks (FIRMS Polling)
    start_scheduler()
    
    yield
    
    # Shutdown Events
    stop_scheduler()
    ml_engine.unload_model()

app = FastAPI(title="PyroGuard API", lifespan=lifespan)

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 10. Error Handling Registration
setup_exception_handlers(app)

# Include Routers
app.include_router(endpoints.router, prefix="/api")

# 4. Static File Serving (Vite Output)
# Mount static files at root, but ensure API routes are declared first!
import os
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

```

---

## 5. Background Tasks (`app/tasks/scheduler.py`)

Using `APScheduler` is ideal for periodic background polling.

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import logging

logger = logging.getLogger("pyroguard")
scheduler = AsyncIOScheduler()

async def poll_firms_data():
    logger.info("Polling FIRMS data...")
    # Add actual FIRMS API call and DB insertion here
    pass

def start_scheduler():
    scheduler.add_job(poll_firms_data, 'interval', minutes=30, id='firms_polling')
    scheduler.start()
    logger.info("Background scheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Background scheduler stopped.")
```

---

## 8. Environment Variables (`app/core/config.py`)

Use `pydantic-settings` for robust validation of environment variables.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PyroGuard API"
    FIRMS_API_KEY: str
    DATABASE_URL: str = "sqlite:///data/pyroguard.db"
    MODEL_PATH: str = "ml_models/best.pt"
    DEBUG: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 9. Health Check Endpoint (`app/api/endpoints.py`)

```python
from fastapi import APIRouter, Depends
from aiosqlite import Connection
import time
from app.db.database import get_db_connection
import app.main as main_app

router = APIRouter()

@router.get("/health")
async def health_check(db: Connection = Depends(get_db_connection)):
    uptime = time.time() - main_app.START_TIME if main_app.START_TIME else 0
    
    # Check DB status
    db_status = "ok"
    try:
        await db.execute("SELECT 1")
    except Exception:
        db_status = "error"

    return {
        "status": "online",
        "uptime_seconds": round(uptime, 2),
        "database": db_status,
        "ml_model": "loaded" # Query ML engine status
    }
```

---

## 11. Logging (`app/core/logging_setup.py`)

```python
import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("app.log")
        ]
    )
```
*(Ensure `setup_logging()` is called at the very top of `main.py`)*

---

## 12. requirements.txt

```text
# Web Framework
fastapi==0.110.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9

# Database
aiosqlite==0.20.0
pydantic==2.6.4
pydantic-settings==2.2.1

# Background Tasks & Utilities
APScheduler==3.10.4
python-dotenv==1.0.1
httpx==0.27.0

# Machine Learning & Data Processing
ultralytics==8.1.29
numpy==1.26.4
pandas==2.2.1
Pillow==10.2.0
opencv-python-headless==4.9.0.80
```

---

## 6. Dockerfile

A multi-stage build helps keep the final image clean, especially important with large ML libraries.

```dockerfile
# Stage 1: Build & Install dependencies
FROM python:3.10-slim AS builder

WORKDIR /app
COPY requirements.txt .

# Install system dependencies needed for compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime image
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies (OpenCV requires libgl1 and libglib2.0)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 7. Docker Compose

Setup an Nginx reverse proxy alongside the FastAPI backend, utilizing named volumes for persistent SQLite storage.

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: pyroguard-backend
    restart: unless-stopped
    volumes:
      - ./data:/app/data          # Persist SQLite Database
      - ./ml_models:/app/ml_models # Mount ML Models
      - ./static:/app/static      # Frontend Build artifacts
    env_file:
      - .env
    networks:
      - pyroguard-net

  nginx:
    image: nginx:alpine
    container_name: pyroguard-proxy
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - pyroguard-net

networks:
  pyroguard-net:
    driver: bridge
```

*Note on Nginx Configuration:* Nginx should be configured to route `/api/*` to `http://backend:8000/api` and fallback to `/` for the static assets (which FastAPI can also handle, but Nginx is faster for static files if configured properly).
