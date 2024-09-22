<script>
    import { feedbackList } from '$lib/stores/feedbackStore';
    import { onMount } from 'svelte';

    let feedbackEntries = [];

    async function fetchFeedback() {
        const response = await fetch('/api/feedback');
        if (response.ok) {
            feedbackEntries = await response.json();
        } else {
            // Handle error
            alert('Failed to load feedback.');
        }
    }

    onMount(() => {
        fetchFeedback();
    });

    let newFeedback = '';
    let newName = '';
    let newEmail = '';

    async function submitDetailedFeedback() {
        const payload = {
            feedback: newFeedback,
            deviceInfo: navigator.userAgent,
            page: window.location.pathname,
            name: newName || null,
            email: newEmail || null
        };

        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            newFeedback = '';
            newName = '';
            newEmail = '';
            fetchFeedback();
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

    <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Submit Your Feedback</h2>
        <textarea
            bind:value={newFeedback}
            rows="4"
            class="w-full border rounded p-2 mb-2"
            placeholder="Your feedback..."
        ></textarea>
        <input
            type="text"
            bind:value={newName}
            class="w-full border rounded p-2 mb-2"
            placeholder="Your name (optional)"
        />
        <input
            type="email"
            bind:value={newEmail}
            class="w-full border rounded p-2 mb-2"
            placeholder="Your email (optional)"
        />
        <button
            on:click={submitDetailedFeedback}
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
            Submit Feedback
        </button>
    </section>

    <section>
        <h2 class="text-xl font-semibold mb-2">Existing Feedback</h2>
        {#if feedbackEntries.length > 0}
            <ul class="space-y-4">
                {#each feedbackEntries as entry}
                    <li class="p-4 border rounded shadow">
                        <p>{entry.feedback}</p>
                        <div class="mt-2 text-sm text-gray-600">
                            <span>Page: {entry.page_url}</span>
                            {#if entry.device_info}
                                <span> | Device: {entry.device_info}</span>
                            {/if}
                            {#if entry.name}
                                <span> | Name: {entry.name}</span>
                            {/if}
                            {#if entry.email}
                                <span> | Email: {entry.email}</span>
                            {/if}
                            <span> | Submitted on: {new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                    </li>
                {/each}
            </ul>
        {:else}
            <p>No feedback available.</p>
        {/if}
    </section>
</div>