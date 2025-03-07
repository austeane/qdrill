<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    PARALLEL_TIMELINES,
    TIMELINE_COLORS,
    DEFAULT_TIMELINE_NAMES,
    selectedTimelines,
    handleTimelineSave,
    getTimelineColor,
    getTimelineName,
    updateTimelineColor,
    updateTimelineName,
    customTimelineNames,
    debugTimelineNames
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

  // Track locally which timeline is being configured
  let activeTimeline = null;
  let showColorPicker = false;
  let showNameEditor = false;
  let editingName = '';
  
  // Subscribe to customTimelineNames to make the component reactive to changes
  // Use a local variable for the custom timeline names store
  let timelineNamesStore;
  $: timelineNamesStore = $customTimelineNames;
  
  // Force component updates when customTimelineNames changes
  $: console.log("[DEBUG] customTimelineNames changed:", timelineNamesStore);
  
  // Track if we need to refresh timeline names
  let timelineNamesCache = {};
  
  // Refresh timeline names whenever show changes to true (modal opens)
  $: if (show) {
    console.log("[DEBUG] Modal opened, refreshing timeline names from store");
    // Force a refresh of the PARALLEL_TIMELINES when the modal opens
    for (const [key, _] of Object.entries(PARALLEL_TIMELINES)) {
      // Update the name in PARALLEL_TIMELINES from custom or default
      const currentName = getTimelineName(key);
      PARALLEL_TIMELINES[key] = {
        ...PARALLEL_TIMELINES[key],
        name: currentName
      };
      // Update our cache for comparison
      timelineNamesCache[key] = currentName;
    }
  }

  function openColorPicker(timeline) {
    activeTimeline = timeline;
    showColorPicker = true;
    showNameEditor = false;
  }

  function openNameEditor(timeline) {
    activeTimeline = timeline;
    
    // Always get the freshest name from the store using getTimelineName
    // This ensures we get current custom names from customTimelineNames store
    editingName = getTimelineName(timeline);
    console.log(`[DEBUG] Opening name editor for ${timeline} with current name: ${editingName}`);
    
    showNameEditor = true;
    showColorPicker = false;
  }

  function saveTimelineName() {
    if (activeTimeline && editingName) {
      console.log('[DEBUG] TimelineSelectorModal - saving timeline name:', { timeline: activeTimeline, name: editingName });
      updateTimelineName(activeTimeline, editingName);
      showNameEditor = false;
      
      // Debug the current state of timeline names
      debugTimelineNames();
      
      // Update the cached timeline name
      timelineNamesCache[activeTimeline] = editingName;
      
      // Force update of the PARALLEL_TIMELINES object for this component
      PARALLEL_TIMELINES[activeTimeline] = {
        ...PARALLEL_TIMELINES[activeTimeline],
        name: editingName
      };
      
      // Force component to update by creating a minimal delay
      setTimeout(() => {
        console.log('[DEBUG] Forcing component update after name change');
        // Create a temporary copy to trigger reactivity
        timelineNamesStore = { ...timelineNamesStore };
        activeTimeline = null;
      }, 50);
    }
  }

  function selectColor(color) {
    if (activeTimeline) {
      // Validate that color is in TIMELINE_COLORS before updating
      if (Object.keys(TIMELINE_COLORS).includes(color)) {
        updateTimelineColor(activeTimeline, color);
      } else {
        console.warn(`Invalid color class "${color}" selected in TimelineSelectorModal. Must be one of: ${Object.keys(TIMELINE_COLORS).join(', ')}`);
      }
      showColorPicker = false;
      activeTimeline = null;
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Configure Timelines</h3>
        
        <!-- Timeline Selection -->
        <h4 class="text-md font-medium text-gray-800 mb-2">Select Timelines</h4>
        <div class="space-y-4">
          {#each Object.entries(PARALLEL_TIMELINES) as [key, _]}
            <div class="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
              <label class="flex items-center space-x-3 flex-grow cursor-pointer">
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
                <span class="text-gray-700">{timelineNamesStore ? getTimelineName(key) : PARALLEL_TIMELINES[key].name}</span>
              </label>
              
              <!-- Color preview and edit buttons -->
              {#if $selectedTimelines.has(key)}
                <div class="flex items-center space-x-2">
                  <div class={`w-6 h-6 rounded ${getTimelineColor(key)}`}></div>
                  <div class="flex space-x-2">
                    <button 
                      on:click={() => openNameEditor(key)}
                      class="text-sm text-blue-600 hover:text-blue-800"
                      title={`Rename from '${timelineNamesStore ? getTimelineName(key) : PARALLEL_TIMELINES[key].name}'`}
                    >
                      Rename
                    </button>
                    <button 
                      on:click={() => openColorPicker(key)}
                      class="text-sm text-blue-600 hover:text-blue-800"
                      title="Change Color"
                    >
                      Color
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Name editor dialog -->
        {#if showNameEditor}
          <div class="mt-4 p-3 border rounded bg-gray-50">
            <h5 class="text-sm font-medium mb-2">Rename Timeline: {activeTimeline ? (timelineNamesStore ? getTimelineName(activeTimeline) : PARALLEL_TIMELINES[activeTimeline]?.name || activeTimeline) : ''}</h5>
            <div class="flex items-center">
              <input 
                type="text" 
                bind:value={editingName} 
                placeholder="Enter timeline name" 
                class="flex-grow p-2 border border-gray-300 rounded mr-2" 
              />
              <button 
                on:click={saveTimelineName}
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        {/if}

        <!-- Color picker dialog -->
        {#if showColorPicker}
          <div class="mt-4 p-3 border rounded bg-gray-50">
            <h5 class="text-sm font-medium mb-2">Select Color for {activeTimeline ? (timelineNamesStore ? getTimelineName(activeTimeline) : PARALLEL_TIMELINES[activeTimeline]?.name || activeTimeline) : ''} Timeline</h5>
            <div class="grid grid-cols-5 gap-2">
              {#each Object.entries(TIMELINE_COLORS) as [colorClass, colorName]}
                <button 
                  class={`w-8 h-8 rounded cursor-pointer hover:opacity-80 ${colorClass}`}
                  title={colorName}
                  on:click={() => selectColor(colorClass)}
                >
                </button>
              {/each}
            </div>
          </div>
        {/if}

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