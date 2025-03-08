<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ExcalidrawWrapper from '../../../components/ExcalidrawWrapper.svelte';
  
  export let data;
  
  let formation = data.formation;
  let isLoading = true;
  let error = null;
  
  onMount(async () => {
    try {
      const response = await fetch(`/api/formations/${$page.params.id}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      formation = await response.json();
      isLoading = false;
    } catch (err) {
      console.error('Error fetching formation:', err);
      error = err.message;
      isLoading = false;
    }
  });
  
  function handleEdit() {
    goto(`/formations/${formation.id}/edit`);
  }
  
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this formation? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/formations/${formation.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      goto('/formations');
    } catch (err) {
      console.error('Error deleting formation:', err);
      alert(`Failed to delete formation: ${err.message}`);
    }
  }
</script>

<svelte:head>
  <title>{formation?.name || 'Loading Formation'} - QDrill</title>
  <meta name="description" content={formation?.brief_description || 'View formation details'} />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <div class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-700 p-6 rounded-lg">
      <h2 class="text-xl font-bold mb-2">Error Loading Formation</h2>
      <p>{error}</p>
      <button 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        on:click={() => goto('/formations')}
      >
        Back to Formations
      </button>
    </div>
  {:else}
    <div class="mb-6 flex items-center justify-between">
      <div>
        <button 
          class="text-blue-600 hover:text-blue-800 flex items-center"
          on:click={() => goto('/formations')}
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Formations
        </button>
      </div>
      
      {#if $page.data.session && $page.data.session.user.id === formation.created_by || formation.is_editable_by_others}
        <div class="flex space-x-4">
          <button 
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            on:click={handleEdit}
          >
            Edit
          </button>
          {#if $page.data.session && $page.data.session.user.id === formation.created_by}
            <button 
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              on:click={handleDelete}
            >
              Delete
            </button>
          {/if}
        </div>
      {/if}
    </div>
    
    <div class="bg-white rounded-lg shadow-sm overflow-hidden p-8">
      <h1 class="text-3xl font-bold mb-4">{formation.name}</h1>
      
      <div class="mb-6">
        <p class="text-lg text-gray-700">{formation.brief_description}</p>
      </div>
      
      {#if formation.tags && formation.tags.length > 0}
        <div class="flex flex-wrap gap-2 mb-6">
          {#each formation.tags as tag}
            <span class="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
              {tag}
            </span>
          {/each}
        </div>
      {/if}
      
      {#if formation.detailed_description}
        <div class="border-t border-gray-200 pt-6 mb-8">
          <h2 class="text-xl font-semibold mb-4">Description</h2>
          <div class="prose max-w-none">
            {@html formation.detailed_description}
          </div>
        </div>
      {/if}
      
      {#if formation.diagrams && formation.diagrams.length > 0}
        <div class="border-t border-gray-200 pt-6">
          <h2 class="text-xl font-semibold mb-4">Diagrams</h2>
          
          <div class="space-y-8">
            {#each formation.diagrams as diagram, i}
              <div class="border rounded-lg overflow-hidden">
                <div class="bg-gray-50 p-4 border-b">
                  <h3 class="font-medium">Diagram {i + 1}</h3>
                </div>
                <div class="p-4">
                  <ExcalidrawWrapper
                    data={typeof diagram === 'string' ? JSON.parse(diagram) : diagram}
                    id={`view-diagram-${i}`}
                    readonly={true}
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="border-t border-gray-200 pt-6 mt-8 text-sm text-gray-500">
        <div class="flex flex-wrap justify-between">
          <div>
            <span>Created: {new Date(formation.created_at).toLocaleDateString()}</span>
            {#if formation.created_at !== formation.updated_at}
              <span class="ml-4">Updated: {new Date(formation.updated_at).toLocaleDateString()}</span>
            {/if}
          </div>
          <div>
            <span>Type: {formation.formation_type === 'offense' ? 'Offense' : 'Defense'}</span>
            <span class="mx-2">•</span>
            <span>Visibility: {formation.visibility}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>