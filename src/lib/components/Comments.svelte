<script>
import { onMount } from 'svelte';
import { writable } from 'svelte/store';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { apiFetch } from '$lib/utils/apiFetch.js';

	export let drillId = null;
	export let practicePlanId = null;

	let comments = writable([]);
	let newComment = writable('');
	let user = get(page).data.session?.user;

	onMount(async () => {
		if (!drillId && !practicePlanId) return;

		let url = '/api/comments?';
		if (drillId) {
			url += `drillId=${drillId}`;
		} else {
			url += `practicePlanId=${practicePlanId}`;
		}

               try {
                       const result = await apiFetch(url);
                       comments.set(result);
               } catch (error) {
                       console.error('Failed to load comments:', error);
               }
	});

	async function addComment() {
		const content = get(newComment).trim();
		if (!content) return;

               try {
                       const comment = await apiFetch('/api/comments', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ drillId, practicePlanId, content })
                       });
                       comments.update((curr) => [...curr, comment]);
                       newComment.set('');
               } catch (error) {
                       console.error('Failed to add comment:', error);
               }
	}

	async function deleteComment(id) {
               try {
                       await apiFetch(`/api/comments?id=${id}`, { method: 'DELETE' });
                       comments.update((curr) => curr.filter((comment) => comment.id !== id));
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
				bind:value={$newComment}
				placeholder="Add a comment..."
				class="w-full p-2 border border-gray-300 rounded-md"
				rows="3"
			></textarea>
			<button
				on:click={addComment}
				class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
			>
				Submit
			</button>
		</div>
	{:else}
		<p class="mb-4 text-gray-600">You must be logged in to add comments.</p>
	{/if}

	<ul>
		{#each $comments as comment}
			<li class="mb-4 p-4 border border-gray-200 rounded-md">
				<div class="flex justify-between">
					<span class="font-semibold">{comment.user_name}</span>
					{#if user && user.id === comment.user_id}
						<button
							on:click={() => deleteComment(comment.id)}
							class="text-red-500 hover:text-red-700"
						>
							Delete
						</button>
					{/if}
				</div>
				<p class="mt-2 text-gray-700">{comment.content}</p>
				<span class="text-sm text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Optional styles for better UI */
</style>
