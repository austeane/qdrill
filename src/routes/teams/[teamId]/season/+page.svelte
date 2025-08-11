<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SeasonTimeline from '$lib/components/season/SeasonTimeline.svelte';
  
  export let data;
  
  let seasons = data.seasons || [];
  let activeSeason = seasons.find(s => s.is_active);
  let sections = [];
  let markers = {};
  let showCreateModal = false;
  
  let newSeason = {
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  };
  
  onMount(async () => {
    if (activeSeason) {
      await loadTimelineData();
    }
  });
  
  async function loadTimelineData() {
    if (!activeSeason) return;
    
    // Load sections
    const sectionsRes = await fetch(`/api/seasons/${activeSeason.id}/sections`);
    if (sectionsRes.ok) {
      sections = await sectionsRes.json();
    }
    
    // Load markers
    const markersRes = await fetch(`/api/seasons/${activeSeason.id}/markers`);
    if (markersRes.ok) {
      markers = await markersRes.json();
    }
  }
  
  async function createSeason() {
    const response = await fetch(`/api/teams/${$page.params.teamId}/seasons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeason)
    });
    
    if (response.ok) {
      const season = await response.json();
      seasons = [...seasons, season];
      if (season.is_active) {
        activeSeason = season;
        seasons = seasons.map(s => ({
          ...s,
          is_active: s.id === season.id
        }));
        await loadTimelineData();
      }
      showCreateModal = false;
      resetForm();
    }
  }
  
  async function setActive(seasonId) {
    const response = await fetch(`/api/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true })
    });
    
    if (response.ok) {
      seasons = seasons.map(s => ({
        ...s,
        is_active: s.id === seasonId
      }));
      activeSeason = seasons.find(s => s.id === seasonId);
      await loadTimelineData();
    }
  }
  
  function resetForm() {
    newSeason = {
      name: '',
      start_date: '',
      end_date: '',
      is_active: false
    };
  }
</script>

<div class="container mx-auto p-6">
  <div class="mb-4">
    <a href="/teams" class="text-blue-500 hover:underline">← Back to Teams</a>
  </div>
  
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Season Management</h1>
    {#if data.userRole === 'admin'}
      <button
        on:click={() => showCreateModal = true}
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Season
      </button>
    {/if}
  </div>
  
  {#if activeSeason}
    <div class="mb-8">
      <SeasonTimeline 
        season={activeSeason}
        {sections}
        {markers}
        isAdmin={data.userRole === 'admin'}
        isPublicView={false}
      />
    </div>
    
    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-xl font-semibold text-green-800">Active Season</h2>
          <p class="text-2xl font-bold mt-2">{activeSeason.name}</p>
          <p class="text-gray-600 mt-1">
            {new Date(activeSeason.start_date).toLocaleDateString()} - 
            {new Date(activeSeason.end_date).toLocaleDateString()}
          </p>
        </div>
        {#if data.userRole === 'admin'}
          <div class="space-y-2">
            <a
              href="/teams/{$page.params.teamId}/season/sections"
              class="block px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
            >
              Manage Sections
            </a>
            <a
              href="/teams/{$page.params.teamId}/season/markers"
              class="block px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
            >
              Manage Events
            </a>
            <a
              href="/teams/{$page.params.teamId}/season/recurrences"
              class="block px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 text-center"
            >
              Recurring Practices
            </a>
            <a
              href="/teams/{$page.params.teamId}/season/week"
              class="block px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 text-center"
            >
              Week View
            </a>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <p class="text-yellow-800">No active season. Create or activate a season to get started.</p>
    </div>
  {/if}
  
  <h2 class="text-xl font-semibold mb-4">All Seasons</h2>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each seasons.filter(s => !s.is_active) as season}
      <div class="border rounded-lg p-4">
        <h3 class="font-semibold">{season.name}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {new Date(season.start_date).toLocaleDateString()} - 
          {new Date(season.end_date).toLocaleDateString()}
        </p>
        {#if data.userRole === 'admin'}
          <div class="mt-4">
            <button
              on:click={() => setActive(season.id)}
              class="text-blue-500 hover:underline text-sm"
            >
              Set Active
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Create Season Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 class="text-2xl font-bold mb-4">Create Season</h2>
      
      <input
        bind:value={newSeason.name}
        placeholder="Season Name (e.g., Spring 2024)"
        class="w-full p-2 border rounded mb-3"
      />
      
      <label class="block mb-3">
        <span class="text-gray-700">Start Date</span>
        <input
          type="date"
          bind:value={newSeason.start_date}
          class="mt-1 block w-full p-2 border rounded"
        />
      </label>
      
      <label class="block mb-3">
        <span class="text-gray-700">End Date</span>
        <input
          type="date"
          bind:value={newSeason.end_date}
          class="mt-1 block w-full p-2 border rounded"
        />
      </label>
      
      <label class="flex items-center mb-4">
        <input
          type="checkbox"
          bind:checked={newSeason.is_active}
          class="mr-2"
        />
        <span>Set as active season</span>
      </label>
      
      <div class="flex justify-end space-x-2">
        <button
          on:click={() => {
            showCreateModal = false;
            resetForm();
          }}
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          on:click={createSeason}
          disabled={!newSeason.name || !newSeason.start_date || !newSeason.end_date}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}