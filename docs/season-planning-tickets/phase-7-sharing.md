## Phase 7: Sharing - ICS Feed, Public Links, and Member Access

### Overview
Implement comprehensive sharing capabilities for season data, including ICS calendar feeds, public share links with token-based access, and proper member read-only views. This enables teams to share their schedules with parents, players, and other stakeholders.

### User Stories
- As a coach, I want to share our practice schedule via calendar subscription so parents can stay informed
- As a team admin, I want to generate shareable links for our season schedule
- As a team member, I want read-only access to see published practices and events
- As a parent, I want to subscribe to the team calendar in my phone's calendar app

### Prerequisites
- Phase 6 completed (Week view working)
- Published/draft practice distinction implemented
- Season markers and sections in place
- Token generation for seasons already exists in database

### Implementation Components

### 1. ICS Service (`src/lib/server/services/icsService.js`)
```javascript
import ical from 'ical-generator';
import { practicePlanService } from './practicePlanService';
import { seasonMarkerService } from './seasonMarkerService';
import { seasonService } from './seasonService';
import { teamService } from './teamService';

class ICSService {
  /**
   * Generate ICS calendar for a season
   * @param {string} seasonId - Season ID
   * @param {string} token - ICS token for validation
   * @returns {string} ICS calendar string
   */
  async generateSeasonCalendar(seasonId, token) {
    // Validate token
    const season = await seasonService.getById(seasonId);
    if (!season || season.ics_token !== token) {
      throw new Error('Invalid season or token');
    }
    
    // Get team for timezone
    const team = await teamService.getById(season.team_id);
    
    // Create calendar
    const calendar = ical({
      name: `${team.name} - ${season.name}`,
      timezone: team.timezone || 'America/New_York',
      prodId: '//QDrill//Season Calendar//EN',
      method: 'PUBLISH'
    });
    
    // Add published practices
    const practices = await practicePlanService.getBySeasonId(seasonId, 'published');
    
    for (const practice of practices) {
      const startDateTime = this.combineDateAndTime(
        practice.scheduled_date,
        practice.start_time || team.default_start_time,
        team.timezone
      );
      
      const duration = await practicePlanService.calculateTotalDuration(practice.id);
      
      calendar.createEvent({
        start: startDateTime,
        duration: duration * 60, // Convert minutes to seconds
        summary: practice.name || 'Team Practice',
        description: this.generatePracticeDescription(practice),
        location: practice.location || team.default_location,
        url: `${process.env.PUBLIC_URL}/practice-plans/${practice.id}`,
        categories: ['PRACTICE'],
        status: 'CONFIRMED'
      });
    }
    
    // Add markers as all-day or multi-day events
    const markers = await seasonMarkerService.getBySeason(seasonId);
    
    for (const marker of markers) {
      const event = {
        summary: marker.title,
        description: marker.notes,
        categories: [marker.type.toUpperCase()],
        allDay: true
      };
      
      if (marker.end_date) {
        // Multi-day event
        event.start = new Date(marker.start_date);
        event.end = new Date(marker.end_date);
      } else {
        // Single day event
        event.start = new Date(marker.start_date);
      }
      
      // Set color based on marker type
      switch(marker.type) {
        case 'tournament':
          event.color = 'red';
          break;
        case 'scrimmage':
          event.color = 'blue';
          break;
        case 'break':
          event.color = 'gray';
          break;
      }
      
      calendar.createEvent(event);
    }
    
    return calendar.toString();
  }
  
  /**
   * Combine date and time with timezone
   */
  combineDateAndTime(dateStr, timeStr, timezone) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create date in the team's timezone
    const date = new Date(year, month - 1, day, hours, minutes);
    
    // Return with timezone info
    return {
      date,
      tz: timezone
    };
  }
  
  /**
   * Generate practice description for ICS
   */
  generatePracticeDescription(practice) {
    let description = [];
    
    if (practice.sections && practice.sections.length > 0) {
      description.push('Sections:');
      practice.sections.forEach(section => {
        description.push(`- ${section.name} (${section.duration_minutes} min)`);
      });
    }
    
    if (practice.notes) {
      description.push('', 'Notes:', practice.notes);
    }
    
    description.push('', `View online: ${process.env.PUBLIC_URL}/practice-plans/${practice.id}`);
    
    return description.join('\n');
  }
  
  /**
   * Rotate ICS token for a season
   */
  async rotateICSToken(seasonId, userId) {
    const newToken = crypto.randomUUID();
    
    await seasonService.update(seasonId, {
      ics_token: newToken,
      updated_at: new Date()
    });
    
    return newToken;
  }
}

export const icsService = new ICSService();
```

