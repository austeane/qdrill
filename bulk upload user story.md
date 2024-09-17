Bulk Drill Upload

As a user, I want to be able to upload multiple drills at once via a CSV file, so that I can quickly add a large number of drills to the system without manually entering each one. I also want to be able to review and correct any errors in the uploaded data directly from the user interface.

Acceptance Criteria:

1. There is a "Bulk Drill Upload" option in the top navigation bar.

2. The bulk upload page includes:
   - A downloadable CSV template with the correct format for drill data.
   - An upload area where users can drag and drop or select a CSV file.
   - An "Upload" button to initiate the upload process.

3. The system processes the entire CSV file, attempting to parse as much data as possible from each row, even if errors are encountered.

4. After processing, the system displays a summary of the upload, including:
   - Total number of drills in the CSV
   - Number of drills parsed without errors
   - Number of drills with one or more errors

5. Users are presented with a review interface showing all parsed drills, with errors clearly highlighted:
   - Drills with errors are visually distinct (e.g., highlighted in yellow).
   - Specific fields with errors are marked (e.g., with a red outline or icon).
   - Error messages are displayed next to the problematic fields, explaining the issue (e.g., "Minimum people cannot be negative").

6. In the review interface, users can:
   - Edit any drill details, including correcting errors.
   - Add diagrams to individual drills.
   - Remove drills they don't want to import.

7. The system provides inline validation during the review process, updating error statuses in real-time as users make corrections.

8. Users can filter the review list to show:
   - All drills
   - Only drills with errors
   - Only drills without errors

9. There is a "Save Changes" button that updates the parsed data with any user edits.

10. Users can choose to import all valid drills, even if some still have errors.

11. After the import is complete, the system redirects users to the drill listing page and displays a success message with the number of drills imported.

12. The bulk upload feature includes appropriate error handling and logging for troubleshooting purposes.

13. The feature is responsive and works well on both desktop and mobile devices.

Validation Specifications:

1. Name: Required

2. Brief Description: Required

3. Detailed Description: Optional

4. Skill Level:
   - Required
   - Must be an array of numbers
   - Valid options: 1 (New to Sport), 2 (Beginner), 3 (Intermediate), 4 (Advanced), 5 (Elite)

5. Complexity:
   - Optional
   - Must be a number
   - Valid options: 1 (Low), 2 (Medium), 3 (High)

6. Suggested Length:
   - Required
   - Two columns in CSV: suggested_length_min and suggested_length_max
   - Both must be positive integers
   - Max must be greater than or equal to Min

7. Number of People:
   - Optional
   - Two columns in CSV: number_of_people_min and number_of_people_max
   - Both must be positive integers
   - Max must be greater than or equal to Min

8. Skills Focused On:
   - Required
   - Must be an array

9. Positions Focused On:
   - Required
   - Must be an array
   - Elements can only be Beater, Chaser, Keeper, Seeker

10. Video Link:
    - Optional
    - Must be a valid URL format

Notes:
- Images and diagrams are not supported via CSV upload
- When processing the CSV, combine the min and max columns for suggested length and number of people into single fields
- Implement appropriate error handling and user feedback for validation failures
- Ensure that the downloadable CSV template reflects these validation rules and includes example data


Issues:

1. Implement Bulk Drill Upload UI
   - Create a "Bulk Drill Upload" option in the top navigation bar
   - Design and implement the bulk upload page with CSV template download, file upload area, and upload button
   - Allow for in-line editing of the uploaded drills

2. Develop CSV Processing Backend
   - Create an API endpoint to handle CSV file uploads
   - Implement CSV parsing logic, attempting to extract as much data as possible from each row
   - Handle and log errors during processing

3. Create Upload Summary Display
   - Implement a summary view showing total drills, successfully parsed drills, and drills with errors

4. Design and Implement Review Interface
   - Create a UI for reviewing parsed drills, highlighting errors
   - Implement inline editing for drill details
   - Add functionality to remove drills from the import list

5. Add Diagram Creation to Review Interface
   - Integrate the existing DiagramDrawer component into the review interface
   - Allow users to add diagrams to individual drills during the review process

6. Implement Real-time Validation
   - Add client-side validation for drill edits in the review interface
   - Update error statuses in real-time as users make corrections

7. Create Filtering System for Review List
   - Implement filters to show all drills, only drills with errors, or only drills without errors

8. Develop Save and Import Functionality
   - Create a "Save Changes" button to update parsed data with user edits
   - Implement the ability to import all valid drills, even if some have errors

9. Implement Post-Import Redirect and Notification
   - Add logic to redirect users to the drill listing page after import
   - Display a success message with the number of drills imported

