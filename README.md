# GE2025 Election Simulator

A little project built with the help of Cursor AI (Claude 3.7). You can check out my free rendered app here - https://ge-25-simulator.onrender.com/. Note this is currently free tier so it will take some time to boot up.

A web application that simulates the Singapore General Elections 2025, allowing users to:
- View electoral boundaries on an interactive map of Singapore
- Allocate vote percentages to different parties in each constituency - currently does not allow for spoilt votes.
- Visualize the winning party colors on the map
- View the parliamentary composition and total votes

## Setup

1. Install the required Python packages:
```bash
pip install -r requirements.txt
```

2. Make sure you have the following data files in the `data` directory:
- `ElectoralBoundary2025GEOJSON.geojson`: Contains the electoral boundaries
- `ge2025_candidates.json`: Contains the candidate information

3. Run the Flask application:
```bash
python app.py
```

4. Open your web browser and navigate to `http://localhost:5000`

## Features

- Interactive map showing electoral boundaries
- Hover over constituencies to view basic information
- Click on a constituency to allocate votes to different parties
- Real-time updates of parliamentary composition and total votes
- Color-coded visualization of winning parties

## Data Sources

- Electoral boundaries data from ElectoralBoundary2025GEOJSON (courtesy of data.gov.sg)
- Candidate information from ge2025_candidates.json (obtained from Straits Times)

## Technologies Used

- Backend: Flask
- Frontend: HTML, CSS, JavaScript
- Map Visualization: Leaflet.js
- Data Visualization: D3.js 