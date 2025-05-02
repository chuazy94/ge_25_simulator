import requests
import geopandas as gpd
import pandas as pd
from io import BytesIO
import json

def fetch_electoral_boundaries():
    # API endpoint for electoral boundaries
    url = "https://data.gov.sg/api/action/datastore_search?resource_id=4e7981c1-9ae3-c1e3-b7ce-3d9842415c8d"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Extract the GeoJSON data
        geojson_data = data['result']['records'][0]['geojson']
        
        # Convert to GeoDataFrame
        gdf = gpd.GeoDataFrame.from_features(geojson_data)
        
        # Save to file
        gdf.to_file("ge2025_boundaries.geojson", driver="GeoJSON")
        print("Successfully saved electoral boundaries to ge2025_boundaries.geojson")
        
        return gdf
    
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def fetch_party_data():
    # This is a placeholder for party data
    # Note: Official party data might not be available until closer to the election
    parties = {
        "People's Action Party": {"seats": 93},
        "Workers' Party": {"seats": 10},
        "Progress Singapore Party": {"seats": 0},
        "Singapore Democratic Party": {"seats": 0},
        "National Solidarity Party": {"seats": 0},
        "Reform Party": {"seats": 0},
        "Singapore People's Party": {"seats": 0},
        "Singapore Democratic Alliance": {"seats": 0}
    }
    
    # Save to JSON file
    with open("ge2025_parties.json", "w") as f:
        json.dump(parties, f, indent=4)
    print("Successfully saved party data to ge2025_parties.json")
    
    return parties

if __name__ == "__main__":
    print("Fetching GE2025 electoral boundaries...")
    boundaries = fetch_electoral_boundaries()
    
    print("\nFetching party data...")
    parties = fetch_party_data()
    
    if boundaries is not None:
        print("\nElectoral Boundaries Summary:")
        print(f"Total number of constituencies: {len(boundaries)}")
        print("\nFirst few constituencies:")
        print(boundaries[['name', 'type']].head())
    
    if parties:
        print("\nParty Summary:")
        total_seats = sum(party['seats'] for party in parties.values())
        print(f"Total number of parties: {len(parties)}")
        print(f"Total number of seats: {total_seats}")
        print("\nParty details:")
        for party, data in parties.items():
            print(f"{party}: {data['seats']} seats") 