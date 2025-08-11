<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
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
  
  async function createTeam() {
    if (!newTeam.name.trim()) {
      createError = 'Team name is required';
      return;
    }
    
    isCreating = true;
    createError = '';
    
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      
      if (response.ok) {
        const team = await response.json();
        goto(`/teams/${team.id}/settings`);
      } else {
        const error = await response.json();
        createError = error.error || 'Failed to create team';
      }
    } catch (err) {
      createError = 'Network error. Please try again.';
    } finally {
      isCreating = false;
    }
  }
  
  function closeModal() {
    showCreateModal = false;
    createError = '';
    newTeam = {
      name: '',
      description: '',
      timezone: 'America/New_York',
      default_start_time: '09:00'
    };
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">My Teams</h1>
  
  <button 
    on:click={() => showCreateModal = true}
    class="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
  >
    Create Team
  </button>
  
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each teams as team}
      <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
        <h2 class="text-xl font-semibold">{team.name}</h2>
        <p class="text-gray-600">{team.description || 'No description'}</p>
        <p class="text-sm text-gray-500 mt-2">
          Role: <span class="font-medium capitalize">{team.role}</span>
        </p>
        <div class="mt-4 space-x-2">
          <a 
            href="/teams/{team.id}/season" 
            class="text-blue-500 hover:underline"
          >
            View Season
          </a>
          {#if team.role === 'admin'}
            <a 
              href="/teams/{team.id}/settings" 
              class="text-gray-500 hover:underline"
            >
              Settings
            </a>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  
  {#if teams.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500 mb-4">You're not a member of any teams yet.</p>
      <button 
        on:click={() => showCreateModal = true}
        class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Create Your First Team
      </button>
    </div>
  {/if}
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-2xl font-bold mb-4">Create Team</h2>
      
      {#if createError}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {createError}
        </div>
      {/if}
      
      <label class="block mb-3">
        <span class="text-gray-700">Team Name *</span>
        <input
          bind:value={newTeam.name}
          placeholder="e.g., Toronto Dragons"
          class="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        />
      </label>
      
      <label class="block mb-3">
        <span class="text-gray-700">Description</span>
        <textarea
          bind:value={newTeam.description}
          placeholder="Brief description of your team (optional)"
          class="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          disabled={isCreating}
        />
      </label>
      
      <label class="block mb-3">
        <span class="text-gray-700">Timezone</span>
        <select 
          bind:value={newTeam.timezone}
          class="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">UK Time</option>
          <option value="Europe/Paris">Central European Time</option>
        </select>
      </label>
      
      <label class="block mb-4">
        <span class="text-gray-700">Default Practice Start Time</span>
        <input
          type="time"
          bind:value={newTeam.default_start_time}
          class="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCreating}
        />
      </label>
      
      <div class="flex justify-end space-x-2">
        <button
          on:click={closeModal}
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          disabled={isCreating}
        >
          Cancel
        </button>
        <button
          on:click={createTeam}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  </div>
{/if}