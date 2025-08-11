<script>
  import { page } from '$app/stores';
  import WeekView from '$lib/components/season/WeekView.svelte';
  
  export let data;
  
  let season = data.season ?? null;
  let practices = data.practices ?? [];
  let markers = data.markers ?? [];
  let currentWeek = data.currentWeek ? new Date(data.currentWeek) : new Date();
  let loading = false;
  let error = data.error ?? null;

  // Keep URL in sync with currentWeek when navigating in the component
  function updateUrlWithWeek(week) {
    if (typeof window !== 'undefined') {
      const url = new URL($page.url);
      url.searchParams.set('week', week.toISOString().split('T')[0]);
      window.history.replaceState({}, '', url);
    }
  }
  $: if (typeof window !== 'undefined') {
    updateUrlWithWeek(currentWeek);
  }
</script>

<svelte:head>
  <title>Week View - {season?.name || 'Season'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <div class="mb-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Week View</h1>
      <div class="flex gap-3">
        <a 
          href="/teams/{$page.params.teamId}/season"
          class="text-blue-500 hover:underline text-sm flex items-center"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Season Overview
        </a>
        {#if data.userRole === 'admin'}
          <a 
            href="/teams/{$page.params.teamId}/season/recurrences"
            class="text-blue-500 hover:underline text-sm"
          >
            Manage Recurrences
          </a>
        {/if}
      </div>
    </div>
    
    {#if season}
      <p class="text-gray-600 mt-2">
        {season.name} • 
        {#if data.userRole === 'admin'}
          Admin view (all practices)
        {:else}
          Member view (published only)
        {/if}
      </p>
    {/if}
  </div>
  
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="text-gray-500">
        <svg class="animate-spin h-8 w-8 mr-3 inline" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading week data...
      </div>
    </div>
  {:else if error}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
      <div class="flex">
        <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="font-medium">{error}</p>
          {#if error.includes('No active season')}
            <a 
              href="/teams/{$page.params.teamId}/season"
              class="text-amber-800 underline text-sm mt-1 inline-block"
            >
              Go to season management →
            </a>
          {/if}
        </div>
      </div>
    </div>
  {:else if season}
    <WeekView
      {season}
      {practices}
      {markers}
      bind:currentWeek
      isAdmin={data.userRole === 'admin'}
      teamId={$page.params.teamId}
    />
    
    <div class="mt-6 text-sm text-gray-600">
      <p>💡 Tips:</p>
      <ul class="mt-1 ml-6 list-disc">
        {#if data.userRole === 'admin'}
          <li>Click "Add Practice" on any day to create a draft practice plan</li>
          <li>Draft practices are only visible to admins until published</li>
          <li>Use the Edit button to modify practice details</li>
        {:else}
          <li>Only published practices are shown in this view</li>
          <li>Contact your team admin to make changes to the schedule</li>
        {/if}
        <li>Events and markers are shown at the top of each day</li>
        <li>Use the arrow buttons or "Today" to navigate between weeks</li>
      </ul>
    </div>
  {:else}
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
      No season data available
    </div>
  {/if}
</div>