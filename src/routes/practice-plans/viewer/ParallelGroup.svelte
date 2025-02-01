<script>
  import { createEventDispatcher } from 'svelte';
  import DrillCard from './DrillCard.svelte';
  
  export let items = [];
  export let canEdit = false;
  export let startTime = null;

  const dispatch = createEventDispatcher();

  $: groupDuration = Math.max(...items.map(item => 
    item.selected_duration || item.duration || 0
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
    {#each items as item (item.drill?.id || item.id || crypto.randomUUID())}
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
    display: flex;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .group-content {
      flex-direction: column;
    }
  }
</style> 