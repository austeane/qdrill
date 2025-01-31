# Task Organization and Implementation Plan

## Skill Management
### 1. Dynamic Skill Addition
**Files Needed**: 
- `src/routes/drills/DrillForm.svelte`
- `src/lib/stores/drillsStore.js`
- `src/lib/constants/skills.js`

**Description**: Enable dynamic addition of new skills during drill creation/editing. Should be able to press enter or a button to add the skill, or use the dropdown to select existing skill.

**Implementation Notes**:
- Check current skill handling in DrillForm.svelte (lines 32-63)

**Concerns**:
- Verify skill uniqueness before adding
- Normalize of skill names (caps and spacing)

### 1b. Bad inputs in skills

**Files Needed**: 
- `src/routes/api/skills/+server.js`
- `src/lib/constants/skills.js`
- `src/routes/drills/DrillForm.svelte`

**Description**: Fix inconsistent skill storage and normalization issues in the skills table.

**Issues**:
- Inconsistent casing (e.g., "Close outs" vs "close outs")
- Skills stored as JSON strings instead of plain text
- Duplicate skills with different casing
- Inconsistent normalization across entry points

**Implementation Notes**:
- Add skill name normalization (case, whitespace)
- Clean up JSON string entries and merge duplicates
- Update DrillForm to handle skills consistently
- Add validation to prevent future bad inputs
- Delete from db bad entries

**Concerns**:
- Maintain compatibility with existing drills
- Handle migration of existing skills data

Skill column from skills table:
Cuts
Close outs
Positioning
close outs
marked defence
throwbacks
throwing
picks
zone defence
driving
shooting
catching (chasers)
catching (beaters)
dodgeball blocks
dodging
communication
timing
tackling
tracking
passing
positioning
decision making
speed
agility
offence
defence
Ball carrying
Wing
Timing
Communication
Throwing
Offence
Defence
Tackling
Tracking
Shooting
Decision making
Strips
Driving
Agility
Speed
{"skill":"Offence","usage_count":3,"isPredefined":true}
{"skill":"Throwing","usage_count":4,"isPredefined":true}
{"skill":"{\"skill\":\"Close outs\",\"usage_count\":2,\"isPredefined\":true}","usage_count":1,"isPredefined":false}
{"skill":"Agility","usage_count":1,"isPredefined":true}
{"skill":"Reaction time","usage_count":0,"isPredefined":true}
{"skill":"Close outs","usage_count":2,"isPredefined":true}
Passing
Catching (chasers)

## UI/UX Improvements




### 3. Save Feedback
**Files Needed**:
- `src/routes/drills/DrillForm.svelte` (handles save operations)

**Description**: No visual feedback during drill save operations.
## Search and Selection Issues

### 1. Skills Search Fix
**Files Needed**:
- `src/routes/drills/DrillForm.svelte` (contains skills search and selection UI)
- `src/lib/stores/drillsStore.js` (contains skills filtering logic)
- `src/components/FilterPanel.svelte` (for reference implementation of skills filtering)

**Description**: Fix non-functioning skills search functionality.

**Implementation Notes**:
- Current implementation includes:
  - Skills search input with suggestions dropdown
  - Skills selection modal with search functionality
  - Skills store with filtering logic
- Need to fix:
  - Event handlers in DrillForm.svelte (lines 183-260)
  - Search and filtering logic in drillsStore.js
  - Suggestion display and selection UI
- Consider using FilterPanel.svelte's implementation as reference:
  - Uses ThreeStateCheckbox for selection
  - Implements debounced search
  - Handles keyboard navigation

**Concerns**:
- Verify event handler bindings
- Ensure proper state updates in store
- Test search with various input patterns
- Consider case sensitivity handling
- Add proper error handling for failed searches
- Test with large datasets
- Ensure proper cleanup of event listeners

### 2. Skills Dropdown Format
**Files Needed**:
- `src/routes/drills/DrillForm.svelte` (contains skills dropdown)
- `src/lib/constants/skills.js` (contains predefined skills)
- `src/components/FilterPanel.svelte` (for reference implementation)

**Description**: Remove "predefined" text in brackets from skills dropdown.

**Implementation Notes**:
- Current dropdown shows "[predefined]" text for predefined skills
- Need to update skill display format in:
  - Main skills input dropdown
  - Skills selection modal
  - Selected skills display
- Consider using FilterPanel.svelte's clean label display

