# Weather-Aware Truck Routing 🚛🌦️

A production-ready full-stack web application designed for commercial freight logistics. It enables dispatchers and truck drivers to evaluate alternative routes between any origin and destination, proactively mitigating crosswind rollover hazards, severe precipitation, and winter snowfall based on real-time vehicle gross load weight and dynamic weather forecasts.

Built with **Django REST Framework (DRF)** on the backend and **React (Vite + TypeScript + Tailwind CSS + Leaflet)** on the frontend.

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Risk Assessment & Load Rules Engine](#-risk-assessment--load-rules-engine)
- [Multi-Criteria Route Recommendation Engine](#-multi-criteria-route-recommendation-engine)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Backend Setup](#1-backend-setup-django-drf)
  - [Frontend Setup](#2-frontend-setup-react--vite)
- [API Reference](#-api-reference)
- [Running Automated Tests](#-running-automated-tests)
- [Deployment Guide](#-deployment-guide)
- [5–10 Minute Walkthrough Guide](#-510-minute-walkthrough-guide)

---

## 🌟 Key Features

1. **Multi-Alternative Route Generation**: Generates 3 distinct route corridors between any origin and destination worldwide (including major US interstate freight corridors and Indian national expressways like Delhi → Kanpur and Delhi → Lucknow).
2. **Deterministic Checkpoint Discretization**: Samples geographic checkpoints strictly every **10, 25, or 50 miles** along each route polyline.
3. **Accurate Timestamp ETAs**: Calculates arrival time ($T_{arr} = T_{dep} + \Delta t_i$) for every single checkpoint using cumulative segment distance and driving duration.
4. **ETA-Specific Weather Forecasting**: Fetches wind speed (mph), rain rate (in/hr), and snowfall rate (in/hr) matching the exact arrival hour at each checkpoint via **Open-Meteo**.
5. **Dynamic Load Weight Overrides**: Applies commercial trucking physics:
   - Wind $\ge 55\text{ mph}$ $\implies$ **No Travel** for any vehicle.
   - Wind $45\text{--}54\text{ mph}$ with Load Weight $> 30{,}000\text{ lbs}$ $\implies$ **No Travel**.
   - Wind $35\text{--}44\text{ mph}$ with Load Weight $> 40{,}000\text{ lbs}$ $\implies$ **Severe**.
6. **Multi-Criteria Route Ranking**: Automatically sorts and identifies the safest route using strict hierarchical safety prioritization.
7. **Enterprise Dispatch UI & Interactive Map**: High-contrast Positron navigation map with glowing recommended route, single-chain checkpoint hierarchy, floating HUDs, quick presets, and an interactive **0–48 hour forecast evolution scrubber**.
8. **Resilient Dual-Routing & Keyless Out-of-the-Box Operation**: Zero external API key dependencies required for immediate local testing, with optional **OpenRouteService (ORS)** API key support.

---

## 🏗️ System Architecture & Data Flow

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
  (OSM Nominatim / Coordinates)        (ORS / OSRM / Highway Alternatives)
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
         - Leaflet Map with glowing recommended route
         - Color-coded checkpoint markers (Green -> Black)
         - Checkpoint inspection modal with active overrides
         - 0–48 hr corridor weather heatmap slider
```

---

## ⚖️ Risk Assessment & Load Rules Engine

### 1. Base Weather Thresholds
| Condition | Low (1) | Moderate (2) | High (3) | Severe (4) | No Travel (5) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wind Speed** | $< 25\text{ mph}$ | $25\text{--}34\text{ mph}$ | $35\text{--}44\text{ mph}$ | $45\text{--}54\text{ mph}$ | $\ge 55\text{ mph}$ |
| **Rain Rate** | $< 0.10\text{ in/hr}$ | $0.10\text{--}0.25\text{ in/hr}$ | $0.25\text{--}0.50\text{ in/hr}$ | $0.50\text{--}1.00\text{ in/hr}$ | $> 1.00\text{ in/hr}$ |
| **Snowfall Rate** | $< 0.5\text{ in/hr}$ | $0.5\text{--}1.0\text{ in/hr}$ | $1.0\text{--}2.0\text{ in/hr}$ | $2.0\text{--}3.0\text{ in/hr}$ | $> 3.0\text{ in/hr}$ |

### 2. Vehicle Load Weight Overrides
- **Rule 1**: $\text{Wind} \ge 55\text{ mph} \implies \text{No Travel}$ (Regardless of load weight).
- **Rule 2**: $45\text{--}54\text{ mph Wind} + \text{Load Weight} > 30{,}000\text{ lbs} \implies \text{No Travel}$ (Elevates Severe wind to No Travel).
- **Rule 3**: $35\text{--}44\text{ mph Wind} + \text{Load Weight} > 40{,}000\text{ lbs} \implies \text{Severe}$ (Elevates High wind to Severe).

---

## 🏆 Multi-Criteria Route Recommendation Engine

The 3 alternative routes are strictly ranked using a lexicographical tuple key:
$$\text{Rank Tuple} = (\text{Severe Miles},\, \text{High Miles},\, \text{Average Numerical Risk},\, \text{Total Travel Time})$$

1. **Fewest Severe Miles**: Mitigates high-danger squalls and whiteout events.
2. **Fewest High Miles**: Minimizes moderate-to-severe hazard fatigue and hydroplaning risks.
3. **Lowest Average Numerical Risk**: Prefers calm atmospheric conditions.
4. **Shortest Travel Time**: Operational tie-breaker for commercial dispatch efficiency.

The top-ranked route is tagged as `is_recommended: true` and rendered with a distinct glowing emerald highlight on the map.

---

## 💻 Tech Stack

- **Backend**: Python 3.12, Django 6.x, Django REST Framework (DRF), django-cors-headers, geopy, shapely, requests.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Mapping**: Leaflet, React-Leaflet, CartoDB Dark Matter tiles.
- **Weather Provider**: Open-Meteo API (High limit, hourly forecasts, no API key required).
- **Testing**: Pytest, Pytest-Django.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── manage.py
│   ├── pytest.ini
│   ├── truck_weather_routing/     # Django configuration & settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── routing_app/               # Core routing application
│       ├── serializers.py         # DRF input/output validation
│       ├── views.py               # REST API endpoints
│       ├── urls.py
│       ├── services/
│       │   ├── risk_evaluator.py  # Condition thresholds & load rules engine
│       │   ├── routing_service.py # Polyline resampling & ETA interpolation
│       │   ├── weather_service.py # Batch Open-Meteo queries & caching
│       │   └── corridor_service.py# Bounding box & 0-48h heatmap grid
│       └── tests/
│           ├── test_risk_evaluator.py
│           └── test_views.py
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── App.tsx                # Main container & state management
│       ├── types/index.ts         # TypeScript definitions
│       ├── services/api.ts        # Backend REST API client
│       └── components/
│           ├── Sidebar.tsx        # Left navigation rail with brand & promo
│           ├── Header.tsx         # Panoramic truck banner with window tabs
│           ├── InputPanel.tsx     # Dispatch parameters form & preset controls
│           ├── RouteCard.tsx      # Alternative route summary cards with risk matrix
│           ├── RouteComparison.tsx# Side-by-side decision matrix
│           ├── MapView.tsx        # Leaflet interactive map with custom layers
│           ├── BottomActionBar.tsx# Sticky bottom summary bar with proceed action
│           ├── ForecastSlider.tsx # 0-48 hour interactive playback slider
│           ├── CheckpointModal.tsx# Telemetry popup with active overrides
│           └── RiskRulesDrawer.tsx# Risk rule specification guide
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup (Django DRF)
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers requests geopy shapely python-dotenv pytest pytest-django

# Run database migrations
python manage.py migrate

# (Optional) Copy environment template
cp .env.example .env

# Start development server
python manage.py runserver 127.0.0.1:8000
```
Backend API will be running at `http://127.0.0.1:8000/api/`.

### 2. Frontend Setup (React + Vite)
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📡 API Reference

### 1. Evaluate Routes
- **Endpoint**: `POST /api/routes/evaluate/`
- **Request Body**:
```json
{
  "origin": "Chicago, IL",
  "destination": "Dallas, TX",
  "departure_time": "2026-11-08T08:00:00Z",
  "load_weight": 34000.0,
  "step_miles": 25,
  "ors_api_key": ""
}
```
- **Response**:
```json
{
  "status": "success",
  "origin": { "name": "Chicago, IL", "lat": 41.8781, "lon": -87.6298 },
  "destination": { "name": "Dallas, TX", "lat": 32.7767, "lon": -96.7970 },
  "routes": [
    {
      "id": "route_option_1",
      "name": "Northern Bypass Corridor",
      "rank": 1,
      "is_recommended": true,
      "distance_miles": 920.4,
      "duration_hours": 15.8,
      "summary": {
        "severe_miles": 0.0,
        "high_miles": 25.0,
        "average_risk": 1.8,
        "total_distance_miles": 920.4,
        "total_duration_seconds": 56880
      },
      "checkpoints": [
        {
          "index": 0,
          "mile_marker": 0.0,
          "lat": 41.8781,
          "lon": -87.6298,
          "eta_iso": "2026-11-08T08:00:00Z",
          "eta_formatted": "Nov 08, 08:00 AM",
          "weather": { "wind_mph": 18.2, "rain_in_per_hr": 0.02, "snow_in_per_hr": 0.0 },
          "final_level": "Low",
          "final_score": 1,
          "active_overrides": []
        }
      ]
    }
  ],
  "corridor": { "forecast_hour": 0, "points": [...] }
}
```

### 2. Corridor Forecast Evolution
- **Endpoint**: `POST /api/corridor/heatmap/`
- **Request Body**:
```json
{
  "routes_coordinates": [...],
  "departure_time": "2026-11-08T08:00:00Z",
  "forecast_hour": 18
}
```

---

## 🧪 Running Automated Tests

Run the full pytest suite in the `backend/` directory:
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest -v
```
All unit tests verify:
- Wind thresholds (<25, 25–34, 35–44, 45–54, $\ge$55)
- Rain thresholds (<0.10, 0.10–0.25, 0.25–0.50, 0.50–1.00, >1.00)
- Snow thresholds (<0.5, 0.5–1.0, 1.0–2.0, 2.0–3.0, >3.0)
- Load override 1: Wind $\ge 55\text{ mph} \implies \text{No Travel}$
- Load override 2: Wind 45–54 mph + Weight $> 30{,}000\text{ lbs} \implies \text{No Travel}$
- Load override 3: Wind 35–44 mph + Weight $> 40{,}000\text{ lbs} \implies \text{Severe}$
- Lexicographical route ranking order
- API endpoints & response schema validation

---

## 🎥 5–10 Minute Walkthrough Guide

When recording your assessment walkthrough, follow this structured outline:

1. **Introduction & Assessment Overview (1 min)**:
   - Introduce the commercial logistics problem: unexpected weather hazards cause dangerous crosswind rollovers and jackknifing.
   - Walk through the core tech stack: Django REST Framework backend with Leaflet + React on the frontend.
2. **User Inputs & Parameters (1.5 min)**:
   - Demonstrate entering Origin and Destination (with geocoding support and swap button).
   - Point out the Departure Date/Time picker and Load Weight input.
   - Highlight the **Sampling Interval selector (10, 25, 50 miles)** and explain how it alters checkpoint density.
3. **Route Generation & Weather Evaluation Logic (2.5 min)**:
   - Demonstrate the 3 alternative routes generated on the map.
   - Click on checkpoints along the routes to display the **Telemetry Modal / Tooltip**:
     * Show Mile marker, calculated arrival ETA ($T_{arr} = T_{dep} + \Delta t_i$).
     * Show Wind speed (mph), Rain rate (in/hr), Snow rate (in/hr).
     * Demonstrate active **Load Rule Adjustments** (e.g. 48 mph wind triggering No Travel when weight $> 30{,}000\text{ lbs}$).
4. **Recommendation Engine & Multi-Criteria Ranking (2 min)**:
   - Review the **Alternative Routes Decision Matrix**:
     * Point out the lexicographical ranking: Fewest Severe miles $\to$ Fewest High miles $\to$ Lowest average risk $\to$ Shortest travel time.
     * Show how the top route receives the emerald **"Recommended"** badge and glowing highlight.
5. **Interactive Weather Corridor Heatmap & 0–48 Hour Slider (1.5 min)**:
   - Toggle the Weather Heatmap layer.
   - Drag and play the **0–48 hour forecast slider** to demonstrate how weather systems and fronts evolve along the trip corridor over time.
6. **Code Architecture & Security (1 min)**:
   - Highlight clean modular services (`risk_evaluator.py`, `routing_service.py`, `weather_service.py`).
   - Mention API key protection (keys never exposed to frontend), rate-limiting resilience, and caching.

---

## 📄 License
MIT License. Created for the Weather-Aware Truck Routing Assessment.
