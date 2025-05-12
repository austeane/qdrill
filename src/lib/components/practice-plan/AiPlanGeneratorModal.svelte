<script>
	/* NEW component */
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import AiPlanGenerator from './AiPlanGenerator.svelte';

	// Props
	export let isOpen = false;
	export let skillOptions = [];
	export let focusAreaOptions = [];

	const dispatch = createEventDispatcher();

	function close() {
		isOpen = false;
		dispatch('close');
	}

	/* Handle plan returned by AiPlanGenerator:
	   – send it to the backend to persist (AI output should now match backend schema)
	   – on success navigate to /practice-plans/{id}/edit
	*/
	async function handleGenerated(event) {
		const generatedPlanFromAI = event.detail; // This should now be in the correct format
		try {
			// No transformation needed if AI prompt and schema are aligned with backend
			console.log('Sending AI-generated plan (expected to match backend schema):', JSON.stringify(generatedPlanFromAI, null, 2));

			const res = await fetch('/api/practice-plans', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(generatedPlanFromAI) // Send the AI-generated plan directly
			});
			const body = await res.json();
			if (!res.ok) {
				let errorMessage = 'Failed to save plan.';
				if (body?.error) {
					errorMessage = body.error;
				} else if (body?.errors) { // Handle Zod-like error structures
					errorMessage = Object.entries(body.errors)
						.map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
						.join('; ');
				}
				throw new Error(errorMessage);
			}

			// Navigate straight to edit page
			goto(`/practice-plans/${body.id}/edit`);
		} catch (err) {
			console.error(err);
			alert(err.message || 'Could not create plan');
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
		<div class="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
			<!-- Close button -->
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none"
				on:click={close}
				aria-label="Close"
			>&times;</button>

			<!-- Re-use existing generator -->
			<AiPlanGenerator
				{skillOptions}
				{focusAreaOptions}
				on:generated={handleGenerated}
				on:error={(e) => alert(e.detail)}
			/>
		</div>
	</div>
{/if} 