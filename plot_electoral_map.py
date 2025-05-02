import geopandas as gpd
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import numpy as np
import os

def plot_electoral_map(geojson_file):
    # Read the GeoJSON file
    
    gdf = gpd.read_file(geojson_file)
    
    # Print the available columns to help debug
    print("Available columns:", gdf.columns.tolist())
    
    # Create a figure and axis
    fig, ax = plt.subplots(figsize=(15, 15))
    
    # Plot all constituencies with a single color
    gdf.plot(
        ax=ax,
        color='lightblue',
        edgecolor='black',
        linewidth=0.5
    )
    
    # Add constituency names as labels
    for idx, row in gdf.iterrows():
        centroid = row.geometry.centroid
        # Use the first available name field
        name = row.get('name', row.get('NAME', row.get('Name', 'Unknown')))
        ax.annotate(
            text=name,
            xy=(centroid.x, centroid.y),
            xytext=(3, 3),
            textcoords="offset points",
            fontsize=8,
            bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="gray", alpha=0.7)
        )
    
    # Customize the plot
    ax.set_title('Singapore General Election 2025 Electoral Boundaries', fontsize=16, pad=20)
    
    # Remove axis
    ax.set_axis_off()
    
    # Adjust layout
    plt.tight_layout()
    
    # Save the plot
    plt.savefig('ge2025_map.png', dpi=300, bbox_inches='tight')
    print("Map has been saved as 'ge2025_map.png'")
    
    # Show the plot
    plt.show()

if __name__ == "__main__":
    # Use the correct path to the GeoJSON file
    geojson_file = os.path.join("data", "ElectoralBoundary2025GEOJSON.geojson")
    plot_electoral_map(geojson_file) 