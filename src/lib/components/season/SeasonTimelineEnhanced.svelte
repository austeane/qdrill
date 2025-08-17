<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  import Card from '$lib/components/ui/Card.svelte';
  import { Button } from '$lib/components/ui/button';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  
  export let season;
  export let sections = [];
  export let markers = [];
  export let practices = [];
  export let isAdmin = false;
  export let teamId;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let timelineElement;
  let dayWidth = 30;
  let rowHeight = 40;
  let headerHeight = 60;
  
  // Interaction states
  let mode = 'select'; // 'select', 'add-section', 'add-marker'
  let isDragging = false;
  let dragStart = null;
  let dragEnd = null;
  let dragType = null;
  let hoveredSection = null;
  let hoveredMarker = null;
  
  // Dialog states
  let showSectionDialog = false;
  let showMarkerDialog = false;
  let showPracticeConfirm = false;
  let editingSection = null;
  let editingMarker = null;
  let selectedDate = null;
  
  // Form data
  let sectionForm = {
    name: '',
    color: '#3B82F6',
    seedDefaults: true,
    startDate: '',
    endDate: ''
  };
  
  let markerForm = {
    type: 'tournament',
    name: '',
    color: '#8B5CF6',
    date: '',
    endDate: ''
  };
  
  // Predefined colors
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
  ];
  
  const markerTypes = [
    { value: 'tournament', label: 'Tournament' },
    { value: 'break', label: 'Break' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'other', label: 'Other' }
  ];
  
  // Calculate timeline dimensions
  $: seasonStart = season ? new Date(season.start_date) : new Date();
  $: seasonEnd = season ? new Date(season.end_date) : new Date();
  $: totalDays = Math.ceil((seasonEnd - seasonStart) / (1000 * 60 * 60 * 24)) + 1;
  $: timelineWidth = totalDays * dayWidth;
  
  // Group sections by overlapping rows for stacking
  $: stackedSections = stackSections(sections);
  $: sectionsHeight = (stackedSections.length || 1) * rowHeight;
  
  // Date utilities
  function dateToX(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const dayIndex = Math.floor((d - seasonStart) / (1000 * 60 * 60 * 24));
    return dayIndex * dayWidth;
  }
  
  function xToDate(x) {
    const dayIndex = Math.floor(x / dayWidth);
    const date = new Date(seasonStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  }
  
  function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  function formatDateISO(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
  
  // Stack overlapping sections into rows
  function stackSections(sections) {
    if (!sections || sections.length === 0) return [];
    
    const sorted = [...sections].sort((a, b) => 
      new Date(a.start_date) - new Date(b.start_date)
    );
    
    const rows = [];
    
    for (const section of sorted) {
      let placed = false;
      const sectionStart = new Date(section.start_date);
      const sectionEnd = new Date(section.end_date);
      
      for (let i = 0; i < rows.length; i++) {
        const canFit = rows[i].every(existing => {
          const existingStart = new Date(existing.start_date);
          const existingEnd = new Date(existing.end_date);
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
  
  // Mouse event handlers
  function handleMouseDown(event) {
    if (!isAdmin || mode === 'select') return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top - headerHeight;
    
    if (y < 0 || y > sectionsHeight + rowHeight * 2) return;
    
    isDragging = true;
    dragStart = { x, y };
    dragEnd = { x, y };
    dragType = y < sectionsHeight ? 'section' : 'marker';
  }
  
  function handleMouseMove(event) {
    if (!isDragging) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top - headerHeight;
    
    dragEnd = { x, y };
  }
  
  function handleMouseUp(event) {
    if (!isDragging) return;
    
    isDragging = false;
    
    if (!dragStart || !dragEnd) return;
    
    const startDate = xToDate(Math.min(dragStart.x, dragEnd.x));
    const endDate = xToDate(Math.max(dragStart.x, dragEnd.x));
    
    if (dragType === 'section' && mode === 'add-section') {
      sectionForm = {
        name: '',
        color: colors[sections.length % colors.length],
        seedDefaults: true,
        startDate: formatDateISO(startDate),
        endDate: formatDateISO(endDate)
      };
      showSectionDialog = true;
    } else if (dragType === 'marker' && mode === 'add-marker') {
      markerForm = {
        type: 'tournament',
        name: '',
        color: colors[markers.length % colors.length],
        date: formatDateISO(startDate),
        endDate: dragEnd.x !== dragStart.x ? formatDateISO(endDate) : ''
      };
      showMarkerDialog = true;
    }
    
    dragStart = null;
    dragEnd = null;
    dragType = null;
  }
  
  function handleDayClick(date) {
    if (!isAdmin) return;
    
    selectedDate = date;
    
    if (mode === 'add-marker') {
      markerForm = {
        type: 'tournament',
        name: '',
        color: colors[markers.length % colors.length],
        date: formatDateISO(date),
        endDate: ''
      };
      showMarkerDialog = true;
    } else {
      // Check if practice already exists
      const dateStr = formatDateISO(date);
      const existingPractice = practices.find(p => 
        p.scheduled_date === dateStr
      );
      
      if (existingPractice) {
        toast.push(`A practice already exists on this day. <a href="/teams/${teamId}/plans/${existingPractice.id}" style="text-decoration: underline">Open plan</a> | <a href="/teams/${teamId}/season/week?week=${dateStr}" style="text-decoration: underline">Week view</a>`, {
          theme: {
            '--toastBackground': '#FEF3C7',
            '--toastColor': '#92400E',
            '--toastBarBackground': '#F59E0B'
          }
        });
      } else {
        showPracticeConfirm = true;
      }
    }
  }
  
  // CRUD operations
  async function createSection() {
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/sections`, {
        method: 'POST',
        body: JSON.stringify({
          name: sectionForm.name,
          start_date: sectionForm.startDate,
          end_date: sectionForm.endDate,
          color: sectionForm.color,
          seed_default_sections: sectionForm.seedDefaults
        })
      });
      
      if (result.success) {
        sections = [...sections, result.section];
        toast.push('Section created successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        showSectionDialog = false;
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to create section', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function updateSection() {
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/sections/${editingSection.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: sectionForm.name,
          start_date: sectionForm.startDate,
          end_date: sectionForm.endDate,
          color: sectionForm.color
        })
      });
      
      if (result.success) {
        sections = sections.map(s => 
          s.id === editingSection.id ? { ...s, ...result.section } : s
        );
        toast.push('Section updated successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        showSectionDialog = false;
        editingSection = null;
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to update section', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function deleteSection(section) {
    if (!confirm(`Delete section "${section.name}"?`)) return;
    
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/sections/${section.id}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        sections = sections.filter(s => s.id !== section.id);
        toast.push('Section deleted successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to delete section', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function createMarker() {
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/markers`, {
        method: 'POST',
        body: JSON.stringify({
          type: markerForm.type,
          name: markerForm.name,
          date: markerForm.date,
          end_date: markerForm.endDate || null,
          color: markerForm.color
        })
      });
      
      if (result.success) {
        markers = [...markers, result.marker];
        toast.push('Marker created successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        showMarkerDialog = false;
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to create marker', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function updateMarker() {
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/markers/${editingMarker.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: markerForm.type,
          name: markerForm.name,
          date: markerForm.date,
          end_date: markerForm.endDate || null,
          color: markerForm.color
        })
      });
      
      if (result.success) {
        markers = markers.map(m => 
          m.id === editingMarker.id ? { ...m, ...result.marker } : m
        );
        toast.push('Marker updated successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        showMarkerDialog = false;
        editingMarker = null;
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to update marker', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function deleteMarker(marker) {
    if (!confirm(`Delete marker "${marker.title || marker.name}"?`)) return;
    
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
        method: 'DELETE'
      });
      
      if (result.success) {
        markers = markers.filter(m => m.id !== marker.id);
        toast.push('Marker deleted successfully', {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        dispatch('change');
      }
    } catch (error) {
      toast.push(error.message || 'Failed to delete marker', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function instantiatePractice() {
    loading = true;
    
    try {
      const result = await apiFetch(`/api/seasons/${season.id}/instantiate`, {
        method: 'POST',
        body: JSON.stringify({
          scheduled_date: formatDateISO(selectedDate)
        })
      });
      
      if (result.success && result.plan) {
        toast.push(`Practice created successfully. <a href="/teams/${teamId}/plans/${result.plan.id}" style="text-decoration: underline">Open plan</a> | <a href="/teams/${teamId}/season/week?week=${formatDateISO(selectedDate)}" style="text-decoration: underline">Week view</a>`, {
          theme: {
            '--toastBackground': '#D1FAE5',
            '--toastColor': '#065F46',
            '--toastBarBackground': '#10B981'
          }
        });
        showPracticeConfirm = false;
        dispatch('practiceCreated', result.plan);
      }
    } catch (error) {
      toast.push(error.message || 'Failed to create practice', {
        theme: {
          '--toastBackground': '#FEE2E2',
          '--toastColor': '#991B1B',
          '--toastBarBackground': '#EF4444'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  // Edit helpers
  function startEditSection(section) {
    editingSection = section;
    sectionForm = {
      name: section.name,
      color: section.color,
      seedDefaults: false,
      startDate: formatDateISO(section.start_date),
      endDate: formatDateISO(section.end_date)
    };
    showSectionDialog = true;
  }
  
  function startEditMarker(marker) {
    editingMarker = marker;
    markerForm = {
      type: marker.type,
      name: marker.title || marker.name,
      color: marker.color,
      date: formatDateISO(marker.start_date || marker.date),
      endDate: marker.end_date ? formatDateISO(marker.end_date) : ''
    };
    showMarkerDialog = true;
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
</script>

<div class="timeline-container" class:admin={isAdmin}>
  {#if isAdmin}
    <div class="toolbar mb-4 flex justify-between items-center">
      <div class="flex gap-2">
        <Button 
          variant={mode === 'select' ? 'default' : 'outline'} 
          size="sm"
          on:click={() => mode = 'select'}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2z" />
          </svg>
          Select
        </Button>
        <Button 
          variant={mode === 'add-section' ? 'default' : 'outline'} 
          size="sm"
          on:click={() => mode = 'add-section'}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </Button>
        <Button 
          variant={mode === 'add-marker' ? 'default' : 'outline'} 
          size="sm"
          on:click={() => mode = 'add-marker'}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Add Marker
        </Button>
      </div>
      <div class="text-sm text-gray-500">
        {#if mode === 'add-section'}
          Drag across dates to create a section
        {:else if mode === 'add-marker'}
          Click a day to add a marker
        {:else}
          Click on sections or markers to edit
        {/if}
      </div>
    </div>
  {/if}
  
  <Card>
    <div 
      class="timeline overflow-x-auto"
      bind:this={timelineElement}
      on:mousedown={handleMouseDown}
      on:mousemove={handleMouseMove}
      on:mouseup={handleMouseUp}
      on:mouseleave={() => isDragging = false}
      role="grid"
      tabindex="0"
    >
      <!-- Month headers -->
      <div class="timeline-header sticky top-0 bg-gray-50 border-b z-20" style="height: {headerHeight}px">
        {#each getMonths() as month}
          <div 
            class="month-header absolute flex items-center justify-center font-medium text-sm"
            style="left: {month.x}px; width: {month.width}px; height: {headerHeight / 2}px"
          >
            {month.name}
          </div>
        {/each}
        
        <!-- Day numbers -->
        <div class="absolute" style="top: {headerHeight / 2}px">
          {#each getDays() as day, i}
            <div 
              class="day-header absolute text-xs text-center border-r border-gray-200"
              style="left: {i * dayWidth}px; width: {dayWidth}px; height: {headerHeight / 2}px"
            >
              {day.getDate()}
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Timeline body -->
      <div class="timeline-body relative" style="width: {timelineWidth}px; min-height: 300px">
        <!-- Sections lane -->
        <div class="sections-lane relative" style="height: {sectionsHeight}px">
          {#each stackedSections as row, rowIndex}
            {#each row as section}
              <div
                class="section-bar absolute rounded transition-all cursor-pointer"
                class:hovered={hoveredSection === section.id}
                style="
                  left: {dateToX(section.start_date)}px;
                  width: {dateToX(section.end_date) - dateToX(section.start_date) + dayWidth}px;
                  top: {rowIndex * rowHeight + 5}px;
                  height: {rowHeight - 10}px;
                  background-color: {section.color};
                  opacity: {hoveredSection === section.id ? 1 : 0.8};
                "
                on:mouseenter={() => hoveredSection = section.id}
                on:mouseleave={() => hoveredSection = null}
                on:click={() => isAdmin && mode === 'select' && startEditSection(section)}
                role="button"
                tabindex="0"
              >
                <span class="section-name text-white text-xs font-medium px-2">{section.name}</span>
                {#if isAdmin && hoveredSection === section.id}
                  <button 
                    class="section-delete absolute right-1 top-1 text-white bg-black bg-opacity-20 rounded px-1"
                    on:click|stopPropagation={() => deleteSection(section)}
                    aria-label="Delete section"
                  >
                    ×
                  </button>
                {/if}
              </div>
            {/each}
          {/each}
          
          <!-- Drag preview -->
          {#if isDragging && dragType === 'section'}
            <div 
              class="drag-preview absolute bg-blue-500 opacity-40 rounded"
              style="
                left: {Math.min(dragStart.x, dragEnd.x)}px;
                width: {Math.abs(dragEnd.x - dragStart.x)}px;
                top: {stackedSections.length * rowHeight + 5}px;
                height: {rowHeight - 10}px;
              "
            />
          {/if}
        </div>
        
        <!-- Markers lane -->
        <div class="markers-lane absolute" style="top: {sectionsHeight}px; height: {rowHeight}px; left: 0; right: 0">
          {#each markers as marker}
            {@const isRange = marker.end_date && marker.end_date !== marker.start_date}
            <div
              class="marker absolute flex items-center cursor-pointer"
              class:marker-range={isRange}
              class:hovered={hoveredMarker === marker.id}
              style="
                left: {dateToX(marker.start_date || marker.date)}px;
                {isRange ? `width: ${dateToX(marker.end_date) - dateToX(marker.start_date || marker.date) + dayWidth}px;` : ''}
              "
              on:mouseenter={() => hoveredMarker = marker.id}
              on:mouseleave={() => hoveredMarker = null}
              on:click={() => isAdmin && mode === 'select' && startEditMarker(marker)}
              role="button"
              tabindex="0"
            >
              {#if isRange}
                <div class="h-1 rounded-full" style="background-color: {marker.color}; width: 100%"></div>
              {:else}
                <span class="marker-dot w-3 h-3 rounded-full" style="background-color: {marker.color}"></span>
              {/if}
              <span class="marker-label ml-1 text-xs font-medium bg-white px-1 rounded">{marker.title || marker.name}</span>
              {#if isAdmin && hoveredMarker === marker.id}
                <button 
                  class="marker-delete ml-1 px-1 text-xs bg-gray-100 rounded"
                  on:click|stopPropagation={() => deleteMarker(marker)}
                  aria-label="Delete marker"
                >
                  ×
                </button>
              {/if}
            </div>
          {/each}
          
          <!-- Drag preview -->
          {#if isDragging && dragType === 'marker'}
            <div 
              class="drag-preview absolute h-1 bg-purple-500 opacity-40 rounded-full"
              style="
                left: {Math.min(dragStart.x, dragEnd.x)}px;
                width: {Math.abs(dragEnd.x - dragStart.x) || 10}px;
                top: 50%;
                transform: translateY(-50%);
              "
            />
          {/if}
        </div>
        
        <!-- Practice chips lane -->
        {#if practices && practices.length > 0}
          <div class="practices-lane absolute" style="top: {sectionsHeight + rowHeight}px; height: {rowHeight}px; left: 0; right: 0">
            {#each practices as practice}
              <a
                href="/teams/{teamId}/plans/{practice.id}"
                class="practice-chip absolute"
                style="left: {dateToX(practice.scheduled_date) + dayWidth / 2}px; transform: translateX(-50%)"
                title="{practice.title}"
              >
                <Badge variant={practice.status === 'published' ? 'success' : 'secondary'} size="xs">
                  {practice.status === 'published' ? 'P' : 'D'}
                </Badge>
              </a>
            {/each}
          </div>
        {/if}
        
        <!-- Day cells (interactive layer) -->
        <div class="day-cells absolute" style="top: 0; left: 0">
          {#each getDays() as day, i}
            <div 
              class="day-cell absolute border-r border-gray-100 hover:bg-blue-50 hover:bg-opacity-50 transition-colors cursor-pointer"
              class:weekend={day.getDay() === 0 || day.getDay() === 6}
              class:today={formatDateISO(day) === formatDateISO(new Date())}
              style="left: {i * dayWidth}px; width: {dayWidth}px; height: {sectionsHeight + rowHeight * 2}px"
              on:click={() => handleDayClick(day)}
              role="gridcell"
              tabindex="-1"
              aria-label={formatDate(day)}
            >
            </div>
          {/each}
        </div>
      </div>
    </div>
  </Card>
  
  <!-- Tips -->
  {#if isAdmin}
    <div class="mt-4 text-sm text-gray-600">
      <p class="font-medium">💡 Tips:</p>
      <ul class="mt-1 ml-6 list-disc space-y-1">
        <li>Click "Add Section" then drag across dates to create a new phase</li>
        <li>Click "Add Marker" then click a day to mark important dates</li>
        <li>Click any day to create a practice prefilled with that day's active sections</li>
        <li>Hover over sections or markers and click to edit or delete</li>
      </ul>
    </div>
  {/if}
</div>

<!-- Section Dialog -->
<Dialog bind:open={showSectionDialog} title={editingSection ? 'Edit Section' : 'Create Section'}>
  <form on:submit|preventDefault={editingSection ? updateSection : createSection}>
    <div class="space-y-4">
      <Input
        label="Section Name"
        bind:value={sectionForm.name}
        placeholder="e.g., Pre-season, Regular Season"
        required
      />
      
      <div class="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          bind:value={sectionForm.startDate}
          required
        />
        <Input
          type="date"
          label="End Date"
          bind:value={sectionForm.endDate}
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div class="flex gap-2">
          {#each colors as color}
            <button
              type="button"
              class="w-8 h-8 rounded-md border-2 transition-all"
              class:border-gray-400={sectionForm.color === color}
              class:border-transparent={sectionForm.color !== color}
              style="background-color: {color}"
              on:click={() => sectionForm.color = color}
              aria-label="Select color {color}"
            />
          {/each}
        </div>
      </div>
      
      {#if !editingSection}
        <div class="flex items-center">
          <input
            type="checkbox"
            bind:checked={sectionForm.seedDefaults}
            id="seed-defaults"
            class="mr-2"
          />
          <label for="seed-defaults" class="text-sm">
            Seed default practice sections (Introduction, Fundamentals, Formations, Plays, Tactics)
          </label>
        </div>
      {/if}
    </div>
    
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="ghost" on:click={() => showSectionDialog = false}>
        Cancel
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : editingSection ? 'Update' : 'Create'}
      </Button>
    </div>
  </form>
</Dialog>

<!-- Marker Dialog -->
<Dialog bind:open={showMarkerDialog} title={editingMarker ? 'Edit Marker' : 'Create Marker'}>
  <form on:submit|preventDefault={editingMarker ? updateMarker : createMarker}>
    <div class="space-y-4">
      <Select
        label="Type"
        bind:value={markerForm.type}
        options={markerTypes}
        required
      />
      
      <Input
        label="Name"
        bind:value={markerForm.name}
        placeholder="e.g., Regionals, Spring Break"
        required
      />
      
      <div class="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          bind:value={markerForm.date}
          required
        />
        <Input
          type="date"
          label="End Date (optional)"
          bind:value={markerForm.endDate}
          placeholder="Leave empty for single day"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div class="flex gap-2">
          {#each colors as color}
            <button
              type="button"
              class="w-8 h-8 rounded-md border-2 transition-all"
              class:border-gray-400={markerForm.color === color}
              class:border-transparent={markerForm.color !== color}
              style="background-color: {color}"
              on:click={() => markerForm.color = color}
              aria-label="Select color {color}"
            />
          {/each}
        </div>
      </div>
    </div>
    
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="ghost" on:click={() => showMarkerDialog = false}>
        Cancel
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : editingMarker ? 'Update' : 'Create'}
      </Button>
    </div>
  </form>
</Dialog>

<!-- Practice Confirmation Dialog -->
<Dialog bind:open={showPracticeConfirm} title="Create Practice">
  <div class="space-y-4">
    <p>Create a practice plan for <strong>{selectedDate ? formatDate(selectedDate) : ''}</strong>?</p>
    
    {#if selectedDate}
      {@const overlappingSections = sections.filter(s => {
        const sDate = new Date(selectedDate);
        const sStart = new Date(s.start_date);
        const sEnd = new Date(s.end_date);
        return sDate >= sStart && sDate <= sEnd;
      })}
      
      {#if overlappingSections.length > 0}
        <div class="bg-blue-50 p-3 rounded-md">
          <p class="text-sm font-medium text-blue-900">This practice will be prefilled with content from:</p>
          <ul class="mt-2 text-sm text-blue-700">
            {#each overlappingSections as section}
              <li class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: {section.color}"></span>
                {section.name}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </div>
  
  <div class="flex justify-end gap-2 mt-6">
    <Button variant="ghost" on:click={() => showPracticeConfirm = false}>
      Cancel
    </Button>
    <Button on:click={instantiatePractice} disabled={loading}>
      {loading ? 'Creating...' : 'Create Practice'}
    </Button>
  </div>
</Dialog>

<style>
  .timeline-container {
    position: relative;
  }
  
  .timeline {
    cursor: crosshair;
  }
  
  .timeline-container.admin .timeline.mode-select {
    cursor: default;
  }
  
  .weekend {
    background-color: #fafafa;
  }
  
  .today {
    background-color: rgba(34, 197, 94, 0.1);
  }
</style>