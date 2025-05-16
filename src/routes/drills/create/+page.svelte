<script>
	import DrillForm from '../DrillForm.svelte';
	export let data; // Accept data from load function
</script>

<svelte:head>
	<title>Create Drill</title>
	<meta name="description" content="Create a new drill" />
</svelte:head>

<!-- Pass the loaded data as props to DrillForm -->
<DrillForm
	allSkills={data.allSkills}
	allDrillNames={data.allDrillNames}
	prefilledName={data.prefilledName}
	practicePlanId={data.practicePlanId}
	practicePlanItemId={data.practicePlanItemId}
/>
