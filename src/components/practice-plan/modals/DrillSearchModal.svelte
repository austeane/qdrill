<script>
  import { createEventDispatcher } from 'svelte';
  import { addBreak, addDrillToPlan } from '$lib/stores/sectionsStore';
  import { toast } from '@zerodevx/svelte-toast';
  
  export let show = false;
  export let selectedSectionId = null;
  
  const dispatch = createEventDispatcher();
  
  let searchQuery = '';
  let searchResults = [];

  function close() {
    show = false;
    searchQuery = '';
    searchResults = [];
    dispatch('close');
  }

  async function searchDrills(query) {
    if (!query || query.trim() === '') {
      searchResults = [];
      return;
    }
    
    try {
      const response = await fetch(`/api/drills/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        searchResults = await response.json();
      } else {
        console.error('Failed to search drills');
        searchResults = [];
        toast.push('Error searching drills', { theme: { '--toastBackground': 'red' } });
      }
    } catch (error) {
      console.error('Error searching drills:', error);
      searchResults = [];
      toast.push('Error connecting to server', { theme: { '--toastBackground': 'red' } });
    }
  }

  function handleAddDrill(drill) {
    if (!selectedSectionId) {
      toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
      return;
    }
    
    addDrillToPlan(drill, selectedSectionId);
    close();
  }

  function handleAddBreak() {
    if (!selectedSectionId) {
      toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
      return;
    }
    
    addBreak(selectedSectionId);
    close();
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add to Practice Plan</h3>
        
        <!-- Add Break option at the top -->
        <div class="mb-6 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
             on:click={handleAddBreak}>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-medium">Add Break</h4>
              <p class="text-sm text-gray-500">Add a timed break or transition period</p>
            </div>
            <span class="text-blue-500">+</span>
          </div>
        </div>

        <div class="border-t my-4"></div>
        
        <!-- Search input -->
        <div class="mb-4">
          <input
            type="text"
            bind:value={searchQuery}
            on:input={() => searchDrills(searchQuery)}
            placeholder="Search drills..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Search results -->
        <div class="max-h-[400px] overflow-y-auto">
          {#if searchResults.length === 0}
            <p class="text-gray-500 text-center py-4">
              {searchQuery ? 'No drills found' : 'Start typing to search drills'}
            </p>
          {:else}
            <ul class="divide-y divide-gray-200">
              {#each searchResults as drill}
                <li class="py-3 hover:bg-gray-50 cursor-pointer px-2 rounded"
                    on:click={() => handleAddDrill(drill)}>
                  <div class="flex justify-between items-center">
                    <span>{drill.name}</span>
                    <button class="text-blue-500 hover:text-blue-700">
                      Add
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <!-- Close button -->
        <div class="mt-4 flex justify-end">
          <button
            class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            on:click={close}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 