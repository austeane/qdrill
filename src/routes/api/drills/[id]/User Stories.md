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
Implement the ability to add breaks between drills in the practice plan.
Tasks:
Add an "Add Break" button between drill items
Implement a function to insert a break with a default duration of 5 minutes
Allow users to modify the break duration
Include breaks in the drag and drop reordering functionality
Related files:
src/routes/practice-plans/create/+page.svelte (new file)


5:
Issue: Implement Automatic Calculation of Plan Metrics
Description:
Add functionality to automatically calculate and display plan metrics, with the ability for users to modify them.
Tasks:
Implement functions to calculate:
Estimated time to complete the plan
Player range
Skill level range
Complexity level distribution
Display these metrics on the practice plan creation page
Allow users to manually adjust these values
Update calculations when drills are added, removed, or reordered
Related files:
src/routes/practice-plans/create/+page.svelte (new file)

6:
Issue: Create API Endpoint for Saving Practice Plans
Description:
Implement a server-side API endpoint to save created practice plans.
Tasks:
Create a new API route for saving practice plans
Implement data validation for the incoming practice plan data
Save the practice plan data to the database
Return appropriate success/error responses

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
