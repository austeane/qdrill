<script>
	import { SvelteSet } from 'svelte/reactivity';

	let {
		show = $bindable(false),
		selectedTimelines = new SvelteSet(),
		parallelTimelines = {},
		timelineColors = {},
		getTimelineColor = (_timeline) => 'bg-gray-500',
		getTimelineName = (timeline) => timeline,
		customTimelineNames = {},
		onClose,
		onSaveTimelines,
		onUpdateTimelineName,
		onUpdateTimelineColor
	} = $props();

	function close() {
		show = false;
		onClose?.();
	}

	function save() {
		onSaveTimelines?.({
			selected: Array.from(selectedTimelines || []),
			customNames: customTimelineNames || {}
		});
		close();
	}

	// Track locally which timeline is being configured
	let activeTimeline = $state(null);
	let showColorPicker = $state(false);
	let showNameEditor = $state(false);
	let editingName = $state('');

	let currentTimelineColors = $state({});
	let wasOpen = $state(false);

	$effect(() => {
		if (show && !wasOpen) {
			activeTimeline = null;
			showColorPicker = false;
			showNameEditor = false;
			editingName = '';

			const nextColors = {};
			for (const key of Object.keys(parallelTimelines || {})) {
				nextColors[key] =
					parallelTimelines?.[key]?.color || getTimelineColor(key) || 'bg-gray-500';
			}
			currentTimelineColors = nextColors;
		}

		wasOpen = show;
	});

	function timelineName(timeline) {
		return (
			customTimelineNames?.[timeline] ||
			parallelTimelines?.[timeline]?.name ||
			getTimelineName(timeline) ||
			timeline
		);
	}

	function timelineColor(timeline) {
		return (
			currentTimelineColors?.[timeline] ||
			parallelTimelines?.[timeline]?.color ||
			getTimelineColor(timeline) ||
			'bg-gray-500'
		);
	}

	function toggleTimelineSelection(timeline, checked) {
		if (!selectedTimelines) return;
		if (checked) selectedTimelines.add(timeline);
		else selectedTimelines.delete(timeline);
	}

	function openColorPicker(timeline) {
		activeTimeline = timeline;
		showColorPicker = true;
		showNameEditor = false;
	}

	function openNameEditor(timeline) {
		activeTimeline = timeline;
		editingName = timelineName(timeline);

		showNameEditor = true;
		showColorPicker = false;
	}

	function saveTimelineName() {
		if (!activeTimeline) return;
		const name = editingName?.trim();
		if (!name) return;

		onUpdateTimelineName?.({ timeline: activeTimeline, name });
		showNameEditor = false;
		activeTimeline = null;
	}

	function selectColor(color) {
		if (!activeTimeline) return;

		if (Object.keys(timelineColors).includes(color)) {
			onUpdateTimelineColor?.({ timeline: activeTimeline, color });
			currentTimelineColors = { ...currentTimelineColors, [activeTimeline]: color };
		} else {
			console.warn(
				`Invalid color class "${color}" selected in TimelineSelectorModal. Must be one of: ${Object.keys(timelineColors).join(', ')}`
			);
		}

		showColorPicker = false;
		activeTimeline = null;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
		role="dialog"
		aria-modal="true"
		aria-labelledby="timeline-selector-title"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
			<div class="mt-3">
				<h3 id="timeline-selector-title" class="text-lg font-medium text-gray-900 mb-4">
					Configure Timelines
				</h3>

				<!-- Timeline Selection -->
				<h4 class="text-md font-medium text-gray-800 mb-2">Select Timelines</h4>
				<div class="space-y-4">
					{#each Object.entries(parallelTimelines) as [key, _] (key)}
						<div class="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
							<label class="flex items-center space-x-3 flex-grow cursor-pointer">
								<input
									type="checkbox"
									checked={selectedTimelines.has(key)}
									onchange={(e) => toggleTimelineSelection(key, e.currentTarget.checked)}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
								/>
								<span class="text-gray-700">{timelineName(key)}</span>
							</label>

							<!-- Color preview and edit buttons -->
							{#if selectedTimelines.has(key)}
								<div class="flex items-center space-x-2">
									<div class={`w-6 h-6 rounded ${timelineColor(key)}`}></div>
									<div class="flex space-x-2">
										<button
											type="button"
											onclick={() => openNameEditor(key)}
											class="text-sm text-blue-600 hover:text-blue-800"
											title={`Rename from '${timelineName(key)}'`}
										>
											Rename
										</button>
										<button
											type="button"
											onclick={() => openColorPicker(key)}
											class="text-sm text-blue-600 hover:text-blue-800"
											title="Change Color"
										>
											Color
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Name editor dialog -->
				{#if showNameEditor}
					<div class="mt-4 p-3 border rounded bg-gray-50">
						<h5 class="text-sm font-medium mb-2">
							Rename Timeline: {activeTimeline ? timelineName(activeTimeline) : ''}
						</h5>
						<div class="flex items-center">
							<input
								type="text"
								bind:value={editingName}
								placeholder="Enter timeline name"
								class="flex-grow p-2 border border-gray-300 rounded mr-2"
							/>
							<button
								type="button"
								onclick={saveTimelineName}
								class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Save
							</button>
						</div>
					</div>
				{/if}

				<!-- Color picker dialog -->
				{#if showColorPicker}
					<div class="mt-4 p-3 border rounded bg-gray-50">
						<h5 class="text-sm font-medium mb-2">
							Select Color for {activeTimeline ? timelineName(activeTimeline) : ''} Timeline
						</h5>
						<div class="grid grid-cols-5 gap-2">
							{#each Object.entries(timelineColors) as [colorClass, colorName] (colorClass)}
								<button
									type="button"
									class={`w-8 h-8 rounded cursor-pointer hover:opacity-80 ${colorClass}`}
									title={colorName}
									onclick={() => selectColor(colorClass)}
								>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="mt-6 flex justify-end space-x-3">
					<button
						type="button"
						class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
						onclick={close}
						aria-label="Cancel"
					>
						Cancel
					</button>
					<button
						type="button"
						class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
						onclick={save}
						aria-label="Save"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
