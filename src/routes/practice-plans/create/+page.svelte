<script>
	import PracticePlanForm from '../PracticePlanForm.svelte';
	export let data; // Receive data from load function
	$: ({ pendingPlanData, skillOptions = [], focusAreaOptions = [] } = data); // Extract pendingPlanData and options
</script>

{#if pendingPlanData}
	<!-- Pass pendingPlanData if it exists -->
	<PracticePlanForm {pendingPlanData} {skillOptions} {focusAreaOptions} />
{:else}
	<!-- Otherwise, render normally (for non-redirect cases) -->
	<PracticePlanForm {skillOptions} {focusAreaOptions} />
{/if}
