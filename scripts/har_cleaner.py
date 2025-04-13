import json
import argparse
import os

def remove_content_key(obj):
    """Recursively removes the 'content' key from dictionaries within a JSON object."""
    if isinstance(obj, dict):
        # Use list() to create a copy of keys to avoid modification during iteration
        for key in list(obj.keys()):
            if key == 'content':
                del obj[key]
            else:
                remove_content_key(obj[key])
    elif isinstance(obj, list):
        for item in obj:
            remove_content_key(item)

def main():
    parser = argparse.ArgumentParser(description='Remove "content" keys from a HAR file.')
    parser.add_argument('input_file', help='Path to the input HAR file.')
    parser.add_argument('-o', '--output_file', help='Path to the output HAR file. If not provided, appends "_cleaned" to the input filename.')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite the input file instead of creating a new one.')

    args = parser.parse_args()

    input_path = args.input_file
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        return

    if args.overwrite:
        output_path = input_path
    elif args.output_file:
        output_path = args.output_file
    else:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_cleaned{ext}"

    try:
        with open(input_path, 'r', encoding='utf-8') as f_in:
            har_data = json.load(f_in)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {input_path}: {e}")
        # Attempt to provide more context about the error location
        try:
            with open(input_path, 'r', encoding='utf-8') as f_check:
                f_check.seek(max(0, e.pos - 50)) # Show context around the error
                context = f_check.read(100)
                print(f"Context around error (approx. position {e.pos}):\n...\n{context}\n...")
        except Exception:
            pass # Ignore errors during context retrieval
        return
    except Exception as e:
        print(f"Error reading input file {input_path}: {e}")
        return

    print(f"Processing {input_path}...")
    # Assuming the main data is under log -> entries
    if 'log' in har_data and 'entries' in har_data['log']:
        remove_content_key(har_data['log']['entries'])
    else:
        print("Warning: Could not find 'log' -> 'entries' structure. Applying to the whole file.")
        remove_content_key(har_data)

    try:
        with open(output_path, 'w', encoding='utf-8') as f_out:
            json.dump(har_data, f_out, indent=2) # Use indent=2 for readability
        print(f"Successfully processed. Cleaned file saved to: {output_path}")
    except Exception as e:
        print(f"Error writing output file {output_path}: {e}")

if __name__ == "__main__":
    main()