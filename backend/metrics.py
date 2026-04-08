import numpy as np
from simulation import DIRECTIONS, run_simulation, compare_strategies


def avg_wait_time(result):
    return dict(zip(DIRECTIONS, result["wait_times"].mean(axis=0).round(2)))


def avg_throughput(result):
    return dict(zip(DIRECTIONS, result["throughput"].mean(axis=0).round(2)))


def peak_queue(result):
    return dict(zip(DIRECTIONS, result["queues"].max(axis=0).astype(int)))


def avg_congestion(result):
    return dict(zip(DIRECTIONS, result["queues"].mean(axis=0).round(2)))


def congestion_alerts(result):
    return result["alerts"]


def throughput_over_time(result):
    return {
        "hours": list(range(result["time_steps"])),
        "data": {
            d: result["throughput"][:, i].tolist()
            for i, d in enumerate(DIRECTIONS)
        }
    }


def queue_trends(result):
    return {
        "hours": list(range(result["time_steps"])),
        "data": {
            d: result["queues"][:, i].tolist()
            for i, d in enumerate(DIRECTIONS)
        }
    }


def compute_all(result):
    return {
        "strategy":           result["strategy"],
        "avg_wait_time":      avg_wait_time(result),
        "avg_throughput":     avg_throughput(result),
        "peak_queue":         peak_queue(result),
        "avg_congestion":     avg_congestion(result),
        "alerts":             congestion_alerts(result),
        "throughput_over_time": throughput_over_time(result),
        "queue_trends":       queue_trends(result),
    }


def compare_metrics(extra_arrivals=None, time_steps=24, seed=42):
    results = compare_strategies(extra_arrivals, time_steps=time_steps, seed=seed)
    return {
        "baseline":  compute_all(results["baseline"]),  
        "optimized": compute_all(results["optimized"]),
    }


if __name__ == "__main__":
    arrivals = {"north": 30, "south": 25, "east": 20, "west": 35}
    metrics  = compare_metrics(extra_arrivals=arrivals)

    for strategy, m in metrics.items():
        print(f"\n{'═' * 45}")
        print(f"  {strategy.upper()}")
        print(f"{'═' * 45}")
        print(f"  Avg wait time  : {m['avg_wait_time']}")
        print(f"  Avg throughput : {m['avg_throughput']}")
        print(f"  Peak queue     : {m['peak_queue']}")
        print(f"  Avg congestion : {m['avg_congestion']}")
        print(f"  Alerts         : {len(m['alerts'])}")
        for a in m["alerts"][:5]:
            print(f"    hour {a['hour']:>2}  {a['direction']:<6}  queue={a['queue_length']}")