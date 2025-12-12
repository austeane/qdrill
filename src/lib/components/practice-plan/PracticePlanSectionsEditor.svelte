<script>
	import { createEventDispatcher } from 'svelte';
	import {
		sections,
		addSection,
		removeSection,
		removeItem,
		handleDurationChange,
		handleTimelineChange,
		handleUngroup,
		getTimelineName,
		customTimelineNames
	} from '$lib/stores/sectionsStore';
	import SectionContainer from '$lib/components/practice-plan/sections/SectionContainer.svelte';
	import SimpleButton from '../../../routes/practice-plans/components/SimpleButton.svelte';

	const dispatch = createEventDispatcher();

	function handleOpenDrillSearch(event) {
		dispatch('openDrillSearch', event.detail);
	}

	function handleOpenTimelineSelector() {
		dispatch('openTimelineSelector');
	}
</script>

<div class="practice-plan-sections space-y-4">
	<h2 class="text-xl font-semibold">Plan Sections &amp; Items</h2>
	{#each $sections as section, sectionIndex (section.id || sectionIndex)}
		<SectionContainer
			{section}
			{sectionIndex}
			on:openDrillSearch={handleOpenDrillSearch}
			on:openTimelineSelector={handleOpenTimelineSelector}
			onRemoveSection={removeSection}
			onRemoveItem={removeItem}
			onDurationChange={handleDurationChange}
			onTimelineChange={handleTimelineChange}
			onUngroup={handleUngroup}
			timelineNameGetter={getTimelineName}
			customTimelineNamesData={$customTimelineNames}
		/>
	{/each}
	<div class="my-4">
		<SimpleButton on:click={addSection}>+ Add Section</SimpleButton>
	</div>
</div>
