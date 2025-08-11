<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import RecurrenceConfig from '$lib/components/season/RecurrenceConfig.svelte';
  import BatchGenerationPreview from '$lib/components/season/BatchGenerationPreview.svelte';
  
  let season = null;
  let recurrences = [];
  let templates = [];
  let loading = true;
  let error = null;
  
  let showConfig = false;
  let editingRecurrence = null;
  let showPreview = false;
  let selectedRecurrence = null;
  let preview = null;
  let generating = false;
  
  let dateRange = {
    start_date: '',
    end_date: ''
  };
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    try {
      loading = true;
      
      // Get active season
      const seasonRes = await fetch(`/api/teams/${$page.params.teamId}/seasons/active`);
      if (!seasonRes.ok) {
        throw new Error('No active season found');
      }
      season = await seasonRes.json();
      
      // Set default date range to next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      dateRange.start_date = nextMonth.toISOString().split('T')[0];
      dateRange.end_date = endOfNextMonth.toISOString().split('T')[0];
      
      // Get recurrences
      const recurrencesRes = await fetch(`/api/seasons/${season.id}/recurrences`);
      if (recurrencesRes.ok) {
        recurrences = await recurrencesRes.json();
      }
      
      // Get template practice plans
      const templatesRes = await fetch(`/api/teams/${$page.params.teamId}/practice-plans?template=true`);
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        templates = data.plans || [];
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  async function handleSaveRecurrence(event) {
    const data = event.detail;
    
    try {
      const url = editingRecurrence 
        ? `/api/seasons/${season.id}/recurrences/${editingRecurrence.id}`
        : `/api/seasons/${season.id}/recurrences`;
      
      const method = editingRecurrence ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save recurrence');
      }
      
      await loadData();
      showConfig = false;
      editingRecurrence = null;
    } catch (err) {
      alert(err.message);
    }
  }
  
  function handleEditRecurrence(recurrence) {
    editingRecurrence = recurrence;
    showConfig = true;
  }
  
  async function handleDeleteRecurrence(recurrence) {
    if (!confirm(`Delete recurrence pattern "${recurrence.name}"? This will not delete already generated practices.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/seasons/${season.id}/recurrences/${recurrence.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recurrence');
      }
      
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  }
  
  async function handlePreviewGeneration(recurrence) {
    selectedRecurrence = recurrence;
    preview = null;
    showPreview = true;
    
    try {
      const response = await fetch(`/api/seasons/${season.id}/recurrences/${recurrence.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRange)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to preview generation');
      }
      
      preview = await response.json();
    } catch (err) {
      alert(err.message);
      showPreview = false;
    }
  }
  
  async function handleGenerate() {
    if (!selectedRecurrence || !preview) return;
    
    generating = true;
    
    try {
      const response = await fetch(`/api/seasons/${season.id}/recurrences/${selectedRecurrence.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRange)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate practices');
      }
      
      const result = await response.json();
      alert(`Successfully generated ${result.generated} practices!`);
      
      showPreview = false;
      selectedRecurrence = null;
      preview = null;
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      generating = false;
    }
  }
  
  function formatPattern(pattern) {
    return pattern.charAt(0).toUpperCase() + pattern.slice(1);
  }
  
  function formatDays(recurrence) {
    if (recurrence.day_of_week && recurrence.day_of_week.length > 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return recurrence.day_of_week.map(d => days[d]).join(', ');
    }
    if (recurrence.day_of_month && recurrence.day_of_month.length > 0) {
      return recurrence.day_of_month.map(d => `${d}${getOrdinalSuffix(d)}`).join(', ');
    }
    return '-';
  }
  
  function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="text-gray-500">Loading...</div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {error}
    </div>
  {:else if !season}
    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
      No active season found. Please create and activate a season first.
    </div>
  {:else}
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Practice Recurrence Patterns</h1>
      <p class="text-gray-600">
        Set up recurring practice schedules for {season.name}
      </p>
    </div>
    
    {#if showConfig}
      <div class="bg-white border rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">
          {editingRecurrence ? 'Edit' : 'Create'} Recurrence Pattern
        </h2>
        <RecurrenceConfig
          recurrence={editingRecurrence}
          {season}
          {templates}
          on:save={handleSaveRecurrence}
          on:cancel={() => {
            showConfig = false;
            editingRecurrence = null;
          }}
        />
      </div>
    {:else if showPreview}
      <div class="bg-white border rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">
          Preview Batch Generation: {selectedRecurrence?.name}
        </h2>
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              bind:value={dateRange.start_date}
              min={season.start_date}
              max={season.end_date}
              class="w-full border rounded px-3 py-2"
              on:change={() => handlePreviewGeneration(selectedRecurrence)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              bind:value={dateRange.end_date}
              min={season.start_date}
              max={season.end_date}
              class="w-full border rounded px-3 py-2"
              on:change={() => handlePreviewGeneration(selectedRecurrence)}
            />
          </div>
        </div>
        <BatchGenerationPreview
          {preview}
          loading={generating}
          on:generate={handleGenerate}
          on:cancel={() => {
            showPreview = false;
            selectedRecurrence = null;
            preview = null;
          }}
        />
      </div>
    {:else}
      <div class="mb-4">
        <button
          on:click={() => showConfig = true}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Recurrence Pattern
        </button>
      </div>
      
      {#if recurrences.length === 0}
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No recurrence patterns configured yet.
        </div>
      {:else}
        <div class="bg-white border rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pattern
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              {#each recurrences as recurrence}
                <tr>
                  <td class="px-4 py-3 font-medium">
                    {recurrence.name}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {formatPattern(recurrence.pattern)}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {formatDays(recurrence)}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {recurrence.time_of_day || '-'}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {recurrence.template_name || 'Season default'}
                  </td>
                  <td class="px-4 py-3">
                    {#if recurrence.is_active}
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-right text-sm space-x-2">
                    <button
                      on:click={() => handlePreviewGeneration(recurrence)}
                      class="text-green-600 hover:underline"
                    >
                      Generate
                    </button>
                    <button
                      on:click={() => handleEditRecurrence(recurrence)}
                      class="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => handleDeleteRecurrence(recurrence)}
                      class="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  {/if}
</div>