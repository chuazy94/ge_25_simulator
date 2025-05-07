from flask import Flask, render_template, jsonify, send_from_directory
from flask_caching import Cache
from functools import wraps
import json
import os
from pathlib import Path
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure Flask app
app.config.update(
    CACHE_TYPE="SimpleCache",
    CACHE_DEFAULT_TIMEOUT=300,  # 5 minutes cache timeout
    JSON_SORT_KEYS=False,  # Maintain JSON order
    MAX_CONTENT_LENGTH=16 * 1024 * 1024  # 16MB max upload size
)

# Initialize cache
cache = Cache(app)

# Constants
DATA_DIR = Path('data')
CANDIDATES_FILE = DATA_DIR / 'ge2025_candidates.json'

def load_election_data() -> Dict[str, Any]:
    """Load and validate election data from JSON file."""
    try:
        with open(CANDIDATES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"Successfully loaded election data from {CANDIDATES_FILE}")
        return data
    except FileNotFoundError:
        logger.error(f"Election data file not found: {CANDIDATES_FILE}")
        return {}
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in election data file: {CANDIDATES_FILE}")
        return {}
    except Exception as e:
        logger.error(f"Error loading election data: {str(e)}")
        return {}

# Load election data
election_data = load_election_data()

def handle_error(f):
    """Decorator for error handling in routes."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    return wrapper

@app.route('/')
@handle_error
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/api/candidates')
@cache.cached(timeout=300)  # Cache for 5 minutes
@handle_error
def get_candidates():
    """Get election candidates data."""
    return jsonify(election_data)

@app.route('/data/<path:filename>')
@handle_error
def serve_data(filename):
    """Serve static data files."""
    if not DATA_DIR.exists():
        logger.error(f"Data directory not found: {DATA_DIR}")
        return jsonify({"error": "Data directory not found"}), 404
    
    file_path = DATA_DIR / filename
    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        return jsonify({"error": "File not found"}), 404
    
    return send_from_directory(DATA_DIR, filename)

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors."""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Ensure data directory exists
    DATA_DIR.mkdir(exist_ok=True)
    
    # Run the app
    app.run(
        debug=False,  # Disable debug mode in production
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000))
    ) 