#!/usr/bin/env python3
"""Helper script to create a practice plan via the QDrill API.

Update PRACTICE_PLAN_DATA with your plan information matching
`createPracticePlanSchema` and run `python create_practice_plan_script.py`.
"""

import os
import json
import sys

try:
    import requests
except ModuleNotFoundError:
    sys.exit("The 'requests' package is required. Install with: pip install requests")

API_URL = os.environ.get("QDRILL_API_URL", "http://localhost:3000/api/practice-plans")

# Minimal example plan - replace with real data
PRACTICE_PLAN_DATA = {
    "name": "Example Practice Plan",
    "visibility": "public",
    "is_editable_by_others": True,
    "sections": [
        {
            "name": "Example Section",
            "order": 0,
            "items": [
                {
                    "type": "break",
                    "name": "Placeholder",
                    "duration": 5
                }
            ]
        }
    ]
}


def create_plan(plan):
    try:
        response = requests.post(API_URL, json=plan)
        response.raise_for_status()
        data = response.json()
        print(f"\u2713 Created practice plan '{data.get('id')}': {data.get('message')}")
        return data
    except requests.RequestException as e:
        print(f"\u2717 Failed to create practice plan: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        return None


def main():
    print(f"Posting practice plan to {API_URL}")
    result = create_plan(PRACTICE_PLAN_DATA)
    if result:
        with open("created_practice_plan.json", "w") as f:
            json.dump(result, f, indent=2)
    print("Done.")


if __name__ == "__main__":
    main()
