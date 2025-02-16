<script>
  import { createEventDispatcher } from 'svelte';

  const PARALLEL_TIMELINES = {
    BEATERS: { name: 'Beaters', color: 'bg-gray-500' },
    CHASERS: { name: 'Chasers', color: 'bg-green-500' },
    SEEKERS: { name: 'Seekers', color: 'bg-yellow-500' }
  };

  export let groupData;
  export let sectionId;

  const dispatch = createEventDispatcher();

  // Local state for internal drag and drop
  let draggedItem = null;
  let dragOverPosition = null;

  function handleDrillDragStart(e, timelineId, drillIndex) {
    e.stopPropagation(); // Prevent group drag
    draggedItem = { timelineId, drillIndex };
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrillDragOver(e, timelineId, drillIndex) {
    e.stopPropagation();
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    dragOverPosition = y < rect.height / 2 ? 'top' : 'bottom';
  }

  function handleDrillDrop(e, timelineId, drillIndex) {
    e.stopPropagation();
    e.preventDefault();

    if (!draggedItem) return;

    dispatch('internalReorder', {
      sourceTimeline: draggedItem.timelineId,
      sourceDrillIndex: draggedItem.drillIndex,
      targetTimeline: timelineId,
      targetDrillIndex: drillIndex,
      position: dragOverPosition
    });

    draggedItem = null;
    dragOverPosition = null;
  }

  function handleDurationChange(timelineId, drillIndex, newDuration) {
    dispatch('durationChange', {
      timelineId,
      drillIndex,
      newDuration
    });
  }

  function handleRemoveDrill(timelineId, drillIndex) {
    dispatch('removeDrill', {
      timelineId,
      drillIndex
    });
  }

  // Add ungroup functionality
  function handleUngroup() {
    dispatch('ungroup');
  }

  function handleGroupDragStart(e) {
    e.stopPropagation();
    dispatch('groupDragStart', {});
  }
</script>

<div class="parallel-group-container">
  <div class="group-header">
    <div 
      class="group-drag-handle"
      on:mousedown|stopPropagation
      draggable="true"
      on:dragstart={handleGroupDragStart}
    >
      ⋮⋮
    </div>
    
    <!-- Add ungroup button -->
    <button 
      class="ungroup-button"
      on:click={handleUngroup}
      title="Ungroup these drills"
    >
      Ungroup
    </button>
  </div>

  <!-- Timeline columns -->
  {#each groupData.timelines as timeline}
    <div class="timeline-column" data-timeline={timeline.id}>
      <div class="timeline-column-header">
        <div class={`timeline-color ${PARALLEL_TIMELINES[timeline.id].color}`}></div>
        <div class="flex-1">
          <span>{PARALLEL_TIMELINES[timeline.id].name}</span>
          <span class="text-sm text-gray-500 ml-2">
            {timeline.drills.reduce((total, drill) => total + (drill.selected_duration || drill.duration), 0)}min
          </span>
        </div>
      </div>

      <!-- Drills in this timeline -->
      {#each timeline.drills as drill, drillIndex}
        <div 
          class="timeline-item"
          draggable="true"
          on:dragstart|stopPropagation={(e) => handleDrillDragStart(e, timeline.id, drillIndex)}
          on:dragover|stopPropagation={(e) => handleDrillDragOver(e, timeline.id, drillIndex)}
          on:drop|stopPropagation={(e) => handleDrillDrop(e, timeline.id, drillIndex)}
        >
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex justify-between items-center">
              <span>{drill.name}</span>
              <div class="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  class="w-16 px-2 py-1 border rounded"
                  value={drill.selected_duration || drill.duration}
                  on:blur={(e) => handleDurationChange(timeline.id, drillIndex, parseInt(e.target.value))}
                />
                <button 
                  class="text-red-500 hover:text-red-700"
                  on:click={() => handleRemoveDrill(timeline.id, drillIndex)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  /* Move relevant styles from PracticePlanForm.svelte */
  .parallel-group-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 0.5rem;
    position: relative;
  }

  .group-drag-handle {
    position: absolute;
    top: 0.5rem;
    left: -1.5rem;
    cursor: grab;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .group-drag-handle:hover {
    opacity: 1;
  }

  .group-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .ungroup-button {
    font-size: 0.875rem;
    color: #6b7280;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .ungroup-button:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .timeline-column {
    flex: 1;
    min-width: 0;
  }

  /* Add other relevant styles from the original file */
</style> 