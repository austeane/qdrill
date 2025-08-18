<script>
  import { onMount, tick } from 'svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  
  export let season;
  export let sections = [];
  export let markers = [];
  export let practices = [];
  
  let timelineElement;
  let dayWidth = 30;
  let rowHeight = 40;
  let headerHeight = 60;
  
  // Calculate timeline dimensions
  $: seasonStart = season ? (season.start_date ? parseISODateLocal(season.start_date) : new Date()) : new Date();
  $: seasonEnd = season ? (season.end_date ? parseISODateLocal(season.end_date) : new Date()) : new Date();
  $: totalDays = Math.ceil((seasonEnd - seasonStart) / (1000 * 60 * 60 * 24)) + 1;
  $: timelineWidth = totalDays * dayWidth;
  
  // Group sections by overlapping rows for stacking
  $: stackedSections = stackSections(sections);
  $: sectionsHeight = (stackedSections.length || 1) * rowHeight;
  
  // Compute marker rows for collision-free layout
  $: markerRowMap = computeMarkerRows(markers);
  $: markerRowCount = markerRowMap.size ? Math.max(...markerRowMap.values()) + 1 : 1;
  $: markersHeight = Math.max(rowHeight, markerRowCount * 20);
  
  // Total vertical height
  $: bodyHeight = sectionsHeight + markersHeight + (practices?.length ? rowHeight : 0);
  
  // Date utilities
  function parseISODateLocal(s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  function dateToX(date) {
    const d = typeof date === 'string' ? parseISODateLocal(date) : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s0 = new Date(seasonStart.getFullYear(), seasonStart.getMonth(), seasonStart.getDate());
    const dayIndex = Math.floor((d - s0) / 86400000);
    return dayIndex * dayWidth;
  }
  
  function formatDate(date) {
    const d = typeof date === 'string' ? parseISODateLocal(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  function formatDateISO(date) {
    const d = typeof date === 'string' ? parseISODateLocal(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  
  // Stack overlapping sections into rows
  function stackSections(sections) {
    if (!sections || sections.length === 0) return [];
    
    const sorted = [...sections].sort((a, b) => 
      parseISODateLocal(a.start_date) - parseISODateLocal(b.start_date)
    );
    
    const rows = [];
    
    for (const section of sorted) {
      let placed = false;
      const sectionStart = parseISODateLocal(section.start_date);
      const sectionEnd = parseISODateLocal(section.end_date);
      
      for (let i = 0; i < rows.length; i++) {
        const canFit = rows[i].every(existing => {
          const existingStart = parseISODateLocal(existing.start_date);
          const existingEnd = parseISODateLocal(existing.end_date);
          return sectionEnd < existingStart || sectionStart > existingEnd;
        });
        
        if (canFit) {
          rows[i].push(section);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        rows.push([section]);
      }
    }
    
    return rows;
  }
  
  // Generate day cells
  function getDays() {
    const days = [];
    const current = new Date(seasonStart);
    
    for (let i = 0; i < totalDays; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }
  
  // Generate month headers
  function getMonths() {
    const months = [];
    const current = new Date(seasonStart);
    current.setDate(1);
    
    while (current <= seasonEnd) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const start = monthStart < seasonStart ? seasonStart : monthStart;
      const end = monthEnd > seasonEnd ? seasonEnd : monthEnd;
      
      const startX = dateToX(start);
      const endX = dateToX(end) + dayWidth;
      
      months.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        x: startX,
        width: endX - startX
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }
  
  // Group markers by day for collision detection
  function getMarkersForDay(date) {
    const dateStr = formatDateISO(date);
    return markers.filter(m => {
      const startDate = formatDateISO(m.start_date || m.date);
      const endDate = m.end_date ? formatDateISO(m.end_date) : startDate;
      return dateStr >= startDate && dateStr <= endDate;
    });
  }
  
  // Compute marker rows for interval layout
  function computeMarkerRows(list) {
    if (!list || !list.length) return new Map();
    const items = list.map(m => ({
      id: m.id,
      start: parseISODateLocal(m.start_date || m.date),
      end: parseISODateLocal(m.end_date || (m.start_date || m.date))
    })).sort((a, b) => (a.start - b.start) || (a.end - b.end));

    const rowEnds = [];
    const map = new Map();

    for (const it of items) {
      let r = rowEnds.findIndex(end => end < it.start);
      if (r === -1) { r = rowEnds.length; rowEnds.push(it.end); }
      else { rowEnds[r] = it.end; }
      map.set(it.id, r);
    }
    return map;
  }
  
  // Auto-scroll to today on mount
  onMount(async () => {
    await tick();
    if (!season || !timelineElement) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (today >= seasonStart && today <= seasonEnd) {
      const x = dateToX(today);
      const scrollLeft = x - timelineElement.clientWidth / 2 + dayWidth / 2;
      timelineElement.scrollLeft = Math.max(0, scrollLeft);
    }
  });
</script>

<div class="timeline-viewer">
  <!-- Zoom control -->
  <div class="controls mb-4 flex justify-between items-center">
    <h3 class="text-lg font-semibold">Season Timeline</h3>
    <div class="flex items-center gap-2">
      <label for="zoom-slider" class="text-sm text-gray-600">Zoom:</label>
      <input
        id="zoom-slider"
        type="range"
        min="16"
        max="60"
        step="4"
        bind:value={dayWidth}
        class="w-24"
      />
      <span class="text-xs text-gray-500 w-12">{dayWidth}px</span>
    </div>
  </div>
  
  <Card>
    <div 
      class="timeline overflow-x-auto"
      bind:this={timelineElement}
    >
      <!-- Month headers -->
      <div class="timeline-header sticky top-0 bg-gray-50 border-b z-20" style="height: {headerHeight}px">
        {#each getMonths() as month}
          <div 
            class="month-header absolute flex items-center justify-center font-medium text-sm border-r border-gray-300"
            style="left: {month.x}px; width: {month.width}px; height: {headerHeight / 2}px"
          >
            {month.name}
          </div>
        {/each}
        
        <!-- Day numbers -->
        <div class="absolute" style="top: {headerHeight / 2}px">
          {#each getDays() as day, i}
            <div 
              class="day-header absolute text-xs text-center border-r"
              class:week-divider={day.getDay() === 1}
              class:weekend-header={day.getDay() === 0 || day.getDay() === 6}
              style="left: {i * dayWidth}px; width: {dayWidth}px; height: {headerHeight / 2}px; line-height: {headerHeight / 2}px"
            >
              {day.getDate()}
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Timeline body -->
      <div class="timeline-body relative" style="width: {timelineWidth}px; min-height: 200px">
        <!-- Background grid -->
        <div class="grid-bg absolute" style="top: 0; left: 0; width: {timelineWidth}px; height: {bodyHeight}px;">
          {#each getDays() as day, i}
            {@const isWeekend = day.getDay() === 0 || day.getDay() === 6}
            {@const isToday = formatDateISO(day) === formatDateISO(new Date())}
            <div
              class="grid-day absolute border-r"
              class:week-divider={day.getDay() === 1}
              class:weekend={isWeekend}
              class:today={isToday}
              style="left: {i * dayWidth}px; width: {dayWidth}px; height: {bodyHeight}px"
            />
          {/each}
        </div>
        
        <!-- Sections -->
        <div class="sections-lane relative" style="height: {sectionsHeight}px">
          {#each stackedSections as row, rowIndex}
            {#each row as section}
              <div
                class="section-bar absolute rounded"
                style="
                  left: {dateToX(section.start_date)}px;
                  width: {dateToX(section.end_date) - dateToX(section.start_date) + dayWidth}px;
                  top: {rowIndex * rowHeight + 5}px;
                  height: {rowHeight - 10}px;
                  background-color: {section.color};
                  opacity: 0.85;
                "
                title="{section.name}: {formatDate(section.start_date)} - {formatDate(section.end_date)}"
              >
                <span class="section-name text-white text-xs font-medium px-2 select-none">{section.name}</span>
              </div>
            {/each}
          {/each}
        </div>
        
        <!-- Markers -->
        <div class="markers-lane absolute" style="top: {sectionsHeight}px; height: {markersHeight}px; left: 0; right: 0">
          {#each markers as marker}
            {@const isRange = marker.end_date && marker.end_date !== (marker.start_date || marker.date)}
            {@const markerName = marker.title || marker.name}
            <div
              class="marker absolute flex items-center"
              class:marker-range={isRange}
              style="
                left: {dateToX(marker.start_date || marker.date)}px;
                {isRange ? `width: ${dateToX(marker.end_date) - dateToX(marker.start_date || marker.date) + dayWidth}px;` : ''};
                top: {(markerRowMap.get(marker.id) || 0) * 20}px;
              "
              title={markerName}
            >
              {#if isRange}
                <div class="marker-range-line" style="background-color: {marker.color}; width: 100%">
                  <div class="marker-range-fill" style="background-color: {marker.color}"></div>
                </div>
                <span class="marker-label ml-1 text-xs font-medium bg-white px-1 rounded shadow-sm">{markerName}</span>
              {:else}
                <span class="marker-dot" style="background-color: {marker.color}"></span>
                {#if dayWidth >= 40}
                  <span class="marker-label ml-1 text-xs font-medium bg-white px-1 rounded shadow-sm">{markerName}</span>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
        
        <!-- Practice chips -->
        {#if practices && practices.length > 0}
          <div class="practices-lane absolute" style="top: {sectionsHeight + markersHeight}px; height: {rowHeight}px; left: 0; right: 0">
            {#each practices as practice}
              <div
                class="practice-chip absolute"
                style="left: {dateToX(practice.scheduled_date) + dayWidth / 2}px; transform: translateX(-50%)"
                title="{practice.title}"
              >
                <Badge variant={practice.status === 'published' ? 'success' : 'secondary'} size="xs">
                  {practice.status === 'published' ? 'P' : 'D'}
                </Badge>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </Card>
  
  <!-- Legend -->
  <div class="mt-4 flex items-center gap-6 text-xs text-gray-600">
    <span class="flex items-center gap-2">
      <span class="w-8 h-3 bg-blue-500 rounded opacity-85"></span>
      Sections
    </span>
    <span class="flex items-center gap-2">
      <span class="w-3 h-3 bg-purple-500 rounded-full"></span>
      Events
    </span>
    <span class="flex items-center gap-2">
      <Badge variant="success" size="xs">P</Badge>
      Published Practice
    </span>
    <span class="flex items-center gap-2">
      <Badge variant="secondary" size="xs">D</Badge>
      Draft Practice
    </span>
  </div>
</div>

<style>
  .timeline {
    cursor: grab;
  }
  
  .timeline:active {
    cursor: grabbing;
  }
  
  /* Background grid */
  .grid-day {
    background-color: transparent;
    border-color: #e5e7eb;
  }
  
  .grid-day.weekend {
    background-color: #fafafa;
  }
  
  .grid-day.today {
    background-color: rgba(34, 197, 94, 0.06);
    box-shadow: inset 2px 0 #10b981;
  }
  
  .week-divider {
    border-color: #9ca3af !important;
  }
  
  .weekend-header {
    background-color: #f9fafb;
  }
  
  /* Section bars */
  .section-bar {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
  }
  
  .section-name {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Markers */
  .marker-dot {
    display: block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .marker-range-line {
    height: 3px;
    border-radius: 1.5px;
    position: relative;
  }
  
  .marker-range-fill {
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 7px;
    opacity: 0.2;
    border-radius: 3.5px;
  }
  
  .marker-label {
    white-space: nowrap;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Practice chips */
  .practice-chip {
    z-index: 10;
  }
  
  /* Zoom slider */
  input[type="range"] {
    accent-color: #3b82f6;
  }
  
  /* Dark mode support */
  :global(.dark) .timeline-viewer {
    color: #f3f4f6;
  }
  
  :global(.dark) .controls h3 {
    color: #f3f4f6;
  }
  
  :global(.dark) .timeline-header {
    background: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .month-header {
    border-color: #374151;
  }
  
  :global(.dark) .grid-day {
    border-color: #374151;
  }
  
  :global(.dark) .grid-day.weekend {
    background-color: #111827;
  }
  
  :global(.dark) .grid-day.today {
    background-color: rgba(16, 185, 129, 0.1);
  }
  
  :global(.dark) .weekend-header {
    background-color: #111827;
  }
  
  :global(.dark) .week-divider {
    border-color: #4b5563 !important;
  }
</style>