### 2. ICS Calendar Endpoint (`src/routes/api/seasons/[seasonId]/calendar.ics/+server.js`)
```javascript
import { icsService } from '$lib/server/services/icsService';

export async function GET({ params, url }) {
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Token required', { status: 401 });
  }
  
  try {
    const icsContent = await icsService.generateSeasonCalendar(
      params.seasonId,
      token
    );
    
    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="season-calendar.ics"',
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('ICS generation error:', error);
    return new Response('Invalid token or season', { status: 404 });
  }
}
```

### 3. Share Management Endpoint (`src/routes/api/seasons/[seasonId]/share/+server.js`)
```javascript
import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService';
import { teamMemberService } from '$lib/server/services/teamMemberService';
import { icsService } from '$lib/server/services/icsService';

// GET - Get share links
export async function GET({ locals, params }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const season = await seasonService.getById(params.seasonId);
  if (!season) {
    return json({ error: 'Season not found' }, { status: 404 });
  }
  
  // Check admin permission
  const member = await teamMemberService.getMember(season.team_id, locals.user.id);
  if (!member || member.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }
  
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  
  return json({
    publicViewUrl: `${baseUrl}/seasons/${params.seasonId}/view?token=${season.public_view_token}`,
    icsUrl: `${baseUrl}/api/seasons/${params.seasonId}/calendar.ics?token=${season.ics_token}`,
    tokens: {
      publicView: season.public_view_token,
      ics: season.ics_token
    }
  });
}

// POST - Rotate tokens
export async function POST({ locals, params, request }) {
  if (!locals.user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const { tokenType } = await request.json();
  
  const season = await seasonService.getById(params.seasonId);
  if (!season) {
    return json({ error: 'Season not found' }, { status: 404 });
  }
  
  // Check admin permission
  const member = await teamMemberService.getMember(season.team_id, locals.user.id);
  if (!member || member.role !== 'admin') {
    return json({ error: 'Admin access required' }, { status: 403 });
  }
  
  let newToken;
  
  if (tokenType === 'ics') {
    newToken = await icsService.rotateICSToken(params.seasonId, locals.user.id);
  } else if (tokenType === 'public') {
    newToken = await seasonService.rotatePublicToken(params.seasonId, locals.user.id);
  } else {
    return json({ error: 'Invalid token type' }, { status: 400 });
  }
  
  return json({ 
    success: true, 
    newToken,
    message: `${tokenType} token rotated successfully`
  });
}
```

### 4. Public Season View (`src/routes/seasons/[seasonId]/view/+page.svelte`)
```svelte
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import SeasonTimeline from '$lib/components/season/SeasonTimeline.svelte';
  
  let season = null;
  let sections = [];
  let markers = [];
  let practices = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    
    if (!token) {
      error = 'Access token required';
      loading = false;
      return;
    }
    
    try {
      // Validate token and get season data
      const response = await fetch(
        `/api/seasons/${$page.params.seasonId}/public?token=${token}`
      );
      
      if (!response.ok) {
        throw new Error('Invalid or expired link');
      }
      
      const data = await response.json();
      season = data.season;
      sections = data.sections;
      markers = data.markers;
      practices = data.practices;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="text-center py-12">Loading season...</div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {error}
    </div>
  {:else if season}
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{season.team_name} - {season.name}</h1>
      <p class="text-gray-600 mt-2">
        Public view - showing published practices only
      </p>
    </div>
    
    <SeasonTimeline
      {season}
      {sections}
      {markers}
      existingPractices={practices}
      isAdmin={false}
      isPublicView={true}
    />
    
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="font-semibold mb-2">Subscribe to Calendar</h3>
      <p class="text-sm text-gray-600 mb-2">
        Copy this URL to subscribe in your calendar app:
      </p>
      <div class="flex items-center gap-2">
        <input
          type="text"
          value="{$page.url.origin}/api/seasons/{season.id}/calendar.ics?token={$page.url.searchParams.get('token')}"
          readonly
          class="flex-1 px-3 py-2 border rounded text-sm"
        />
        <button
          on:click={copyICSUrl}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Copy
        </button>
      </div>
    </div>
  {:else}
    <div>Season not found</div>
  {/if}
</div>
```

