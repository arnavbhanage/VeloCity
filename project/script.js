// ===== CONFIG =====
const DIRECTIONS = ["north", "south", "east", "west"];
let activeChart = "avg_wait_time";

// ===== ELEMENTS =====
const form = document.getElementById("simForm");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const resultsDiv = document.getElementById("results");

// ===== BUILD FORM =====
function buildForm() {
  form.innerHTML = `
    <h2>Simulation parameters</h2>

    ${DIRECTIONS.map(dir => `
      <label>${dir}</label>
      <input type="number" name="${dir}" value="20" required />
    `).join("")}

    <label>Time Steps</label>
    <input type="number" name="time_steps" value="24" required />

    <button type="submit">Run Simulation</button>
  `;
}

buildForm();

// ===== FORM SUBMIT =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(form).entries());

  loader.style.display = "block";
  errorBox.style.display = "none";
  resultsDiv.style.display = "none";

  try {
    const res = await fetch("http://127.0.0.1:5000/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Simulation failed");

    renderResults(data);

  } catch (err) {
    console.error(err);
    errorBox.innerText = err.message;
    errorBox.style.display = "block";
  } finally {
    loader.style.display = "none";
  }
});

// ===== RENDER RESULTS =====
function renderResults(result) {
  // store globally (FIXED)
  window.lastResult = result;

  // safety check
  if (!result || !result.charts) {
    console.error("Invalid result:", result);
    resultsDiv.innerHTML = "<p>Error: Invalid data from backend</p>";
    resultsDiv.style.display = "block";
    return;
  }

  activeChart = "avg_wait_time";

  resultsDiv.style.display = "block";

  resultsDiv.innerHTML = `
    <h2>Results</h2>

    <div><b>Best Wait:</b> ${bestWait(result.optimized.avg_wait_time)}</div>
    <div><b>Improvement:</b> ${improvement(result)}</div>
    <div><b>Alerts:</b> ${result.optimized.alerts.length}</div>
    <div><b>Peak Queue:</b> ${Math.max(...Object.values(result.optimized.peak_queue))}</div>

    <h3>Charts</h3>

    <div>
      ${Object.keys(result.charts).map(key => `
        <button onclick="switchChart('${key}')">${key}</button>
      `).join("")}
    </div>

    <div>
      <img id="chartImg" src="data:image/png;base64,${result.charts[activeChart]}" />
    </div>
  `;
}

// ===== SWITCH CHART =====
function switchChart(key) {
  if (!window.lastResult || !window.lastResult.charts[key]) {
    console.error("Chart missing:", key);
    return;
  }

  activeChart = key;

  const img = document.getElementById("chartImg");
  if (img) {
    img.src = `data:image/png;base64,${window.lastResult.charts[key]}`;
  }
}

// ===== HELPERS =====
function bestWait(obj) {
  if (!obj) return "—";
  const max = Math.max(...Object.values(obj));
  return max.toFixed(2) + "h";
}

function improvement(result) {
  if (!result) return "—";

  const base = avg(Object.values(result.baseline.avg_wait_time));
  const opt = avg(Object.values(result.optimized.avg_wait_time));

  if (base === 0) return "—";

  const pct = ((base - opt) / base) * 100;
  return (pct >= 0 ? "-" : "+") + Math.abs(pct).toFixed(0) + "%";
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}