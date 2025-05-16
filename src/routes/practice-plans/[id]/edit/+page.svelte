<script>
	import PracticePlanForm from '../../PracticePlanForm.svelte';

	export let data;
	$: ({ practicePlan } = data);
	$: console.log('[Edit Page] Practice Plan Data:', practicePlan);
</script>

<section class="container mx-auto p-4">
	{#if practicePlan}
		<PracticePlanForm {practicePlan} />
	{:else}
		<p>Loading practice plan...</p>
	{/if}
</section>
