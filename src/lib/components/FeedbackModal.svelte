<script>
	import { feedbackModalVisible, feedbackList } from '$lib/stores/feedbackStore';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/utils/apiFetch';

	let feedbackText = '';
	let feedbackType = 'general';
	let name = '';
	let email = '';

	async function submitFeedback() {
		const deviceInfo = browser ? navigator.userAgent : 'Server-side';
		const currentPage = $page.url.pathname;

		const payload = {
			feedback: feedbackText,
			deviceInfo,
			page: currentPage,
			feedbackType
		};

		try {
			await apiFetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			feedbackText = '';
			feedbackType = 'general';
			name = '';
			email = '';
			feedbackModalVisible.set(false);
			// Optionally, refresh feedback list
			loadFeedback();
		} catch (error) {
			// Error handling already done by apiFetch
			alert('Failed to submit feedback: ' + error.message);
		}
	}

	function closeModal() {
		feedbackModalVisible.set(false);
	}

	function goToFeedbackPage() {
		feedbackModalVisible.set(false);
		goto('/feedback');
	}

	async function loadFeedback() {
		try {
			const data = await apiFetch('/api/feedback');
			feedbackList.set(data);
		} catch (error) {
			console.error('Failed to load feedback:', error);
		}
	}

	onMount(() => {
		loadFeedback();
	});
</script>

{#if $feedbackModalVisible}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-6 rounded shadow-lg max-w-md w-full">
			<h2 class="text-xl font-semibold mb-4">Quick Feedback</h2>
			<select bind:value={feedbackType} class="w-full border rounded p-2 mb-2">
				<option value="bug">Bug</option>
				<option value="general">General Comment</option>
				<option value="feature">Feature Request</option>
				<option value="other">Other</option>
			</select>
			<textarea
				bind:value={feedbackText}
				rows="4"
				class="w-full border rounded p-2"
				placeholder="Your feedback..."
			></textarea>
			<div class="mt-4 flex justify-end">
				<button type="button" on:click={closeModal} class="px-4 py-2 bg-gray-300 rounded" aria-label="Cancel">
					Cancel
				</button>
				<button
					on:click={submitFeedback}
					class="px-4 py-2 bg-blue-500 text-white rounded"
					aria-label="Submit Feedback"
				>
					Submit
				</button>
			</div>
			<div class="mt-4 text-sm text-gray-600 text-center">
				<a href="#" on:click|preventDefault={goToFeedbackPage}>Give and see detailed feedback</a>
			</div>
		</div>
	</div>
{/if}
