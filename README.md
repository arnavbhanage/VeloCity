# Adaptive Traffic Flow Simulation

A simulation-based traffic flow system that models vehicle movement at a roundabout intersection. Built with Python and NumPy, with a React frontend for interactive input and result visualization.

---

## Features

- Grid-based roundabout simulation with four incoming directions (North, South, East, West)
- Time-step simulation with day/night traffic pattern switching
- Vehicle classification: personal (higher priority) vs commercial (lower priority)
- Congestion detection and queue monitoring — alerts when any direction exceeds 20 vehicles
- Strategy comparison: baseline (equal priority) vs optimized (personal vehicle priority)
- Performance metrics: average wait time, throughput, congestion level, queue length trends

---

## Project Structure

```
traffic-sim/
├── backend/
│   ├── simulation.py      # NumPy traffic model and time-step loop
│   ├── metrics.py         # Wait time, throughput, and congestion calculations
│   ├── visualizer.py      # Matplotlib chart generation
│   └── app.py             # Flask API — exposes /run endpoint
├── frontend/
│   └── src/
│       ├── App.jsx         # Main React component
│       └── SimForm.jsx     # Input controls and run button
├── database/
│   └── init_db.py         # SQLite setup — creates users table
├── requirements.txt
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

### Backend setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will start at `http://localhost:5000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Database setup (optional)

```bash
cd database
python init_db.py
```

---

## Running the simulation (CLI)

You can run the simulation directly without the frontend:

```bash
cd backend
python simulation.py
```

This will run both the baseline and optimized strategies, print metrics to the terminal, and save chart images to `backend/output/`.

---

## API

### `POST /run`

Runs the simulation with the provided parameters and returns performance metrics.

**Request body:**
```json
{
  "north": 30,
  "south": 25,
  "east": 20,
  "west": 35,
  "time_steps": 24,
  "strategy": "optimized"
}
```

**Response:**
```json
{
  "avg_wait_time": { "north": 4.2, "south": 3.8, "east": 2.1, "west": 5.0 },
  "throughput": [12, 14, 13, 15],
  "congestion_levels": { "north": 0.6, "south": 0.4, "east": 0.3, "west": 0.7 },
  "alerts": [
    { "time": 7, "direction": "west", "queue_length": 22 }
  ]
}
```

---

## Configuration

Key parameters can be adjusted in `simulation.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `TIME_STEPS` | 24 | Simulation duration (hours) |
| `DAY_START` | 6 | Hour when daytime pattern begins |
| `NIGHT_START` | 20 | Hour when nighttime pattern begins |
| `QUEUE_ALERT_THRESHOLD` | 20 | Queue length that triggers a congestion alert |
| `PERSONAL_VEHICLE_PRIORITY` | 1.5 | Priority multiplier for personal vehicles |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Simulation | Python, NumPy |
| Visualization | Matplotlib |
| API | Flask |
| Frontend | React, HTML/CSS |
| Database | SQLite |

---

## Future Enhancements

- Adaptive traffic signals that respond to live queue lengths
- Machine learning-based traffic volume prediction
- Integration with real-world traffic datasets
- Multi-intersection simulation support