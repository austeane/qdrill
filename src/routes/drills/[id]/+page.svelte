<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { cart } from '$lib/stores/cartStore';
  import DiagramDrawer from '../../../components/DiagramDrawer.svelte';
  import Breadcrumb from '../../../components/Breadcrumb.svelte';
  import { goto } from '$app/navigation';
  import UpvoteDownvote from '../../../components/UpvoteDownvote.svelte';
  import Comments from '../../../components/Comments.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import ExcalidrawWrapper from '../../../components/ExcalidrawWrapper.svelte';

  let drill = writable({});
  let allVariants = writable({}); // Store for all variant data
  let currentDrillId = $page.params.id;
  let showVariantModal = false;
  let searchQuery = '';
  let selectedDrill = null;
  let relationshipType = null;
  let isLoadingParents = false;
  let availableParentDrills = [];
  let isSearching = false;
  let searchResults = [];
  let editableDiagram = writable(null);

  onMount(async () => {
    try {
      // Load the current drill first for quick display
      const response = await fetch(`/api/drills/${currentDrillId}`);
      if (!response.ok) {
        throw new Error(`Error fetching drill details: ${response.statusText}`);
      }
      const data = await response.json();
      drill.set(data);
      
      // Then load all variants data in the background
      loadAllVariantData(data);
    } catch (error) {
      console.error(error);
    }
  });

  async function loadAllVariantData(currentDrill) {
    try {
      // Determine the parent drill ID
      const parentId = currentDrill.parent_drill_id || currentDrill.id;
      
      const response = await fetch(`/api/drills/${parentId}/all-variants`);
      if (!response.ok) {
        throw new Error('Failed to fetch variant data');
      }
      const variantData = await response.json();
      
      // Store all drill data indexed by ID for quick access
      const drillMap = {};
      drillMap[parentId] = {
        ...variantData.parent,
        variations: variantData.variants // Store the ordered variations array with the parent
      };
      variantData.variants.forEach(variant => {
        drillMap[variant.id] = variant;
      });
      
      allVariants.set(drillMap);

      // Update the current drill with complete variant information
      drill.update(d => ({
        ...d,
        variations: variantData.variants,
        parent_drill_id: d.id === parentId ? null : parentId,
        parent_drill_name: d.id === parentId ? null : variantData.parent.name
      }));
    } catch (error) {
      console.error('Error loading variant data:', error);
    }
  }

  // Function to switch between variants without page reload
  function switchVariant(variantId) {
    currentDrillId = variantId;
    const variantData = $allVariants[variantId];
    if (variantData) {
      const parentId = variantData.parent_drill_id || variantId;
      const parentDrill = $allVariants[parentId];
      
      // Set the drill with complete variant information
      drill.set({
        ...variantData,
        variations: parentDrill.variations || [], // Use the parent's ordered variations array
        parent_drill_id: variantId === parentId ? null : parentId,
        parent_drill_name: variantId === parentId ? null : parentDrill.name
      });

      // Update URL without page reload
      goto(`/drills/${variantId}`, { replaceState: true, noScroll: true });
    }
  }

  function editDiagram(index) {
    editableDiagram.set($drill.diagrams[index]);
  }

  function handleDiagramSave(event, index) {
    const updatedDiagram = event.detail;
    drill.update(d => {
      d.diagrams[index] = updatedDiagram;
      return d;
    });
    editableDiagram.set(null); // Reset the editable diagram after saving
  }

  function addDrillToPlan() {
    cart.addDrill($drill);
    // Show notification
    alert('Drill added to plan');
  }

  // Function to create a new variation
  async function createVariation() {
    await goto(`/drills/create?parentId=${drill.id}`);
  }

  async function loadPotentialParents() {
    isLoadingParents = true;
    try {
      const response = await fetch('/api/drills');
      if (response.ok) {
        const drills = await response.json();
        // Filter out current drill and any variants
        availableParentDrills = drills.filter(d => 
          d.id !== $drill.id && 
          !d.parent_drill_id &&
          d.id !== $drill.parent_drill_id
        );
      }
    } catch (error) {
      console.error('Error loading potential parent drills:', error);
    } finally {
      isLoadingParents = false;
    }
  }

  async function setAsVariant() {
    if (!selectedDrill || !relationshipType) {
      toast.push('Please select a drill and relationship type', {
        theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
      });
      return;
    }

    try {
      const response = await fetch(`/api/drills/${relationshipType === 'current-as-child' ? $drill.id : selectedDrill.id}/set-variant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parentDrillId: relationshipType === 'current-as-child' ? selectedDrill.id : $drill.id 
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedDrill = await response.json();
      drill.set(updatedDrill);
      showVariantModal = false;
      selectedDrill = null;
      relationshipType = null;
      
      toast.push('Successfully set variant relationship', {
        theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
      });
      
      // Refresh the page to show updated relationships
      goto(`/drills/${$drill.id}`, { replaceState: true });
    } catch (error) {
      console.error('Error setting variant relationship:', error);
      toast.push('Failed to set variant relationship', {
        theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
      });
    }
  }

  async function removeVariant() {
    try {
      const response = await fetch(`/api/drills/${$drill.id}/set-variant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentDrillId: null })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedDrill = await response.json();
      drill.set(updatedDrill);
      toast.push('Successfully removed variant status', {
        theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
      });
      
      // Refresh the page to show updated relationships
      goto(`/drills/${$drill.id}`, { replaceState: true });
    } catch (error) {
      console.error('Error removing variant status:', error);
      toast.push('Failed to remove variant status', {
        theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
      });
    }
  }

  async function searchDrills() {
    isSearching = true;
    try {
      const response = await fetch(`/api/drills/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const drills = await response.json();
        // Filter out current drill and any variants
        searchResults = drills.filter(d => d.id !== $drill.id);
      }
    } catch (error) {
      console.error('Error searching drills:', error);
    } finally {
      isSearching = false;
    }
  }

  // Debounce the search function
  let searchTimeout;
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchDrills();
    }, 300);
  }

  function selectDrill(drill) {
    selectedDrill = drill;
    searchQuery = drill.name;
  }

  async function removeVariantRelationship(variantId) {
    try {
      const response = await fetch(`/api/drills/${variantId}/set-variant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentDrillId: null })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Refresh the current drill to update the variations list
      const drillResponse = await fetch(`/api/drills/${$drill.id}`);
      if (drillResponse.ok) {
        const updatedDrill = await drillResponse.json();
        drill.set(updatedDrill);
      }

      toast.push('Variant relationship removed successfully', {
        theme: { '--toastBackground': '#10B981', '--toastColor': 'white' }
      });
    } catch (error) {
      console.error('Error removing variant relationship:', error);
      toast.push('Failed to remove variant relationship', {
        theme: { '--toastBackground': '#EF4444', '--toastColor': 'white' }
      });
    }
  }
