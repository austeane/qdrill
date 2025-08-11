## Phase 6: Week View - Implementation Ticket

### Overview
Create a focused week view for coaches to quickly see and manage the upcoming week's practices, providing an at-a-glance overview with quick actions for common tasks.

### User Stories
- As a coach, I want to see this week's practices at a glance so I can prepare efficiently
- As a coach, I want to quickly navigate between weeks during the season
- As a coach, I want to see markers/events that affect this week's schedule
- As a team member, I want to see published practices for the upcoming week

### Prerequisites
- Phase 5 completed (Recurrence and batch generation working)
- Practice plans with draft/published status
- Season timeline with practices and markers
- Team permissions system operational

### UI Components

#### 1. Week View Component (`src/lib/components/season/WeekView.svelte`)
```svelte
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let season;
  export let practices = [];
  export let markers = [];
  export let currentWeek = new Date();
  export let isAdmin = false;
  
  let weekStart;
  let weekEnd;
  let weekDays = [];
  let groupedPractices = {};
  
  $: {
    // Calculate week boundaries
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    weekStart = startOfWeek;
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    weekEnd = endOfWeek;
    
    // Generate week days
    weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    
    // Group practices by date
    groupedPractices = {};
    practices.forEach(practice => {
      const dateKey = practice.scheduled_date;
      if (!groupedPractices[dateKey]) {
        groupedPractices[dateKey] = [];
      }
      groupedPractices[dateKey].push(practice);
    });
  }
  
  function navigateWeek(direction) {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    currentWeek = newWeek;
  }
  
  function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  function getPracticeForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return groupedPractices[dateStr] || [];
  }
  
  function getMarkersForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    return markers.filter(m => {
      const start = new Date(m.start_date);
      const end = m.end_date ? new Date(m.end_date) : start;
      return date >= start && date <= end;
    });
  }
  
  async function quickCreatePractice(date) {
    const dateStr = date.toISOString().split('T')[0];
    const response = await fetch(`/api/seasons/${season.id}/instantiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_date: dateStr })
    });
    
    if (response.ok) {
      const plan = await response.json();
      goto(`/practice-plans/${plan.id}/edit`);
    }
  }
</script>

