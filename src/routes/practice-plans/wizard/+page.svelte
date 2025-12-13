<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	// Redirect to first step if accessing wizard root
	onMount(() => {
		goto('/practice-plans/wizard/basic-info');
	});
</script>

<div class="min-h-screen bg-gray-50">
	{@render children?.()}
</div>
