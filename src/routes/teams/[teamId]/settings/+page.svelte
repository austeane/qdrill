<script>
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Tabs from '$lib/components/ui/Tabs.svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { toast } from '@zerodevx/svelte-toast';
  import { invalidate } from '$app/navigation';

  export let data;

  let team = data.team;
  let members = data.members;
  let isUpdating = false;
  let updateError = '';
  let updateSuccess = false;
  
  // Member management state
  let showAddMemberDialog = false;
  let newMemberEmail = '';
  let newMemberRole = 'member';
  let isAddingMember = false;
  let addMemberError = '';
  let activeTab = 'general';

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'UK Time' },
    { value: 'Europe/Paris', label: 'Central European Time' }
  ];

  async function updateTeam() {
    isUpdating = true;
    updateError = '';
    updateSuccess = false;

    try {
      await apiFetch(`/api/teams/${team.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: team.name,
          description: team.description,
          timezone: team.timezone,
          default_start_time: team.default_start_time
        })
      });
      updateSuccess = true;
      setTimeout(() => (updateSuccess = false), 3000);
    } catch (err) {
      updateError = err?.message || 'Failed to update team';
    } finally {
      isUpdating = false;
    }
  }

  async function addMember() {
    if (!newMemberEmail.trim()) {
      addMemberError = 'Email is required';
      return;
    }

    isAddingMember = true;
    addMemberError = '';

    try {
      // First find user by email
      const usersResult = await apiFetch(`/api/users/search?email=${encodeURIComponent(newMemberEmail)}`).catch(() => null);
      
      if (!usersResult || usersResult.length === 0) {
        addMemberError = 'No user found with that email address';
        return;
      }

      const userId = usersResult[0].id;

      // Add member
      await apiFetch(`/api/teams/${team.slug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: newMemberRole
        })
      });

      toast.push('Member added successfully', { theme: { '--toastBackground': '#10b981' } });
      showAddMemberDialog = false;
      newMemberEmail = '';
      newMemberRole = 'member';
      
      // Refresh data
      await invalidate(`/teams/${team.slug}/settings`);
    } catch (err) {
      addMemberError = err?.message || 'Failed to add member';
    } finally {
      isAddingMember = false;
    }
  }

  async function updateMemberRole(userId, newRole) {
    try {
      await apiFetch(`/api/teams/${team.slug}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: newRole
        })
      });
      
      toast.push('Role updated successfully', { theme: { '--toastBackground': '#10b981' } });
      await invalidate(`/teams/${team.slug}/settings`);
    } catch (err) {
      toast.push(err?.message || 'Failed to update role', { theme: { '--toastBackground': '#ef4444' } });
    }
  }

  async function removeMember(userId, userName) {
    if (!confirm(`Are you sure you want to remove ${userName} from the team?`)) return;

    try {
      await apiFetch(`/api/teams/${team.slug}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId
        })
      });
      
      toast.push('Member removed successfully', { theme: { '--toastBackground': '#10b981' } });
      await invalidate(`/teams/${team.slug}/settings`);
    } catch (err) {
      toast.push(err?.message || 'Failed to remove member', { theme: { '--toastBackground': '#ef4444' } });
    }
  }
</script>

<div class="container mx-auto p-6">
  <div class="mb-4">
    <Button href="/teams" variant="ghost">← Back to Teams</Button>
  </div>

  <h1 class="text-3xl font-bold mb-6">Team Settings</h1>

  <Tabs bind:value={activeTab} tabs={[
    { value: 'general', label: 'General' },
    { value: 'members', label: 'Members' }
  ]}>
    {#if activeTab === 'general'}
      <div class="tabs-content">
        {#if updateError}
          <p class="mb-4 text-red-600">{updateError}</p>
        {/if}
        {#if updateSuccess}
          <p class="mb-4 text-green-600">Team updated successfully!</p>
        {/if}

        <Card>
          <h2 slot="header" class="text-xl font-semibold">Team Information</h2>

          <div class="grid gap-4">
            <Input label="Team Name" bind:value={team.name} disabled={isUpdating} />
            <Textarea label="Description" bind:value={team.description} rows={3} disabled={isUpdating} />
            <Select label="Timezone" bind:value={team.timezone} options={timezoneOptions} disabled={isUpdating} />
            <Input label="Default Practice Start Time" type="time" bind:value={team.default_start_time} disabled={isUpdating} />
          </div>

          <div slot="footer">
            <Button variant="primary" on:click={updateTeam} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Team'}
            </Button>
          </div>
        </Card>
      </div>
    {:else if activeTab === 'members'}
      <div class="tabs-content">
        <Card>
          <div slot="header" class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Team Members</h2>
            <Button variant="primary" size="sm" on:click={() => showAddMemberDialog = true}>
              + Add Member
            </Button>
          </div>
          
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
          
          <div class="space-y-3">
            {#each members as member}
              <div class="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div class="flex items-center gap-3">
                  {#if member.user?.image}
                    <img 
                      src={member.user.image} 
                      alt={member.user.name || 'User avatar'} 
                      class="w-10 h-10 rounded-full"
                    />
                  {:else}
                    <div class="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span class="text-sm font-medium">
                        {(member.user?.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  {/if}
                  <div>
                    <div class="font-medium">{member.user?.name || 'Unknown User'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{member.user?.email || member.user_id}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <Select
                    value={member.role}
                    on:change={(e) => updateMemberRole(member.user_id, e.target.value)}
                    options={[
                      { value: 'admin', label: 'Admin' },
                      { value: 'coach', label: 'Coach' },
                      { value: 'member', label: 'Member' }
                    ]}
                    disabled={members.filter(m => m.role === 'admin').length === 1 && member.role === 'admin'}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    on:click={() => removeMember(member.user_id, member.user?.name || 'this member')}
                    disabled={members.filter(m => m.role === 'admin').length === 1 && member.role === 'admin'}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </Card>
        
        <Dialog bind:open={showAddMemberDialog} title="Add Team Member">
          <div class="grid gap-4">
            <Input
              label="Email Address"
              type="email"
              bind:value={newMemberEmail}
              placeholder="user@example.com"
              error={addMemberError}
              disabled={isAddingMember}
            />
            <Select
              label="Role"
              bind:value={newMemberRole}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'coach', label: 'Coach' },
                { value: 'admin', label: 'Admin' }
              ]}
              disabled={isAddingMember}
            />
          </div>
          <div slot="footer" class="flex gap-2">
            <Button 
              variant="primary" 
              on:click={addMember}
              disabled={isAddingMember || !newMemberEmail.trim()}
            >
              {isAddingMember ? 'Adding...' : 'Add Member'}
            </Button>
            <Button 
              variant="ghost" 
              on:click={() => { 
                showAddMemberDialog = false; 
                addMemberError = ''; 
                newMemberEmail = '';
                newMemberRole = 'member';
              }}
            >
              Cancel
            </Button>
          </div>
        </Dialog>
      </div>
    {/if}
  </Tabs>
</div>
