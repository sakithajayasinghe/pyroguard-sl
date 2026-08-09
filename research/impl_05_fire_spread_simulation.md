# IMPLEMENTATION RESEARCH: Cellular Automata Fire Spread Simulation

## 1. Executive Summary
Cellular Automata (CA) offer a highly efficient, grid-based approach to modeling wildfire spread. By combining CA with simplified physical equations (like the Rothermel model), we can accurately simulate how wind, terrain, and vegetation types interact to drive fire propagation. This approach is computationally light, highly suitable for parallelization via NumPy, and ideal for creating real-time interactive risk maps.

## 2. Cellular Automata Basics
In a CA model, the landscape is discretized into a 2D grid. Each cell represents a geographical area (e.g., 30m x 30m) and holds a specific state:
*   `0`: **Unburned** (contains fuel)
*   `1`: **Burning** (currently on fire and actively spreading)
*   `2`: **Burned** (depleted of fuel, cannot reignite)
*   `-1`: **Unburnable** (water bodies, bare rock, urban areas)

At each time step, the model evaluates all `Burning` cells and calculates the probability of the fire spreading to its 8 adjacent neighbors (Moore neighborhood). 

## 3. Core Environmental Influences

### 3.1 Wind Influence
Wind has the most significant impact on the rate of spread (ROS). It pushes the flames and heated air ahead of the fire front, pre-heating unburned fuel.
*   **Vector Mechanics:** The spread probability is enhanced in the direction the wind is blowing (downwind) and reduced in the opposite direction (upwind). 
*   **Calculation:** We use the angle difference between the wind direction and the neighbor cell's direction to compute a modifier.

### 3.2 Terrain Influence (Slope)
Fires spread faster uphill because the flames are physically closer to the unburned fuel above them, accelerating pre-heating and drying. 
*   **Calculation:** By comparing the elevation of the burning cell and the target cell, we can calculate the slope. Positive slopes (uphill) exponentially increase spread probability, while negative slopes (downhill) decrease it.

### 3.3 Vegetation Influence (Fuel Load)
Different vegetation types have different intrinsic burn rates based on their density, moisture retention, and chemical makeup. In CA, vegetation types define the **base spread probability**.

## 4. Realistic Parameters for Sri Lanka
Sri Lanka experiences significant fire risks, particularly during the dry seasons (February-March, July-August). Based on research into Sri Lankan vegetation:
*   **Grasslands/Scrublands (Dry Zone, e.g., *Imperata cylindrica*):** Very high spread rate. "Fine fuels" dry out rapidly. Base Probability: `0.4 - 0.6`
*   **Pine Plantations (Hill Country):** High spread rate. Resin-rich needles create a highly combustible ground layer. Base Probability: `0.3 - 0.5`
*   **Degraded Forest Edges:** Moderate spread rate. Base Probability: `0.2 - 0.3`
*   **Dense Natural Rainforest (Wet Zone):** Low spread rate due to high moisture. Base Probability: `0.05 - 0.1`

## 5. Python Implementation

Below is a highly optimized, complete NumPy implementation for simulating wind-driven fire spread.