**Concerns**:
- Maintain distinction between predefined and custom skills in data
- Update any sorting/filtering that relies on "[predefined]" text
- Ensure consistent display across all skill selection UIs
- Test with both predefined and custom skills
- Verify no impact on skill storage/retrieval

## Section Management

### 1. Section Reordering
**Files Needed**:
- `src/routes/practice-plans/wizard/sections/+page.svelte`
- `src/routes/practice-plans/wizard/timeline/+page.svelte`
- `src/lib/stores/wizardStore.js`
- `src/lib/stores/wizardValidation.js`

**Description**: Implement section reordering functionality.

**Implementation Notes**:
- Already has drag-and-drop handlers in sections/+page.svelte
- Timeline view also needs to support reordering
- Need to ensure order persistence in wizardStore
- Update visual feedback during drag operations
- Ensure auto-save functionality works with reordering
- Recalculate start times after reordering in timeline view

**Concerns**:
- Maintain consistency between sections and timeline views
- Handle edge cases in drag-and-drop
- Ensure proper state updates in store
- Consider mobile touch interactions

### 2. Drill Duration Editing
**Files Needed**:
- `src/routes/practice-plans/PracticePlanForm.svelte`
- `src/routes/practice-plans/wizard/drills/+page.svelte`
- `src/routes/practice-plans/viewer/DrillCard.svelte`
- `src/lib/stores/wizardStore.js`

**Description**: Enable editing of individual drill durations.

**Implementation Notes**:
- Duration input UI exists in DrillCard component
- Need to implement duration change handlers
- Update total section duration calculations
- Consider parallel drills duration handling
- Validate against section time limits
- Ensure proper store updates

**Concerns**:
- Validate duration against section constraints
- Update parallel drill group durations consistently
- Handle duration changes in both form and wizard views
- Consider UX for duration input (spinner vs direct input)

### 3. Drill Ordering Preservation
**Files Needed**:
- `src/routes/practice-plans/PracticePlanForm.svelte`
- `src/routes/practice-plans/wizard/drills/+page.svelte`
- `src/routes/api/practice-plans/[id]/+server.js`
- Database schema (practice_plan_drills table with order_in_plan column)

**Description**: Fix issue with drill order not being preserved.

**Implementation Notes**:
- practice_plan_drills table has order_in_plan column
- Need to ensure order is saved in API calls
- Update drag-and-drop handlers to maintain order
- Consider parallel drill groups in ordering
- Implement proper order handling in both form and wizard views

**Concerns**:
- Ensure order_in_plan is properly used in database operations
- Handle order updates in transactions to prevent race conditions
- Consider section-specific ordering
- Maintain order consistency with parallel drill groups
- Review save/load pipeline for order preservation
- Consider bulk order updates vs individual updates

## Formatting Issues

### 1. Practice Plan Description Formatting
**Files Needed**:
- `src/routes/practice-plans/wizard/basic-info/+page.svelte` (contains rich text editor implementation)
- `src/routes/practice-plans/PracticePlanForm.svelte` (contains description field)
- `src/routes/practice-plans/wizard/overview/+page.svelte` (displays formatted description)
- `src/routes/practice-plans/[id]/+page.svelte` (displays formatted description)

**Description**: Fix formatting issues in saved practice plan descriptions.

**Implementation Notes**:
- Current implementation:
  - Basic info page uses TinyMCE editor
  - Form uses plain textarea
  - Overview and detail pages display raw description
- Need to fix:
  - Ensure consistent editor usage across all description inputs
  - Properly save formatted content in database
  - Render formatted content in overview and detail views
- Reference implementation from basic-info/+page.svelte:
  ```svelte
  <Editor
      apiKey="your-tinymce-api-key"
      init={{
          height: 300,
          menubar: false,
          plugins: [
              'advlist', 'autolink', 'lists', 'link', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code',
              'insertdatetime', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help'
      }}
      value={$basicInfo.description}
      on:change={handleDescriptionChange}
  />
  ```
- Add proper content sanitization and storage

**Concerns**:
- Ensure consistent editor configuration across all instances
- Properly sanitize HTML content before storage
- Handle migration of existing plain text descriptions
- Verify proper rendering in all views
- Consider mobile editing experience
- Test copy/paste behavior from various sources
- Ensure proper handling of special characters
- Add proper error handling for malformed content

## Drill Creation Issues


