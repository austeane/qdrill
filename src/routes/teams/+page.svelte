<script>
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';

  export let data;

  let teams = data.teams || [];
  let showCreateModal = false;
  let newTeam = {
    name: '',
    description: '',
    timezone: 'America/New_York',
    default_start_time: '09:00'
  };
  let isCreating = false;
  let createError = '';

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'UK Time' },
    { value: 'Europe/Paris', label: 'Central European Time' }
  ];

  async function createTeam() {
    if (!newTeam.name.trim()) {
      createError = 'Team name is required';
      return;
    }

    isCreating = true;
    createError = '';

    try {
      const team = await apiFetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      goto(`/teams/${team.id}/settings`);
    } catch (err) {
      createError = err?.message || 'Failed to create team';
    } finally {
      isCreating = false;
    }
  }

  function resetForm() {
    createError = '';
    newTeam = {
      name: '',
      description: '',
      timezone: 'America/New_York',
      default_start_time: '09:00'
    };
  }

  function closeModal() {
    showCreateModal = false;
    resetForm();
  }
</script>

<svelte:head>
  <title>Teams - QDrill</title>
</svelte:head>

<div class="container mx-auto p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold">{data.isAuthenticated ? 'My Teams' : 'Teams'}</h1>
    {#if data.isAuthenticated}
      <Button variant="primary" on:click={() => (showCreateModal = true)}>Create Team</Button>
    {:else}
      <Button href="/login" variant="primary">Sign in</Button>
    {/if}
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each teams as team}
      <Card variant="elevated">
        <h3 slot="header">
          {#if data.isAuthenticated}
            <a href={`/teams/${team.id}/season`} class="hover:underline">{team.name}</a>
          {:else}
            <a href={`/login?next=${encodeURIComponent(`/teams/${team.id}/season`)}`}>{team.name}</a>
          {/if}
        </h3>
        <p>{team.description || 'No description'}</p>
        <p class="text-sm text-gray-500 mt-2">
          {#if data.isAuthenticated && team.role}
            Role: <span class="font-medium capitalize">{team.role}</span>
          {:else}
            Read-only preview
          {/if}
        </p>
        <div slot="footer" class="flex gap-2">
          {#if data.isAuthenticated}
            <Button href={`/teams/${team.id}/season`} size="sm">View Season</Button>
            {#if team.role === 'admin'}
              <Button href={`/teams/${team.id}/settings`} variant="ghost" size="sm">Settings</Button>
            {/if}
          {:else}
            <Button href={`/login?next=${encodeURIComponent(`/teams/${team.id}/season`)}`} size="sm">View Season</Button>
          {/if}
        </div>
      </Card>
    {/each}
  </div>

  {#if teams.length === 0}
    <div class="text-center py-12">
      {#if data.isAuthenticated}
        <p class="text-gray-500 mb-4">You're not a member of any teams yet.</p>
        <Button variant="primary" on:click={() => (showCreateModal = true)}>
          Create Your First Team
        </Button>
      {:else}
        <p class="text-gray-500 mb-4">No teams to show yet. Sign in to create or join a team.</p>
        <Button href="/login" variant="primary">Sign in</Button>
      {/if}
    </div>
  {/if}
</div>

<Dialog bind:open={showCreateModal} title="Create Team" description="Set up a team for your organization or club.">
  <div class="grid gap-4">
    <Input
      label="Team Name"
      placeholder="e.g., Toronto Dragons"
      bind:value={newTeam.name}
      required
      error={createError && !newTeam.name.trim() ? createError : ''}
      disabled={isCreating}
    />

    <Textarea
      label="Description"
      placeholder="Brief description of your team (optional)"
      bind:value={newTeam.description}
      rows={3}
      disabled={isCreating}
    />

    <Select
      label="Timezone"
      bind:value={newTeam.timezone}
      options={timezoneOptions}
      disabled={isCreating}
    />

    <Input
      label="Default Practice Start Time"
      type="time"
      bind:value={newTeam.default_start_time}
      disabled={isCreating}
    />

    {#if createError && newTeam.name.trim()}
      <p class="text-sm text-red-600">{createError}</p>
    {/if}
  </div>

  <div slot="footer" class="flex justify-end gap-2">
    <Button variant="ghost" on:click={closeModal} disabled={isCreating}>Cancel</Button>
    <Button variant="primary" on:click={createTeam} disabled={isCreating}>
      {isCreating ? 'Creating...' : 'Create'}
    </Button>
  </div>
</Dialog>
