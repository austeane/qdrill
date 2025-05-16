<script>
	import PracticePlanForm from '../PracticePlanForm.svelte';
	export let data; // Receive data from load function
	$: ({ pendingPlanData } = data); // Extract pendingPlanData
</script>

{#if pendingPlanData}
	<!-- Pass pendingPlanData if it exists -->
	<PracticePlanForm {pendingPlanData} />
{:else}
	<!-- Otherwise, render normally (for non-redirect cases) -->
	<PracticePlanForm />
{/if}
