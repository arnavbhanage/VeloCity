import numpy as np
DIRECTIONS = ["north", "south", "east", "west"]
DIR_INDEX  = {d: i for i, d in enumerate(DIRECTIONS)}

TIME_STEPS              = 24   # hours in one simulation run
DAY_START               = 6    # hour daytime pattern begins
NIGHT_START             = 20   # hour nighttime pattern begins
QUEUE_ALERT_THRESHOLD   = 20   # vehicles — triggers a congestion alert
ROUNDABOUT_CAPACITY     = 8    # max vehicles that can move through per step
PERSONAL_PRIORITY_MULT  = 1.5  # throughput multiplier for optimized strategy

BASE_ARRIVAL_RATES = np.array([
    [[8, 2], [3, 5]],   
    [[7, 2], [2, 4]],   
    [[6, 1], [2, 3]],   
    [[9, 2], [4, 6]],   
], dtype=float)


def run_simulation(
    extra_arrivals: dict | None = None,
    strategy: str = "baseline",
    time_steps: int = TIME_STEPS,
    seed: int = 42,
):
    rng = np.random.default_rng(seed)

    queues       = np.zeros((time_steps, 4),    dtype=float)
    vtype_queues = np.zeros((time_steps, 4, 2), dtype=float)
    throughput   = np.zeros((time_steps, 4),    dtype=float)
    wait_times   = np.zeros((time_steps, 4),    dtype=float)
    alerts       = []
    current_queue = np.zeros((4, 2), dtype=float) 

    for t in range(time_steps):
        hour        = t % 24
        time_period = 0 if DAY_START <= hour < NIGHT_START else 1

        arrival_rates = BASE_ARRIVAL_RATES[:, :, time_period].copy()

        if extra_arrivals:
            for dir_name, total in extra_arrivals.items():
                d = DIR_INDEX[dir_name]
                current_rate_sum = arrival_rates[d].sum() * time_steps
                if current_rate_sum > 0:
                    scale = total / current_rate_sum
                    arrival_rates[d] *= scale

        arrivals = rng.poisson(arrival_rates) 
        current_queue += arrivals


        capacity_per_dir = ROUNDABOUT_CAPACITY / 4

        for d in range(4):
            personal   = current_queue[d, 0]
            commercial = current_queue[d, 1]
            total_waiting = personal + commercial

            if total_waiting == 0:
                continue

            if strategy == "optimized" and total_waiting > 0:
                
                personal_capacity   = min(personal,   capacity_per_dir * PERSONAL_PRIORITY_MULT)
                remaining_capacity  = max(0, capacity_per_dir - personal_capacity)
                commercial_capacity = min(commercial, remaining_capacity)
            else:
                ratio = personal / total_waiting if total_waiting > 0 else 0.5
                personal_capacity   = min(personal,   capacity_per_dir * ratio)
                commercial_capacity = min(commercial, capacity_per_dir * (1 - ratio))

            cleared_personal   = np.floor(personal_capacity)
            cleared_commercial = np.floor(commercial_capacity)

            current_queue[d, 0] -= cleared_personal
            current_queue[d, 1] -= cleared_commercial
            current_queue[d]     = np.maximum(current_queue[d], 0)  

            throughput[t, d] = cleared_personal + cleared_commercial
        queues[t]       = current_queue.sum(axis=1)      
        vtype_queues[t] = current_queue.copy()

        arrival_totals = arrivals.sum(axis=1).astype(float)
        arrival_totals = np.where(arrival_totals == 0, 1, arrival_totals)
        wait_times[t]  = queues[t] / arrival_totals

        for d, dir_name in enumerate(DIRECTIONS):
            if queues[t, d] > QUEUE_ALERT_THRESHOLD:
                alerts.append({
                    "hour":         t,
                    "direction":    dir_name,
                    "queue_length": int(queues[t, d]),
                })

    return {
        "queues":        queues,
        "wait_times":    wait_times,
        "throughput":    throughput,
        "vehicle_types": vtype_queues,
        "alerts":        alerts,
        "strategy":      strategy,
        "time_steps":    time_steps,
    }


def compare_strategies(extra_arrivals=None, time_steps=TIME_STEPS, seed=42):
    baseline  = run_simulation(extra_arrivals, strategy="baseline",  time_steps=time_steps, seed=seed)
    optimized = run_simulation(extra_arrivals, strategy="optimized", time_steps=time_steps, seed=seed)
    return {"baseline": baseline, "optimized": optimized}

def summarise(result: dict) -> dict:
    return {
        "strategy":          result["strategy"],
        "avg_wait_per_dir":  dict(zip(DIRECTIONS, result["wait_times"].mean(axis=0).round(2))),
        "avg_throughput":    dict(zip(DIRECTIONS, result["throughput"].mean(axis=0).round(2))),
        "peak_queue":        dict(zip(DIRECTIONS, result["queues"].max(axis=0).astype(int))),
        "avg_congestion":    dict(zip(DIRECTIONS, result["queues"].mean(axis=0).round(2))),
        "total_alerts":      len(result["alerts"]),
        "alerts":            result["alerts"],
    }
if __name__ == "__main__":
    print("Running traffic simulation...\n")

    results = compare_strategies(
        extra_arrivals={"north": 30, "south": 25, "east": 20, "west": 35},
    )

    for strategy_name, result in results.items():
        s = summarise(result)
        print(f"{'═' * 50}")
        print(f"  Strategy : {s['strategy'].upper()}")
        print(f"{'═' * 50}")
        print(f"  Avg wait time (hrs) : {s['avg_wait_per_dir']}")
        print(f"  Avg throughput      : {s['avg_throughput']}")
        print(f"  Peak queue length   : {s['peak_queue']}")
        print(f"  Avg congestion      : {s['avg_congestion']}")
        print(f"  Congestion alerts   : {s['total_alerts']}")
        if s["alerts"]:
            print(f"  Alert details:")
            for a in s["alerts"][:5]:
                print(f"    hour {a['hour']:>2}  {a['direction']:<6}  queue={a['queue_length']}")
            if len(s["alerts"]) > 5:
                print(f"    ... and {len(s['alerts']) - 5} more")
            print()
