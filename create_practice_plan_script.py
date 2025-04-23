# Potential location: llm_tools/practice_plan_tools.py

import requests
import json

def create_practice_plan(plan_data: dict) -> dict:
    """
    Creates a new practice plan, including sections and items, via the API.

    This tool wraps a POST request to the `/api/practice-plans` endpoint.
    The input data must be a nested dictionary conforming to the structure
    validated by `createPracticePlanSchema`.

    Args:
      plan_data: A nested dictionary representing the practice plan.
                 Must include 'name' and a 'sections' array. Each section
                 must have 'name' and an 'items' array. Each item must
                 have 'type', 'name', and 'duration'. Include 'drill_id'
                 for existing drills.

    Returns:
      A dictionary containing the 'id' of the newly created practice plan
      and a success message, e.g., {'id': 123, 'message': '...'}.

    Raises:
      requests.exceptions.RequestException: If the API request fails.
      ValueError: If the API returns an error (e.g., validation error)
                  or non-JSON response.
    """
    api_url = "http://localhost:3000/api/practice-plans" # Adjust if needed

    print(f"Sending POST request to {api_url} with practice plan data...")
    # Avoid printing potentially huge nested data, maybe just top-level keys?
    print(f"Top-level keys: {list(plan_data.keys())}")
    print(f"Number of sections: {len(plan_data.get('sections', []))}")


    try:
        response = requests.post(api_url, json=plan_data, headers={'Content-Type': 'application/json'})
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

        result = response.json()

        # Check for application-level errors in the response body
        if 'error' in result:
            error_info = result['error']
            error_message = f"API Error ({error_info.get('code', 'Unknown')}): {error_info.get('message', 'An error occurred')}"
            if 'details' in error_info:
                # Format Zod details nicely if possible
                details_str = json.dumps(error_info['details'], indent=2)
                error_message += f"\nDetails:\n{details_str}"
            raise ValueError(error_message)

        # Check if the expected 'id' is present in the successful response
        if 'id' not in result:
             raise ValueError(f"API response missing expected 'id'. Response: {json.dumps(result)}")

        print("\n--- Success! ---")
        print("API Response:")
        print(json.dumps(result, indent=2))
        return result # Should contain {'id': ..., 'message': '...'}

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
        # Catch ValueErrors raised for application errors or missing ID
        print(f"\n--- API Error or Invalid Response ---")
        print(f"Error: {e}")
        raise


