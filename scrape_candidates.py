import requests
from bs4 import BeautifulSoup
import json
import geopandas as gpd
import re
from typing import Dict, List
import os

def get_constituency_names():
    """Get constituency names from the GeoJSON file."""
    geojson_file = os.path.join("data", "ElectoralBoundary2025GEOJSON.geojson")
    gdf = gpd.read_file(geojson_file)
    return gdf['ED_DESC_FU'].tolist()

def scrape_straits_times():
    """Scrape candidate information from Straits Times."""
    url = "https://www.straitstimes.com/multimedia/graphics/2025/04/singapore-general-election-ge2025-candidates/index.html"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Initialize the data structure
    constituency_data = {}
    
    # Find all constituency sections
    constituency_sections = soup.find_all('div', class_='constituency-section')
    
    for section in constituency_sections:
        # Extract constituency name
        constituency_name = section.find('h2').text.strip()
        
        # Extract party and candidate information
        party_blocks = section.find_all('div', class_='party-block')
        party_data = {}
        
        for party_block in party_blocks:
            party_name = party_block.find('h3').text.strip()
            candidates = [c.text.strip() for c in party_block.find_all('li')]
            party_data[party_name] = candidates
        
        # Extract number of electors
        electors_text = section.find('div', class_='electors').text
        num_electors = int(re.search(r'\d+', electors_text).group())
        
        constituency_data[constituency_name] = {
            'parties': party_data,
            'number_of_electors': num_electors
        }
    
    return constituency_data

def scrape_data_gov_sg():
    """Scrape additional information from data.gov.sg."""
    url = "https://elections.data.gov.sg/en"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Initialize the data structure
    additional_data = {}
    
    # Find all constituency information
    constituency_blocks = soup.find_all('div', class_='constituency-info')
    
    for block in constituency_blocks:
        constituency_name = block.find('h3').text.strip()
        # Add any additional information from data.gov.sg
        additional_data[constituency_name] = {
            'additional_info': block.find('p').text.strip()
        }
    
    return additional_data

def merge_data(st_data: Dict, gov_data: Dict, constituency_names: List[str]) -> Dict:
    """Merge data from different sources and ensure constituency names match."""
    final_data = {}
    
    for constituency in constituency_names:
        # Find matching constituency name (case-insensitive)
        matching_st = next((k for k in st_data.keys() 
                          if k.lower() == constituency.lower()), None)
        matching_gov = next((k for k in gov_data.keys() 
                           if k.lower() == constituency.lower()), None)
        
        if matching_st:
            final_data[constituency] = st_data[matching_st]
            if matching_gov:
                final_data[constituency].update(gov_data[matching_gov])
        else:
            final_data[constituency] = {
                'parties': {},
                'number_of_electors': 0
            }
    
    return final_data

def main():
    # Get constituency names from GeoJSON
    constituency_names = get_constituency_names()
    print("Found constituencies:", constituency_names)
    
    # Scrape data from both sources
    st_data = scrape_straits_times()
    gov_data = scrape_data_gov_sg()
    
    # Merge and match data
    final_data = merge_data(st_data, gov_data, constituency_names)
    
    # Save to JSON file
    with open('ge2025_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print("Data has been saved to ge2025_candidates.json")

if __name__ == "__main__":
    main() 