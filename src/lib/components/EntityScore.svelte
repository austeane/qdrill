<script>
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	let { drillId = null, practicePlanId = null } = $props();

	let score = $state(0);
	let isLoading = $state(true);

	$effect(() => {
		if (!drillId && !practicePlanId) {
			isLoading = false;
			return;
		}

		let cancelled = false;

		(async () => {
			isLoading = true;
			try {
				const endpoint = `/api/votes?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
				const counts = await apiFetch(endpoint);
				if (cancelled) return;
				score = (counts.upvotes || 0) - (counts.downvotes || 0);
			} catch (error) {
				console.error('Error loading score:', error);
				toast.push('Error loading score', { theme: { '--toastBackground': '#F56565' } });
			} finally {
				if (!cancelled) isLoading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

{#if isLoading}
	<span class="text-xs text-gray-400 italic">Loading score...</span>
{:else}
	<span class="font-medium text-sm">
		Score: {score}
	</span>
{/if}
