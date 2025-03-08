<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    formations, 
    filteredFormations, 
    fetchAllFormations, 
    isLoading,
    searchQuery,
    selectedTags,
    selectedFormationType
  } from '$lib/stores/formationsStore';
  
  let searchInput = '';
  let tagsList = [];
  
  onMount(async () => {
    // Fetch all formations
    try {
      await fetchAllFormations();
      
      // Extract unique tags from all formations
      const allTags = new Set();
      $formations.forEach(formation => {
        if (formation.tags && Array.isArray(formation.tags)) {
          formation.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      tagsList = Array.from(allTags).sort();
    } catch (error) {
      console.error('Error fetching formations:', error);
    }
  });
  
  function handleSearch() {
    searchQuery.set(searchInput);
  }
  
  function handleTagToggle(tag) {
    selectedTags.update(tags => {
      const newTags = { ...tags };
      newTags[tag] = !newTags[tag];
      return newTags;
    });
  }
  
  function handleFormationTypeChange(type) {
    selectedFormationType.set(type === $selectedFormationType ? null : type);
  }

  function clearFilters() {
    searchQuery.set('');
    searchInput = '';
    selectedTags.set({});
    selectedFormationType.set(null);
  }
</script>

<svelte:head>
  <title>Formations - QDrill</title>
  <meta name="description" content="Browse and search player formations for your team" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold">Formations</h1>
      <p class="text-gray-600 mt-1">Rather than drills, these are the offensive and defensive formations that your team plays in half-court situations</p>
    </div>
    {#if $page.data.session}
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        on:click={() => goto('/formations/create')}
      >
        Create Formation
      </button>
    {:else}
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        on:click={() => goto('/formations/create')}
      >
        Create Formation
      </button>
    {/if}
  </div>
  
  <!-- Search & Filter Section -->
  <div class="bg-gray-50 rounded-lg p-6 mb-8">
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <div class="relative">
          <input
            id="search"
            type="text"
            bind:value={searchInput}
            on:input={handleSearch}
            placeholder="Search formations..."
            class="block w-full border border-gray-300 rounded-md py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Formation Type Filter -->
    <div class="mt-4">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Filter by Type</h3>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 text-sm rounded-full border transition-colors"
          class:bg-blue-100={$selectedFormationType === 'offense'}
          class:border-blue-300={$selectedFormationType === 'offense'}
          class:text-blue-800={$selectedFormationType === 'offense'}
          class:border-gray-300={$selectedFormationType !== 'offense'}
          on:click={() => handleFormationTypeChange('offense')}
        >
          Offense
        </button>
        <button
          class="px-3 py-1 text-sm rounded-full border transition-colors"
          class:bg-blue-100={$selectedFormationType === 'defense'}
          class:border-blue-300={$selectedFormationType === 'defense'}
          class:text-blue-800={$selectedFormationType === 'defense'}
          class:border-gray-300={$selectedFormationType !== 'defense'}
          on:click={() => handleFormationTypeChange('defense')}
        >
          Defense
        </button>
      </div>
    </div>
    
    {#if tagsList.length > 0}
      <div class="mt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Filter by Tags</h3>
        <div class="flex flex-wrap gap-2">
          {#each tagsList as tag}
            <button
              class="px-3 py-1 text-sm rounded-full border transition-colors"
              class:bg-blue-100={$selectedTags[tag]}
              class:border-blue-300={$selectedTags[tag]}
              class:text-blue-800={$selectedTags[tag]}
              class:border-gray-300={!$selectedTags[tag]}
              on:click={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}
    
    <div class="mt-4 flex justify-end">
      <button
        class="text-sm text-blue-600 hover:text-blue-800"
        on:click={clearFilters}
      >
        Clear All Filters
      </button>
    </div>
  </div>
  
  {#if $isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if $filteredFormations.length === 0}
    <div class="bg-white rounded-lg shadow-sm p-8 text-center">
      <h3 class="text-xl font-medium text-gray-800 mb-2">No formations found</h3>
      <p class="text-gray-600 mb-4">Try adjusting your search or filters, or create a new formation.</p>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        on:click={() => goto('/formations/create')}
      >
        Create Formation
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each $filteredFormations as formation}
        <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow" on:click={() => goto(`/formations/${formation.id}`)}>
          <div class="cursor-pointer p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">{formation.name}</h2>
            <p class="text-gray-600 mb-4 line-clamp-3">{formation.brief_description}</p>
            
            {#if formation.tags && formation.tags.length > 0}
              <div class="flex flex-wrap gap-1.5 mt-2">
                {#each formation.tags as tag}
                  <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                    {tag}
                  </span>
                {/each}
              </div>
            {/if}
            
            <div class="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{new Date(formation.created_at).toLocaleDateString()}</span>
              {#if formation.created_by}
                <span>By {formation.created_by}</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>