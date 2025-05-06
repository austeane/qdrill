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
	   – send it to the backend to persist
	   – on success navigate to /practice-plans/{id}/edit
	*/
	async function handleGenerated(event) {
		const generatedPlan = event.detail;
		try {
			const res = await fetch('/api/practice-plans', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(generatedPlan)
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error || 'Failed to save plan');

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