// ===== CONFIG =====
const DIRECTIONS = ["north", "south", "east", "west"];
let activeChart = "avg_wait_time";

// ===== ELEMENTS =====
const form = document.getElementById("simForm");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const resultsDiv = document.getElementById("results");

// ===== BUILD FORM (Updated with shadcn CSS classes) =====
function buildForm() {
  form.innerHTML = `
    <div class="space-y-1.5">
      <h2 class="font-semibold leading-none tracking-tight text-xl">Simulation parameters</h2>
      <p class="text-sm text-muted-foreground">Adjust traffic volume and simulation duration.</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
      ${DIRECTIONS.map(dir => `
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none capitalize">${dir}</label>
          <input type="number" name="${dir}" value="20" required 
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
        </div>
      `).join("")}
    </div>

    <div class="space-y-2 pt-2 border-t border-border mt-6">
      <label class="text-sm font-medium leading-none">Time Steps</label>
      <input type="number" name="time_steps" value="24" required 
        class="flex h-10 w-full sm:w-1/4 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
    </div>

    <button type="submit" 
      class="inline-flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 mt-4">
      Run Simulation
    </button>
  `;
}

buildForm();

// ===== FORM SUBMIT =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = Object.fromEntries(new FormData(form).entries());

  loader.style.display = "flex"; // Changed from block to flex for tailwind centering
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

// ===== RENDER RESULTS (Updated with shadcn CSS classes) =====
function renderResults(result) {
  window.lastResult = result;

  if (!result || !result.charts) {
    console.error("Invalid result:", result);
    resultsDiv.innerHTML = "<p class='text-destructive'>Error: Invalid data from backend</p>";
    resultsDiv.style.display = "block";
    return;
  }

  activeChart = "avg_wait_time";
  resultsDiv.style.display = "block";

  resultsDiv.innerHTML = `
    <h2 class="font-semibold tracking-tight text-2xl mb-4">Results Overview</h2>
    
    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p class="text-sm font-medium text-muted-foreground">Best Wait</p>
        <p class="text-2xl font-bold mt-1">${bestWait(result.optimized.avg_wait_time)}</p>
      </div>
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p class="text-sm font-medium text-muted-foreground">Improvement</p>
        <p class="text-2xl font-bold mt-1 text-emerald-400">${improvement(result)}</p>
      </div>
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p class="text-sm font-medium text-muted-foreground">Alerts</p>
        <p class="text-2xl font-bold mt-1 text-amber-400">${result.optimized.alerts.length}</p>
      </div>
      <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p class="text-sm font-medium text-muted-foreground">Peak Queue</p>
        <p class="text-2xl font-bold mt-1">${Math.max(...Object.values(result.optimized.peak_queue))}</p>
      </div>
    </div>

    <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm mt-6">
      <div class="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 class="font-semibold text-lg">Metrics Chart</h3>
        <div class="flex flex-wrap gap-2">
          ${Object.keys(result.charts).map(key => `
            <button onclick="switchChart('${key}')" 
              class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
              ${key.replace(/_/g, ' ')}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="p-6 flex justify-center bg-zinc-950/50 rounded-b-xl">
        <img id="chartImg" class="max-h-[400px] w-auto object-contain rounded-md" src="data:image/png;base64,${result.charts[activeChart]}" />
      </div>
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

// ===== HELPERS (Completely untouched) =====
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