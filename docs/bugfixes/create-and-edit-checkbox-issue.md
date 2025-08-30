# Create and Edit Immediately Checkbox Issue

## Issue Description
The "Create and edit immediately" checkbox in the Teams practice creation dialog was not working. When users clicked the checkbox, it would not stay checked and the button text would not change from "Create Practice" to "Create & Edit".

## Root Cause
The issue was in the `Checkbox.svelte` component (`/src/lib/components/ui/Checkbox.svelte`). The component was only forwarding the `on:change` event, but Svelte's `bind:checked` directive requires additional events (`on:input` and `on:click`) to properly sync the checkbox state with the bound variable in the parent component.

## Location of Issue
- **Affected Component**: `/src/lib/components/season/desktop/CreatePracticeDialog.svelte`
- **Root Cause Component**: `/src/lib/components/ui/Checkbox.svelte`
- **User Path**: Teams > Season > Schedule View > Click "Practice" button > Checkbox in dialog

## Solution
Added missing event handlers to the Checkbox component to properly forward all events needed by Svelte's binding mechanism:

```svelte
<!-- Before -->
<input
  {id}
  type="checkbox"
  bind:checked
  {disabled}
  class="checkbox-input"
  class:error={error}
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
  on:change
  {...$$restProps}
/>

<!-- After -->
<input
  {id}
  type="checkbox"
  bind:checked
  {disabled}
  class="checkbox-input"
  class:error={error}
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
  on:change
  on:input
  on:click
  {...$$restProps}
/>
```

## Impact
This fix ensures that:
1. The checkbox properly toggles between checked and unchecked states
2. The bound `createAndEdit` variable in `CreatePracticeDialog.svelte` updates correctly
3. The button text dynamically changes between "Create Practice" and "Create & Edit" based on checkbox state
4. When checked, clicking the button will create the practice and immediately navigate to the edit page

## Testing
Tested the fix by:
1. Navigating to Teams > Season > Schedule view
2. Clicking the "Practice" button to open the dialog
3. Clicking the "Create and edit immediately" checkbox
4. Verifying the checkbox stays checked
5. Verifying the button text changes to "Create & Edit"

## Prevention
To prevent similar issues in the future:
- Ensure all form input components properly forward all necessary events
- Test checkbox components with `bind:checked` directive during development
- Consider creating a test suite for UI components that verifies event forwarding