	<script>
		import FeedbackModal from './FeedbackModal.svelte';
		import { feedbackStore } from '$lib/stores/feedbackStore';

		function openFeedbackModal() {
			feedbackStore.open();
		}
	</script>

<div class="fixed bottom-4 left-4">
	<button
		onclick={openFeedbackModal}
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		aria-label="Feedback"
	>
		Feedback
	</button>
</div>

<FeedbackModal />
