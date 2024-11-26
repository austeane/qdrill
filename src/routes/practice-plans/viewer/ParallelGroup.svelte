<script>
  import { createEventDispatcher } from 'svelte';
  import DrillCard from './DrillCard.svelte';
  
  export let items = [];
  export let canEdit = false;

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
      <div class="group-duration">{groupDuration} min</div>
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
        isInParallelGroup={true}
        on:edit
        on:durationChange
      />
    {/each}
  </div>
</div>

<style>
  .parallel-group {
    border: 2px solid theme('colors.blue.200');
    border-radius: 0.5rem;
    padding: 1rem;
    background: theme('colors.blue.50');
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .parallel-indicator {
    font-weight: 500;
    color: theme('colors.blue.700');
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .parallel-indicator::before {
    content: '∥';
    font-weight: bold;
  }

  .group-duration {
    color: theme('colors.blue.600');
    font-size: 0.875rem;
    font-weight: 500;
  }

  .group-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .group-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .ungroup-btn {
    font-size: 0.875rem;
    color: theme('colors.blue.600');
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: theme('colors.blue.100');
    transition: all 0.2s ease;
  }

  .ungroup-btn:hover {
    background: theme('colors.blue.200');
  }
</style> 