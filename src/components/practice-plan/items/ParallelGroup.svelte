<script>
  import { 
    startGroupDrag,
    handleGroupDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    dragState
  } from '$lib/stores/dragManager';
  import { 
    handleUngroup, 
    getParallelBlockDuration,
    calculateTimelineDurations,
    getTimelineName,
    customTimelineNames
  } from '$lib/stores/sectionsStore';
  import TimelineColumn from './TimelineColumn.svelte';
  
  export let groupId;
  export let items = [];
  export let sectionIndex;
  export let sectionId;
  
  // Subscribe to customTimelineNames store to make the component reactive
  let timelineNamesStore;
  $: timelineNamesStore = $customTimelineNames;
  
  // Get group timelines and name
  $: firstGroupItem = items.find(item => item.parallel_group_id === groupId);
  $: groupTimelines = firstGroupItem?.groupTimelines || [];
  
  // Try to create a better group name based on included timelines
  $: groupName = (() => {
    // If there's an explicit group name, use it
    if (firstGroupItem?.group_name && firstGroupItem.group_name !== 'Parallel Activities') {
      return firstGroupItem.group_name;
    }
    
    // Otherwise, construct a name from the timelines
    if (groupTimelines && groupTimelines.length) {
      // Get each timeline's custom name
      const timelineNames = groupTimelines.map(t => getTimelineName(t));
      
      // For more than 2 timelines, use a generic name
      if (timelineNames.length > 2) {
        return "Multiple Timelines";
      }
      
      // For 1-2 timelines, show their names
      return timelineNames.join(' & ');
    }
    
    // Fallback name
    return 'Parallel Activities';
  })();
  
  $: console.log('[DEBUG] ParallelGroup - groupTimelines:', {
    groupId,
    groupName,
    timelines: groupTimelines,
    firstItem: firstGroupItem ? {
      id: firstGroupItem.id,
      name: firstGroupItem.name,
      parallel_timeline: firstGroupItem.parallel_timeline,
      groupTimelines: firstGroupItem.groupTimelines,
      group_name: firstGroupItem.group_name
    } : null,
    itemsCount: items.filter(item => item.parallel_group_id === groupId).length
  });
  
  // Calculate durations - memoize to prevent multiple recalculations
  let lastGroupItems = [];
  let cachedDurations = {};
  
  $: {
    // Only recalculate if the items actually changed
    const groupItems = items.filter(item => item.parallel_group_id === groupId);
    const itemsChanged = groupItems.length !== lastGroupItems.length || 
                         JSON.stringify(groupItems.map(i => i.id)) !== 
                         JSON.stringify(lastGroupItems.map(i => i.id));
    
    if (itemsChanged) {
      cachedDurations = calculateTimelineDurations(items, groupId);
      lastGroupItems = [...groupItems];
    }
  }
  
  $: durations = cachedDurations;
  
  // Reactive drag states for this group
  $: isBeingDragged = $dragState.isDragging && 
                      $dragState.dragType === 'group' && 
                      $dragState.sourceSection === sectionIndex && 
                      $dragState.sourceGroupId === groupId;
  
  $: isDropTarget = $dragState.targetSection === sectionIndex && 
                    $dragState.targetGroupId === groupId;
</script>

<div 
  class="parallel-group-container relative px-2 py-2 mb-2 bg-blue-50 border-l-4 border-blue-300 rounded {isBeingDragged ? 'dragging' : ''}"
  draggable="true"
  on:dragstart={(e) => startGroupDrag(e, sectionIndex, groupId)}
  on:dragover={(e) => handleGroupDragOver(e, sectionIndex, groupId, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:dragend={handleDragEnd}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="group-drag-handle">Drag Entire Block</div>
      <h3 class="text-md font-medium">{groupName}</h3>
    </div>
    <button on:click={() => handleUngroup(groupId)}>Ungroup</button>
  </div>

  {#if groupTimelines?.length > 0}
    <div 
      class="grid gap-4" 
      style="--timeline-count: {groupTimelines.length}; grid-template-columns: repeat(var(--timeline-count), 1fr);"
    >
      {#each groupTimelines.sort() as timeline}
        <TimelineColumn
          {timeline}
          {groupTimelines}
          timelineItems={items}
          {sectionIndex}
          {sectionId}
          parallelGroupId={groupId}
          totalDuration={durations[timeline] || 0}
        />
      {/each}
    </div>
  {:else}
    <!-- Show a message when no timelines are configured -->
    <div class="text-center text-gray-500 py-4">
      No timelines configured. Click "Create Parallel Block" to add timelines.
    </div>
  {/if}
</div>

<style>
  .parallel-group-container {
    position: relative;
    transition: transform 0.2s ease, outline 0.2s ease;
  }

  :global(.parallel-group-container.drop-before) {
    position: relative;
  }

  :global(.parallel-group-container.drop-before)::before {
    content: '';
    position: absolute;
    top: -0.25rem;
    left: 0;
    right: 0;
    height: 0.25rem;
    background-color: #3b82f6;
    border-radius: 999px;
    z-index: 10;
  }

  :global(.parallel-group-container.drop-after) {
    position: relative;
  }

  :global(.parallel-group-container.drop-after)::after {
    content: '';
    position: absolute;
    bottom: -0.25rem;
    left: 0;
    right: 0;
    height: 0.25rem;
    background-color: #3b82f6;
    border-radius: 999px;
    z-index: 10;
  }

  .group-drag-handle {
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    background-color: #f9fafb;
    border-radius: 0.25rem;
    cursor: grab;
  }

  .group-drag-handle:active {
    cursor: grabbing;
  }

  .group-drag-handle:hover {
    border-color: #93c5fd;
  }

  /* Mobile layout */
  @media (max-width: 767px) {
    .grid {
      grid-template-columns: 1fr !important;
      grid-template-rows: repeat(var(--timeline-count, 2), auto);
    }
  }
</style> 