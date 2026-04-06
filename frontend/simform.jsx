import { useState } from "react"

const DIRECTIONS = ["north", "south", "east", "west"]

const DEFAULTS = {
  north:      30,
  south:      25,
  east:       20,
  west:       35,
  time_steps: 24,
}

export default function SimForm({ onRun, loading }) {
  const [values, setValues] = useState(DEFAULTS)

  function handleChange(e) {
    const { name, value } = e.target
    setValues(v => ({ ...v, [name]: value === "" ? "" : Number(value) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onRun(values)
  }

  return (
    <form onSubmit={handleSubmit} className="sim-form">
      <div className="form-header">
        <h2 className="form-title">Simulation parameters</h2>
        <p className="form-sub">Set incoming vehicle counts per direction</p>
      </div>

      <div className="direction-grid">
        {DIRECTIONS.map(dir => (
          <div key={dir} className="direction-card">
            <div className="dir-compass">
              <CompassIcon direction={dir} />
            </div>
            <label className="dir-label" htmlFor={dir}>
              {dir.charAt(0).toUpperCase() + dir.slice(1)}
            </label>
            <input
              id={dir}
              name={dir}
              type="number"
              min="0"
              max="999"
              value={values[dir]}
              onChange={handleChange}
              className="dir-input"
              required
            />
            <span className="dir-unit">vehicles</span>
          </div>
        ))}
      </div>

      <div className="options-row">
        <div className="option-field">
          <label htmlFor="time_steps" className="option-label">
            Time steps
          </label>
          <p className="option-hint">Hours to simulate (1–168)</p>
          <input
            id="time_steps"
            name="time_steps"
            type="number"
            min="1"
            max="168"
            value={values.time_steps}
            onChange={handleChange}
            className="option-input"
            required
          />
        </div>

        <div className="option-field">
          <label className="option-label">Strategies</label>
          <p className="option-hint">Both run automatically</p>
          <div className="strategy-pills">
            <span className="pill pill-active">Baseline</span>
            <span className="pill pill-active">Optimized</span>
          </div>
        </div>
      </div>

      <button type="submit" className="run-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="btn-spinner" />
            Running…
          </>
        ) : (
          <>
            <span className="btn-icon">▶</span>
            Run simulation
          </>
        )}
      </button>

      <style>{`
        .sim-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.8rem;
        }

        .form-header { margin-bottom: 1.6rem; }
        .form-title  { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
        .form-sub    { font-size: 0.82rem; color: var(--muted); }

        .direction-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.4rem;
        }
        @media (max-width: 600px) {
          .direction-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .direction-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
          transition: border-color 0.15s;
        }
        .direction-card:focus-within { border-color: var(--accent); }

        .dir-compass { margin-bottom: 0.1rem; }

        .dir-label {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--muted);
          font-weight: 500;
        }

        .dir-input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 1.3rem;
          font-weight: 500;
          text-align: center;
          padding: 0.4rem 0.5rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .dir-input:focus { border-color: var(--accent); }
        .dir-input::-webkit-inner-spin-button,
        .dir-input::-webkit-outer-spin-button { opacity: 0.3; }

        .dir-unit { font-size: 0.72rem; color: var(--muted); }

        .options-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.6rem;
          flex-wrap: wrap;
        }

        .option-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .option-label { font-size: 0.82rem; font-weight: 500; }
        .option-hint  { font-size: 0.75rem; color: var(--muted); }

        .option-input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 1rem;
          padding: 0.45rem 0.75rem;
          width: 110px;
          outline: none;
          transition: border-color 0.15s;
        }
        .option-input:focus { border-color: var(--accent); }

        .strategy-pills { display: flex; gap: 0.4rem; margin-top: 0.2rem; }
        .pill {
          font-size: 0.75rem;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          color: var(--muted);
        }
        .pill-active {
          border-color: var(--accent2);
          color: var(--accent2);
          background: #071f14;
        }

        .run-btn {
          width: 100%;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--radius);
          font-family: var(--font);
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: opacity 0.15s, transform 0.1s;
        }
        .run-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .run-btn:active:not(:disabled) { transform: translateY(0); }
        .run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-icon { font-size: 0.75rem; }

        .btn-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  )
}

function CompassIcon({ direction }) {
  const arrows = { north: "↑", south: "↓", east: "→", west: "←" }
  const colors  = { north: "#378ADD", south: "#1D9E75", east: "#D85A30", west: "#7F77DD" }
  return (
    <span style={{
      fontSize:   "1.3rem",
      color:      colors[direction],
      lineHeight: 1,
    }}>
      {arrows[direction]}
    </span>
  )
}