# --- Data for the "East April TC Practice" plan ---
actual_plan_data = {
  "name": "East April TC Practice",
  "description": "Team Canada East practice plan for April 26, 2025, focusing on position-specific drills and strategic offense/defense.",
  "practice_goals": ["Warmup", "Chaser Skills", "Beater Skills", "Strategic Play", "Scrimmaging"],
  "phase_of_season": "Mid season",
  "visibility": "public",
  "is_editable_by_others": True,
  "estimated_number_of_participants": 20,
  "start_time": "08:30:00",
  "sections": [
    {
      "name": "(8:30) Outdoor Warm up",
      "order": 0,
      "items": [
        {
          "type": "break",
          "name": "Standard outdoor warmup",
          "duration": 30
        }
      ]
    },
    {
      "name": "(9:00) Position Specific Warm ups",
      "order": 1,
      "notes": "Chasers and Beaters split. Volunteers set up pitch. Beater warmup happens concurrently.",
      "items": [
        {
          "type": "drill",
          "name": "Five star",
          "duration": 7,
          "drill_id": 62,
          "parallel_group_id": "group_warmups",
          "parallel_timeline": "CHASERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        },
        {
          "type": "drill",
          "name": "Long-short-long",
          "duration": 8,
          "drill_id": 150,
          "parallel_group_id": "group_warmups",
          "parallel_timeline": "CHASERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        },
        {
          "type": "break",
          "name": "Beater Warmup Placeholder",
          "duration": 15,
          "parallel_group_id": "group_warmups",
          "parallel_timeline": "BEATERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        }
      ]
    },
    {
      "name": "(9:15) Position Specific Drills",
      "order": 2,
      "notes": "Chaser/Beater drills run concurrently (total section time 30min). Seekers have separate drills.",
      "items": [
        {
          "type": "drill",
          "name": "Tackling 2v2",
          "duration": 15,
          "drill_id": 151,
          "parallel_group_id": "group_position_drills",
          "parallel_timeline": "CHASERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        },
        {
          "type": "drill",
          "name": "Passing Around Hoops",
          "duration": 15,
          "drill_id": 149,
          "parallel_group_id": "group_position_drills",
          "parallel_timeline": "CHASERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        },
        {
          "type": "drill",
          "name": "Beating Ball Carrier (Free Beater)",
          "duration": 15,
          "drill_id": 152,
          "parallel_group_id": "group_position_drills",
          "parallel_timeline": "BEATERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        },
        {
          "type": "drill",
          "name": "Boston beater drill",
          "duration": 15,
          "drill_id": 143,
          "parallel_group_id": "group_position_drills",
          "parallel_timeline": "BEATERS",
          "groupTimelines": ["CHASERS", "BEATERS"]
        }
      ]
    },
    {
      "name": "(9:45) TC Strategic One Runs",
      "order": 3,
      "items": [
        { "type": "break", "name": "General Strategic Intro", "duration": 10 },
        { "type": "break", "name": "Hoop Defense Intro & Run", "duration": 10 },
        { "type": "break", "name": "Attacking VS Hoop Concepts", "duration": 30 },
        { "type": "break", "name": "2-2 Defense Intro & Run", "duration": 10 },
        { "type": "break", "name": "Attacking vs 2-2 Concepts", "duration": 30 }
      ]
    },
     {
      "name": "(11:15) Buffer",
      "order": 4,
      "items": [
        { "type": "break", "name": "Buffer Time / Water Break", "duration": 15 }
      ]
    },
    {
      "name": "(11:30) Scrimmages",
      "order": 5,
       "items": [
        { "type": "break", "name": "Scrimmage 1 (8 min)", "duration": 8 },
        { "type": "break", "name": "Scrimmage 2 (8 min)", "duration": 8 },
        { "type": "break", "name": "Scrimmage 3 (8 min, SOP)", "duration": 8 }
      ]
    }
  ]
}

# --- Example Usage ---
# This part demonstrates how an LLM might construct the data and call the function.

# Assume 'search_drills' found drill ID 62 for "Five star"
# Assume 'create_drill' created drill ID 149 for "Passing Around Hoops"
# Assume 'create_drill' created drill ID 150 for "Tackling 2v2" (hypothetical)

# example_plan_data = {
#   "name": "East April TC Practice - Initial Drills",
#   "description": "Warmups and position specific drills from the plan.",
#   "practice_goals": ["Warmup", "Chaser Skills", "Beater Skills"],
#   "phase_of_season": "Mid season, skill building",
#   "visibility": "private", # Assume logged-in user context
#   "sections": [
#     {
#       "name": "Position Specific Warm ups",
#       "order": 0, # Service layer handles order on creation
#       "notes": "Chasers and Beaters split.",
#       "items": [
#         { "type": "drill", "name": "Five star", "duration": 10, "drill_id": 62 },
#         # { "type": "drill", "name": "Long-short-long", "duration": 10, "drill_id": ... }, # Need to search/create this drill
#         # { "type": "break", "name": "Beater Warmup Placeholder", "duration": 10 } # Placeholder for beater warmup
#       ]
#     },
#     {
#       "name": "Position Specific Drills - Chasers",
#       "order": 1,
#       "items": [
#         { "type": "drill", "name": "Tackling 2v2", "duration": 15, "drill_id": 150 },
#         { "type": "drill", "name": "Passing Around Hoops", "duration": 15, "drill_id": 149 }
#       ]
#     },
#     # {
#     #   "name": "Position Specific Drills - Beaters",
#     #   "order": 2,
#     #   "items": [
#     #     { "type": "drill", "name": "Beats on ball carrier", "duration": 15, "drill_id": ... },
#     #     { "type": "drill", "name": "Boston beater drill", "duration": 15, "drill_id": ... }
#     #   ]
#     # }
#   ]
# }

if __name__ == "__main__":
  try:
    print("Attempting to create practice plan...")
    new_plan = create_practice_plan(actual_plan_data) # Use the actual data
    print(f"\nSuccessfully created practice plan with ID: {new_plan.get('id')}")
  except (requests.exceptions.RequestException, ValueError, json.JSONDecodeError) as e:
    print(f"\nScript failed to create practice plan: {e}")
    import sys
    sys.exit(1)
