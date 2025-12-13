<script>
	import PracticePlanForm from '../PracticePlanForm.svelte';

	let { data } = $props(); // Receive data from load function

	const skillOptions = $derived(data?.skillOptions ?? []);
	const focusAreaOptions = $derived(data?.focusAreaOptions ?? []);
</script>

<PracticePlanForm {skillOptions} {focusAreaOptions} />
