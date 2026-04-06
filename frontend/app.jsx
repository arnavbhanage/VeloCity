import { useState } from "react"
import SimForm from "./SimForm"

const CHART_META = [
  { key: "avg_wait_time",        label: "Avg wait time" },
  { key: "congestion_levels",    label: "Congestion levels" },
  { key: "throughput_over_time", label: "Throughput over time" },
  { key: "queue_trends",         label: "Queue trends" },
]

export default function App() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [active,  setActive]  = useState("avg_wait_time")

  async function handleRun(formData) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("http://localhost:5000/run", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Simulation failed.")
      setResult(data)
      setActive("avg_wait_time")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon" />
            <span className="logo-text">TrafficSim</span>
          </div>
          <p className="tagline">Roundabout flow analysis</p>
        </div>
      </header>

      <main>
        <section className="form-section">
          <SimForm onRun={handleRun} loading={loading} />
        </section>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading && (
          <div className="loader-wrap">
            <div className="spinner" />
            <p>Running simulation…</p>
          </div>
        )}

        {result && (
          <section className="results">
            <div className="metrics-grid">
              <MetricCard
                label="Best wait time"
                value={bestWait(result.optimized.avg_wait_time)}
                sub="optimized · worst direction"
              />
              <MetricCard
                label="Improvement"
                value={improvement(result)}
                sub="avg wait vs baseline"
                highlight
              />
              <MetricCard
                label="Congestion alerts"
                value={result.optimized.alerts.length}
                sub="queue > 20 vehicles"
              />
              <MetricCard
                label="Peak queue"
                value={Math.max(...Object.values(result.optimized.peak_queue))}
                sub="optimized · max across directions"
              />
            </div>

            {result.optimized.alerts.length > 0 && (
              <div className="alert-list">
                <h3 className="section-label">Congestion alerts</h3>
                <div className="alerts">
                  {result.optimized.alerts.map((a, i) => (
                    <div key={i} className="alert-chip">
                      <span className="alert-dir">{a.direction}</span>
                      <span>hour {a.hour}</span>
                      <span className="alert-q">{a.queue_length} vehicles</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="charts-section">
              <h3 className="section-label">Charts</h3>
              <div className="chart-tabs">
                {CHART_META.map(c => (
                  <button
                    key={c.key}
                    className={`tab ${active === c.key ? "tab-active" : ""}`}
                    onClick={() => setActive(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="chart-display">
                <img
                  src={`data:image/png;base64,${result.charts[active]}`}
                  alt={active}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #0b0f1a;
          --surface:  #131929;
          --border:   #1e2d45;
          --accent:   #3b82f6;
          --accent2:  #10b981;
          --warn:     #f59e0b;
          --danger:   #ef4444;
          --text:     #e2e8f0;
          --muted:    #64748b;
          --font:     'DM Sans', sans-serif;
          --mono:     'DM Mono', monospace;
          --radius:   10px;
        }

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        body { background: var(--bg); color: var(--text); font-family: var(--font); }

        .app { min-height: 100vh; display: flex; flex-direction: column; }

        header {
          border-bottom: 1px solid var(--border);
          padding: 0 2rem;
          background: var(--surface);
        }
        .header-inner {
          max-width: 960px;
          margin: 0 auto;
          padding: 1.2rem 0;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .logo { display: flex; align-items: center; gap: 0.6rem; }
        .logo-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2.5px solid var(--accent);
          position: relative;
        }
        .logo-icon::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 8px; height: 8px;
          background: var(--accent);
          border-radius: 50%;
        }
        .logo-text { font-size: 1.1rem; font-weight: 600; letter-spacing: -0.02em; }
        .tagline { color: var(--muted); font-size: 0.85rem; }

        main {
          max-width: 960px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
          width: 100%;
          flex: 1;
        }

        .form-section { margin-bottom: 2rem; }

        .error-banner {
          background: #2d1515;
          border: 1px solid var(--danger);
          color: #fca5a5;
          padding: 0.9rem 1.2rem;
          border-radius: var(--radius);
          margin-bottom: 2rem;
          font-size: 0.9rem;
        }

        .loader-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 700px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .metric-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.2rem 1rem;
        }
        .metric-card.highlight { border-color: var(--accent2); }
        .metric-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
        .metric-value { font-family: var(--mono); font-size: 1.8rem; font-weight: 500; line-height: 1; margin-bottom: 0.3rem; }
        .metric-card.highlight .metric-value { color: var(--accent2); }
        .metric-sub { font-size: 0.75rem; color: var(--muted); }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin-bottom: 0.8rem;
        }

        .alert-list { margin-bottom: 2rem; }
        .alerts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .alert-chip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #1f1208;
          border: 1px solid #78350f;
          border-radius: 6px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-family: var(--mono);
        }
        .alert-dir { color: var(--warn); font-weight: 500; text-transform: capitalize; }
        .alert-q { color: var(--danger); }

        .charts-section { }
        .chart-tabs {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .tab {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.4rem 0.9rem;
          border-radius: 6px;
          font-size: 0.82rem;
          font-family: var(--font);
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab:hover { border-color: var(--accent); color: var(--text); }
        .tab-active { border-color: var(--accent); color: var(--accent); background: #0f1f3d; }

        .chart-display {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          text-align: center;
        }
        .chart-display img { max-width: 100%; border-radius: 6px; }
      `}</style>
    </div>
  )
}

function MetricCard({ label, value, sub, highlight }) {
  return (
    <div className={`metric-card ${highlight ? "highlight" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  )
}

function bestWait(waitObj) {
  const max = Math.max(...Object.values(waitObj))
  return max.toFixed(2) + "h"
}

function improvement(result) {
  const baseAvg = avg(Object.values(result.baseline.avg_wait_time))
  const optAvg  = avg(Object.values(result.optimized.avg_wait_time))
  if (baseAvg === 0) return "—"
  const pct = ((baseAvg - optAvg) / baseAvg) * 100
  return (pct >= 0 ? "−" : "+") + Math.abs(pct).toFixed(0) + "%"
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}