<div class="week-view">
  <!-- Week navigation -->
  <div class="week-header">
    <button on:click={() => navigateWeek(-1)}>← Previous</button>
    <h2>Week of {formatDate(weekStart)}</h2>
    <button on:click={() => navigateWeek(1)}>Next →</button>
    <button on:click={() => currentWeek = new Date()}>Today</button>
  </div>
  
  <!-- Week grid -->
  <div class="week-grid">
    {#each weekDays as day}
      {@const practices = getPracticeForDate(day)}
      {@const markers = getMarkersForDate(day)}
      {@const isToday = day.toDateString() === new Date().toDateString()}
      {@const isPast = day < new Date()}
      
      <div class="day-column" class:today={isToday} class:past={isPast}>
        <div class="day-header">
          <span class="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
          <span class="day-date">{day.getDate()}</span>
        </div>
        
        <!-- Markers -->
        {#if markers.length > 0}
          <div class="day-markers">
            {#each markers as marker}
              <div class="marker marker-{marker.type}">
                {marker.title}
              </div>
            {/each}
          </div>
        {/if}
        
        <!-- Practices -->
        <div class="day-practices">
          {#if practices.length > 0}
            {#each practices as practice}
              <div class="practice-card status-{practice.status}">
                <div class="practice-time">
                  {practice.start_time || season.default_start_time}
                </div>
                <div class="practice-name">
                  {practice.name}
                </div>
                <div class="practice-actions">
                  {#if isAdmin}
                    <a href="/practice-plans/{practice.id}/edit">Edit</a>
                    {#if practice.status === 'draft'}
                      <button on:click={() => publishPractice(practice.id)}>
                        Publish
                      </button>
                    {/if}
                  {:else if practice.status === 'published'}
                    <a href="/practice-plans/{practice.id}">View</a>
                  {/if}
                </div>
              </div>
            {/each}
          {:else if isAdmin && !isPast}
            <button 
              class="quick-add"
              on:click={() => quickCreatePractice(day)}
            >
              + Add Practice
            </button>
          {:else}
            <div class="no-practice">No practice</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Week summary -->
  <div class="week-summary">
    <div class="summary-stat">
      <span class="stat-value">{practices.length}</span>
      <span class="stat-label">Total Practices</span>
    </div>
    <div class="summary-stat">
      <span class="stat-value">
        {practices.filter(p => p.status === 'published').length}
      </span>
      <span class="stat-label">Published</span>
    </div>
    <div class="summary-stat">
      <span class="stat-value">
        {practices.filter(p => p.status === 'draft').length}
      </span>
      <span class="stat-label">Drafts</span>
    </div>
  </div>
</div>
```

#### 2. Week View Page (`src/routes/teams/[teamId]/season/week/+page.svelte`)
```svelte
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import WeekView from '$lib/components/season/WeekView.svelte';
  
  export let data;
  
  let season = null;
  let practices = [];
  let markers = [];
  let currentWeek = new Date();
  let loading = true;
  
  // Parse week from URL query params
  $: if ($page.url.searchParams.has('week')) {
    currentWeek = new Date($page.url.searchParams.get('week'));
  }
  
  onMount(async () => {
    await loadWeekData();
  });
  
  async function loadWeekData() {
    loading = true;
    
    // Get active season
    const seasonRes = await fetch(`/api/teams/${$page.params.teamId}/seasons/active`);
    if (seasonRes.ok) {
      season = await seasonRes.json();
      
      // Calculate week range
      const weekStart = new Date(currentWeek);
      weekStart.setDate(currentWeek.getDate() - currentWeek.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Get practices for the week
      const practicesRes = await fetch(
        `/api/teams/${$page.params.teamId}/practice-plans?` +
        `start_date=${weekStart.toISOString().split('T')[0]}&` +
        `end_date=${weekEnd.toISOString().split('T')[0]}`
      );
      if (practicesRes.ok) {
        const data = await practicesRes.json();
        practices = data.plans || [];
      }
      
      // Get markers for the week
      const markersRes = await fetch(`/api/seasons/${season.id}/markers`);
      if (markersRes.ok) {
        markers = await markersRes.json();
      }
    }
    
    loading = false;
  }
  
  $: if (currentWeek) {
    loadWeekData();
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold">Week View</h1>
    <div class="flex gap-4 mt-4">
      <a 
        href="/teams/{$page.params.teamId}/season"
        class="text-blue-500 hover:underline"
      >
        ← Season Overview
      </a>
      <a 
        href="/teams/{$page.params.teamId}/season/recurrences"
        class="text-blue-500 hover:underline"
      >
        Manage Recurrences
      </a>
    </div>
  </div>
  
  {#if loading}
    <div class="text-center py-12">Loading week data...</div>
  {:else if season}
    <WeekView
      {season}
      {practices}
      {markers}
      bind:currentWeek
      isAdmin={data.userRole === 'admin'}
    />
  {:else}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      No active season found.
    </div>
  {/if}
</div>
```

### API Enhancements

#### 1. Week Data Endpoint (`src/routes/api/teams/[teamId]/week-data/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
import { seasonMarkerService } from '$lib/server/services/seasonMarkerService';
import { teamMemberService } from '$lib/server/services/teamMemberService';

export async function GET({ locals, params, url }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const member = await teamMemberService.getMember(params.teamId, locals.user.id);
  if (!member) {
    return json({ error: 'Not a team member' }, { status: 403 });
  }
  
  const weekStart = url.searchParams.get('start');
  const weekEnd = url.searchParams.get('end');
  
  // Get practices for the week
  const practices = await practicePlanService.getByDateRange(
    params.teamId,
    weekStart,
    weekEnd,
    member.role === 'admin' ? 'all' : 'published'
  );
  
  // Get markers
  const markers = await seasonMarkerService.getByDateRange(
    params.teamId,
    weekStart,
    weekEnd
  );
  
  return json({
    practices,
    markers,
    stats: {
      total: practices.length,
      published: practices.filter(p => p.status === 'published').length,
      draft: practices.filter(p => p.status === 'draft').length
    }
  });
}
```

### Mobile Responsiveness
- Stack day columns vertically on mobile
- Swipe gestures for week navigation
- Condensed practice cards for small screens
- Touch-friendly action buttons

### Features
1. **Week Navigation**
   - Previous/Next week buttons
   - Jump to today button
   - URL updates with week parameter for bookmarking

2. **Day View**
   - Visual distinction for today and past days
   - Markers/events displayed prominently
   - Practice status indicators (draft/published)
   - Quick add practice button for admins

3. **Practice Actions**
   - Quick edit link
   - One-click publish for drafts
   - View link for team members

4. **Week Summary**
   - Total practices count
   - Published vs draft breakdown
   - Quick stats at a glance

### Styling Considerations
```css
.week-view {
  @apply bg-white rounded-lg shadow;
}

.week-grid {
  @apply grid grid-cols-7 gap-2;
}

.day-column {
  @apply border rounded p-2 min-h-[200px];
}

.day-column.today {
  @apply bg-blue-50 border-blue-300;
}

.day-column.past {
  @apply opacity-60;
}

.practice-card {
  @apply border rounded p-2 mb-2;
}

.practice-card.status-draft {
  @apply bg-yellow-50 border-yellow-300;
}

.practice-card.status-published {
  @apply bg-green-50 border-green-300;
}

.marker {
  @apply text-xs px-2 py-1 rounded mb-1;
}

.marker-tournament {
  @apply bg-red-100 text-red-800;
}

.marker-scrimmage {
  @apply bg-blue-100 text-blue-800;
}

.marker-break {
  @apply bg-gray-100 text-gray-800;
}
```

### Testing Requirements
1. **Unit Tests**
   - Week calculation logic
   - Date grouping functions
   - Navigation state management

2. **Integration Tests**
   - Week data loading
   - Practice filtering by date range
   - Permission-based visibility

3. **E2E Tests**
   - Week navigation flow
   - Quick practice creation
   - Mobile responsiveness

### Success Metrics
- Coaches can view and manage weekly practices in < 2 clicks
- Page load time < 500ms for week data
- Mobile-friendly with 100% of features accessible
- Reduced time to find and edit upcoming practices

### Implementation Notes
- Leverage existing practice plan and marker services
- Reuse permission checks from team member service
- Consider caching week data for performance
- Add keyboard shortcuts for power users (arrow keys for navigation)