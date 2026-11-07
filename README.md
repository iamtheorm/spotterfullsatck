# SafeCorridor: Weather-Aware Freight Intelligence

A full-stack logistics application designed for commercial freight dispatch. SafeCorridor evaluates alternative highway routes between an origin and destination, calculating point-in-time atmospheric hazards (crosswinds, precipitation, snowfall) and applying vehicle gross load weight rules to prevent tractor-trailer rollovers and severe weather delays.

Built with Django REST Framework on the backend and React (TypeScript, Vite, Tailwind CSS, Leaflet) on the frontend.

---

## Table of Contents
- [Key Features](#key-features)
- [System Architecture and Data Flow](#system-architecture-and-data-flow)
- [Risk Assessment and Load Rules Engine](#risk-assessment-and-load-rules-engine)
- [Multi-Criteria Route Recommendation Engine](#multi-criteria-route-recommendation-engine)
- [Technical Stack](#technical-stack)
- [Repository Structure](#repository-structure)
- [Engineering Improvements: UX, Performance and Accuracy](#engineering-improvements-ux-performance-and-accuracy)
- [Setup and Installation](#setup-and-installation)
- [Automated Testing Suite](#automated-testing-suite)
- [License](#license)

---

## Key Features

1. **Multi-Alternative Route Generation**: Generates 3 distinct route corridors between any origin and destination worldwide, evaluating alternative highway geometries.
2. **Cascading Country-Filtered Autocomplete**: Asynchronous geocoding with a 300ms debounce and country code filtering, extracting standardized city/state labels and verified coordinates.
3. **Deterministic Checkpoint Discretization**: Samples geographic checkpoints strictly every 10, 25, or 50 miles along each route polyline.
4. **Point-in-Time Checkpoint ETAs**: Calculates arrival timestamps for every individual checkpoint using cumulative driving distance and duration.
5. **Hourly Weather Forecast Matching**: Queries wind speed, precipitation rate, and snowfall rate for the exact predicted arrival hour at each checkpoint via Open-Meteo.
6. **Dynamic Vehicle Gross Weight Rules**: Evaluates crosswind rollover thresholds based on cargo load:
   - Wind >= 55 mph: No Travel (mandatory shutdown for all vehicles).
   - Wind 45 to 54 mph with Load Weight > 30,000 lbs: No Travel.
   - Wind 35 to 44 mph with Load Weight > 40,000 lbs: Severe.
7. **Class 8 Commercial Semi-Truck Simulation**:
   - Top-down 18-wheeler tractor-trailer SVG asset with dynamic heading orientation, tandem axles, trailer ribbing, and forward headlight projection.
   - Dispatch telemetry HUD tracking simulation progress, elapsed travel time, and live wind speed.
8. **Synthesized Air Horn (Web Audio API)**:
   - Procedurally synthesizes a dual-pitch pneumatic brass tone when the simulation enters an 8,000-meter radius of checkpoints with High risk or above (High, Severe, No Travel).
   - Low and Moderate risk sectors transition quietly with telemetry updates and zero horn noise.
   - Requires zero external audio file downloads or network requests.
9. **Multi-Style Base Map Views and Viewport Clamping**:
   - 5 selectable base layers: Clean Dispatch, Topographic Terrain (with elevation hillshading), Satellite Hybrid (aerial imagery with highway vectors), Night Operations (dark mode), and Street Navigation (OpenStreetMap).
   - Viewport limits (minimum zoom level 3, maxBounds, and worldCopyJump) prevent tile repeating ribbons and polar void exposure.
10. **Dynamic Unit Switching**:
    - Live selection between Imperial and Metric units (Miles / Kilometers, Pounds / Kilograms) with bi-directional conversion.
11. **Hourly Weather Corridor Heatmap**:
    - Visualizes the corridor atmospheric risk surface synchronized with the truck's simulation hour (0 to 48 hours).
12. **Hierarchical Route Sorting**: Automatically ranks routes using strict lexicographical safety criteria.

---

## System Architecture and Data Flow

```
                      [ User Form Inputs ]
        (Origin, Destination, Departure Time, Load Weight, Step Size)
                               │
                               ▼
                    [ Django REST API Endpoint ]
                       POST /api/routes/evaluate/
                               │
          ┌────────────────────┴────────────────────┐
          ▼                                         ▼
   [ Geocoding Service ]                    [ Routing Service ]
  (OSM Nominatim / Coordinates)        (ORS / Highway Alternatives)
          │                                         │
          └────────────────────┬────────────────────┘
                               ▼
                   [ Polyline Discretization ]
           (Resample coordinates at 10, 25, or 50 miles)
                               │
                               ▼
                   [ Checkpoint ETA Calculator ]
           (T_arrival_i = T_departure + Cumulative_Seconds_i)
                               │
                               ▼
                   [ Weather Engine & Cache ]
           (Batch query Open-Meteo at checkpoint ETA)
                               │
                               ▼
                 [ Risk & Load Rules Evaluator ]
          - Wind, Rain, Snow classification
          - Gross load weight overrides
          - Aggregate Severe mi, High mi, Avg Risk
                               │
                               ▼
               [ Multi-Criteria Recommendation ]
         Sort: (Severe mi -> High mi -> Avg Risk -> Travel Time)
                               │
                               ▼
                  [ Interactive React Client ]
         - Leaflet Map with highlighted recommended route
         - Color-coded checkpoint markers (Low to No Travel)
         - Checkpoint inspection modal with active overrides
         - Live route simulation and telemetry HUD
```

---

## Risk Assessment and Load Rules Engine

### 1. Base Weather Thresholds
| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wind Speed** | < 25 mph | 25 to 34 mph | 35 to 44 mph | 45 to 54 mph | >= 55 mph |
| **Rain Rate** | < 0.10 in/hr | 0.10 to 0.25 in/hr | 0.25 to 0.50 in/hr | 0.50 to 1.00 in/hr | > 1.00 in/hr |
| **Snowfall Rate** | < 0.5 in/hr | 0.5 to 1.0 in/hr | 1.0 to 2.0 in/hr | 2.0 to 3.0 in/hr | > 3.0 in/hr |

### 2. Vehicle Load Weight Overrides
- **Rule 1**: Wind >= 55 mph -> No Travel (regardless of vehicle gross weight).
- **Rule 2**: 45 to 54 mph Wind + Load Weight > 30,000 lbs -> No Travel (elevates Severe wind risk to No Travel due to high-profile sail area).
- **Rule 3**: 35 to 44 mph Wind + Load Weight > 40,000 lbs -> Severe (elevates High wind risk to Severe).

---

## Multi-Criteria Route Recommendation Engine

Alternative corridors are ranked using a deterministic lexicographical key:

$$\text{Rank Key} = (\text{Severe Distance},\, \text{High Distance},\, \text{Average Numerical Risk},\, \text{Total Travel Time})$$

1. **Fewest Severe Distance**: Directly minimizes exposure to mandatory shutdown conditions, blizzard squalls, and severe wind shears.
2. **Fewest High Distance**: Reduces driver fatigue and hydroplaning hazards.
3. **Lowest Average Numerical Risk**: Prefers routes traversing calm atmospheric conditions.
4. **Shortest Travel Time**: Operational tie-breaker for commercial freight efficiency.

The top-ranked corridor is marked as recommended and highlighted on the map.

---

## Technical Stack

- **Backend**: Python 3.12, Django 6.1, Django REST Framework, django-cors-headers, geopy, shapely, requests.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Mapping**: Leaflet, React-Leaflet, CartoDB Positron, Esri Topo and Satellite tiles, OpenStreetMap.
- **Weather Service**: Open-Meteo API (hourly forecast models, rate-limit resilient).
- **Testing**: Pytest, Pytest-Django.

---

## Repository Structure

```
.
├── backend/
│   ├── manage.py
│   ├── pytest.ini
│   ├── truck_weather_routing/     # Django configuration and settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── routing_app/               # Core routing application
│       ├── serializers.py         # DRF input/output serialization
│       ├── views.py               # REST API views
│       ├── urls.py
│       ├── services/
│       │   ├── risk_evaluator.py  # Atmospheric thresholds and weight rules
│       │   ├── routing_service.py # Polyline resampling and ETA interpolation
│       │   ├── weather_service.py # Batch weather requests and LRU cache
│       │   └── corridor_service.py# Corridor bounding box and heatmap grid
│       └── tests/
│           ├── test_risk_evaluator.py
│           └── test_views.py
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── App.tsx                # Application shell and state orchestration
│       ├── types/index.ts         # TypeScript domain interfaces
│       ├── services/api.ts        # REST API integration
│       └── components/
│           ├── Header.tsx         # Clean navigation header with settings
│           ├── InputPanel.tsx     # Dispatch parameters and city autocomplete
│           ├── CityAutocomplete.tsx# Debounced search with country filtering
│           ├── RouteCard.tsx      # Alternative route cards with risk breakdown
│           ├── RouteComparison.tsx# Side-by-side decision matrix modal
│           ├── MapView.tsx        # Leaflet interactive map with custom HUDs
│           ├── CheckpointModal.tsx# Telemetry popup with active rule overrides
│           └── RiskRulesDrawer.tsx# Commercial load rule specification guide
└── README.md
```

---

## Engineering Improvements: UX, Performance and Accuracy

### 1. User Experience Enhancements
- **Edge-to-Edge Layout**: Replaced nested cards and redundant containers with a clean, full-bleed map workspace and compact, semi-transparent HUD controls.
- **Standardized Metric Alignment**: Unified alternative route cards with a 2-row layout: primary values and icons on top, metric sub-labels on bottom (`ETA`, `Distance`, `Avg Risk`), preventing visual collisions.
- **Controlled Viewport and Boundary Management**: Clamped map bounds (`minZoom={3}`, `maxBounds`) to stop Web Mercator world repetition and polar void exposure.
- **Collision-Free Overlay**: Eliminated overlapping floating banners in the bottom section of the map to ensure clear visibility of the simulation telemetry HUD.
- **Professional Iconography**: Standardized on Lucide React vector icons with zero informal emojis across all panels, tables, and map overlays.

### 2. Performance Optimizations
- **Procedural Audio Synthesis**: Generated the pneumatic air horn sound entirely on the client using the browser's Web Audio API (dual-pitch oscillators, lowpass filtering, and exponential gain ramps). Operates with zero network latency and zero external audio asset dependencies.
- **Frame-Accurate Simulation Loop**: Animated the vehicle using browser `requestAnimationFrame` with delta-time normalization, ensuring smooth 60 FPS playback without CPU stutter or timer drift.
- **Asynchronous Debounced Geocoding**: 300ms debounce on location inputs prevents request floods to OpenStreetMap Nominatim.
- **Batch Weather Requests and In-Memory Caching**: Weather queries for all route checkpoints are clustered into single-roundtrip requests and cached in memory to maintain sub-second response times.

### 3. Routing and Risk Accuracy
- **Point-in-Time Checkpoint ETAs**: Atmospheric models are queried against the predicted arrival hour at each coordinate ($T_{\text{arr}} = T_{\text{dep}} + \sum \Delta t$) rather than assuming departure weather conditions remain static over a 10 to 18-hour haul.
- **Vehicle Rollover Physics**: Incorporates empirical gross weight considerations to protect high-profile empty trailers from dangerous crosswinds.
- **Hierarchical Safety Prioritization**: Deterministic lexicographical sorting guarantees that severe hazard avoidance strictly precedes travel speed optimization.

---

## Setup and Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher and npm

### 1. Backend Setup (Django DRF)
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers requests geopy shapely python-dotenv pytest pytest-django

# Run database migrations
python manage.py migrate

# Start development server
python manage.py runserver 127.0.0.1:8000
```
The backend API runs at `http://127.0.0.1:8000/api/`.

### 2. Frontend Setup (React + Vite)
In a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## Automated Testing Suite

Execute the test suite in the `backend/` directory:
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest -v
```

The automated test suite verifies:
- Wind threshold classifications (<25, 25-34, 35-44, 45-54, >=55 mph)
- Rain precipitation thresholds (<0.10, 0.10-0.25, 0.25-0.50, 0.50-1.00, >1.00 in/hr)
- Snowfall rate thresholds (<0.5, 0.5-1.0, 1.0-2.0, 2.0-3.0, >3.0 in/hr)
- Gross load weight override 1: Wind >= 55 mph -> No Travel
- Gross load weight override 2: Wind 45-54 mph + Weight > 30,000 lbs -> No Travel
- Gross load weight override 3: Wind 35-44 mph + Weight > 40,000 lbs -> Severe
- Lexicographical route sorting and recommendation logic
- REST API endpoint health and response schema validation

---

## License
MIT License.