</script>

<svelte:head>
  <title>{$drill.name}</title>
  <meta name="description" content="Details of the selected drill" />
</svelte:head>

<Breadcrumb customSegments={[{ name: 'Drills', url: '/drills' }, { name: $drill.name }]} />

<section class="max-w-4xl mx-auto px-4 py-8">
  <div class="relative bg-white p-6 rounded-lg shadow-md">
    <div class="absolute top-4 right-4">
      <UpvoteDownvote drillId={$drill.id} />
    </div>
    <h1 class="text-3xl font-bold mb-6">{$drill.name}</h1>
    <div class="flex justify-between items-center mb-6">
      <div class="flex space-x-4">
        <a href="/drills/create" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300">
          Create New Drill
        </a>
        <button
          on:click={addDrillToPlan}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Add Drill to Plan
        </button>
      </div>
    </div>
    
    <div class="bg-white shadow-md rounded-lg p-6 mb-8">
      <p class="text-xl mb-4">{$drill.brief_description}</p>
      
      <div class="flex justify-center space-x-4 mb-6">
        <a 
          href="/drills/{$page.params.id}/edit" 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Edit Drill
        </a>
        {#if $drill.variations?.length > 0 || $drill.parent_drill_id}
          <button
            on:click={() => {
              loadPotentialParents();
              showVariantModal = true;
            }}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Manage Variants
          </button>
        {:else}
          <button
            on:click={() => {
              loadPotentialParents();
              showVariantModal = true;
            }}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Mark as Variant
          </button>
        {/if}
      </div>

      {#if ($drill.variations?.length > 0 || $drill.parent_drill_id) && $allVariants[$drill.parent_drill_id || $drill.id]}
        <div class="mb-8 bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">Drill Variations</h3>
          <div class="flex flex-wrap gap-2">
            <!-- Show parent drill first -->
            <button
              on:click={() => switchVariant($drill.parent_drill_id || $drill.id)}
              class="px-4 py-2 rounded-full {currentDrillId === ($drill.parent_drill_id || $drill.id) ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'}"
            >
              {$drill.parent_drill_name || $drill.name} (Parent)
            </button>

            <!-- Show all variants -->
            {#each $allVariants[$drill.parent_drill_id || $drill.id].variations || [] as variation}
              <button
                on:click={() => switchVariant(variation.id)}
                class="px-4 py-2 rounded-full {currentDrillId === variation.id ? 'bg-blue-500 text-white' : 'bg-white border hover:bg-gray-50'}"
              >
                {variation.name} (Variant)
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h2 class="text-lg font-semibold mb-2">Drill Details</h2>
          <p><strong>Skill Levels:</strong> {$drill.skill_level}</p>
          <p><strong>Complexity:</strong> {$drill.complexity}</p>
          <p><strong>Suggested Length:</strong> {$drill.suggested_length} minutes</p>
          <p><strong>Number of People:</strong> {$drill.number_of_people_min} - {($drill.number_of_people_max && $drill.number_of_people_max !== '0') ? $drill.number_of_people_max : 'Any'}</p>      </div>
        <div>
          <h2 class="text-lg font-semibold mb-2">Focus Areas</h2>
          <p><strong>Skills:</strong> {Array.isArray($drill.skills_focused_on) ? $drill.skills_focused_on.join(', ') : (typeof $drill.skills_focused_on === 'string' ? $drill.skills_focused_on.split(', ').join(', ') : '')}</p>
          <p><strong>Positions:</strong> {Array.isArray($drill.positions_focused_on) ? $drill.positions_focused_on.join(', ') : (typeof $drill.positions_focused_on === 'string' ? $drill.positions_focused_on.split(', ').join(', ') : '')}</p>
        </div>
        <div>
          <h2 class="text-lg font-semibold mb-2">Drill Types</h2>
          <p>{Array.isArray($drill.drill_type) ? $drill.drill_type.join(', ') : 'N/A'}</p>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Detailed Description</h2>
        <p class="whitespace-pre-wrap">{$drill.detailed_description}</p>
      </div>

      {#if $drill.video_link}
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Video</h2>
          <a href={$drill.video_link} target="_blank" class="text-blue-500 hover:text-blue-700 transition duration-300">Watch Video</a>
        </div>
      {/if}

      {#if $drill.images && $drill.images.length > 0}
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-2">Images</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {#each Array.isArray($drill.images) ? $drill.images : [] as image}
              <img src={image} alt="Drill Image" class="w-full h-48 object-cover rounded-lg" />
            {/each}
          </div>
        </div>
      {/if}

      {#if $drill.diagrams && $drill.diagrams.length > 0}
        <div>
          <h2 class="text-lg font-semibold mb-2">Diagrams</h2>
          {#each $drill.diagrams as diagram, index}
            <div class="mb-4 diagram-container">
              <ExcalidrawWrapper 
                data={diagram} 
                on:save={(event) => handleDiagramSave(event, index)} 
                showSaveButton={false} 
                {index}
                readonly={true}
              />
            </div>
          {/each}
        </div>
      {/if}

      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Comments</h2>
        <Comments drillId={$page.params.id} />
      </div>
    </div>
  </div>

  {#if showVariantModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 class="text-xl font-bold mb-4">Manage Variants</h2>
        
        <p class="text-gray-600 mb-6">
          Mark this drill as a variant if it's a modified version of another drill. This helps group related drills together, making them easier to find.
        </p>

        {#if $drill.variation_count > 0}
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Variant Drills:</h3>
            <div class="space-y-2">
              {#each $drill.variations as variation}
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>{variation.name}</span>
                  <button
                    on:click={() => removeVariantRelationship(variation.id)}
                    class="text-red-500 hover:text-red-700"
                  >
                    Remove Variant
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if $drill.parent_drill_id}
          <div class="mt-4 p-4 bg-gray-50 rounded">
            <h3 class="font-semibold mb-2">Current Parent Drill:</h3>
            <p>{$drill.parent_drill_name}</p>
            <button
              on:click={removeVariant}
              class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove Variant Status
            </button>
          </div>
        {/if}

        <div class="mt-4">
          <input
            type="text"
            bind:value={searchQuery}
            on:input={handleSearchInput}
            placeholder="Search for a new parent drill..."
            class="w-full p-2 border rounded"
          />
        </div>

        {#if isSearching}
          <p>Searching...</p>
        {:else if searchResults.length > 0}
          <div class="max-h-60 overflow-y-auto mb-4">
            {#each searchResults as searchedDrill}
              <div class="flex items-center justify-between p-2 hover:bg-gray-100 {selectedDrill?.id === searchedDrill.id ? 'bg-blue-100' : ''}">
                <span>{searchedDrill.name}</span>
                <button
                  on:click={() => {
                    selectedDrill = searchedDrill;
                    searchQuery = searchedDrill.name;
                  }}
                  class="text-blue-500 hover:text-blue-700"
                >
                  Select
                </button>
              </div>
            {/each}
          </div>
        {:else if searchQuery}
          <p>No results found</p>
        {/if}

        {#if selectedDrill}
          <div class="mt-4 p-4 bg-gray-50 rounded">
            <h3 class="font-semibold mb-2">Make "{$drill.name}" the:</h3>
            <div class="space-y-2">
              <button
                on:click={() => relationshipType = 'current-as-parent'}
                class="w-full text-left p-2 rounded {relationshipType === 'current-as-parent' ? 'bg-blue-100' : 'hover:bg-gray-100'}"
              >
                Parent (of "{selectedDrill.name}")
              </button>
              <button
                on:click={() => relationshipType = 'current-as-child'}
                class="w-full text-left p-2 rounded {relationshipType === 'current-as-child' ? 'bg-blue-100' : 'hover:bg-gray-100'}"
              >
                Variant (of "{selectedDrill.name}")
              </button>
            </div>
          </div>
        {/if}

        <div class="mt-4 flex justify-end space-x-2">
          <button
            on:click={() => {
              showVariantModal = false;
              selectedDrill = null;
              relationshipType = null;
            }}
            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            on:click={setAsVariant}
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!selectedDrill || !relationshipType}
          >
            Set Relationship
          </button>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .diagram-container {
    /* Set a fixed aspect ratio matching the CANVAS dimensions (500x600) */
    aspect-ratio: 5/6;
    width: 100%;
    max-width: 500px; /* Match CANVAS_WIDTH */
    margin: 0 auto; /* Center the container */
  }

  /* Make the container responsive but maintain aspect ratio */
  @media (max-width: 500px) {
    .diagram-container {
      width: 100%;
      max-width: none;
    }
  }
</style>