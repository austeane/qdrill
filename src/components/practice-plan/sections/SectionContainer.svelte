<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    handleSectionDragStart, 
    handleSectionDragOver, 
    handleSectionDragLeave, 
    handleSectionDrop,
    handleEmptySectionDrop
  } from '$lib/stores/dragStore';
  import SectionHeader from './SectionHeader.svelte';
  import DrillItem from '../items/DrillItem.svelte';
  import ParallelGroup from '../items/ParallelGroup.svelte';
  import { removeSection, removeItem } from '$lib/stores/sectionsStore';
  
  export let section;
  export let sectionIndex;
  
  const dispatch = createEventDispatcher();
  
  function handleOpenDrillSearch(event) {
    dispatch('openDrillSearch', event.detail);
  }
  
  function handleOpenTimelineSelector() {
    dispatch('openTimelineSelector');
  }
  
  // Group items by parallel group ID
  $: groupedItems = groupItemsByParallelGroup(section.items);
  
  function groupItemsByParallelGroup(items) {
    const result = {
      groups: {},
      singles: []
    };
    
    if (!items) return result;
    
    items.forEach(item => {
      if (item.parallel_group_id) {
        if (!result.groups[item.parallel_group_id]) {
          result.groups[item.parallel_group_id] = [];
        }
        result.groups[item.parallel_group_id].push(item);
      } else {
        result.singles.push(item);
      }
    });
    
    return result;
  }
</script>

<div 
  class="section-container bg-white rounded-lg shadow-sm p-4 mb-4"
  draggable="true"
  on:dragstart={(e) => handleSectionDragStart(e, sectionIndex)}
  on:dragover={(e) => handleSectionDragOver(e, sectionIndex)}
  on:dragleave={handleSectionDragLeave}
  on:drop={(e) => handleSectionDrop(e, sectionIndex)}
>
  <SectionHeader 
    {section} 
    onRemove={removeSection}
    on:openDrillSearch={handleOpenDrillSearch}
    on:openTimelineSelector={handleOpenTimelineSelector}
  />

  <ul 
    class="space-y-4 min-h-[50px]"
    on:dragover|preventDefault
    on:drop={(e) => section.items.length === 0 ? handleEmptySectionDrop(e, sectionIndex) : null}
  >
    {#if section.items.length === 0}
      <div 
        class="empty-section-placeholder h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500"
        on:dragover|preventDefault
        on:drop={(e) => handleEmptySectionDrop(e, sectionIndex)}
      >
        Drag drills here
      </div>
    {:else}
      <!-- First render parallel groups -->
      {#each Object.entries(groupedItems.groups) as [groupId, items]}
        <ParallelGroup 
          {groupId} 
          {items} 
          {sectionIndex} 
          sectionId={section.id}
        />
      {/each}
      
      <!-- Then render non-grouped items -->
      {#each groupedItems.singles as item, itemIndex}
        <DrillItem 
          {item} 
          {itemIndex} 
          {sectionIndex}
          onRemove={() => removeItem(sectionIndex, section.items.indexOf(item))} 
        />
      {/each}
    {/if}
  </ul>
</div>

<style>
  .empty-section-placeholder {
    transition: all 0.2s ease;
  }

  .empty-section-placeholder:hover {
    border-color: theme('colors.blue.500');
    color: theme('colors.blue.500');
  }
  
  .section-container {
    transition: border-color 0.2s ease;
    border: 2px solid transparent;
    cursor: grab;
  }

  .section-container:active {
    cursor: grabbing;
  }

  .section-container.border-t-4 {
    border-top: 4px solid theme('colors.blue.500');
  }

  .section-container.border-b-4 {
    border-bottom: 4px solid theme('colors.blue.500');
  }
</style> 