### 5. Share Settings Component (`src/lib/components/season/ShareSettings.svelte`)
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let season;
  export let shareUrls = {};
  
  const dispatch = createEventDispatcher();
  
  let copying = null;
  
  async function copyToClipboard(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      copying = type;
      setTimeout(() => copying = null, 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  }
  
  async function rotateToken(tokenType) {
    if (!confirm(`Rotate ${tokenType} token? Existing links will stop working.`)) {
      return;
    }
    
    dispatch('rotate', { tokenType });
  }
</script>

<div class="share-settings space-y-4">
  <div class="share-section">
    <h3 class="font-semibold mb-2">Public View Link</h3>
    <p class="text-sm text-gray-600 mb-2">
      Share this link for read-only access to the season timeline
    </p>
    <div class="flex items-center gap-2">
      <input
        type="text"
        value={shareUrls.publicViewUrl}
        readonly
        class="flex-1 px-3 py-2 border rounded text-sm"
      />
      <button
        on:click={() => copyToClipboard(shareUrls.publicViewUrl, 'public')}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {copying === 'public' ? '✓ Copied' : 'Copy'}
      </button>
      <button
        on:click={() => rotateToken('public')}
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Rotate
      </button>
    </div>
  </div>
  
  <div class="share-section">
    <h3 class="font-semibold mb-2">Calendar Subscription (ICS)</h3>
    <p class="text-sm text-gray-600 mb-2">
      Add to Google Calendar, Apple Calendar, Outlook, etc.
    </p>
    <div class="flex items-center gap-2">
      <input
        type="text"
        value={shareUrls.icsUrl}
        readonly
        class="flex-1 px-3 py-2 border rounded text-sm"
      />
      <button
        on:click={() => copyToClipboard(shareUrls.icsUrl, 'ics')}
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        {copying === 'ics' ? '✓ Copied' : 'Copy'}
      </button>
      <button
        on:click={() => rotateToken('ics')}
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Rotate
      </button>
    </div>
    
    <div class="mt-2 text-xs text-gray-500">
      <p>• Updates automatically when practices are published</p>
      <p>• Includes all published practices and events</p>
      <p>• Respects team timezone settings</p>
    </div>
  </div>
  
  <div class="share-section">
    <h3 class="font-semibold mb-2">Quick Share Options</h3>
    <div class="flex gap-2">
      <button
        on:click={() => shareViaEmail()}
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        📧 Email
      </button>
      <button
        on:click={() => generateQRCode()}
        class="px-4 py-2 border rounded hover:bg-gray-50"
      >
        📱 QR Code
      </button>
    </div>
  </div>
</div>
```

### Key Features

1. **ICS Calendar Feed**
   - Published practices only (no drafts)
   - All season markers/events
   - Proper timezone handling
   - Auto-updates when practices change
   - Standard ICS format for universal compatibility

2. **Public Share Links**
   - Token-based access (no login required)
   - Read-only season timeline view
   - Shows only published practices
   - Includes calendar subscription option
   - Mobile-responsive design

3. **Member Access Controls**
   - Team members see published practices
   - Admins see all (drafts + published)
   - Section visibility based on `overview_visible_to_members` flag
   - Proper permission checks throughout

4. **Token Management**
   - Separate tokens for ICS and public view
   - Admin-only token rotation
   - Token validation on every request
   - Secure random UUID generation

### Testing Requirements

1. **Unit Tests**
   - ICS generation with various event types
   - Timezone calculations
   - Token validation logic
   - Permission checks

2. **Integration Tests**
   - Calendar subscription flow
   - Public link access
   - Token rotation effects
   - Multi-timezone scenarios

3. **E2E Tests**
   - Share link generation and copying
   - Calendar app integration
   - Mobile access to public view

### Security Considerations
- Tokens are cryptographically secure UUIDs
- No PII exposed in public views
- Rate limiting on ICS endpoint
- Token rotation invalidates old links
- HTTPS required for production

### Dependencies
```json
{
  "dependencies": {
    "ical-generator": "^3.0.0"
  }
}
```

### Success Metrics
- 90% of parents successfully subscribe to calendar
- < 500ms ICS generation time
- Zero unauthorized access incidents
- 50% reduction in "when is practice?" questions