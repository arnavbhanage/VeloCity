from flask import Flask, request, jsonify
from flask_cors import CORS
from metrics import compare_metrics
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


@app.route("/run", methods=["POST"])
def run():
    body = request.get_json()

    arrivals = {
        "north": body.get("north", 30),
        "south": body.get("south", 25),
        "east":  body.get("east",  20),
        "west":  body.get("west",  35),
    }
    time_steps = body.get("time_steps", 24)

    try:
        arrivals   = {k: int(v) for k, v in arrivals.items()}
        time_steps = int(time_steps)
    except (ValueError, TypeError):
        return jsonify({"error": "All vehicle counts and time_steps must be integers."}), 400

    if not all(v >= 0 for v in arrivals.values()):
        return jsonify({"error": "Vehicle counts must be non-negative."}), 400

    if not (1 <= time_steps <= 168):
        return jsonify({"error": "time_steps must be between 1 and 168."}), 400

    result = compare_metrics(extra_arrivals=arrivals, time_steps=time_steps)
    return jsonify(result), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)