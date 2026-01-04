import requests
import json
import sys

# Configuration
SOURCE_URL = "https://de1.api.radio-browser.info/json/stations"
OUTPUT_FILE = "stations_transformed.json"

def fetch_and_transform():
    print(f"Connecting to {SOURCE_URL}...")
    
    try:
        # We use a timeout to avoid hanging indefinitely
        response = requests.get(SOURCE_URL, timeout=30)
        response.raise_for_status() # Raise error for bad status codes (4xx, 5xx)
        
        data = response.json()
        print(f"Successfully downloaded {len(data)} stations. Starting transformation...")

        transformed_data = []

        for station in data:
            # Skip stations without a valid URL or Name to keep DB clean
            if not station.get('url_resolved') and not station.get('url'):
                continue

            # Construct the new object based on your schema
            new_entry = {
                "id": station.get('stationuuid'),
                "name": station.get('name', '').strip(), # Remove leading/trailing whitespace/tabs
                "url": station.get('url_resolved') or station.get('url'),
                "country": station.get('countrycode'),
                "lat": station.get('geo_lat'),
                "lon": station.get('geo_long'),
                "source": "radio-browser" 
            }
            
            transformed_data.append(new_entry)

        # Write to disk
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(transformed_data, f, indent=2, ensure_ascii=False)
            
        print(f"Success! Saved {len(transformed_data)} stations to '{OUTPUT_FILE}'.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_and_transform()
