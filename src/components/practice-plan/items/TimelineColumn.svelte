<script>
  import { 
    handleTimelineDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } from '$lib/stores/dragManager';
  import DrillItem from './DrillItem.svelte';
  import { removeItem } from '$lib/stores/sectionsStore';
  
  export let timeline;
  export let groupTimelines;
  export let timelineItems = [];
  export let sectionIndex;
  export let sectionId;
  export let parallelGroupId;
  export let totalDuration = 0;
  
  // Filter items for this specific timeline
  $: timelineSpecificItems = timelineItems.filter(
    item => item.parallel_group_id === parallelGroupId && 
           item.parallel_timeline === timeline
  );
  
  $: console.log('[DEBUG] TimelineColumn', {
    timeline,
    parallelGroupId,
    itemCount: timelineSpecificItems.length,
    timelineItems: timelineSpecificItems.map(i => ({
      name: i.name,
      parallel_timeline: i.parallel_timeline,
      groupTimelines: i.groupTimelines
    }))
  });
</script>

<div 
  class="timeline-column bg-white rounded-lg border border-gray-200 p-2 min-h-[150px] flex flex-col transition-all duration-200"
  on:dragover={(e) => handleTimelineDragOver(e, sectionIndex, timeline, parallelGroupId, e.currentTarget)}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <div class="timeline-header bg-gray-100 rounded-lg p-2 mb-3 flex-shrink-0">
    <h4 class="font-semibold">{timeline}</h4>
    <div class="text-sm text-gray-500">{totalDuration}min</div>
  </div>
  
  <ul class="space-y-2 min-h-[50px] flex-grow">
    {#if timelineSpecificItems.length === 0}
      <div class="empty-timeline p-2 text-center text-gray-400 border border-dashed border-gray-300 rounded h-full min-h-[60px] flex items-center justify-center transition-all duration-200">
        Drag drills here
      </div>
    {:else}
      {#each timelineSpecificItems as item, itemIndex}
        <DrillItem 
          {item} 
          {itemIndex} 
          {sectionIndex}
          onRemove={() => removeItem(sectionIndex, timelineItems.indexOf(item))} 
        />
      {/each}
    {/if}
  </ul>
</div>

<style>
  .timeline-column {
    position: relative;
    transition: all 0.2s ease-in-out;
  }
  
  /* Drop target styles */
  :global(.timeline-column.timeline-drop-target) {
    border-color: #3b82f6;
    border-style: dashed;
    background-color: rgba(219, 234, 254, 0.5); /* bg-blue-100 with opacity */
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  }
  
  .empty-timeline {
    transition: all 0.2s ease-in-out;
  }
  
  :global(.timeline-drop-target .empty-timeline) {
    border-color: #3b82f6;
    background-color: rgba(219, 234, 254, 0.8);
  }
</style> 