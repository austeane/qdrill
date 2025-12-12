<script>
	import FormationForm from '../../FormationForm.svelte';

	export let data;

	$: formation = data.formation;
</script>

<svelte:head>
	<title>Edit Formation - {formation.name}</title>
	<meta name="description" content="Edit the formation details" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<FormationForm {formation} />
</div>
