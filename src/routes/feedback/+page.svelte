<script>
	// import { feedbackList } from '$lib/stores/feedbackStore'; // Store not used directly for list
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation'; // Import invalidate

	export let data; // Accept data from load function

	// Initialize feedbackEntries from server-side data
	let feedbackEntries = data.feedbackEntries || [];
	let isDev = data.isDev || false; // Get dev status from load

	let filterType = 'all';
	let sortBy = 'date';

	// Function to invalidate feedback data
	function invalidateFeedbackData() {
		invalidate('app:feedback');
	}

	// Filtering and sorting remain client-side for now
	$: filteredFeedback = feedbackEntries.filter(
		(entry) => filterType === 'all' || entry.feedback_type === filterType
	);

	$: sortedFeedback = [...filteredFeedback].sort((a, b) => {
		if (sortBy === 'upvotes') {
			return b.upvotes - a.upvotes;
		} else {
			return new Date(b.timestamp) - new Date(a.timestamp);
		}
	});

	async function upvoteFeedback(id) {
		const response = await fetch(`/api/feedback/${id}/upvote`, { method: 'POST' });
		if (response.ok) {
			// Invalidate data instead of manual update
			invalidateFeedbackData();
			// const updatedFeedback = await response.json();
			// feedbackEntries = feedbackEntries.map(entry =>
			//     entry.id === updatedFeedback.id ? { ...entry, upvotes: updatedFeedback.upvotes } : entry
			// );
		} else {
			alert('Failed to upvote feedback.');
		}
	}

	async function deleteFeedback(id) {
		if (!confirm('Are you sure you want to delete this feedback?')) return;

		const response = await fetch(`/api/feedback/${id}/delete`, { method: 'DELETE' });
		if (response.ok) {
			// Invalidate data
			invalidateFeedbackData();
			// feedbackEntries = feedbackEntries.filter(entry => entry.id !== id);
		} else {
			alert('Failed to delete feedback.');
		}
	}

	// Re-initialize feedbackEntries when data prop changes (after invalidation)
	$: if (data.feedbackEntries) {
		feedbackEntries = data.feedbackEntries || [];
	}
	$: isDev = data.isDev || false;

	let newFeedback = '';
	let newFeedbackType = 'general';
	let name = '';
	let email = '';

	async function submitDetailedFeedback() {
		const payload = {
			feedback: newFeedback,
			deviceInfo: navigator.userAgent,
			page: window.location.pathname,
			feedbackType: newFeedbackType,
			name: name,
			email: email
		};

		const response = await fetch('/api/feedback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			newFeedback = '';
			newFeedbackType = 'general';
			name = '';
			email = '';
			invalidateFeedbackData(); // Invalidate data to refresh list
			alert('Feedback submitted successfully.');
		} else {
			alert('Failed to submit feedback.');
		}
	}
</script>

<svelte:head>
	<title>Feedback - QDrill</title>
	<meta name="description" content="View and submit feedback for QDrill" />
</svelte:head>

<div class="container mx-auto p-6">
	<h1 class="text-2xl font-bold mb-4">Feedback</h1>
	{#if data.loadError}
		<p class="text-red-500 bg-red-100 p-3 rounded mb-4">{data.loadError}</p>
	{/if}

	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-2">Submit Your Feedback</h2>
		<select bind:value={newFeedbackType} class="w-full border rounded p-2 mb-2">
			<option value="bug">Bug</option>
			<option value="general">General Comment</option>
			<option value="feature">Feature Request</option>
			<option value="other">Other</option>
		</select>
		<textarea
			bind:value={newFeedback}
			rows="4"
			class="w-full border rounded p-2 mb-2"
			placeholder="Your feedback..."
		></textarea>
		<input
			bind:value={name}
			type="text"
			class="w-full border rounded p-2 mb-2"
			placeholder="Your name (optional)"
		/>
		<input
			bind:value={email}
			type="email"
			class="w-full border rounded p-2 mb-2"
			placeholder="Your email (optional)"
		/>
		<button
			on:click={submitDetailedFeedback}
			class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
			disabled={!newFeedback.trim()}
		>
			Submit Feedback
		</button>
	</section>

	<section>
		<h2 class="text-xl font-semibold mb-2">Existing Feedback</h2>
		<div class="mb-4 flex items-center space-x-4">
			<div class="mb-4">
				<label for="filter-select" class="mr-2">Filter by:</label>
				<select id="filter-select" bind:value={filterType} class="border rounded p-1">
					<option value="all">All</option>
					<option value="bug">Bug</option>
					<option value="general">General Comment</option>
					<option value="feature">Feature Request</option>
					<option value="other">Other</option>
				</select>
			</div>
			<div class="mb-4">
				<label for="sort-select" class="ml-4 mr-2">Sort by:</label>
				<select id="sort-select" bind:value={sortBy} class="border rounded p-1">
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
					<option value="upvotes">Upvotes</option>
				</select>
			</div>
		</div>
		{#if sortedFeedback.length > 0}
			<ul class="space-y-4">
				{#each sortedFeedback as entry (entry.id)}
					<!-- Added key -->
					<li class="p-4 border rounded shadow">
						<p>{entry.feedback}</p>
						<div class="mt-2 text-sm text-gray-600">
							<span>Type: {entry.feedback_type}</span>
							<span> | Submitted on: {new Date(entry.timestamp).toLocaleString()}</span>
							<span> | Upvotes: {entry.upvotes}</span>
							<button
								on:click={() => upvoteFeedback(entry.id)}
								class="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs"
							>
								Upvote
							</button>
							<!-- Use isDev prop passed from server -->
							{#if isDev}
								<button
									on:click={() => deleteFeedback(entry.id)}
									class="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
								>
									Delete
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No feedback available matching the current filters.</p>
		{/if}
	</section>
</div>
