User Stories

Practice Plan Creator

As a user, I want to be able to create a practice plan from drills. 
I want to be able create in a similar fashion to how I add items to a shopping cart.
In the drills page, I want to click a checkbox next to the drills I want to add to my plan, and then have a button that says "Add Selected Drills to Plan". I want another button at the top that says "Create Plan with Selected [number of selected drills] Drills".
I also want to be able to add the drill from the drill details page via a button that says "Add Drill to Plan".

I want to have the ability to click on a shopping cart symbol in the top right of the page that will expand to show the drill titles, and have the ability to remove drills from there.

After I create a plan, I want to be redirected to a page that shows me the plan, and I want to see a list of the drills in the plan, with a button to remove the drill from the plan.
I also want to see the:
- estimated time to complete the plan
- player range that the plan is intended for 
- the skill level that the plan is intended for
- the number of drills of each complexity level that the plan contains
- the number drills for each position that the plan contains

And have the ability to:
- remove the drill from the plan
- edit the drill in the plan
- add a break to the plan
- add a name to the plan
- add a description to the plan

Also we need to be able to view created practice plans. Similar to viewing the list of drills, and individual drill details; there will be the plan listing page, and each will have a plan details page. 

Issues:
Make sure throughout that errors are handled well, and there is logging where things could potentially go wrong. Make sure everything is responsive and works well on mobile, and is performant. 



1:
Issue: Implement Practice Plan Creation Page Layout
Description:
Create a new page for practice plan creation with a vertical layout. The page should include:
Fields for plan name and description
A section to display selected drills
A submit button at the bottom
Tasks:
Create a new Svelte component for the practice plan creation page
Implement the basic layout with placeholders for all sections
Add routing for the new page
Related files:
src/routes/practice-plans/create/+page.svelte (new file)
src/routes/+layout.svelte (update navigation)


2:
Issue: Implement Drill Selection and Cart Functionality
Description:
Add the ability to select drills from both the drill listing page and the drill details page, and implement a cart system for creating a practice plan.

Tasks:
1. Drill Listing Page:
   - Add checkboxes next to each drill in the drill listing page
   - Implement a "Add Selected Drills to Plan" button that appears when at least one drill is selected

2. Drill Details Page:
   - Add an "Add Drill to Plan" button on the drill details page

3. Cart Functionality:
   - Create a store to temporarily hold selected drills
   - Implement a shopping cart symbol in the top right of the page
   - Create an expandable cart view that shows selected drill titles
   - Add the ability to remove drills from the cart

4. Create Plan Button:
   - Implement a "Create Plan with Selected [number] Drills" button at the top of the page
   - Update the button text dynamically based on the number of selected drills

5. Navigation:
   - Redirect to the practice plan creation page when the "Create Plan" button is clicked

6. User Feedback:
   - Provide visual feedback when drills are added to or removed from the cart
   - Show a notification or animation when the cart is updated

7. Persistence:
   - Implement local storage to persist selected drills between page reloads

Related files:
- src/routes/drills/+page.svelte (update drill listing page)
- src/routes/drills/[id]/+page.svelte (update drill details page)
- src/lib/stores/cartStore.js (new file for cart store)
- src/components/Cart.svelte (new component for cart functionality)
- src/routes/+layout.svelte (update to include cart symbol)


3:
Issue: Implement Drag and Drop for Drill Reordering
Description:
Add drag and drop functionality to reorder drills within the practice plan creation page.
Tasks:
Research and choose a Svelte-compatible drag and drop library
Implement drag and drop functionality for the list of selected drills
Ensure the order of drills is preserved when submitting the form
Related files:
src/routes/practice-plans/create/+page.svelte (new file)

4:
Issue: Add Break Insertion Functionality
Description:
Implement the ability to add breaks between drills in the practice plan. Breaks should be treated as separate entities from drills, with their own properties and behavior.
Tasks:
1. Create a new Break component to represent breaks in the practice plan.
Add an "Add Break" button between drill items in the practice plan creation page.
Implement a function to insert a break with a default duration of 5 minutes.
Allow users to modify the break duration directly in the practice plan.
Include breaks in the drag and drop reordering functionality alongside drills.
Update the plan metrics calculation to account for break durations.

5:
Issue: Implement Automatic Calculation of Plan Metrics

