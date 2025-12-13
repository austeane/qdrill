# DrillForm Toggle Validation Errors Don't Clear

## Summary
When clicking toggle buttons (Drill Type, Skill Level, Positions) after a validation error, the error message remains visible even though the selection was made.

## Severity
**LOW** - Cosmetic bug only; form submission works correctly

## Discovered
December 12, 2025 - Production testing via Playwright MCP browser automation

## Error Details
1. User submits form without selecting required toggle fields
2. Validation errors appear: "At least one drill type is required", etc.
3. User clicks a toggle button to make a selection
4. The button shows `.selected` class (visually selected)
5. BUT the error message remains visible
6. Form submission still works correctly if user ignores the stale error

## Steps to Reproduce
1. Navigate to https://www.qdrill.app/drills/new
2. Fill in name and description fields
3. Click "Create Drill" without selecting any toggles
4. Observe validation errors appear
5. Click a toggle button (e.g., "Skill-focus" under Drill Type)
6. Observe button is highlighted/selected BUT error message persists

## Root Cause Analysis

### Code Location
`src/routes/drills/DrillForm.svelte`

### The Bug
The form uses separate Svelte stores for field values and errors:

```javascript
// Field stores (updated on toggle click)
let drill_type = writable(drill.drill_type ?? []);
let skill_level = writable(drill.skill_level ?? []);
let positions_focused_on = writable(drill.positions_focused_on ?? []);

// Errors store (only updated during validateForm())
let errors = writable({});
```

The `toggleSelection` function updates the field store:
```javascript
function toggleSelection(store, value) {
  store.update((selected) => {
    if (selected.includes(value)) {
      return selected.filter((item) => item !== value);
    } else {
      return [...selected, value];
    }
  });
}
```

But it doesn't clear the corresponding error. Errors are only re-evaluated when `validateForm()` is called during form submission.

### The Fix
Add reactive statements to clear errors when field values change:

```javascript
// Add after the errors store declaration
$: if ($drill_type.length > 0 && $errors.drill_type) {
  errors.update(e => {
    const { drill_type, ...rest } = e;
    return rest;
  });
}

$: if ($skill_level.length > 0 && $errors.skill_level) {
  errors.update(e => {
    const { skill_level, ...rest } = e;
    return rest;
  });
}

$: if ($positions_focused_on.length > 0 && $errors.positions_focused_on) {
  errors.update(e => {
    const { positions_focused_on, ...rest } = e;
    return rest;
  });
}
```

Alternative: Modify `toggleSelection` to accept the error key and clear it:
```javascript
function toggleSelection(store, value, errorKey) {
  store.update((selected) => {
    if (selected.includes(value)) {
      return selected.filter((item) => item !== value);
    } else {
      return [...selected, value];
    }
  });
  // Clear error if selection is now valid
  if (errorKey) {
    errors.update(e => {
      const { [errorKey]: _, ...rest } = e;
      return rest;
    });
  }
}
```

## Resolution Steps
1. Add reactive error clearing to `DrillForm.svelte`
2. Test by triggering validation errors then selecting toggles
3. Verify errors clear immediately after selection

## Related Files
- `src/routes/drills/DrillForm.svelte` - Main form component

## Notes
- This is a Svelte reactivity pattern issue, not a Svelte 5 migration issue
- Similar patterns may exist in other forms (FormationForm, etc.)
- Consider creating a reusable form validation utility
