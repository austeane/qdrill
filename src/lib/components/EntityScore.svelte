<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	export let drillId = null;
	export let practicePlanId = null;

	let score = writable(0);
	let isLoading = writable(true);

	onMount(async () => {
		if (!drillId && !practicePlanId) {
			isLoading.set(false);
			return;
		}

		try {
			const endpoint = `/api/votes?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
			const counts = await apiFetch(endpoint);
			score.set((counts.upvotes || 0) - (counts.downvotes || 0));
		} catch (error) {
			console.error('Error loading score:', error);
			toast.push('Error loading score', { theme: { '--toastBackground': '#F56565' } });
		} finally {
			isLoading.set(false);
		}
	});
</script>

{#if $isLoading}
	<span class="text-xs text-gray-400 italic">Loading score...</span>
{:else}
	<span class="font-medium text-sm">
		Score: {$score}
	</span>
{/if}
