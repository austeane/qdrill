<script>
	import DrillForm from '../../DrillForm.svelte';

	let { data } = $props();

	const drill = $derived(data.drill);
	const allSkills = $derived(data.allSkills);
	const allDrillNames = $derived(data.allDrillNames);
	const error = $derived(data.error);
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
			{#if error}
				<p class="text-center text-red-500">Error: {error}</p>
			{/if}
		{/if}
	</section>
