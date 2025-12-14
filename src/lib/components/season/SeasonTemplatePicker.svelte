<script>
	import { page } from '$app/state';

	let { seasonId, currentTemplateId, onSelect, onClose } = $props();

	let templates = $state([]);
	let selectedTemplateId = $state(null);
	let loading = $state(true);

	$effect(() => {
		selectedTemplateId = currentTemplateId ?? null;
	});

	async function loadTemplates() {
		// Use the resolved team.id (UUID) from layout data instead of the URL param
		const teamId = page.data.team?.id;
		if (!teamId) {
			console.error('No team ID available in page data');
			loading = false;
			return;
		}

		const response = await fetch(`/api/practice-plans?team_id=${teamId}&is_template=true`);
		if (response.ok) {
			const data = await response.json();
			templates = data.items || [];
		}
		loading = false;
	}

	function selectTemplate() {
		onSelect?.({ templateId: selectedTemplateId });
	}

	function close() {
		onClose?.();
	}

	$effect(() => {
		void loadTemplates();
	});
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
		<h2 class="text-2xl font-bold mb-4">Select Season Template</h2>

		{#if loading}
			<p class="text-gray-500">Loading templates...</p>
		{:else if templates.length === 0}
			<p class="text-gray-500 mb-4">No template practice plans found.</p>
			<p class="text-sm text-gray-600">
				Create a practice plan and mark it as a template to use it here.
			</p>
		{:else}
			<div class="space-y-3 mb-6">
				<label class="block border rounded p-3 hover:bg-gray-50 cursor-pointer">
					<input type="radio" bind:group={selectedTemplateId} value={null} class="mr-2" />
					<span class="font-medium">No Template</span>
					<span class="text-sm text-gray-500 ml-2">(Start from scratch)</span>
				</label>

				{#each templates as template (template.id)}
					<label class="block border rounded p-3 hover:bg-gray-50 cursor-pointer">
						<input type="radio" bind:group={selectedTemplateId} value={template.id} class="mr-2" />
						<span class="font-medium">{template.name}</span>
						{#if template.description}
							<p class="text-sm text-gray-600 mt-1 ml-6">{template.description}</p>
						{/if}
					</label>
				{/each}
			</div>
		{/if}

		<div class="flex justify-end space-x-2">
			<button onclick={close} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
				Cancel
			</button>
			<button
				onclick={selectTemplate}
				disabled={loading}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
			>
				Select
			</button>
		</div>
	</div>
</div>
