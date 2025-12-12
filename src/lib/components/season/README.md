# Season Management Components

This directory contains the redesigned season management system for QDrill. The new architecture provides a clean, modular approach to managing sports seasons, practice schedules, and team events.

## Quick Start

```svelte
<script>
	import SeasonShell from '$lib/components/season/SeasonShell.svelte';
	import Overview from '$lib/components/season/views/Overview.svelte';
	import Schedule from '$lib/components/season/views/Schedule.svelte';
	import Manage from '$lib/components/season/views/Manage.svelte';

	let activeTab = 'overview';
	let season = {
		/* season data */
	};
	let sections = [
		/* season sections */
	];
	let markers = [
		/* events/milestones */
	];
	let practices = [
		/* practice plans */
	];
</script>

<SeasonShell
	{season}
	{sections}
	{markers}
	{practices}
	isAdmin={true}
	teamId="team-123"
	bind:activeTab
>
	{#if activeTab === 'overview'}
		<Overview {...props} />
	{:else if activeTab === 'schedule'}
		<Schedule {...props} />
	{:else if activeTab === 'manage'}
		<Manage {...props} />
	{/if}
</SeasonShell>
```

## Component Overview

### Core Components

#### `SeasonShell.svelte`

The main container that provides responsive navigation and layout.

**Features:**

- Responsive navigation (bottom tabs on mobile, top tabs on desktop)
- Automatic device detection
- Season header with date range
- Admin-only tab visibility

**Props:**

- `season`: Season object with `name`, `start_date`, `end_date`
- `sections`: Array of season sections (training phases)
- `markers`: Array of events/milestones
- `practices`: Array of practice plans
- `isAdmin`: Boolean for admin features
- `teamId`: Team identifier
- `activeTab`: Current tab ('overview' | 'schedule' | 'manage')

### View Components

#### `views/Overview.svelte`

Dashboard view showing season summary and quick actions.

**Features:**

- Section progress cards
- Upcoming events timeline
- Quick practice creation
- Timeline visualization link

#### `views/Schedule.svelte`

Calendar-based practice scheduling interface.

**Features:**

- Week and month view modes
- Drag-to-create practices
- Visual event indicators
- Responsive grid layout

#### `views/Manage.svelte`

Administrative interface for managing sections and events.

**Features:**

- Drag-to-reorder sections
- CRUD operations for sections/events
- Visual color coding
- Date range management

### Utility Components

#### `SeasonTimelineViewer.svelte`

Read-only timeline visualization for the full season.

**Features:**

- Zoomable timeline
- Stacked sections
- Event markers
- Practice indicators
- Auto-scroll to today

### Mobile Components

Located in the `mobile/` subdirectory:

- `CreatePracticeSheet.svelte` - Bottom sheet for creating practices
- `EditSectionSheet.svelte` - Bottom sheet for section editing
- `EditMarkerSheet.svelte` - Bottom sheet for event editing

These components use the `BottomSheet` UI component for mobile-friendly forms.

## Data Structures

### Season Object

```javascript
{
  id: 'season-123',
  name: 'Spring 2024',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  is_active: true,
  team_id: 'team-123'
}
```

### Section Object

```javascript
{
  id: 'section-456',
  name: 'Fundamentals',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  color: '#3B82F6',
  order: 0,
  season_id: 'season-123'
}
```

### Marker Object

```javascript
{
  id: 'marker-789',
  type: 'tournament',
  name: 'Regional Championship',
  date: '2024-02-15',
  end_date: '2024-02-17', // optional for multi-day
  color: '#8B5CF6',
  season_id: 'season-123'
}
```

### Practice Object

```javascript
{
  id: 'practice-012',
  title: 'Morning Practice',
  scheduled_date: '2024-01-15',
  start_time: '09:00:00',
  status: 'published', // or 'draft'
  season_id: 'season-123',
  team_id: 'team-123'
}
```

## Event Handling

### Common Events

All view components emit these events:

