import os
import csv
import io
import time
import datetime
import requests
from functools import lru_cache

# Sri Lanka bounding box (west, south, east, north)
FIRMS_BBOX = "79.5,5.8,82.0,9.9"
FIRMS_SOURCE = "VIIRS_SNPP_NRT"
DEFAULT_DAY_RANGE = 1  # strictly last 24h of NRT detections

CACHE_SECONDS = 300  # stay well under FIRMS's 10-min transaction window


def _get_day_range():
    """Configurable via FIRMS_DAY_RANGE env var; FIRMS only accepts 1-5."""
    try:
        value = int(os.getenv("FIRMS_DAY_RANGE", str(DEFAULT_DAY_RANGE)))
    except ValueError:
        value = DEFAULT_DAY_RANGE
    return max(1, min(5, value))

# FRP (Fire Radiative Power, MW) is a proxy for thermal intensity. Small
# agricultural/chena burns in Sri Lanka typically show low, brief FRP;
# sustained higher FRP at nominal/high satellite confidence is a much
# stronger signal of an actual uncontrolled vegetation fire. This is a
# heuristic (not trained on labeled ground-truth incidents) but it stops
# every raw satellite thermal pixel from being labeled "wildfire".
WILDFIRE_FRP_THRESHOLD_MW = 15.0


def classify_hotspot(frp, confidence):
    """Returns (classification, is_likely_wildfire) for one detection."""
    if confidence == "l":
        return "low_confidence_noise", False
    if frp >= WILDFIRE_FRP_THRESHOLD_MW:
        return "likely_wildfire", True
    return "likely_agricultural_burn", False


def _fetch_firms_csv():
    map_key = os.getenv("FIRMS_MAP_KEY")
    if not map_key:
        return None
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/"
        f"{FIRMS_SOURCE}/{FIRMS_BBOX}/{_get_day_range()}"
    )
    try:
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            return None
        text = res.text.strip()
        if not text or text.startswith("Invalid") or text.startswith("Error"):
            return None
        return text
    except requests.RequestException:
        return None


@lru_cache(maxsize=4)
def _cached_fetch(cache_bucket):
    return _fetch_firms_csv()


def _relative_time(detected_at_utc, now_utc):
    delta_min = int((now_utc - detected_at_utc).total_seconds() / 60)
    if delta_min < 0:
        delta_min = 0
    if delta_min < 60:
        return f"{delta_min} mins ago"
    if delta_min < 1440:
        return f"{delta_min // 60}h ago"
    return f"{delta_min // 1440}d ago"


def get_live_hotspots(limit=40):
    """Real NASA FIRMS VIIRS active-fire detections for Sri Lanka.

    Returns None if FIRMS_MAP_KEY isn't set or the API call fails, so the
    caller can fall back to simulated data instead of showing an empty map.
    """
    cache_bucket = int(time.time() / CACHE_SECONDS)
    raw = _cached_fetch(cache_bucket)
    if raw is None:
        return None

    reader = csv.DictReader(io.StringIO(raw))
    now = datetime.datetime.utcnow()
    hotspots = []
    for i, row in enumerate(reader):
        try:
            bright = float(row.get("bright_ti4") or row.get("brightness") or 0)
            temp_c = round(bright - 273.15, 1) if bright > 200 else bright
            frp = round(float(row.get("frp") or 0), 1)
            acq_time = (row.get("acq_time") or "0").zfill(4)
            detected_at = datetime.datetime.strptime(
                f"{row['acq_date']} {acq_time}", "%Y-%m-%d %H%M"
            )
            confidence = row.get("confidence")
            classification, is_likely_wildfire = classify_hotspot(frp, confidence)
            hotspots.append({
                "id": i + 1,
                "lat": float(row["latitude"]),
                "lng": float(row["longitude"]),
                "temp": temp_c,
                "frp": frp,
                "time": _relative_time(detected_at, now),
                "confidence": confidence,
                "satellite": row.get("satellite"),
                "source": FIRMS_SOURCE,
                "classification": classification,
                "is_likely_wildfire": is_likely_wildfire,
            })
        except (KeyError, ValueError):
            continue

    hotspots.sort(key=lambda h: h["frp"], reverse=True)
    return hotspots[:limit]
