<script>
  import { createEventDispatcher } from 'svelte';
  import DrillCard from './DrillCard.svelte';
  
  export let items = [];
  export let canEdit = false;
  export let startTime = null;

  const dispatch = createEventDispatcher();

  // Define timeline constants
  const PARALLEL_TIMELINES = {
    BEATERS: { name: 'Beaters', color: 'bg-gray-500' },
    CHASERS: { name: 'Chasers', color: 'bg-green-500' },
    SEEKERS: { name: 'Seekers', color: 'bg-yellow-500' }
  };

  // Group items by timeline
  $: timelineGroups = items.reduce((acc, item) => {
    const timeline = item.parallel_timeline || 'CHASERS';
    if (!acc[timeline]) {
      acc[timeline] = [];
    }
    acc[timeline].push(item);
    return acc;
  }, {});

  // Calculate max duration across all timelines
  $: groupDuration = Math.max(...Object.values(timelineGroups).map(timelineItems => 
    Math.max(...timelineItems.map(item => item.selected_duration || item.duration || 0))
  ));

  function ungroup() {
    dispatch('ungroup', { 
      groupId: items[0]?.parallel_group_id 
    });
  }
</script>

<div class="parallel-group">
  <div class="group-header">
    <div class="parallel-indicator">Parallel Activities</div>
    <div class="group-actions">
      <div class="group-duration">
        {#if startTime}
          <span class="text-sm text-gray-500 mr-2">{startTime}</span>
        {/if}
        {groupDuration} min
      </div>
      {#if canEdit}
        <button 
          class="ungroup-btn"
          on:click={ungroup}
          title="Ungroup activities"
        >
          Ungroup
        </button>
      {/if}
    </div>
  </div>

  <div class="group-content">
    {#each Object.entries(timelineGroups) as [timeline, timelineItems]}
      <div class="timeline-column" class:single-timeline={Object.keys(timelineGroups).length === 1}>
        <div class="timeline-header {PARALLEL_TIMELINES[timeline]?.color || 'bg-gray-200'}">
          {PARALLEL_TIMELINES[timeline]?.name || timeline}
        </div>
        <div class="timeline-items">
          {#each timelineItems as item (item.drill?.id || item.id || crypto.randomUUID())}
            <DrillCard 
              {item}
              {canEdit}
              {startTime}
              isInParallelGroup={true}
              on:edit
              on:durationChange
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .parallel-group {
    border: 1px solid theme('colors.gray.200');
    border-radius: 0.5rem;
    padding: 1rem;
    background: theme('colors.gray.50');
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .parallel-indicator {
    font-size: 0.875rem;
    color: theme('colors.gray.600');
    font-weight: 500;
  }

  .group-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .group-duration {
    font-size: 0.875rem;
    color: theme('colors.gray.600');
  }

  .ungroup-btn {
    font-size: 0.75rem;
    color: theme('colors.red.600');
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid theme('colors.red.200');
    background: theme('colors.red.50');
  }

  .ungroup-btn:hover {
    background: theme('colors.red.100');
  }

  .group-content {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .timeline-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .timeline-column.single-timeline {
    grid-column: 1 / -1;
    max-width: 600px;
    margin: 0 auto;
  }

  .timeline-header {
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-weight: 500;
    color: white;
    text-align: center;
  }

  .timeline-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    .group-content {
      grid-template-columns: 1fr;
    }

    .timeline-column {
      border-bottom: 1px solid theme('colors.gray.200');
      padding-bottom: 1rem;
    }

    .timeline-column:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }
</style> 