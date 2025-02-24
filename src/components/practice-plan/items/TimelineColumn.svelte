<script>
  import { PARALLEL_TIMELINES, getParallelBlockDuration, removeTimelineFromGroup } from '$lib/stores/sectionsStore';
  import DrillItem from './DrillItem.svelte';
  
  export let timeline;
  export let timelineItems = [];
  export let sectionIndex;
  export let sectionId;
  export let parallelGroupId;
  export let groupTimelines = [];
  export let totalDuration = 0;
  
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation(); 
  }
  
  function handleDrop(e) {
    e.stopPropagation();
    // Drop handling is delegated to the parent ParallelGroup
  }
</script>

<div 
  class="timeline-column" 
  data-timeline={timeline}
  on:dragover|preventDefault={handleDragOver}
  on:drop|preventDefault={handleDrop}
>
  <div class="timeline-column-header">
    <div class={`timeline-color ${PARALLEL_TIMELINES[timeline].color}`}></div>
    <div class="flex-1">
      <span>{PARALLEL_TIMELINES[timeline].name}</span>
      <span class="text-sm text-gray-500 ml-2">
        {totalDuration}min
      </span>
    </div>
    {#if timeline === groupTimelines[0]}
      <div class="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
        Block: {getParallelBlockDuration(timelineItems, parallelGroupId)}min
      </div>
    {/if}
    {#if groupTimelines.length > 2}
      <button 
        class="ml-2 text-red-500 hover:text-red-700 text-sm"
        on:click={() => removeTimelineFromGroup(sectionId, parallelGroupId, timeline)}
      >
        ×
      </button>
    {/if}
  </div>
  
  <!-- Render drills for this timeline -->
  {#each timelineItems.filter(i => 
    i.parallel_group_id === parallelGroupId && 
    i.parallel_timeline === timeline
  ) as item, index}
    <DrillItem 
      {item}
      itemIndex={timelineItems.indexOf(item)}
      {sectionIndex}
      onRemove={() => removeItem(sectionIndex, timelineItems.indexOf(item))}
    />
  {/each}

  <!-- Add empty state for timeline -->
  {#if !timelineItems.some(i => 
    i.parallel_group_id === parallelGroupId && 
    i.parallel_timeline === timeline
  )}
    <div 
      class="empty-timeline-placeholder h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500"
    >
      Drag drills here
    </div>
  {/if}
</div>

<style>
  .timeline-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 100px;
    padding: 0.5rem;
    border: 2px dashed transparent;
    transition: border-color 0.2s ease;
  }

  .timeline-column[data-timeline="BEATERS"] {
    border-left-color: theme('colors.gray.500');
  }

  .timeline-column[data-timeline="CHASERS"] {
    border-left-color: theme('colors.green.500');
  }

  .timeline-column[data-timeline="SEEKERS"] {
    border-left-color: theme('colors.yellow.500');
  }

  .timeline-column-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    font-weight: 500;
  }

  .timeline-column-header .timeline-color {
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
  }

  .empty-timeline-placeholder {
    transition: all 0.2s ease;
  }

  .empty-timeline-placeholder:hover {
    border-color: theme('colors.blue.500');
    color: theme('colors.blue.500');
  }
</style> 