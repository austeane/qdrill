<script>
	import { createEventDispatcher } from 'svelte';
	// import { writable } from 'svelte/store'; // Commented out as it's not used
	import FeedbackModal from './FeedbackModal.svelte';
	import Button from './ui/button/button.svelte';
	import { feedbackModalVisible } from '$lib/stores/feedbackStore';

	function openFeedbackModal() {
		feedbackModalVisible.set(true);
	}
</script>

<div class="fixed bottom-4 left-4">
	<button
		on:click={openFeedbackModal}
		class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
		aria-label="Feedback"
	>
		Feedback
	</button>
</div>

<FeedbackModal />
