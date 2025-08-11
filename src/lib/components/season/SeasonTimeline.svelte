<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let season;
  export let sections = [];
  export let markers = [];
  export let isAdmin = false;
  export let isPublicView = false;
  export let onDateClick = null;
  export let existingPractices = [];
  
  let timelineElement;
  let containerWidth = 0;
  let dateRange = [];
  let monthHeaders = [];
  
  const DAY_WIDTH = 30;
  const HEADER_HEIGHT = 60;
  const SECTION_HEIGHT = 40;
  const MARKER_HEIGHT = 30;
  
  $: if (season) {
    generateDateRange();
    generateMonthHeaders();
  }
  
  function generateDateRange() {
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    dateRange = days;
    containerWidth = days.length * DAY_WIDTH;
  }
  
  function generateMonthHeaders() {
    const headers = [];
    let currentMonth = null;
    let currentMonthStart = 0;
    
    dateRange.forEach((date, index) => {
      const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
      
      if (monthYear !== currentMonth) {
        if (currentMonth) {
          headers.push({
            month: currentMonth,
            start: currentMonthStart * DAY_WIDTH,
            width: (index - currentMonthStart) * DAY_WIDTH
          });
        }
        currentMonth = monthYear;
        currentMonthStart = index;
      }
    });
    
    if (currentMonth) {
      headers.push({
        month: currentMonth,
        start: currentMonthStart * DAY_WIDTH,
        width: (dateRange.length - currentMonthStart) * DAY_WIDTH
      });
    }
    
    monthHeaders = headers.map(h => ({
      ...h,
      label: getMonthLabel(h.month)
    }));
  }
  
  function getMonthLabel(monthYear) {
    const [month, year] = monthYear.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month)]} ${year}`;
  }
  
  function getDatePosition(date) {
    const d = new Date(date);
    const start = new Date(season.start_date);
    const daysDiff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    return daysDiff * DAY_WIDTH;
  }
  
  function getDateWidth(startDate, endDate) {
    if (!endDate) return DAY_WIDTH;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return daysDiff * DAY_WIDTH;
  }
  
  // Default click handler for creating practices
  async function defaultDateClickHandler(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if practice already exists for this date
    const existing = existingPractices.find(p => p.scheduled_date === dateStr);
    
    if (existing) {
      // Navigate to existing practice
      goto(`/practice-plans/${existing.id}/edit`);
    } else {
      // Create new practice
      try {
        const response = await fetch(`/api/seasons/${season.id}/instantiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_date: dateStr })
        });
        
        if (response.ok) {
          const plan = await response.json();
          goto(`/practice-plans/${plan.id}/edit`);
        } else {
          const error = await response.json();
          alert(`Failed to create practice: ${error.error}`);
        }
      } catch (error) {
        console.error('Error creating practice:', error);
        alert('Failed to create practice plan');
      }
    }
  }
  
  function handleDateClick(date) {
    if (!isAdmin) return;
    
    if (onDateClick) {
      onDateClick(date);
    } else {
      defaultDateClickHandler(date);
    }
  }
  
  // Helper functions for practice indicators
  function hasExistingPractice(date) {
    const dateStr = date.toISOString().split('T')[0];
    return existingPractices.some(p => p.scheduled_date === dateStr);
  }
  
  function getPracticeStatus(date) {
    const dateStr = date.toISOString().split('T')[0];
    const practice = existingPractices.find(p => p.scheduled_date === dateStr);
    return practice?.status || null;
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  $: sectionRows = groupOverlappingSections(sections);
  
  function groupOverlappingSections(sections) {
    const rows = [];
    const sorted = [...sections].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    );
    
    sorted.forEach(section => {
      let placed = false;
      for (let row of rows) {
        const overlaps = row.some(s => 
          !(new Date(section.end_date) < new Date(s.start_date) ||
            new Date(section.start_date) > new Date(s.end_date))
        );
        
        if (!overlaps) {
          row.push(section);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        rows.push([section]);
      }
    });
    
    return rows;
  }
  
  const sectionColors = {
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    green: 'bg-green-100 border-green-300 text-green-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900',
    amber: 'bg-amber-100 border-amber-300 text-amber-900',
    rose: 'bg-rose-100 border-rose-300 text-rose-900',
    cyan: 'bg-cyan-100 border-cyan-300 text-cyan-900'
  };
  
  const markerColors = {
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    green: 'bg-green-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white'
  };
</script>

<div class="border rounded-lg overflow-hidden bg-white">
  <div class="p-4 border-b">
    <h2 class="text-xl font-semibold">Season Timeline</h2>
    <p class="text-gray-600 text-sm mt-1">
      {formatDate(season.start_date)} - {formatDate(season.end_date)}
    </p>
  </div>
  
  <div class="relative overflow-x-auto" bind:this={timelineElement}>
    <div class="relative" style="width: {containerWidth}px; min-height: 400px;">
      <!-- Month headers -->
      <div class="sticky top-0 z-20 bg-gray-50 border-b" style="height: {HEADER_HEIGHT}px;">
        {#each monthHeaders as header}
          <div 
            class="absolute top-0 border-r border-gray-300 flex items-center justify-center font-medium"
            style="left: {header.start}px; width: {header.width}px; height: 30px;"
          >
            {header.label}
          </div>
        {/each}
        
        <!-- Day markers -->
        <div class="absolute" style="height: 30px; top: 30px;">
          {#each dateRange as date, i}
            {@const isWeekend = date.getDay() === 0 || date.getDay() === 6}
            {@const isToday = date.toDateString() === new Date().toDateString()}
            {@const hasPractice = hasExistingPractice(date)}
            {@const practiceStatus = getPracticeStatus(date)}
            <button
              class="absolute border-r border-gray-200 text-xs flex items-center justify-center relative
                     {isWeekend ? 'bg-gray-100' : 'bg-white'}
                     {isToday ? 'ring-2 ring-blue-500 z-10' : ''}
                     {hasPractice ? (practiceStatus === 'published' ? 'bg-green-50' : 'bg-yellow-50') : ''}
                     {isAdmin ? 'hover:bg-blue-50 cursor-pointer' : ''}"
              style="left: {i * DAY_WIDTH}px; width: {DAY_WIDTH}px; height: 30px;"
              on:click={() => handleDateClick(date)}
              disabled={!isAdmin}
              title={hasPractice ? `Practice (${practiceStatus})` : (isAdmin ? 'Click to create practice' : '')}
            >
              {date.getDate()}
              {#if hasPractice}
                <span class="absolute bottom-0 left-0 right-0 h-1 
                           {practiceStatus === 'published' ? 'bg-green-500' : 'bg-yellow-500'}">
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Grid lines -->
      <div class="absolute inset-0" style="top: {HEADER_HEIGHT}px;">
        {#each dateRange as date, i}
          <div 
            class="absolute border-r border-gray-100 h-full"
            style="left: {i * DAY_WIDTH}px;"
          />
        {/each}
      </div>
      
      <!-- Season sections -->
      <div class="absolute" style="top: {HEADER_HEIGHT + 20}px; left: 0; right: 0;">
        {#each sectionRows as row, rowIndex}
          <div class="relative" style="height: {SECTION_HEIGHT}px; margin-bottom: 5px;">
            {#each row as section}
              <div
                class="absolute rounded px-2 py-1 border text-xs font-medium overflow-hidden
                       {sectionColors[section.color] || sectionColors.blue}"
                style="left: {getDatePosition(section.start_date)}px; 
                       width: {getDateWidth(section.start_date, section.end_date)}px;
                       height: {SECTION_HEIGHT - 5}px;"
                title="{section.name}: {section.notes || 'No notes'}"
              >
                <span class="truncate block">{section.name}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
      
      <!-- Markers -->
      <div class="absolute" style="top: {HEADER_HEIGHT + 20 + (sectionRows.length * (SECTION_HEIGHT + 5)) + 20}px; left: 0; right: 0;">
        <div class="text-xs font-semibold text-gray-600 mb-2">Events & Milestones</div>
        
        {#each markers.all || [] as marker}
          {@const left = getDatePosition(marker.start_date)}
          {@const width = getDateWidth(marker.start_date, marker.end_date)}
          
          <div
            class="absolute rounded px-2 py-1 text-xs font-medium
                   {markerColors[marker.color] || markerColors.red}"
            style="left: {left}px; width: {width}px; height: {MARKER_HEIGHT}px; margin-bottom: 5px;"
            title="{marker.title}: {marker.notes || 'No notes'}"
          >
            <span class="truncate block">
              {#if marker.type === 'tournament'}🏆{/if}
              {#if marker.type === 'break'}🏖️{/if}
              {#if marker.type === 'scrimmage'}⚔️{/if}
              {marker.title}
            </span>
          </div>
        {/each}
      </div>
      
      <!-- Today line -->
      {#if true}
        {@const today = new Date()}
        {#if today >= new Date(season.start_date) && today <= new Date(season.end_date)}
          {@const todayPosition = getDatePosition(today)}
        <div 
          class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
          style="left: {todayPosition}px;"
        >
          <div class="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
            Today
          </div>
        </div>
        {/if}
      {/if}
    </div>
  </div>
  
  {#if isAdmin && !isPublicView}
    <div class="p-4 border-t bg-gray-50">
      <div class="flex space-x-2">
        <a 
          href="/teams/{$page.params.teamId}/season/sections"
          class="text-blue-500 hover:underline text-sm"
        >
          Manage Sections
        </a>
        <a 
          href="/teams/{$page.params.teamId}/season/markers"
          class="text-blue-500 hover:underline text-sm"
        >
          Manage Events
        </a>
        {#if onDateClick}
          <span class="text-gray-500 text-sm">• Click any date to create a practice plan</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.overflow-x-auto) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar) {
    height: 8px;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar-track) {
    background: #f7fafc;
  }
  
  :global(.overflow-x-auto::-webkit-scrollbar-thumb) {
    background: #cbd5e0;
    border-radius: 4px;
  }
</style>