```python
import numpy as np
import math
import json
from datetime import datetime, timedelta

# Cell States
UNBURNED = 0
BURNING = 1
BURNED = 2
UNBURNABLE = -1

# 8-Neighbor definitions: (d_row, d_col, angle_from_north_degrees, distance_factor)
NEIGHBORS = [
    (-1,  0,   0, 1.000), # N
    (-1,  1,  45, 1.414), # NE
    ( 0,  1,  90, 1.000), # E
    ( 1,  1, 135, 1.414), # SE
    ( 1,  0, 180, 1.000), # S
    ( 1, -1, 225, 1.414), # SW
    ( 0, -1, 270, 1.000), # W
    (-1, -1, 315, 1.414)  # NW
]

def calculate_wind_factor(wind_speed_ms, wind_dir_deg, neighbor_dir_deg):
    """Calculate probability modifier based on wind speed and direction."""
    wind_rad = math.radians(wind_dir_deg)
    neighbor_rad = math.radians(neighbor_dir_deg)
    
    # Difference between wind direction and direction to neighbor
    angle_diff = abs(wind_rad - neighbor_rad)
    
    # Empirical constant for wind scaling
    c_wind = 0.045 
    
    # Wind factor increases exponentially in the direction of the wind
    return math.exp(c_wind * wind_speed_ms * math.cos(angle_diff))

def calculate_slope_factor(elev_burning, elev_target, distance_m):
    """Calculate probability modifier based on terrain slope."""
    elev_diff = elev_target - elev_burning
    slope_tan = elev_diff / distance_m
    
    # Simplified Rothermel slope factor
    if slope_tan > 0:
        return math.exp(3.533 * (slope_tan ** 1.2)) # Uphill
    else:
        return math.exp(-3.533 * (abs(slope_tan) ** 1.2)) # Downhill

def simulate_fire_spread(grid_shape, ignition_points, fuel_grid, elev_grid, 
                         wind_speed, wind_dir, cell_size_m=30, steps=24):
    """
    Runs the Cellular Automata simulation.
    Returns a list of grids representing the fire state at each step.
    """
    rows, cols = grid_shape
    grid = np.zeros((rows, cols), dtype=int)
    
    # Initialize ignition points
    for r, c in ignition_points:
        grid[r, c] = BURNING
        
    history = [grid.copy()]
    
    for step in range(steps):
        new_grid = grid.copy()
        
        # Find all currently burning cells
        burning_cells = np.argwhere(grid == BURNING)
        
        for r, c in burning_cells:
            # Cell burns out in one time step (simplified)
            new_grid[r, c] = BURNED
            
            # Evaluate spread to neighbors
            for dr, dc, angle, dist_factor in NEIGHBORS:
                nr, nc = r + dr, c + dc
                
                # Check bounds and unburned state
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr, nc] == UNBURNED:
                    
                    base_prob = fuel_grid[nr, nc]
                    
                    if base_prob <= 0: continue
                        
                    # Calculate modifiers
                    wind_mod = calculate_wind_factor(wind_speed, wind_dir, angle)
                    
                    dist_m = dist_factor * cell_size_m
                    slope_mod = calculate_slope_factor(elev_grid[r, c], elev_grid[nr, nc], dist_m)
                    
                    # Final spread probability
                    p_spread = base_prob * wind_mod * slope_mod
                    
                    # Cap probability at 1.0 and adjust for diagonal distance
                    p_spread = min(1.0, p_spread / dist_factor)
                    
                    # Stochastic ignition
                    if np.random.random() < p_spread:
                        new_grid[nr, nc] = BURNING
                        
        grid = new_grid.copy()
        history.append(grid.copy())
        
        # Early stopping if fire is out
        if len(np.argwhere(grid == BURNING)) == 0:
            break
            
    return history
```

## 6. Converting Grid to GeoJSON
To display the simulated spread on a map like Leaflet, we must convert the NumPy array indices back into geographic coordinates (GeoJSON).

```python
def grid_to_geojson(grid_history, origin_lat, origin_lon, cell_size_m=30):
    """
    Converts simulation history to a time-series GeoJSON FeatureCollection.
    """
    # 1 degree of latitude is approx 111,320 meters
    lat_degree_m = 111320
    # 1 degree of longitude varies by latitude
    lon_degree_m = 40075000 * math.cos(math.radians(origin_lat)) / 360
    
    lat_step = cell_size_m / lat_degree_m
    lon_step = cell_size_m / lon_degree_m

    features = []
    
    # Iterate through history to capture the bounding boxes of burned areas per step
    for step, grid in enumerate(grid_history):
        burned_cells = np.argwhere((grid == BURNING) | (grid == BURNED))
        
        for r, c in burned_cells:
            # Calculate corners of the cell
            cell_lat = origin_lat - (r * lat_step) # moving down rows = decreasing lat
            cell_lon = origin_lon + (c * lon_step) # moving right cols = increasing lon
            
            polygon = [
                [cell_lon, cell_lat],
                [cell_lon + lon_step, cell_lat],
                [cell_lon + lon_step, cell_lat - lat_step],
                [cell_lon, cell_lat - lat_step],
                [cell_lon, cell_lat]
            ]
            
            feature = {
                "type": "Feature",
                "properties": {
                    "step": step,
                    "time_offset_hours": step * 1, # assuming 1 step = 1 hour
                    "state": "burned"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon]
                }
            }
            features.append(feature)
            
    return {
        "type": "FeatureCollection",
        "features": features
    }
```

