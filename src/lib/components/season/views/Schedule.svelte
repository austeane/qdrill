<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { device } from '$lib/stores/deviceStore';
  import Card from '$lib/components/ui/Card.svelte';
  import { Button } from '$lib/components/ui/button';
  import Badge from '$lib/components/ui/Badge.svelte';
  import CreatePracticeSheet from '../mobile/CreatePracticeSheet.svelte';
  import EditMarkerSheet from '../mobile/EditMarkerSheet.svelte';
  import CreatePracticeDialog from '../desktop/CreatePracticeDialog.svelte';
  import CreateMarkerDialog from '../desktop/CreateMarkerDialog.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { Plus, Sparkles, ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  export let season = null;
  export let sections = [];
  export let markers = [];
  export let practices = [];
  export let isAdmin = false;
  export let teamSlug = '';
  export let teamTimezone = 'UTC';
  
  const dispatch = createEventDispatcher();
  
  let showPracticeDialog = false;
  let showMarkerDialog = false;
  let selectedDate = null;
  let editingMarker = null;
  let viewMode = 'week'; // 'week' | 'month'
  let currentWeek = [];
  let currentMonth = [];
  let weekOffset = 0;
  let monthOffset = 0;
  
  // Initialize view
  onMount(() => {
    if (viewMode === 'week') {
      generateWeek(0);
    } else {
      generateMonth(0);
    }
  });
  
  function generateWeek(offset) {
    weekOffset = offset;
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Adjust to start of week (Sunday)
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (offset * 7));
    
    currentWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }
  
  function generateMonth(offset) {
    monthOffset = offset;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + offset;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    currentMonth = [];
    
    // Add padding days from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      currentMonth.push({ date, isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      currentMonth.push({ date, isCurrentMonth: true });
    }
    
    // Add padding days from next month
    const endPadding = 42 - currentMonth.length; // 6 weeks * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      currentMonth.push({ date, isCurrentMonth: false });
    }
  }
  
  function navigate(direction) {
    if (viewMode === 'week') {
      generateWeek(weekOffset + direction);
    } else {
      generateMonth(monthOffset + direction);
    }
  }
  
  function switchView(mode) {
    viewMode = mode;
    if (mode === 'week') {
      generateWeek(0);
    } else {
      generateMonth(0);
    }
  }
  
  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }
  
  function getDateString(date) {
    return date.toISOString().split('T')[0];
  }
  
  function getDayPractices(date) {
    const dateStr = getDateString(date);
    return practices.filter(p => p.scheduled_date === dateStr);
  }
  
  function getDaySections(date) {
    return sections.filter(s => {
      const sectionStart = new Date(s.start_date);
      const sectionEnd = new Date(s.end_date);
      return date >= sectionStart && date <= sectionEnd;
    });
  }
  
  function getDayMarkers(date) {
    const dateStr = getDateString(date);
    return markers.filter(m => {
      if (m.end_date) {
        const markerStart = new Date(m.date || m.start_date);
        const markerEnd = new Date(m.end_date);
        return date >= markerStart && date <= markerEnd;
      } else {
        return (m.date || m.start_date) === dateStr;
      }
    });
  }
  
  function handleDayClick(date) {
    if (!isAdmin || isPastDate(date)) return;
    
    selectedDate = getDateString(date);
    showPracticeDialog = true;
  }
  
  function handlePracticeClick(practice) {
    goto(`/teams/${teamSlug}/plans/${practice.id}`);
  }
  
  function handleMarkerClick(marker) {
    if (isAdmin) {
      editingMarker = marker;
      showMarkerDialog = true;
    }
  }
  
  function handlePracticeCreated(event) {
    showPracticeDialog = false;
    dispatch('practiceCreated', event.detail);
  }
  
  function handleMarkerSaved(event) {
    showMarkerDialog = false;
    dispatch('markerChange', event.detail);
  }
  
  function handleAddPractice() {
    console.log('handleAddPractice called');
    const today = new Date();
    selectedDate = getDateString(today);
    showPracticeDialog = true;
    console.log('showPracticeDialog set to:', showPracticeDialog);
  }
  
  function handleAddMarker() {
    console.log('handleAddMarker called');
    editingMarker = null;
    selectedDate = getDateString(new Date());
    showMarkerDialog = true;
    console.log('showMarkerDialog set to:', showMarkerDialog);
  }
  
  // Format headers
  function getWeekHeader() {
    if (currentWeek.length === 0) return '';
    
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short', timeZone: teamTimezone });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short', timeZone: teamTimezone });
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay.getDate()}–${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    } else {
      return `${firstMonth} ${firstDay.getDate()} – ${lastMonth} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    }
  }
  
  function getMonthHeader() {
    if (currentMonth.length === 0) return '';
    const centerDate = currentMonth[15].date; // Approximate middle of month
    return centerDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: teamTimezone });
  }
</script>

<div class="schedule-container" class:desktop={!$device.isMobile}>
  <!-- Header with navigation and view switcher -->
  <div class="schedule-header">
    <div class="nav-controls">
      <button 
        class="nav-button"
        on:click={() => navigate(-1)}
        aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
      >
        <ChevronLeft size={20} />
      </button>
      
      <h2 class="date-header">
        {viewMode === 'week' ? getWeekHeader() : getMonthHeader()}
      </h2>
      
      <button 
        class="nav-button"
        on:click={() => navigate(1)}
        aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
      >
        <ChevronRight size={20} />
      </button>
    </div>
    
    <div class="view-controls">
      <Button
        size="sm"
        variant={viewMode === 'week' ? 'default' : 'ghost'}
        on:click={() => switchView('week')}
      >
        Week
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'month' ? 'default' : 'ghost'}
        on:click={() => switchView('month')}
      >
        Month
      </Button>
      
      {#if isAdmin}
        <div class="divider" />
        <Button 
          variant="outline"
          size="sm"
          on:click={handleAddPractice}
        >
          <Plus size={16} class="mr-1" />
          Practice
        </Button>
        <Button 
          variant="outline"
          size="sm"
          on:click={handleAddMarker}
        >
          <Sparkles size={16} class="mr-1" />
          Event
        </Button>
      {:else}
        <div class="permission-note" role="note" aria-live="polite">
          View only — ask an admin to add practices or events
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Calendar View -->
  {#if viewMode === 'week'}
    <!-- Week View -->
    <div class="week-view">
      <div class="week-grid">
        {#each currentWeek as date}
          {@const dayPractices = getDayPractices(date)}
          {@const dayMarkers = getDayMarkers(date)}
          {@const daySections = getDaySections(date)}
          {@const isPast = isPastDate(date)}
          
          <div
            class="day-cell"
            class:today={isToday(date)}
            class:past={isPast}
            class:has-content={dayPractices.length > 0 || dayMarkers.length > 0}
          >
            <div class="day-header">
              <span class="day-name">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span class="day-date">
                {date.getDate()}
              </span>
            </div>
            
            <div class="day-content">
              {#if daySections.length > 0}
                <div class="section-badges" title={daySections.map(s => s.name).join(', ')}>
                  {#each daySections as s}
                    <span class="section-badge">{s.name}</span>
                  {/each}
                </div>
              {/if}
              {#if dayPractices.length > 0}
                {#each dayPractices as practice}
                  <button
                    class="practice-item"
                    on:click={() => handlePracticeClick(practice)}
                  >
                    <span class="practice-time">
                      {new Date(`2000-01-01T${practice.start_time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                    <Badge 
                      variant={practice.status === 'published' ? 'success' : 'secondary'} 
                      size="xs"
                    >
                      {practice.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </button>
                {/each}
              {/if}
              
              {#if dayMarkers.length > 0}
                {#each dayMarkers as marker}
                  <button
                    class="marker-item"
                    style="--marker-color: {marker.color}"
                    on:click={() => handleMarkerClick(marker)}
                    disabled={!isAdmin}
                  >
                    {marker.name || marker.title}
                  </button>
                {/each}
              {/if}
              
              {#if !isPast && isAdmin && dayPractices.length === 0}
                <button
                  class="add-practice-hint"
                  on:click={() => handleDayClick(date)}
                >
                  <Plus size={16} />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Month View -->
    <div class="month-view">
      <div class="weekday-headers">
        {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
          <div class="weekday-header">{day}</div>
        {/each}
      </div>
      
      <div class="month-grid">
        {#each currentMonth as { date, isCurrentMonth }}
          {@const dayPractices = getDayPractices(date)}
          {@const dayMarkers = getDayMarkers(date)}
          {@const daySections = getDaySections(date)}
          {@const isPast = isPastDate(date)}
          
          <button
            class="month-day"
            class:other-month={!isCurrentMonth}
            class:today={isToday(date)}
            class:past={isPast}
            class:has-practice={dayPractices.length > 0}
            class:has-marker={dayMarkers.length > 0}
            on:click={() => isCurrentMonth && handleDayClick(date)}
            disabled={!isCurrentMonth || isPast || !isAdmin}
          >
            <span class="month-day-number">{date.getDate()}</span>
            {#if daySections.length > 0}
              <div class="month-section-indicator" aria-hidden="true" />
            {/if}
            
            {#if dayPractices.length > 0}
              <div class="day-indicators">
                {#each dayPractices.slice(0, 3) as practice}
                  <div 
                    class="practice-dot"
                    class:published={practice.status === 'published'}
                  />
                {/each}
              </div>
            {/if}
            
            {#if dayMarkers.length > 0}
              <div class="marker-line" style="background-color: {dayMarkers[0].color}" />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Practice Dialog/Sheet -->
{#if $device.isMobile && showPracticeDialog}
  <CreatePracticeSheet
    {season}
    {sections}
    date={selectedDate}
    teamSlug={teamSlug}
    on:save={handlePracticeCreated}
    on:close={() => showPracticeDialog = false}
  />
{/if}
<CreatePracticeDialog
  bind:open={showPracticeDialog}
  {season}
  {sections}
  date={selectedDate}
  {teamId}
  on:save={handlePracticeCreated}
  on:close={() => showPracticeDialog = false}
/>

<!-- Marker Dialog/Sheet -->
{#if $device.isMobile && showMarkerDialog}
  <EditMarkerSheet
    {season}
    marker={editingMarker}
    defaultDate={selectedDate}
    on:save={handleMarkerSaved}
    on:close={() => showMarkerDialog = false}
  />
{/if}
<CreateMarkerDialog
  bind:open={showMarkerDialog}
  {season}
  marker={editingMarker}
  defaultDate={selectedDate}
  on:save={handleMarkerSaved}
  on:delete={handleMarkerSaved}
  on:close={() => showMarkerDialog = false}
/>

<style>
  .schedule-container {
    padding: 16px;
    padding-bottom: 80px;
  }
  
  .schedule-container.desktop {
    padding: 0;
    padding-bottom: 0;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .schedule-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .desktop .schedule-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .nav-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .nav-button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .date-header {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .desktop .date-header {
    font-size: 20px;
  }
  
  .view-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .divider {
    width: 1px;
    height: 24px;
    background: #e5e7eb;
    margin: 0 8px;
  }

  .permission-note {
    font-size: 12px;
    color: #6b7280;
    padding: 4px 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }
  
  /* Week View */
  .week-view {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .week-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  
  .desktop .week-grid {
    min-height: 500px;
  }
  
  .day-cell {
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }
  
  .desktop .day-cell {
    min-height: 150px;
  }
  
  .day-cell:last-child {
    border-right: none;
  }
  
  .day-cell.today {
    background: #f0fdf4;
  }
  
  .day-cell.past {
    background: #fafafa;
    opacity: 0.7;
  }
  
  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .day-cell.today .day-header {
    background: #dcfce7;
  }
  
  .day-name {
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
  }
  
  .desktop .day-name {
    font-size: 12px;
  }
  
  .day-date {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  
  .desktop .day-date {
    font-size: 16px;
  }
  
  .day-content {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }

  .section-badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    color: #1f2937;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 9999px;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .practice-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }
  
  .practice-item:hover {
    background: #dbeafe;
    border-color: #93c5fd;
  }
  
  .practice-time {
    font-weight: 500;
    color: #1e40af;
  }
  
  .marker-item {
    padding: 4px 8px;
    background: var(--marker-color);
    opacity: 0.2;
    border: 1px solid var(--marker-color);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: #111827;
    cursor: pointer;
    transition: opacity 0.2s;
    text-align: left;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .marker-item:not(:disabled):hover {
    opacity: 0.3;
  }
  
  .add-practice-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: auto;
    background: none;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    color: #9ca3af;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .day-cell:hover .add-practice-hint {
    opacity: 1;
  }
  
  .add-practice-hint:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
    color: #6b7280;
  }
  
  /* Month View */
  .month-view {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .weekday-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8px;
  }
  
  .weekday-header {
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    padding: 8px;
  }
  
  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .desktop .month-grid {
    gap: 8px;
  }
  
  .month-day {
    aspect-ratio: 1;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .month-section-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #c7d2fe; /* soft indigo to denote section */
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  .month-day:not(:disabled):hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  .month-day.other-month {
    opacity: 0.3;
  }
  
  .month-day.today {
    background: #f0fdf4;
    border-color: #86efac;
  }
  
  .month-day.past {
    background: #fafafa;
    opacity: 0.5;
  }
  
  .month-day-number {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }
  
  .desktop .month-day-number {
    font-size: 14px;
  }
  
  .day-indicators {
    display: flex;
    gap: 2px;
    margin-top: 4px;
  }
  
  .practice-dot {
    width: 6px;
    height: 6px;
    background: #fbbf24;
    border-radius: 50%;
  }
  
  .practice-dot.published {
    background: #10b981;
  }
  
  .marker-line {
    position: absolute;
    bottom: 2px;
    left: 4px;
    right: 4px;
    height: 2px;
    border-radius: 1px;
  }
  
  /* Dark mode support */
  :global(.dark) .schedule-container {
    background: transparent;
  }
  
  :global(.dark) .date-header {
    color: #f3f4f6;
  }
  
  :global(.dark) .nav-button {
    background: #1f2937;
    border-color: #374151;
    color: #9ca3af;
  }
  
  :global(.dark) .nav-button:hover {
    background: #374151;
    border-color: #4b5563;
  }
  
  :global(.dark) .divider {
    background: #374151;
  }
  
  :global(.dark) .week-view,
  :global(.dark) .month-view {
    background: #1f2937;
  }
  
  :global(.dark) .day-cell {
    border-color: #374151;
  }
  
  :global(.dark) .day-cell.today {
    background: #064e3b;
  }
  
  :global(.dark) .day-cell.past {
    background: #111827;
  }
  
  :global(.dark) .day-header {
    background: #111827;
    border-color: #374151;
  }
  
  :global(.dark) .day-cell.today .day-header {
    background: #047857;
  }
  
  :global(.dark) .day-name,
  :global(.dark) .weekday-header {
    color: #9ca3af;
  }
  
  :global(.dark) .day-date,
  :global(.dark) .month-day-number {
    color: #f3f4f6;
  }
  
  :global(.dark) .practice-item {
    background: #1e3a8a;
    border-color: #2563eb;
  }
  
  :global(.dark) .practice-item:hover {
    background: #1e40af;
    border-color: #3b82f6;
  }
  
  :global(.dark) .practice-time {
    color: #93c5fd;
  }
  
  :global(.dark) .marker-item {
    color: #f3f4f6;
  }
  
  :global(.dark) .add-practice-hint {
    border-color: #4b5563;
    color: #6b7280;
  }
  
  :global(.dark) .add-practice-hint:hover {
    background: #374151;
    border-color: #6b7280;
    color: #9ca3af;
  }
  
  :global(.dark) .month-day {
    background: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .month-day:not(:disabled):hover {
    background: #374151;
    border-color: #4b5563;
  }
  
  :global(.dark) .month-day.today {
    background: #064e3b;
    border-color: #047857;
  }
  
  :global(.dark) .month-day.past {
    background: #111827;
  }
</style>
