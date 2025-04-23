# Filename: create_drill_script.py

import requests
import json

def create_drill(drill_data: dict) -> dict:
  """
  Creates a new drill in the system by sending data to the backend API.

  This tool wraps a POST request to the `/api/drills` endpoint.
  The input data must conform to the structure expected by the API,
  validated by `createDrillSchema`.

  Args:
    drill_data: A dictionary containing the data for the new drill.

  Returns:
    A dictionary representing the newly created drill, including its 'id'.

  Raises:
    requests.exceptions.RequestException: If the API request fails.
    ValueError: If the API returns an error (e.g., validation error) or non-JSON response.
  """
  api_url = "http://localhost:3000/api/drills" # Adjust if your server runs elsewhere

  print(f"Sending POST request to {api_url} with data:")
  # Print data nicely, hiding potentially large diagrams/elements if present
  log_data = {k: v for k, v in drill_data.items() if k != 'diagrams'}
  print(json.dumps(log_data, indent=2))

  try:
    response = requests.post(api_url, json=drill_data, headers={'Content-Type': 'application/json'})
    response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

    created_drill = response.json()

    # Check for application-level errors returned in the JSON body
    if 'error' in created_drill:
        error_info = created_drill['error']
        error_message = f"API Error ({error_info.get('code', 'Unknown')}): {error_info.get('message', 'An error occurred')}"
        if 'details' in error_info:
            error_message += f" Details: {json.dumps(error_info['details'])}"
        raise ValueError(error_message)

    print("\n--- Success! ---")
    print("API Response:")
    print(json.dumps(created_drill, indent=2))
    return created_drill

  except requests.exceptions.RequestException as e:
    print(f"\n--- HTTP Request failed ---")
    print(f"Error: {e}")
    if e.response is not None:
        print(f"Status Code: {e.response.status_code}")
        print(f"Response Body: {e.response.text}")
    raise
  except json.JSONDecodeError:
     print(f"\n--- Failed to decode JSON response ---")
     print(f"Status Code: {response.status_code}")
     print(f"Response Body: {response.text}")
     raise ValueError("Invalid JSON response from API")
  except ValueError as e:
      # Catch the ValueError raised for application errors
      print(f"\n--- API returned an error ---")
      print(f"Error: {e}")
      raise

# --- Data for the "Beating Ball Carrier (Free Beater)" drill ---
passing_drill_data = {
  "name": "Beating Ball Carrier (Free Beater)",
  "brief_description": "Beater drill focusing on making beats on the ball carrier, working around a free defensive beater.",
  "skill_level": ["Advanced"],
  "complexity": "High",
  "suggested_length": { "min": 15, "max": 20 },
  "skills_focused_on": ["Beating", "Positioning", "Decision-making", "Dodging"],
  "positions_focused_on": ["Beater"],
  "drill_type": ["Skill-focus", "Tactic-focus"],
  "visibility": "public",
  "is_editable_by_others": False
}

# --- Execute the function ---
if __name__ == "__main__":
  try:
    print("Attempting to create drill...")
    new_drill = create_drill(passing_drill_data)
    # print(f"\nSuccessfully created drill with ID: {new_drill.get('id')}")
  except (requests.exceptions.RequestException, ValueError, json.JSONDecodeError) as e:
    print(f"\nScript failed: {e}")
    # Exit with a non-zero code to indicate failure
    import sys
    sys.exit(1)