- `sectionChange` - When sections are created/updated/deleted
- `markerChange` - When markers are created/updated/deleted
- `practiceCreated` - When a new practice is created
- `change` - Generic change event for any data modification

### Event Examples

```svelte
<Overview
	on:sectionChange={handleSectionChange}
	on:markerChange={handleMarkerChange}
	on:createPractice={(e) => {
		const { date, sectionId } = e.detail;
		// Handle practice creation
	}}
/>
```

## Responsive Design

The components use the `deviceStore` for responsive behavior:

```svelte
import {device} from '$lib/stores/deviceStore';

{#if $device.isMobile}
	<!-- Mobile layout -->
{:else}
	<!-- Desktop layout -->
{/if}
```

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Theming

Components support dark mode via CSS custom properties:

```css
/* Light mode (default) */
--bg-primary: #f9fafb;
--text-primary: #111827;
--border-color: #e5e7eb;

/* Dark mode */
:global(.dark) {
	--bg-primary: #111827;
	--text-primary: #f3f4f6;
	--border-color: #374151;
}
```

## Best Practices

1. **Data Loading**: Load all season data in the parent component and pass down
2. **State Management**: Use bind:property for two-way binding on arrays
3. **Event Handling**: Always emit events for data changes
4. **Mobile First**: Design for mobile, enhance for desktop
5. **Accessibility**: Use proper ARIA labels and keyboard navigation

## Migration from Old Timeline

If migrating from `SeasonTimelineEnhanced`:

1. Replace the timeline component with `SeasonShell` and view components
2. Move drag-and-drop creation to the Schedule view
3. Use Manage view for section/marker CRUD operations
4. Link to timeline viewer for visualization needs

## API Integration

Components expect these API endpoints:

```
GET    /api/seasons/{id}/sections
POST   /api/seasons/{id}/sections
PATCH  /api/seasons/{id}/sections/{sectionId}
DELETE /api/seasons/{id}/sections/{sectionId}

GET    /api/seasons/{id}/markers
POST   /api/seasons/{id}/markers
PATCH  /api/seasons/{id}/markers/{markerId}
DELETE /api/seasons/{id}/markers/{markerId}

POST   /api/seasons/{id}/instantiate
```

## Examples

### Basic Implementation

```svelte
<!-- routes/teams/[teamId]/season/+page.svelte -->
<script>
	import SeasonShell from '$lib/components/season/SeasonShell.svelte';
	import Overview from '$lib/components/season/views/Overview.svelte';
	// ... other imports

	export let data;

	let activeTab = 'overview';
	let sections = [];
	let markers = [];
	let practices = [];

	// Load data...
</script>

<SeasonShell
	season={data.season}
	{sections}
	{markers}
	{practices}
	isAdmin={data.userRole === 'admin'}
	teamId={data.teamId}
	bind:activeTab
>
	<!-- Content based on activeTab -->
</SeasonShell>
```

### Custom Tab Implementation

```svelte
<SeasonShell {...props}>
	{#if activeTab === 'custom'}
		<div class="custom-view">
			<!-- Your custom content -->
		</div>
	{:else}
		<!-- Default views -->
	{/if}
</SeasonShell>
```

## Troubleshooting

### Common Issues

1. **Tabs not switching**: Ensure `bind:activeTab` is used
2. **Data not updating**: Check event handlers are connected
3. **Mobile layout issues**: Verify deviceStore is imported
4. **Missing styles**: Ensure global styles are loaded

### Debug Mode

Enable debug logging:

```javascript
// In component
const DEBUG = true;

function log(...args) {
	if (DEBUG) console.log('[SeasonComponent]', ...args);
}
```

## Future Enhancements

- Bulk practice operations
- Season templates
- Export functionality
- Real-time collaboration
- Analytics dashboard

## Contributing

When adding new features:

1. Follow the existing component structure
2. Emit appropriate events for data changes
3. Support both mobile and desktop layouts
4. Include TypeScript types
5. Add unit tests
6. Update this documentation
