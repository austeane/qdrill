	<script>
		import { feedbackStore } from '$lib/stores/feedbackStore';
		import { browser } from '$app/environment';
		import { page } from '$app/state';
		import { goto } from '$app/navigation';
		import { apiFetch } from '$lib/utils/apiFetch';

	let feedbackText = $state('');
	let feedbackType = $state('general');

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
				feedbackStore.close();
			} catch (error) {
				// Error handling already done by apiFetch
				alert('Failed to submit feedback: ' + error.message);
			}
		}

		function closeModal() {
			feedbackStore.close();
		}

		function goToFeedbackPage() {
			feedbackStore.close();
			goto('/feedback');
		}
	</script>

{#if feedbackStore.modalVisible}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="feedback-title"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-md w-full">
			<h2 id="feedback-title" class="text-xl font-semibold mb-4">Quick Feedback</h2>
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
				<button
					type="button"
					onclick={closeModal}
					class="px-4 py-2 bg-gray-300 rounded"
					aria-label="Cancel"
				>
					Cancel
				</button>
				<button
					onclick={submitFeedback}
					class="px-4 py-2 bg-blue-500 text-white rounded"
					aria-label="Submit Feedback"
				>
					Submit
				</button>
			</div>
			<div class="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
				<a href="/feedback" onclick={(e) => (e.preventDefault(), goToFeedbackPage())}
					>Give and see detailed feedback</a
				>
			</div>
		</div>
	</div>
{/if}
