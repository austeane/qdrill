<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { dev } from '$app/environment';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	export let planId;
	export let createdBy = null;
	export let onDelete = () => {};

	$: canDelete = $page.data.session?.user?.id === createdBy || dev;

	async function deletePlan() {
		if (
			!confirm('Are you sure you want to delete this practice plan? This action cannot be undone.')
		) {
			return;
		}

		try {
			if (!planId) {
				throw new Error('No plan ID provided');
			}

			await apiFetch(`/api/practice-plans/${planId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// If response.ok is true, and it's a 204 No Content, there's no body to parse.
			// We can proceed directly.
			// No need to call: const data = await response.json();

			onDelete();

			toast.push('Practice plan deleted successfully', {
				theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
			});

			if ($page.url.pathname === `/practice-plans/${planId}`) {
				await goto('/practice-plans');
			}
		} catch (error) {
			console.error('Error deleting practice plan:', error);
			toast.push(error.message || 'Failed to delete practice plan', {
				theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
			});
		}
	}
</script>

{#if canDelete}
	<button
		on:click={deletePlan}
		class="text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
		title="Delete practice plan"
	>
		Delete
	</button>
{/if}
