import json
import glob
import re

def merge_media_files():
    # Grabs all JSON files in the current directory matching your naming convention
    file_paths = glob.glob('media_import_*.json')
    
    merged_series = {}
    merged_items = {}

    for file_path in file_paths:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

            # Process TV Series
            for series in data.get("tvSeries", []):
                s_id = series["id"]
                if s_id not in merged_series:
                    merged_series[s_id] = series.copy()
                else:
                    # Keep highest seasonsAvailable
                    current_seasons = merged_series[s_id].get("seasonsAvailable", 0)
                    new_seasons = series.get("seasonsAvailable", 0)
                    merged_series[s_id]["seasonsAvailable"] = max(current_seasons, new_seasons)

                    # Consolidate missing fields (like imdbUrl, createdAt)
                    for key, value in series.items():
                        if key not in merged_series[s_id]:
                            merged_series[s_id][key] = value

            # Process Media Items
            for item in data.get("mediaItems", []):
                m_id = item["id"]
                item_copy = item.copy()

                # Fix 2018 schema anomalies 
                if item_copy.get("mediaType") == "tv":
                    item_copy["mediaType"] = "tv_season"
                    # Extract season number from title (e.g., "Mindhunter — Season 1" or "Veep sesong 1")
                    if "seasonNumber" not in item_copy:
                        match = re.search(r'(?:Season|sesong)\s+(\d+)', item_copy.get("title", ""), re.IGNORECASE)
                        if match:
                            item_copy["seasonNumber"] = int(match.group(1))

                # Clean up legacy fields
                if "userId" in item_copy:
                    del item_copy["userId"]

                if m_id not in merged_items:
                    merged_items[m_id] = item_copy
                else:
                    # Consolidate missing fields 
                    for key, value in item_copy.items():
                        if key not in merged_items[m_id]:
                            merged_items[m_id][key] = value

    # Build final dictionary
    final_data = {
        "tvSeries": list(merged_series.values()),
        "mediaItems": list(merged_items.values())
    }

    # Write to a clean output file
    with open('merged_media_library.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(file_paths)} files.")
    print(f"Total Unique TV Series: {len(final_data['tvSeries'])}")
    print(f"Total Unique Media Items: {len(final_data['mediaItems'])}")

if __name__ == "__main__":
    merge_media_files()
