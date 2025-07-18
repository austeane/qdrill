#!/usr/bin/env python3
"""Simple helper to create drills via the QDrill API.

Edit the DRILLS_TO_CREATE list with one or more drill objects matching
`createDrillSchema` and run `python create_drill_script.py`.
The script posts each drill to the API and prints the created ID.
"""

import os
import json
import sys

try:
    import requests
except ModuleNotFoundError:
    sys.exit("The 'requests' package is required. Install with: pip install requests")

API_URL = os.environ.get("QDRILL_API_URL", "http://localhost:3000/api/drills")

# Example data - replace with real drills
DRILLS_TO_CREATE = [
    {
        "name": "Example Drill",
        "brief_description": "Update this drill data before running",
        "visibility": "public",
        "is_editable_by_others": True,
    }
]


def create_drill(drill):
    try:
        response = requests.post(API_URL, json=drill)
        response.raise_for_status()
        data = response.json()
        print(f"\u2713 Created drill '{data.get('name')}' (ID: {data.get('id')})")
        return data
    except requests.RequestException as e:
        print(f"\u2717 Failed to create '{drill.get('name')}' : {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        return None


def main():
    print(f"Posting {len(DRILLS_TO_CREATE)} drill(s) to {API_URL}")
    results = [create_drill(d) for d in DRILLS_TO_CREATE]
    # Save created drill info for reference
    with open("created_drills.json", "w") as f:
        json.dump([r for r in results if r], f, indent=2)
    print("Done.")


if __name__ == "__main__":
    main()
