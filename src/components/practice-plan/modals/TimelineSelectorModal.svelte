<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    PARALLEL_TIMELINES, 
    selectedTimelines,
    handleTimelineSave
  } from '$lib/stores/sectionsStore';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  function close() {
    show = false;
    dispatch('close');
  }

  function save() {
    if (handleTimelineSave()) {
      close();
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Select Timelines</h3>
        
        <div class="space-y-4">
          {#each Object.entries(PARALLEL_TIMELINES) as [key, { name, color }]}
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={$selectedTimelines.has(key)}
                on:change={(e) => {
                  if (e.target.checked) {
                    $selectedTimelines.add(key);
                  } else {
                    $selectedTimelines.delete(key);
                  }
                  // Trigger reactivity by reassigning
                  $selectedTimelines = $selectedTimelines;
                  console.log('[DEBUG] Global selectedTimelines updated:', Array.from($selectedTimelines));
                }}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-gray-700">{name}</span>
              <div class={`w-4 h-4 rounded ${color}`}></div>
            </label>
          {/each}
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            on:click={close}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            on:click={save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 