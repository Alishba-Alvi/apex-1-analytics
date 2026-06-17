# Apex 1 Analytics

F1 telemetry dashboard using real FastF1 data.

## Setup

1. Clone the repo
2. Install dependencies:
   pip install -r requirements.txt
3. Run:
   py main.py
4. Open browser at http://127.0.0.1:8000

## Features

- Real F1 telemetry data via FastF1
- Tyre degradation analysis
- Driver comparison overlays
- K-Means ML clustering on car data
- Pit stop probability engine
- Race trace gap-to-leader chart
- Spatial track map visualization

## Notes

- First load of any session takes 30-90 seconds (downloads telemetry data)
- Subsequent loads are instant (cached locally)
- Supports 2024 and 2025 seasons

## Tech Stack

- Backend: FastAPI + FastF1
- Frontend: HTML, Tailwind CSS, Chart.js
- ML: Scikit-learn (KMeans, RandomForest)

## Demo
https://github.com/Alishba-Alvi/apex-1-analytics/blob/main/demo.mp4
