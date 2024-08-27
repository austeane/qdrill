<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import DrillForm from '../../DrillForm.svelte';
  
    let drill = null;
  
    onMount(async () => {
      try {
        const response = await fetch(`/api/drills/${$page.params.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        drill = await response.json();
      } catch (error) {
        console.error('Error fetching drill:', error);
      }
    });
  </script>
  
  <svelte:head>
    <title>Edit Drill</title>
    <meta name="description" content="Edit an existing drill" />
  </svelte:head>
  
  <section class="container mx-auto p-4">
    {#if drill}
      <DrillForm {drill} />
    {:else}
      <p>Loading...</p>
    {/if}
  </section>