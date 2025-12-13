<script>
	import PracticePlanForm from '../../PracticePlanForm.svelte';

	let { data } = $props();
	const practicePlan = $derived(data?.practicePlan);
</script>

<section class="container mx-auto p-4">
	{#if practicePlan}
		<PracticePlanForm {practicePlan} />
	{:else}
		<p>Loading practice plan...</p>
	{/if}
</section>
