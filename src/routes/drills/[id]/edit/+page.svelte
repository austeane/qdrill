<script>
    import DrillForm from '../../DrillForm.svelte';
    
    export let data;
    $: ({ drill, allSkills, allDrillNames } = data);
</script>

<svelte:head>
    <title>Edit Drill</title>
    <meta name="description" content="Edit an existing drill" />
</svelte:head>

<section class="container mx-auto p-4">
    {#if drill && allSkills && allDrillNames}
        <DrillForm {drill} {allSkills} {allDrillNames} />
    {:else}
        <p class="text-center text-gray-600">Loading drill data...</p>
        {#if data.error}
             <p class="text-center text-red-500">Error: {data.error}</p>
        {/if}
    {/if}
</section>