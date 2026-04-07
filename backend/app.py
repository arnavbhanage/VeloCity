from flask import Flask, request, jsonify
from flask_cors import CORS
from metrics import compare_metrics
from visualizer import generate_base64_charts
import numpy as np

app = Flask(__name__)
CORS(app)


class NumpyEncoder(app.json_provider_class):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app.json_provider_class = NumpyEncoder
app.json = NumpyEncoder(app)


from flask import request

@app.route("/run", methods=["POST"])
def run():
    data = request.get_json()
    print(data)  # debug line

    # now use data
    arrivals = {
        "North": data.get("north", 30),
        "South": data.get("south", 25),
        "East":  data.get("east",  20),
        "West":  data.get("west",  35),
    }
    time_steps = data.get("time_steps", 24)

    try:
        arrivals   = {k: int(v) for k, v in arrivals.items()}
        time_steps = int(time_steps)
    except (ValueError, TypeError):
        return jsonify({"error": "All vehicle counts and time_steps must be integers."}), 400

    if not all(v >= 0 for v in arrivals.values()):
        return jsonify({"error": "Vehicle counts must be non-negative."}), 400

    if not (1 <= time_steps <= 168):
        return jsonify({"error": "time_steps must be between 1 and 168."}), 400

    metrics = compare_metrics(extra_arrivals=arrivals, time_steps=time_steps)
    charts  = generate_base64_charts(metrics)
    return jsonify({**metrics, "charts": charts}), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)