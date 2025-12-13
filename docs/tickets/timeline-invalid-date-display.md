# Timeline Invalid Date Display Bug

## Summary
Season timeline section labels show "Invalid Date - Invalid Date" instead of actual date ranges.

## Severity
**MEDIUM** - UI bug affecting readability, functionality still works

## Discovered
December 12, 2025 - Production testing via Playwright MCP browser automation

## Error Details
Section labels in the timeline view display:
```
"Pre-Season: Invalid Date - Invalid Date"
"Regular Season: Invalid Date - Invalid Date"
"Post-Season: Invalid Date - Invalid Date"
```

Instead of expected:
```
"Pre-Season: Jul 31 - Aug 14"
"Regular Season: Aug 15 - Oct 15"
"Post-Season: Oct 16 - Oct 30"
```

## Steps to Reproduce
1. Navigate to https://www.qdrill.app/teams/[team-slug]/season
2. Click on "Timeline" tab or navigate to timeline view
3. Observe section labels in the timeline display "Invalid Date"

## Root Cause Analysis

### Code Location
`src/lib/components/season/SeasonTimelineViewer.svelte`

### The Bug
The `parseISODateLocal` function expects dates in `YYYY-MM-DD` format but receives full ISO strings with time component from JSON serialization.

```javascript
// Current implementation (lines 43-48)
function parseISODateLocal(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const [y, m, d] = s.split('-').map(Number);  // BUG: splits full ISO string
  return new Date(y, m - 1, d);
}
```

When the API returns dates, they're serialized as full ISO strings:
```
"2025-07-31T00:00:00.000Z"
```

The split operation produces:
```javascript
s.split('-') = ["2025", "07", "31T00:00:00.000Z"]
Number("31T00:00:00.000Z") = NaN
new Date(2025, 6, NaN) = Invalid Date
```

### The Fix
Update `parseISODateLocal` to handle full ISO strings:

```javascript
function parseISODateLocal(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  // Handle full ISO strings by taking just the date part
  const dateStr = s.includes('T') ? s.split('T')[0] : s;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
```

Alternative fix using native Date parsing:
```javascript
function parseISODateLocal(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const date = new Date(s);
  // Return a local date to avoid timezone issues
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
```

## Resolution Steps
1. Update `parseISODateLocal` in `SeasonTimelineViewer.svelte`
2. Test with both date string formats (`YYYY-MM-DD` and full ISO)
3. Verify section labels display correctly

## Related Files
- `src/lib/components/season/SeasonTimelineViewer.svelte` - Contains the buggy function
- `src/routes/api/seasons/[seasonId]/sections/+server.js` - API endpoint returning dates
- `src/lib/server/services/seasonSectionService.js` - Service layer

## Testing
After fix, verify:
1. Section labels show proper dates
2. Timeline markers and events still position correctly
3. No timezone-related date shifts
