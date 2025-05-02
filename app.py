from flask import Flask, render_template, jsonify, send_from_directory
import json
import os

app = Flask(__name__)

# Load the election data
with open('data/ge2025_candidates.json', 'r') as f:
    election_data = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/candidates')
def get_candidates():
    return jsonify(election_data)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

if __name__ == '__main__':
    app.run(debug=True) 