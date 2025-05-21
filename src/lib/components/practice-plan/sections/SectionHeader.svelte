<script>
	import { createEventDispatcher } from 'svelte';
	import { handleTimelineSelect } from '$lib/stores/sectionsStore';

	export let section;
	export let onRemove;

	const dispatch = createEventDispatcher();

	function openDrillSearch() {
		dispatch('openDrillSearch', section.id);
	}

	function openTimelineSelector() {
		if (
			handleTimelineSelect(
				section.id,
				section.items.find((i) => i.parallel_group_id)?.parallel_group_id
			)
		) {
			dispatch('openTimelineSelector');
		}
	}
</script>

<div class="section-header flex items-center gap-4 mb-4">
	<input
		type="text"
		bind:value={section.name}
		class="text-xl font-semibold bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none"
		placeholder="Section Name"
	/>
	<button type="button" class="text-blue-500 hover:text-blue-700 text-sm" on:click={openDrillSearch}>
		Add Drill
	</button>
	<button type="button" class="text-blue-500 hover:text-blue-700 text-sm" on:click={openTimelineSelector}>
		Create Parallel Block
	</button>
	<button type="button" class="text-red-500 hover:text-red-700" on:click={() => onRemove(section.id)}>
		Remove Section
	</button>
	<span class="text-sm text-gray-500">({section.items?.length || 0} items)</span>
</div>
