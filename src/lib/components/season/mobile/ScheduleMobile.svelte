<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import CreatePracticeSheet from './CreatePracticeSheet.svelte';
  import EditMarkerSheet from './EditMarkerSheet.svelte';
  
  export let season = null;
  export let sections = [];
  export let markers = [];
  export let practices = [];
  export let isAdmin = false;
  export let teamSlug = '';
  
  const dispatch = createEventDispatcher();
  
  let showPracticeSheet = false;
  let showMarkerSheet = false;
  let selectedDate = null;
  let currentWeek = [];
  let weekOffset = 0;
  let longPressTimer = null;
  let editingMarker = null;
  
  // Initialize current week
  onMount(() => {
    generateWeek(0);
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
  
  function navigateWeek(direction) {
    generateWeek(weekOffset + direction);
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
        // Multi-day marker
        const markerStart = new Date(m.date);
        const markerEnd = new Date(m.end_date);
        return date >= markerStart && date <= markerEnd;
      } else {
        // Single day marker
        return m.date === dateStr;
      }
    });
  }
  
  function handleDayClick(date) {
    const dateStr = getDateString(date);
    selectedDate = dateStr;
    
    if (isAdmin && !isPastDate(date)) {
      showPracticeSheet = true;
    }
  }
  
  function handleDayLongPress(date, event) {
    if (!isAdmin) return;
    
    event.preventDefault();
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    selectedDate = getDateString(date);
    editingMarker = null;
    showMarkerSheet = true;
  }
  
  function startLongPress(date, event) {
    if (!isAdmin) return;
    
    longPressTimer = setTimeout(() => {
      handleDayLongPress(date, event);
    }, 500);
  }
  
  function cancelLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
  
  function handlePracticeClick(practice) {
    goto(`/teams/${teamSlug}/plans/${practice.id}`);
  }
  
  function handleMarkerClick(marker) {
    if (isAdmin) {
      editingMarker = marker;
      showMarkerSheet = true;
    }
  }
  
  function handlePracticeCreated(event) {
    showPracticeSheet = false;
    dispatch('practiceCreated', event.detail);
  }
  
  function handleMarkerSaved(event) {
    showMarkerSheet = false;
    dispatch('markerChange', event.detail);
  }
  
  function handleAddPractice() {
    const today = new Date();
    selectedDate = getDateString(today);
    showPracticeSheet = true;
  }
  
  // Format month header
  function getWeekHeader() {
    if (currentWeek.length === 0) return '';
    
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay.getDate()}–${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    } else {
      return `${firstMonth} ${firstDay.getDate()} – ${lastMonth} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    }
  }
</script>

<div class="schedule-container">
  <!-- Week Navigation -->
  <div class="week-nav">
    <button 
      class="nav-button"
      on:click={() => navigateWeek(-1)}
      aria-label="Previous week"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-7-6 7-6" />
      </svg>
    </button>
    
    <div class="week-header">
      {getWeekHeader()}
    </div>
    
    <button 
      class="nav-button"
      on:click={() => navigateWeek(1)}
      aria-label="Next week"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l7-6-7-6" />
      </svg>
    </button>
  </div>
  
  <!-- Calendar Strip -->
  <div class="calendar-strip">
    {#each currentWeek as date}
      {@const dateStr = getDateString(date)}
      <button
        class="calendar-day"
        class:today={isToday(date)}
        class:past={isPastDate(date)}
        on:click={() => handleDayClick(date)}
        aria-label="{date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}"
      >
        <span class="day-label">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
        <span class="day-number">
          {date.getDate()}
        </span>
        {#if getDayPractices(date).length > 0}
          <div class="day-indicator" />
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- Day List -->
  <div class="day-list">
    {#each currentWeek as date}
      {@const dayPractices = getDayPractices(date)}
      {@const daySections = getDaySections(date)}
      {@const dayMarkers = getDayMarkers(date)}
      {@const hasContent = dayPractices.length > 0 || daySections.length > 0 || dayMarkers.length > 0}
      
      {#if hasContent || isToday(date)}
        <div 
          class="day-card"
          on:touchstart={(e) => startLongPress(date, e)}
          on:touchend={cancelLongPress}
          on:touchmove={cancelLongPress}
          on:mousedown={(e) => startLongPress(date, e)}
          on:mouseup={cancelLongPress}
          on:mouseleave={cancelLongPress}
        >
          <div class="day-header">
            <h3 class="day-title">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {#if isToday(date)}
              <span class="today-badge">Today</span>
            {/if}
          </div>
          
          <!-- Practices -->
          {#if dayPractices.length > 0}
            <div class="practices-section">
              {#each dayPractices as practice}
                <button
                  class="practice-chip"
                  class:draft={practice.status === 'draft'}
                  on:click={() => handlePracticeClick(practice)}
                >
                  <span class="practice-time">
                    {new Date(`2000-01-01T${practice.start_time}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                  <span class="practice-status">
                    {practice.status === 'draft' ? 'Draft' : 'Published'}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
          
          <!-- Sections -->
          {#if daySections.length > 0}
            <div class="sections-row">
              <span class="row-label">Sections:</span>
              <div class="section-chips">
                {#each daySections as section}
                  <div 
                    class="section-chip"
                    style="background-color: {section.color}20; border-color: {section.color}"
                  >
                    {section.name}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Markers -->
          {#if dayMarkers.length > 0}
            <div class="markers-row">
              <span class="row-label">Events:</span>
              <div class="marker-chips">
                {#each dayMarkers as marker}
                  <button
                    class="marker-chip"
                    style="background-color: {marker.color}20; border-color: {marker.color}"
                    on:click={() => handleMarkerClick(marker)}
                    disabled={!isAdmin}
                  >
                    {marker.name}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if !hasContent && isToday(date) && isAdmin}
            <button
              class="empty-day-action"
              on:click={() => handleDayClick(date)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Practice
            </button>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  
  <!-- FAB for adding practice -->
  {#if isAdmin}
    <button
      class="fab"
      on:click={handleAddPractice}
      aria-label="Add practice"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  {/if}
</div>

<!-- Practice Creation Sheet -->
{#if showPracticeSheet}
  <CreatePracticeSheet
    {season}
    {sections}
    date={selectedDate}
    teamSlug={teamSlug}
    on:save={handlePracticeCreated}
    on:close={() => showPracticeSheet = false}
  />
{/if}

<!-- Marker Edit Sheet -->
{#if showMarkerSheet}
  <EditMarkerSheet
    {season}
    marker={editingMarker}
    defaultDate={selectedDate}
    on:save={handleMarkerSaved}
    on:close={() => showMarkerSheet = false}
  />
{/if}

<style>
  .schedule-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 80px; /* Space for bottom nav */
  }
  
  .week-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .nav-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 8px;
  }
  
  .nav-button:active {
    background: #f3f4f6;
  }
  
  .week-header {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
  
  .calendar-strip {
    display: flex;
    padding: 12px 8px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .calendar-strip::-webkit-scrollbar {
    display: none;
  }
  
  .calendar-day {
    flex: 1;
    min-width: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
  }
  
  .calendar-day:active {
    background: #f3f4f6;
  }
  
  .calendar-day.today {
    background: #eff6ff;
  }
  
  .calendar-day.past {
    opacity: 0.5;
  }
  
  .day-label {
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  
  .day-number {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
  
  .calendar-day.today .day-number {
    color: #2563eb;
  }
  
  .day-indicator {
    position: absolute;
    bottom: 4px;
    width: 4px;
    height: 4px;
    background: #10b981;
    border-radius: 50%;
  }
  
  .day-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px;
  }
  
  .day-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    user-select: none;
  }
  
  .day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .day-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: #111827;
  }
  
  .today-badge {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #2563eb;
    background: #eff6ff;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .practices-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .practice-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f0fdf4;
    border: 1px solid #10b981;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .practice-chip.draft {
    background: #fef3c7;
    border-color: #fbbf24;
  }
  
  .practice-chip:active {
    transform: scale(0.98);
  }
  
  .practice-time {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  
  .practice-status {
    font-size: 12px;
    color: #6b7280;
  }
  
  .sections-row,
  .markers-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .row-label {
    font-size: 13px;
    color: #6b7280;
    min-width: 65px;
    padding-top: 4px;
  }
  
  .section-chips,
  .marker-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }
  
  .section-chip,
  .marker-chip {
    font-size: 12px;
    padding: 4px 10px;
    border: 1px solid;
    border-radius: 12px;
    white-space: nowrap;
  }
  
  .marker-chip {
    background: none;
    cursor: pointer;
  }
  
  .marker-chip:disabled {
    cursor: default;
  }
  
  .marker-chip:not(:disabled):active {
    transform: scale(0.98);
  }
  
  .empty-day-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px;
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
  }
  
  .empty-day-action:active {
    background: #f3f4f6;
  }
  
  .fab {
    position: fixed;
    bottom: 80px; /* Above bottom nav */
    right: 16px;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    cursor: pointer;
    z-index: 10;
  }
  
  .fab:active {
    transform: scale(0.95);
  }
  
  /* Dark mode */
  :global(.dark) .week-nav,
  :global(.dark) .calendar-strip {
    background: #1f2937;
    border-bottom-color: #374151;
  }
  
  :global(.dark) .day-card {
    background: #1f2937;
  }
  
  :global(.dark) .week-header,
  :global(.dark) .day-title,
  :global(.dark) .day-number,
  :global(.dark) .practice-time {
    color: #f3f4f6;
  }
  
  :global(.dark) .nav-button,
  :global(.dark) .day-label,
  :global(.dark) .row-label,
  :global(.dark) .practice-status {
    color: #9ca3af;
  }
  
  :global(.dark) .nav-button:active,
  :global(.dark) .calendar-day:active {
    background: #374151;
  }
  
  :global(.dark) .calendar-day.today {
    background: #1e3a8a;
  }
  
  :global(.dark) .calendar-day.today .day-number {
    color: #93bbfe;
  }
  
  :global(.dark) .today-badge {
    background: #1e3a8a;
    color: #93bbfe;
  }
  
  :global(.dark) .practice-chip {
    background: #064e3b;
    border-color: #10b981;
  }
  
  :global(.dark) .practice-chip.draft {
    background: #78350f;
    border-color: #fbbf24;
  }
  
  :global(.dark) .empty-day-action {
    background: #111827;
    border-color: #4b5563;
    color: #9ca3af;
  }
  
  :global(.dark) .empty-day-action:active {
    background: #1f2937;
  }
  
  :global(.dark) .fab {
    background: #3b82f6;
  }
</style>