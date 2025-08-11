<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  export let data;
  
  let team = data.team;
  let members = data.members;
  let isUpdating = false;
  let updateError = '';
  let updateSuccess = false;
  
  async function updateTeam() {
    isUpdating = true;
    updateError = '';
    updateSuccess = false;
    
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: team.name,
          description: team.description,
          timezone: team.timezone,
          default_start_time: team.default_start_time
        })
      });
      
      if (response.ok) {
        updateSuccess = true;
        setTimeout(() => updateSuccess = false, 3000);
      } else {
        const error = await response.json();
        updateError = error.error || 'Failed to update team';
      }
    } catch (err) {
      updateError = 'Network error. Please try again.';
    } finally {
      isUpdating = false;
    }
  }
</script>

<div class="container mx-auto p-6">
  <div class="mb-4">
    <a href="/teams" class="text-blue-500 hover:underline">← Back to Teams</a>
  </div>
  
  <h1 class="text-3xl font-bold mb-6">Team Settings</h1>
  
  {#if updateError}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {updateError}
    </div>
  {/if}
  
  {#if updateSuccess}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      Team updated successfully!
    </div>
  {/if}
  
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">Team Information</h2>
    
    <div class="space-y-4">
      <label class="block">
        <span class="text-gray-700">Team Name</span>
        <input
          bind:value={team.name}
          class="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUpdating}
        />
      </label>
      
      <label class="block">
        <span class="text-gray-700">Description</span>
        <textarea
          bind:value={team.description}
          class="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          disabled={isUpdating}
        />
      </label>
      
      <label class="block">
        <span class="text-gray-700">Timezone</span>
        <select 
          bind:value={team.timezone}
          class="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUpdating}
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">UK Time</option>
          <option value="Europe/Paris">Central European Time</option>
        </select>
      </label>
      
      <label class="block">
        <span class="text-gray-700">Default Practice Start Time</span>
        <input
          type="time"
          bind:value={team.default_start_time}
          class="mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUpdating}
        />
      </label>
      
      <button
        on:click={updateTeam}
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update Team'}
      </button>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Team Members</h2>
    
    <div class="text-sm text-gray-600 mb-4">
      {members.length} member{members.length !== 1 ? 's' : ''}
    </div>
    
    <div class="space-y-2">
      {#each members as member}
        <div class="flex items-center justify-between p-3 border rounded">
          <div>
            <span class="font-medium">{member.user_id}</span>
            <span class="ml-2 text-sm text-gray-500 capitalize">({member.role})</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>