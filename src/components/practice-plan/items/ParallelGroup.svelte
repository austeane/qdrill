<script>
  import { 
    handleParallelGroupDragStart,
    handleParallelGroupDragOver,
    handleParallelGroupDragLeave,
    handleParallelGroupDrop,
    handleDrop,
    handleDropOnTop
  } from '$lib/stores/dragStore';
  import { 
    handleUngroup, 
    getParallelBlockDuration,
    calculateTimelineDurations
  } from '$lib/stores/sectionsStore';
  import TimelineColumn from './TimelineColumn.svelte';
  
  export let groupId;
  export let items = [];
  export let sectionIndex;
  export let sectionId;
  
  // Get group timelines
  $: firstGroupItem = items.find(item => item.parallel_group_id === groupId);
  $: groupTimelines = firstGroupItem?.groupTimelines || [];
  
  // Calculate durations
  $: durations = calculateTimelineDurations(items, groupId);
</script>

<div 
  class="parallel-group-container relative px-2 py-2 mb-2 bg-blue-50 border-l-4 border-blue-300 rounded"
  draggable="true"
  on:dragstart={(e) => handleParallelGroupDragStart(e, sectionIndex, groupId)}
  on:dragover={(e) => handleParallelGroupDragOver(e, sectionIndex)}
  on:dragleave={handleParallelGroupDragLeave}
  on:drop={(e) => handleParallelGroupDrop(e, sectionIndex)}
>
  <div class="flex items-center justify-between">
    <div class="group-drag-handle">Drag Entire Block</div>
    <button on:click={() => handleUngroup(groupId)}>Ungroup</button>
  </div>

  <!-- Add top drop zone -->
  <div 
    class="h-2 -mt-2 mb-2"
    on:dragover|preventDefault
    on:drop={(e) => handleDropOnTop(e, sectionIndex)}
  ></div>

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

  .parallel-group-container.border-t-4 {
    border-top: 4px solid theme('colors.blue.500');
    margin-top: -4px;
  }

  .parallel-group-container.border-b-4 {
    border-bottom: 4px solid theme('colors.blue.500');
    margin-bottom: -4px;
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

  /* Style for the top drop zone */
  .parallel-group-container > .h-2 {
    transition: height 0.2s ease;
  }

  .parallel-group-container > .h-2:hover,
  .parallel-group-container > .h-2.drag-over {
    height: 1rem;
    background-color: rgba(59, 130, 246, 0.1);
  }

  /* Mobile layout */
  @media (max-width: 767px) {
    .grid {
      grid-template-columns: 1fr !important;
      grid-template-rows: repeat(var(--timeline-count, 2), auto);
    }
  }
</style> 