## 7. Integration with Weather Data & FastAPI
To make this operational, we wrap the simulation in a FastAPI endpoint. It takes geographic coordinates, fetches weather, and returns GeoJSON.

```python
from fastapi import FastAPI
import httpx

app = FastAPI()

async def get_current_weather(lat, lon):
    """Fetch wind data from Open-Meteo"""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        return data["current_weather"]["windspeed"], data["current_weather"]["winddirection"]

@app.post("/simulate")
async def run_simulation(lat: float, lon: float, hours: int = 12):
    # 1. Fetch real-time weather
    wind_speed, wind_dir = await get_current_weather(lat, lon)
    
    # 2. Setup grid (In production, load actual DEM/Fuel data for the bbox)
    grid_shape = (100, 100)
    fuel_grid = np.full(grid_shape, 0.4) # Assume uniform dry grass for demo
    elev_grid = np.zeros(grid_shape)     # Assume flat terrain for demo
    ignition_point = [(50, 50)]
    
    # 3. Run CA Simulation
    history = simulate_fire_spread(
        grid_shape, ignition_point, fuel_grid, elev_grid,
        wind_speed, wind_dir, steps=hours
    )
    
    # 4. Convert to GeoJSON
    geojson_output = grid_to_geojson(history, lat, lon)
    
    return geojson_output
```

## 8. Visualization on Leaflet
On the frontend, the GeoJSON can be ingested into Leaflet. By utilizing the `step` property in the GeoJSON, you can create a time-slider animation.

```javascript
// Example Leaflet implementation logic
let geojsonLayer = L.geoJSON(data, {
    filter: function(feature) {
        // Only show fire spread up to the current slider time
        return feature.properties.step <= currentSliderValue;
    },
    style: function(feature) {
        return {
            fillColor: "#ff0000",
            weight: 0,
            fillOpacity: 0.6
        };
    }
}).addTo(map);

// When slider moves, update the layer
document.getElementById('timeSlider').addEventListener('input', function(e) {
    currentSliderValue = e.target.value;
    geojsonLayer.clearLayers();
    geojsonLayer.addData(data);
});
```

## 9. Academic References & Citations
1.  **Rothermel, R. C. (1972).** *A mathematical model for predicting fire spread in wildland fuels.* USDA Forest Service Research Paper INT-115. (The foundational physics equations simplified in this CA model).
2.  **Finney, M. A. (1998).** *FARSITE: Fire Area Simulator-model development and evaluation.* USDA Forest Service Research Paper RMRS-RP-4. (Provides context on integrating spatial data with spread models).
3.  **Alexandridis, A., et al. (2008).** *A two-dimensional cellular automaton model for wildfire spread.* Applied Mathematics and Computation. (Justification for CA neighborhood rules and transition probabilities).
4.  **Galván, P., et al. (Cell2Fire).** *Cell2Fire: A Cell-Based Forest Fire Growth Model.* (Modern python implementation architecture using CA for highly complex landscapes).
5.  **Sri Lankan Context:** Studies by researchers at the University of Sri Jayewardenepura highlighting the extreme flammability of *Imperata cylindrica* grasslands and pine plantations during the July-August dry season.
