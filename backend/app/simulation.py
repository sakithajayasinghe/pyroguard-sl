import json
import math
import random

def simulate_spread(lat, lon, wind_speed, wind_deg, hours):
    # Cellular automata fire spread model
    grid_size = 24
    cell_size = 0.004  # ~450m grid resolution
    
    ignition_x, ignition_y = grid_size // 2, grid_size // 2
    
    grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    hour_grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    grid[ignition_y][ignition_x] = 1
    hour_grid[ignition_y][ignition_x] = 1
    
    wind_rad = math.radians(wind_deg)
    wind_dx = math.sin(wind_rad)
    wind_dy = math.cos(wind_rad)
    
    for h in range(1, int(hours) + 1):
        new_grid = [row[:] for row in grid]
        for y in range(grid_size):
            for x in range(grid_size):
                if grid[y][x] == 1:
                    for dy in [-1, 0, 1]:
                        for dx in [-1, 0, 1]:
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < grid_size and 0 <= nx < grid_size and new_grid[ny][nx] == 0:
                                base_prob = 0.25
                                dist = math.sqrt(dx**2 + dy**2)
                                wind_alignment = (dx * wind_dx + dy * wind_dy) / dist
                                prob = base_prob + (max(-0.2, wind_alignment) * wind_speed * 0.025)
                                
                                if random.Random(y * 100 + x + h).random() < prob:
                                    new_grid[ny][nx] = 1
                                    hour_grid[ny][nx] = h
        grid = new_grid

    features = []
    total_burned_cells = 0
    for y in range(grid_size):
        for x in range(grid_size):
            if grid[y][x] == 1:
                total_burned_cells += 1
                cell_lat = lat + (y - ignition_y) * cell_size
                cell_lon = lon + (x - ignition_x) * cell_size
                
                polygon = [
                    [cell_lon - cell_size/2, cell_lat - cell_size/2],
                    [cell_lon + cell_size/2, cell_lat - cell_size/2],
                    [cell_lon + cell_size/2, cell_lat + cell_size/2],
                    [cell_lon - cell_size/2, cell_lat + cell_size/2],
                    [cell_lon - cell_size/2, cell_lat - cell_size/2]
                ]
                
                burn_hour = hour_grid[y][x]
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [polygon]
                    },
                    "properties": {
                        "state": "burned",
                        "burn_hour": burn_hour,
                        "intensity": min(1.0, 0.4 + (burn_hour / hours) * 0.6)
                    }
                })
                
    area_km2 = round(total_burned_cells * 0.2025, 2)  # ~0.2025 sq km per cell
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "origin": {"lat": lat, "lon": lon},
            "hours": hours,
            "wind_speed_kmh": wind_speed,
            "wind_deg": wind_deg,
            "estimated_burned_area_km2": area_km2,
            "perimeter_km": round(math.sqrt(area_km2) * 4.2, 2),
            "threat_classification": "CRITICAL_SPREAD" if area_km2 > 5 else "MODERATE_SPREAD"
        }
    }
