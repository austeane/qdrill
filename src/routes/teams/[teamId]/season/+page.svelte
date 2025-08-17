<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SeasonTimeline from '$lib/components/season/SeasonTimeline.svelte';
  import ShareSettings from '$lib/components/season/ShareSettings.svelte';
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/Input.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  
  export let data;
  
  let seasons = data.seasons || [];
  let activeSeason = seasons.find(s => s.is_active);
  let sections = [];
  let markers = {};
  let showCreateModal = false;
  let isCreating = false;
  let createError = '';
  
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
    
    try {
      const sectionsRes = await apiFetch(`/api/seasons/${activeSeason.id}/sections`);
      sections = sectionsRes;
    } catch {}
    
    try {
      const markersRes = await apiFetch(`/api/seasons/${activeSeason.id}/markers`);
      markers = markersRes;
    } catch {}
  }
  
  async function createSeason() {
    if (!newSeason.name || !newSeason.start_date || !newSeason.end_date) return;
    isCreating = true;
    createError = '';
    try {
      const season = await apiFetch(`/api/teams/${$page.params.teamId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeason)
      });
      seasons = [...seasons, season];
      if (season.is_active) {
        activeSeason = season;
        seasons = seasons.map(s => ({ ...s, is_active: s.id === season.id }));
        await loadTimelineData();
      }
      showCreateModal = false;
      resetForm();
    } catch (err) {
      createError = err?.message || 'Failed to create season';
    } finally {
      isCreating = false;
    }
  }
  
  async function setActive(seasonId) {
    try {
      await apiFetch(`/api/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true })
      });
      seasons = seasons.map(s => ({ ...s, is_active: s.id === seasonId }));
      activeSeason = seasons.find(s => s.id === seasonId);
      await loadTimelineData();
    } catch {}
  }
  
  function resetForm() {
    newSeason = {
      name: '',
      start_date: '',
      end_date: '',
      is_active: false
    };
    createError = '';
  }
</script>

<div class="container mx-auto p-6">
  <div class="mb-4">
    <Button href="/teams" variant="ghost">← Back to Teams</Button>
  </div>
  
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Season Management</h1>
    {#if data.userRole === 'admin'}
      <Button variant="primary" on:click={() => (showCreateModal = true)}>Create Season</Button>
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
        teamId={$page.params.teamId}
      />
    </div>
    
    <Card class="mb-6">
      <h2 slot="header" class="text-xl font-semibold">Active Season</h2>
      <div class="flex justify-between items-start">
        <div>
          <p class="text-2xl font-bold">{activeSeason.name}</p>
          <p class="text-gray-600 mt-1">
            {new Date(activeSeason.start_date).toLocaleDateString()} - {new Date(activeSeason.end_date).toLocaleDateString()}
          </p>
        </div>
        {#if data.userRole === 'admin'}
          <div class="flex flex-col gap-2">
            <Button href={`/teams/${$page.params.teamId}/season/sections`} size="sm">Manage Sections</Button>
            <Button href={`/teams/${$page.params.teamId}/season/markers`} size="sm">Manage Events</Button>
            <Button href={`/teams/${$page.params.teamId}/season/recurrences`} size="sm">Recurring Practices</Button>
            <Button href={`/teams/${$page.params.teamId}/season/week`} size="sm">Week View</Button>
          </div>
        {/if}
      </div>
    </Card>
    
    <!-- Share Settings -->
    {#if data.userRole === 'admin'}
      <div class="mt-8">
        <ShareSettings 
          seasonId={activeSeason.id}
          isAdmin={true}
        />
      </div>
    {/if}
  {:else}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <p class="text-yellow-800">No active season. Create or activate a season to get started.</p>
    </div>
  {/if}
  
  <h2 class="text-xl font-semibold mb-4">All Seasons</h2>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each seasons.filter(s => !s.is_active) as season}
      <Card>
        <h3 slot="header" class="font-semibold">{season.name}</h3>
        <p class="text-sm text-gray-600 mt-1">
          {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
        </p>
        <div slot="footer">
          {#if data.userRole === 'admin'}
            <Button variant="ghost" size="sm" on:click={() => setActive(season.id)}>Set Active</Button>
          {/if}
        </div>
      </Card>
    {/each}
  </div>
</div>

<!-- Create Season Modal -->
<Dialog bind:open={showCreateModal} title="Create Season" description="Define the dates and optionally set it active.">
  <div class="grid gap-4">
    <Input label="Season Name" placeholder="Season Name (e.g., Spring 2024)" bind:value={newSeason.name} required />
    <Input label="Start Date" type="date" bind:value={newSeason.start_date} required />
    <Input label="End Date" type="date" bind:value={newSeason.end_date} required />
    <Checkbox label="Set as active season" bind:checked={newSeason.is_active} />
    {#if createError}
      <p class="text-sm text-red-600">{createError}</p>
    {/if}
  </div>

  <div slot="footer" class="flex justify-end gap-2">
    <Button variant="ghost" on:click={() => { showCreateModal = false; resetForm(); }} disabled={isCreating}>Cancel</Button>
    <Button variant="primary" on:click={createSeason} disabled={!newSeason.name || !newSeason.start_date || !newSeason.end_date || isCreating}>
      {isCreating ? 'Creating...' : 'Create'}
    </Button>
  </div>
</Dialog>
