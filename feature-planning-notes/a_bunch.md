
## Section Management

### 1. Section Reordering
**Files Needed**:
- `src/routes/practice-plans/PracticePlanForm.svelte`

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
- `src/routes/practice-plans/viewer/DrillCard.svelte`

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


