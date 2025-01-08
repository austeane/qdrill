# Practice Plan Wizard Technical Implementation Plan

# Plain language feature description.

Right now, you have to find your drills, add them to a cart, then create a plan from them.

What I want to do is reduce the friction for creating a practice plan for the most common use cases.
To do that I want a guided "create a practice plan" wizard. Here is some conversation with Claude about it:

<<<me>>>
Okay, I want it to be an interactive form, where you can go back and forth between "pages" rather than all of it being on one page.

You start by putting in the name and the number of participants. 

It presents a list of possible sections, "warmup" "split position skills" "group skills" "half court" "scrimmage" "conditioning", "other <let them type in the section name>"

You select which ones you want, click next. 
Then on the next page they are placed in a timeline and you can rearrange them and choose how long each will take, and any breaks between. 

Then, you click next, and it takes you to the first section and guides you in finding drills for that section. For the pre-filled sections we give default filter values for what drills to find, but they can be adjusted. 

You decide how much time each drill will take, and once you have drills that fill the allocated time, you click next and move on to the next section. 

After you finish all the sections you are taken to a final overview page that has all the sections and allows you to click edit to go to the "page" for that section if you want to switch out drills,  or  you can just rearrange the timeline if you want to change e.g. how much time to allocate to one drill vs another. 


Does this all make sense? Ask any questions you have, give any suggestions you have. After that, I'll ask you to write me a technical description of how we are going to accomplish this.

<<<claude>>>
This makes a lot of sense and provides a clear, guided flow! Let me break down my understanding and ask some clarifying questions:
Flow Understanding:
Basic Info → 2. Section Selection → 3. Timeline Arrangement → 4. Section-by-Section Drill Selection → 5. Final Overview
Questions & Considerations:
Basic Info Page:
Besides name and participants, should we include other initial factors?
Skill level of team
Total practice duration
Indoor/outdoor
Available equipment
Section Selection:
Should sections have descriptions/tooltips explaining their purpose?
For custom sections, should we prompt for any additional info to help with drill filtering?
Should we suggest common section combinations (e.g., "Standard Practice", "Game Day Prep")?
Timeline Arrangement:
Do we want to suggest default durations for each section?
Should we show a running total of practice time?
How should we handle breaks? As separate sections or as gaps between sections?
Should we validate minimum/maximum times for certain sections?
Drill Selection Pages:
How should we handle parallel drills (when you split the team)?
Should we show a mini-timeline at the top to maintain context?
Should we suggest drill combinations that work well together?
Should we allow saving partial progress and coming back later?
Final Overview:
Should we include a print/export view?
Do we want to show any analytics (e.g., skill coverage, intensity distribution)?
Should we allow sharing/collaborating with other coaches?
Additional Suggestions:
Navigation:
Add a progress bar/stepper showing all sections
Allow jumping between sections (not just next/previous)
Save progress automatically
Smart Features:
Remember coach's preferences for future plans
Suggest adjustments if total time doesn't match target
Warning if drill combinations might not work well together
UX Improvements:
Preview cards for suggested drills
Quick filters for common scenarios
Visual timeline representation
Drag-and-drop interface for reordering
Does this align with your vision? Would you like me to elaborate on any of these points? Once you've clarified any questions, I can provide a technical approach for implementation.

<<<me>>>
1: Include phase of season, practice goals, total time available, and skill of team in the plans yes. 
Will need to add skill to the practice plan db to match what is in drills table
2: 
- Yes, tooltips should be good. 
- It should have the prefilled things like participants and skill level but nothing else, otherwise just regular filterpanel stuff 
- no not for now
3: 
-To start with we can do equal time between sections, but I might adjust that in the future
- The timeline should show the total time of the practice in addition to the sections yes. 
- Gaps between sections or drills that can be added, similar to how it's done now probably but open to suggestion
- No other than >0  <total scheduled practice length
4: 
Yes parallel, can draw on our work elsewhere
Yes should have a mini timeline to provide context, can echo our timeline component
Not yet, but in future may want to give popular combos
Yes allow partial
5: After it's completed, it should be created into the curent practice plan page, we should only be changing that mimilally and only in ways that dont break the existing flow that this will live alongside

Suggestion:
1:
- yes
- yes
- yes

2:
- not now, they can copy a plan
- not suggestions but it should be natural in the ui to drag a drills length to the proper amount to hit the target time.
- no


3: 
we have that, can use
possibly, but not right now
we have a timeline representation we can leverage
yes

This does, please give a technical plan that includes every single detail we need to do, including the things I've just answered, and details which code files to create and change (don't write the code just yet) but describe the code you will need to write

Please output to a new markdown file


/end of plain language description

# Implementation Status

## ✅ Phase 1: Database Changes
- Created practice_plan_drafts table
- Added phase_of_season and skill_level columns to practice_plans table
- Added necessary indexes

## ✅ Phase 2: Store Creation
- Created wizardStore.js with:
  - Basic info state management
  - Section management
  - Timeline management
  - Step tracking
  - Draft saving functionality
- Created wizardValidation.js with:
  - Validation functions for each step
  - Real-time validation
  - Error state management

## ✅ Phase 3: Component Structure
Created all necessary components:
- `+layout.svelte`: Common layout with progress bar
- `basic-info/+page.svelte`: Basic information form
- `sections/+page.svelte`: Section selection and ordering
- `timeline/+page.svelte`: Timeline arrangement
- `drills/+page.svelte`: Drill selection for each section
- `overview/+page.svelte`: Final overview and submission

## ✅ Phase 4: API Implementation
- Created server endpoints for:
  - Loading drills
  - Managing drafts (save/load/delete)
  - Final plan submission


## 🚧 Phase 5: UI Polish
Still needed:
1. Consistent styling across all steps
2. Mobile responsiveness
3. Loading states
4. Error handling and user feedback
5. Accessibility improvements

## 🚧 Phase 6: Documentation
Still needed:
1. User documentation
2. Technical documentation
3. Database schema documentation
4. API documentation

# Next Steps

1. Add loading states and error handling
2. Improve mobile responsiveness
3. Add accessibility features
4. Write documentation
5. Test with real users

# Technical Considerations

## State Management
- Using Svelte stores for wizard state
- Auto-save functionality implemented
- Navigation guards in place
- Draft versioning system ready

## Performance
- Lazy loading of drill data
- Optimized timeline calculations
- Efficient drag-and-drop implementation
- Smart component updates

## UX Requirements
- Smooth step transitions
- Clear validation feedback
- Responsive design
- Intuitive drill selection
- Context-aware navigation

``` 