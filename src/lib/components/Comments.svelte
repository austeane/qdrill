<script>
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { page } from '$app/state';

	let { drillId = null, practicePlanId = null } = $props();

	let comments = $state([]);
	let newComment = $state('');
	const user = $derived(page.data.session?.user);

	$effect(() => {
		if (!drillId && !practicePlanId) {
			comments = [];
			return;
		}

		let cancelled = false;

		(async () => {
			let url = '/api/comments?';
			if (drillId) {
				url += `drillId=${drillId}`;
			} else {
				url += `practicePlanId=${practicePlanId}`;
			}

			try {
				const result = await apiFetch(url);
				if (!cancelled) comments = result;
			} catch (error) {
				console.error('Failed to load comments:', error);
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	async function addComment() {
		const content = newComment.trim();
		if (!content) return;

		try {
			const comment = await apiFetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ drillId, practicePlanId, content })
			});
			comments = [...comments, comment];
			newComment = '';
		} catch (error) {
			console.error('Failed to add comment:', error);
		}
	}

	async function deleteComment(id) {
		try {
			await apiFetch(`/api/comments?id=${id}`, { method: 'DELETE' });
			comments = comments.filter((comment) => comment.id !== id);
		} catch (error) {
			console.error('Failed to delete comment:', error);
		}
	}
</script>

<div class="mt-8">
	<h3 class="text-lg font-semibold mb-4">Comments</h3>

	{#if user}
		<div class="mb-4">
			<textarea
				bind:value={newComment}
				placeholder="Add a comment..."
				class="w-full p-2 border border-gray-300 rounded-md"
				rows="3"
			></textarea>
			<button
				onclick={addComment}
				class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
			>
				Submit
			</button>
		</div>
	{:else}
		<p class="mb-4 text-gray-600 dark:text-gray-300">You must be logged in to add comments.</p>
	{/if}

	<ul>
		{#each comments as comment (comment.id)}
			<li class="mb-4 p-4 border border-gray-200 rounded-md">
				<div class="flex justify-between">
					<span class="font-semibold">{comment.user_name}</span>
					{#if user && user.id === comment.user_id}
						<button
							onclick={() => deleteComment(comment.id)}
							class="text-red-500 hover:text-red-700"
						>
							Delete
						</button>
					{/if}
				</div>
				<p class="mt-2 text-gray-700">{comment.content}</p>
				<span class="text-sm text-gray-500 dark:text-gray-400"
					>{new Date(comment.created_at).toLocaleString()}</span
				>
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Optional styles for better UI */
</style>