Description:
Add functionality to automatically calculate and display plan metrics for practice plans. These metrics will provide users with valuable insights about their created plans. The calculations should update dynamically as drills are added, removed, or reordered within the plan. Users should also have the ability to manually adjust these values if needed.

Tasks:
1. Implement calculation functions:
   a. Estimated time to complete the plan:
      - Sum up the suggested length of all drills and breaks in the plan
   b. Player range:
      - Determine the minimum and maximum number of players required across all drills
   c. Skill level range:
      - Identify the lowest and highest skill levels among the drills
   d. Complexity level distribution:
      - Calculate the percentage of drills for each complexity level (Low, Medium, High)

2. Display metrics:
   - Create a new section in the practice plan creation page to show these metrics
   - Use appropriate UI components (e.g., progress bars, charts) to visualize the data

3. Allow manual adjustments:
   - Add input fields or sliders next to each metric for users to modify values
   - Implement logic to handle conflicts between manual adjustments and calculated values

4. Dynamic updates:
   - Set up event listeners or reactive statements to recalculate metrics when:
     * Drills are added to the plan
     * Drills are removed from the plan
     * Drills are reordered within the plan
     * Break durations are modified

5. Optimize performance:
   - Ensure calculations are efficient and don't cause noticeable lag, especially for larger plans

6. Error handling and validation:
   - Implement checks to handle edge cases (e.g., empty plans, invalid manual inputs)
   - Provide user feedback for any calculation errors or inconsistencies

Related files:
src/routes/practice-plans/create/+page.svelte (new file)

Additional Considerations:
- Ensure the UI is responsive and works well on both desktop and mobile devices
- Consider adding tooltips or help text to explain each metric
- Implement data persistence to save calculated metrics along with the practice plan


6:
Issue: Create API Endpoint for Saving Practice Plans

Description:
Implement a robust server-side API endpoint to save created practice plans. This endpoint will handle the creation and storage of practice plans, ensuring data integrity and providing appropriate feedback to the client.

Tasks:
1. Create a new API route:
   - Implement a POST route at `/api/practice-plans`
   - Set up proper request handling and error catching

2. Implement data validation:
   - Validate required fields (e.g., plan name, description, drills)
   - Ensure drill IDs exist in the database
   - Validate data types and formats (e.g., dates, numbers)
   - Implement sanitization to prevent XSS attacks

3. Database interaction:
   - Design and create a `practice_plans` table in the database, creating the CREATE TABLE query
   - Implement database queries to insert new practice plan data
   - Handle potential database errors and constraints

4. Response handling:
   - Return a 201 status code with the created practice plan data on success
   - Return appropriate error codes (400 for bad requests, 500 for server errors)
   - Provide detailed error messages for easier client-side debugging

5. Logging and monitoring:
   - Implement logging for successful creations and errors
   - Log what query is being ran on the db for insertion
   - Set up performance monitoring for the endpoint

6. Testing:
   - Write unit tests for the API endpoint
   - Create integration tests to ensure proper database interaction

7. Documentation:
   - Document the API endpoint, including request format and possible responses
   - Update any relevant API documentation or swagger files

Additional Considerations:
- Implement rate limiting to prevent abuse
- Consider adding authentication to restrict access to authorized users only
- Ensure the endpoint follows RESTful principles
- Optimize database queries for performance

Related files:
- src/routes/api/practice-plans/+server.js (new file)
- src/lib/db.js (update to include practice plan related queries)
- tests/api/practice-plans.test.js (new file for testing)

7:
Issue: Implement Form Submission and Error Handling
Description:
Add functionality to submit the practice plan form and handle any errors that occur during submission.
Tasks:
Implement form submission logic in the practice plan creation page
Add client-side validation for required fields
Display loading state during form submission
Handle and display any errors returned from the API
Redirect to the practice plan detail page on successful submission
Related files:
src/routes/practice-plans/create/+page.svelte (new file)

8:
Issue: Update Navigation and Add "Add to Plan" Button on Drill Detail Page
Description:
Update the navigation to include the new practice plan creation page and add an "Add to Plan" button on the drill detail page.
Tasks:
Add a link to the practice plan creation page in the main navigation
Implement an "Add to Plan" button on the drill detail page
Update the temporary drill storage when the "Add to Plan" button is clicked
Provide user feedback when a drill is added to the plan
