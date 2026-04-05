import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from metrics import compare_metrics

OUTPUT_DIR = "output"
DIRECTIONS = ["north", "south", "east", "west"]
COLORS     = ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD"]


def _setup():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    plt.rcParams.update({
        "figure.facecolor":  "white",
        "axes.facecolor":    "white",
        "axes.grid":         True,
        "grid.alpha":        0.3,
        "axes.spines.top":   False,
        "axes.spines.right": False,
        "font.size":         11,
    })


def _save(name):
    path = os.path.join(OUTPUT_DIR, name)
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  saved → {path}")
    return path


def plot_avg_wait_time(metrics):
    fig, ax = plt.subplots(figsize=(7, 4))

    x      = np.arange(len(DIRECTIONS))
    width  = 0.35
    base   = [metrics["baseline"]["avg_wait_time"][d]  for d in DIRECTIONS]
    opt    = [metrics["optimized"]["avg_wait_time"][d] for d in DIRECTIONS]

    ax.bar(x - width / 2, base, width, label="Baseline",  color="#B4B2A9")
    ax.bar(x + width / 2, opt,  width, label="Optimized", color="#378ADD")

    ax.set_title("Average wait time per direction")
    ax.set_ylabel("Hours")
    ax.set_xticks(x)
    ax.set_xticklabels([d.capitalize() for d in DIRECTIONS])
    ax.legend()

    return _save("avg_wait_time.png")


def plot_throughput_over_time(metrics):
    fig, axes = plt.subplots(1, 2, figsize=(13, 4), sharey=True)

    for ax, strategy in zip(axes, ["baseline", "optimized"]):
        data  = metrics[strategy]["throughput_over_time"]
        hours = data["hours"]
        for i, d in enumerate(DIRECTIONS):
            ax.plot(hours, data["data"][d], label=d.capitalize(), color=COLORS[i], linewidth=1.8)
        ax.set_title(f"Throughput over time — {strategy.capitalize()}")
        ax.set_xlabel("Hour")
        ax.set_ylabel("Vehicles cleared")
        ax.xaxis.set_major_locator(ticker.MultipleLocator(4))
        ax.legend(fontsize=9)

    plt.tight_layout()
    return _save("throughput_over_time.png")


def plot_congestion_levels(metrics):
    fig, ax = plt.subplots(figsize=(7, 4))

    x      = np.arange(len(DIRECTIONS))
    width  = 0.35
    base   = [metrics["baseline"]["avg_congestion"][d]  for d in DIRECTIONS]
    opt    = [metrics["optimized"]["avg_congestion"][d] for d in DIRECTIONS]

    ax.bar(x - width / 2, base, width, label="Baseline",  color="#B4B2A9")
    ax.bar(x + width / 2, opt,  width, label="Optimized", color="#1D9E75")

    ax.set_title("Average congestion level per direction")
    ax.set_ylabel("Avg vehicles in queue")
    ax.set_xticks(x)
    ax.set_xticklabels([d.capitalize() for d in DIRECTIONS])
    ax.legend()

    return _save("congestion_levels.png")


def plot_queue_trends(metrics):
    fig, axes = plt.subplots(1, 2, figsize=(13, 4), sharey=True)

    for ax, strategy in zip(axes, ["baseline", "optimized"]):
        data  = metrics[strategy]["queue_trends"]
        hours = data["hours"]
        for i, d in enumerate(DIRECTIONS):
            ax.plot(hours, data["data"][d], label=d.capitalize(), color=COLORS[i], linewidth=1.8)

        alert_hours = [a["hour"] for a in metrics[strategy]["alerts"]]
        if alert_hours:
            ax.vlines(alert_hours, 0, ax.get_ylim()[1], colors="#E24B4A", linewidth=1,
                      linestyle="--", label="Alert (queue > 20)")

        ax.axhline(y=20, color="#E24B4A", linewidth=1, linestyle=":", alpha=0.6)
        ax.set_title(f"Queue length trends — {strategy.capitalize()}")
        ax.set_xlabel("Hour")
        ax.set_ylabel("Vehicles in queue")
        ax.xaxis.set_major_locator(ticker.MultipleLocator(4))
        ax.legend(fontsize=9)

    plt.tight_layout()
    return _save("queue_trends.png")


def generate_all(extra_arrivals=None, time_steps=24):
    _setup()
    print("Generating charts...")
    metrics = compare_metrics(extra_arrivals=extra_arrivals, time_steps=time_steps)

    paths = {
        "avg_wait_time":       plot_avg_wait_time(metrics),
        "throughput_over_time": plot_throughput_over_time(metrics),
        "congestion_levels":   plot_congestion_levels(metrics),
        "queue_trends":        plot_queue_trends(metrics),
    }

    print("Done.")
    return paths


if __name__ == "__main__":
    generate_all(
        extra_arrivals={"north": 30, "south": 25, "east": 20, "west": 35},
    )