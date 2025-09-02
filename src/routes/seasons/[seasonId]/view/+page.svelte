<script>
  import { page } from '$app/stores';
  import SeasonTimelineViewer from '$lib/components/season/SeasonTimelineViewer.svelte';
  
  export let data;
  
  $: ({ season, practices, markers, sections, isPublicView, icsUrl } = data);
  
  function downloadIcs() {
    window.location.href = icsUrl;
  }
</script>

<svelte:head>
  <title>{season.team_name} - {season.name} Schedule</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
  <!-- Public view header -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span class="text-sm font-medium text-blue-800">Public View</span>
        </div>
        <p class="text-xs text-blue-600 mt-1">
          This is a read-only view of the season schedule
        </p>
      </div>
      <button
        on:click={downloadIcs}
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Add to Calendar
      </button>
    </div>
  </div>
  
  <!-- Season header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">{season.name}</h1>
    <p class="text-gray-600">
      {season.team_name} • 
      {new Date(season.start_date).toLocaleDateString()} - 
      {new Date(season.end_date).toLocaleDateString()}
    </p>
    {#if season.description}
      <p class="text-gray-700 mt-2">{season.description}</p>
    {/if}
  </div>
  
  <!-- Season timeline -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Season Overview</h2>
    <SeasonTimelineViewer
      {season}
      {sections}
      {markers}
      {practices}
    />
  </div>
  
  <!-- Upcoming practices -->
  <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Upcoming Practices</h2>
    {#if practices.length > 0}
      {@const upcomingPractices = practices.filter(p => new Date(p.scheduled_date) >= new Date()).slice(0, 5)}
      {#if upcomingPractices.length > 0}
        <div class="space-y-3">
          {#each upcomingPractices as practice}
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div class="font-medium">{practice.name || 'Practice'}</div>
                <div class="text-sm text-gray-600">
                  {new Date(practice.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {#if practice.start_time}
                    at {practice.start_time}
                  {:else if season.default_start_time}
                    at {season.default_start_time}
                  {/if}
                </div>
                {#if practice.location}
                  <div class="text-sm text-gray-500 mt-1">
                    📍 {practice.location}
                  </div>
                {/if}
              </div>
              {#if practice.duration}
                <div class="text-sm text-gray-500">
                  {practice.duration} min
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500">No upcoming practices scheduled</p>
      {/if}
    {:else}
      <p class="text-gray-500">No practices scheduled yet</p>
    {/if}
  </div>
  
  <!-- Events/Markers -->
  {#if markers.length > 0}
    <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Important Dates</h2>
      <div class="space-y-3">
        {#each markers as marker}
          {@const emoji = {
            tournament: '🏆',
            scrimmage: '⚔️',
            break: '🏖️',
            custom: '📌'
          }[marker.type] || '📌'}
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <span class="text-2xl">{emoji}</span>
            <div class="flex-1">
              <div class="font-medium">{marker.title}</div>
              <div class="text-sm text-gray-600">
                {new Date(marker.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
                {#if marker.end_date && marker.end_date !== marker.start_date}
                  - {new Date(marker.end_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                {/if}
              </div>
              {#if marker.notes}
                <p class="text-sm text-gray-700 mt-1">{marker.notes}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Footer -->
  <div class="mt-12 text-center text-sm text-gray-500">
    <p>Powered by QDrill • <a href="/" class="text-blue-600 hover:underline">Create your own team</a></p>
  </div>
</div>
