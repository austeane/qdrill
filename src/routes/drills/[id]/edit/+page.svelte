<script>
    import DrillForm from '../../DrillForm.svelte';
    
    export let data;
    $: ({ drill } = data);
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