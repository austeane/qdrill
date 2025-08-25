<script>
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { Users, Calendar, Shield, UserPlus } from 'lucide-svelte';

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
  <!-- Hero Section -->
  <div class="mb-12">
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-3xl font-bold">{data.isAuthenticated ? 'My Teams' : 'Teams'}</h1>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            BETA
          </span>
        </div>
        <p class="text-gray-600 dark:text-gray-300">Streamline your coaching with collaborative team management</p>
      </div>
      {#if data.isAuthenticated}
        <Button variant="primary" on:click={() => (showCreateModal = true)}>
          <UserPlus size={16} class="mr-2" />
          Create Team
        </Button>
      {:else}
        <Button href="/login" variant="primary">Sign in to Get Started</Button>
      {/if}
    </div>

    <!-- Feature Overview Section -->
    {#if !data.isAuthenticated || teams.length === 0}
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 mb-8">
        <h2 class="text-2xl font-semibold mb-6">Empower Your Coaching Staff</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-8 text-lg">
          QDrill Teams brings your entire coaching staff together in one centralized platform. 
          Collaborate on practice plans, track season progress, and ensure everyone is aligned on your team's development goals.
        </p>
        
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Feature 1: Season Management -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div class="flex items-center mb-3">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                <Calendar size={20} class="text-green-600 dark:text-green-400" />
              </div>
              <h3 class="font-semibold">Season Management</h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Organize your entire season with sections, markers, and milestones. Track progress from pre-season through playoffs with timeline visualization and coordinate practice schedules across multiple coaches.
            </p>
          </div>

          <!-- Feature 2: Shared Resources -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div class="flex items-center mb-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                <Users size={20} class="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 class="font-semibold">Shared Resources</h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Team practice plans automatically become available to all team members. Build a collaborative library of proven drills, formations, and strategies that your entire coaching staff can access and contribute to.
            </p>
          </div>

          <!-- Feature 3: Role-Based Access -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div class="flex items-center mb-3">
              <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                <Shield size={20} class="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 class="font-semibold">Role-Based Access</h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Control who can edit plans and manage the team. Assign admin or member roles to maintain organization while enabling collaboration across your coaching staff.
            </p>
          </div>
        </div>

        <div class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>🚀 Beta Feature:</strong> Teams is actively being developed based on coach feedback. 
            Join now to help shape the future of collaborative sports planning.
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Teams Grid -->
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

  {#if teams.length === 0 && data.isAuthenticated}
    <div class="col-span-full text-center py-12">
      <div class="max-w-md mx-auto">
        <Users size={48} class="mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-semibold mb-2">Start Your Team Journey</h3>
        <p class="text-gray-500 mb-6">
          Create your first team to unlock collaborative practice planning, season management, and shared resources for your coaching staff.
        </p>
        <Button variant="primary" size="lg" on:click={() => (showCreateModal = true)}>
          <UserPlus size={20} class="mr-2" />
          Create Your First Team
        </Button>
      </div>
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
