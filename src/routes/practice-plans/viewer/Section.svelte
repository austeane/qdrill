<script>
  import { slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import DrillCard from './DrillCard.svelte';
  import ParallelGroup from './ParallelGroup.svelte';

  export let section;
  export let isActive = false;
  export let canEdit = false;
  export let sectionIndex = 0;

  const dispatch = createEventDispatcher();
  let isCollapsed = false;

  const sectionColors = [
    'bg-blue-50',
    'bg-green-50',
    'bg-purple-50',
    'bg-amber-50',
    'bg-rose-50',
    'bg-cyan-50'
  ];

  $: {
    console.log('[Section] Received section data:', {
      name: section.name,
      items: section.items?.map(item => ({
        id: item.id,
        name: item.name,
        duration: item.duration,
        selected_duration: item.selected_duration,
        drill: {
          name: item.drill?.name,
          duration: item.drill?.duration
        }
      }))
    });
  }

  $: {
    console.log('[Section] Full section data:', section);
    if (section.items?.length > 0) {
      console.log('[Section] First item in section:', section.items[0]);
    }
  }

  $: normalizedItems = section.items?.map(item => ({
    ...item,
    name: item.drill?.name || item.name || 'Unnamed Item',
    duration: item.selected_duration || item.drill?.duration || item.duration || 15,
    description: item.drill?.brief_description || item.brief_description || '',
    skill_level: item.drill?.skill_level || item.skill_level || [],
    skills_focused_on: item.drill?.skills_focused_on || item.skills_focused_on || []
  }));

  $: {
    console.log('[Section] Normalized items:', normalizedItems);
  }

  function calculateSectionDuration(items) {
    if (!items || items.length === 0) return 0;
    
    const parallelGroups = {};
    let totalDuration = 0;

    items.forEach(item => {
      const duration = parseInt(
        item.selected_duration || 
        item.duration || 
        (item.drill && (item.drill.duration || item.drill.suggested_length)) || 
        15
      );

      if (item.parallel_group_id) {
        if (!parallelGroups[item.parallel_group_id]) {
          parallelGroups[item.parallel_group_id] = duration;
        } else {
          parallelGroups[item.parallel_group_id] = Math.max(
            parallelGroups[item.parallel_group_id],
            duration
          );
        }
      } else {
        totalDuration += duration;
      }
    });

    totalDuration += Object.values(parallelGroups).reduce((sum, duration) => sum + duration, 0);

    return totalDuration;
  }

  $: sectionDuration = calculateSectionDuration(section.items);

  $: groupedItems = section.items?.reduce((acc, item) => {
    console.log('[Section] Processing item for grouping:', item);
    if (item.parallel_group_id) {
      if (!acc.parallel[item.parallel_group_id]) {
        acc.parallel[item.parallel_group_id] = [];
      }
      acc.parallel[item.parallel_group_id].push(item);
    } else {
      acc.single.push(item);
    }
    return acc;
  }, { single: [], parallel: {} });

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    dispatch('collapse', { isCollapsed });
  }

  function handleDrop(event, targetItem) {
    const draggedItemData = event.dataTransfer.getData('text/plain');
    try {
      const draggedItem = JSON.parse(draggedItemData);
      if (draggedItem && targetItem) {
        const groupId = `group_${Date.now()}`;
        dispatch('updateItems', {
          sourceId: draggedItem.id,
          targetId: targetItem.id,
          groupId: groupId
        });
      }
    } catch (e) {
      console.error('Error handling drop:', e);
    }
  }

  function handleDragStart(event, item) {
    event.dataTransfer.setData('text/plain', JSON.stringify(item));
  }

  function getSectionColor(index) {
    return sectionColors[index % sectionColors.length];
  }

  $: console.log('Section Color:', getSectionColor(sectionIndex), 'Index:', sectionIndex);
</script>

<section
  class="practice-section {getSectionColor(sectionIndex)}"
  class:active={isActive}
  id={`section-${section.id}`}
>
  <header class="section-header">
    <div class="section-info">
      <button 
        class="collapse-btn"
        on:click={toggleCollapse}
        aria-label={isCollapsed ? "Expand section" : "Collapse section"}
      >
        <svg
          class="w-4 h-4 transform transition-transform {isCollapsed ? '-rotate-90' : ''}"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>
      <h2 class="section-title">{section.name || 'Unnamed Section'}</h2>
      <span class="section-duration">{sectionDuration} minutes</span>
    </div>

    {#if section.goals?.length > 0}
      <div class="section-goals">
        <h3 class="goals-title">Section Goals:</h3>
        <ul class="goals-list">
          {#each section.goals as goal}
            <li>{goal}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </header>

  {#if !isCollapsed}
    <div class="section-content" transition:slide>
      {#each Object.entries(groupedItems.parallel) as [groupId, items]}
        <ParallelGroup {items} {canEdit} on:ungroup />
      {/each}

      {#each groupedItems.single as item}
        {#if item}
          <div
            draggable={canEdit}
            on:dragstart={(e) => handleDragStart(e, item)}
            on:drop={(e) => handleDrop(e, item)}
            on:dragover={(e) => e.preventDefault()}
          >
            <DrillCard 
              item={item}
              {canEdit}
              on:edit
              on:durationChange
            />
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</section>

<style>
  .practice-section {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .practice-section.active {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    border-left: 4px solid theme('colors.blue.500');
    filter: brightness(0.95);
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .collapse-btn {
    padding: 0.25rem;
    color: theme('colors.gray.500');
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }

  .collapse-btn:hover {
    background: theme('colors.gray.100');
    color: theme('colors.gray.700');
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: theme('colors.gray.900');
  }

  .section-duration {
    margin-left: auto;
    color: theme('colors.gray.500');
    font-size: 0.875rem;
  }

  .section-goals {
    padding: 0.5rem;
    background: theme('colors.gray.50');
    border-radius: 0.25rem;
  }

  .goals-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: theme('colors.gray.700');
    margin-bottom: 0.25rem;
  }

  .goals-list {
    list-style-type: disc;
    margin-left: 1.5rem;
    font-size: 0.875rem;
    color: theme('colors.gray.600');
  }

  .section-content {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style> 