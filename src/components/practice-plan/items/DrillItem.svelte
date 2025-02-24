<script>
  import { 
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } from '$lib/stores/dragStore';
  import { handleDurationChange } from '$lib/stores/sectionsStore';
  
  export let item;
  export let itemIndex;
  export let sectionIndex;
  export let onRemove;
</script>

<li class="timeline-item relative transition-all duration-200"
  draggable="true"
  on:dragstart={(e) => handleDragStart(e, sectionIndex, itemIndex)}
  on:dragover={(e) => handleDragOver(e, sectionIndex, itemIndex)}
  on:dragleave={handleDragLeave}
  on:drop={(e) => handleDrop(e, sectionIndex, itemIndex)}
>
  <!-- Item content -->
  <div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="mr-2 cursor-grab">⋮⋮</div>
        <span>{item.name}</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <input
            type="number"
            min="1"
            max="120"
            class="w-16 px-2 py-1 border rounded mr-2"
            value={item.selected_duration || item.duration}
            on:blur={(e) => handleDurationChange(sectionIndex, itemIndex, parseInt(e.target.value) || 15)}
          />
          <span class="text-sm text-gray-600">min</span>
        </div>
        <button 
          class="text-red-500 hover:text-red-700 text-sm"
          on:click={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</li>

<style>
  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
    padding: 0.5rem 0; /* Add padding to increase drop target area */
  }

  .timeline-item::before {
    content: '';
    position: absolute;
    top: -0.5rem;
    left: 0;
    right: 0;
    height: 1rem;
    background: transparent;
  }

  .timeline-item::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    right: 0;
    height: 1rem;
    background: transparent;
  }

  .timeline-item .border-t-4 {
    border-top-style: dashed;
  }

  .timeline-item .border-b-4 {
    border-bottom-style: dashed;
  }
</style> 