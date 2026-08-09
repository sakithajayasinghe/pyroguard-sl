import json
import math

def simulate_spread(lat, lon, wind_speed, wind_deg, hours):
    # Simplified cellular automata spread
    # 1 degree of lat/lon is roughly 111km
    grid_size = 20 # 20x20 grid
    cell_size = 0.005 # rough degree step ~ 500m
    
    ignition_x, ignition_y = grid_size // 2, grid_size // 2
    
    grid = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    grid[ignition_y][ignition_x] = 1
    
    wind_rad = math.radians(wind_deg)
    wind_dx = math.sin(wind_rad)
    wind_dy = math.cos(wind_rad)
    
    for h in range(int(hours)):
        new_grid = [row[:] for row in grid]
        for y in range(grid_size):
            for x in range(grid_size):
                if grid[y][x] == 1:
                    # check neighbors
                    for dy in [-1, 0, 1]:
                        for dx in [-1, 0, 1]:
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < grid_size and 0 <= nx < grid_size and new_grid[ny][nx] == 0:
                                # Spread probability based on wind
                                base_prob = 0.2
                                wind_factor = max(0, (dx * wind_dx + dy * wind_dy) / math.sqrt(dx**2 + dy**2))
                                prob = base_prob + (wind_factor * wind_speed * 0.02)
                                
                                import random
                                if random.random() < prob:
                                    new_grid[ny][nx] = 1
        grid = new_grid

    # Convert to GeoJSON
    features = []
    for y in range(grid_size):
        for x in range(grid_size):
            if grid[y][x] == 1:
                # Calculate coordinates for cell polygon
                cell_lat = lat + (y - ignition_y) * cell_size
                cell_lon = lon + (x - ignition_x) * cell_size
                
                polygon = [
                    [cell_lon - cell_size/2, cell_lat - cell_size/2],
                    [cell_lon + cell_size/2, cell_lat - cell_size/2],
                    [cell_lon + cell_size/2, cell_lat + cell_size/2],
                    [cell_lon - cell_size/2, cell_lat + cell_size/2],
                    [cell_lon - cell_size/2, cell_lat - cell_size/2]
                ]
                
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [polygon]
                    },
                    "properties": {
                        "state": "burned"
                    }
                })
                
    return {
        "type": "FeatureCollection",
        "features": features
    }
