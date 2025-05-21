<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms'; // Import enhance
	import { cart } from '$lib/stores/cartStore';
	import { undo, redo, canUndo, canRedo, initializeHistory } from '$lib/stores/historyStore';
	import { authClient } from '$lib/auth-client';
	import { get } from 'svelte/store'; // Import get

	// Import NEW stores and utils
	import {
		planName,
		planDescription,
		phaseOfSeason,
		estimatedNumberOfParticipants,
		practiceGoals,
		visibility,
		isEditableByOthers,
		startTime,
		errors as metadataErrors, // Rename to avoid conflict with form errors
		initializeForm, // Keep initializeForm for setting initial state
		resetForm, // Add resetForm if needed (e.g., on successful create)
		addPracticeGoal,
		removePracticeGoal,
		updatePracticeGoal
	} from '$lib/stores/practicePlanMetadataStore';
	import { formatTime } from '$lib/utils/timeUtils';

	import {
		sections,
		selectedItems,
		selectedSectionId,
		addSection,
		initializeSections,
		totalPlanDuration, // Moved here
		formatDrillItem,
		initializeTimelinesFromPlan,
		removeSection,
		removeItem,
		handleDurationChange,
               handleUngroup,
               getTimelineName,
               getTimelineColor,
               customTimelineNames,
               selectedTimelines,
               addBreak,
               addDrillToPlan,
               addOneOffDrill,
               updateTimelineColor,
               updateTimelineName,
               handleTimelineSave
               // handleDrillMove // Dnd logic likely uses this, ensure it's available if needed
       } from '$lib/stores/sectionsStore';

	// Import component modules
	import DrillSearchModal from '$lib/components/practice-plan/modals/DrillSearchModal.svelte';
	import TimelineSelectorModal from '$lib/components/practice-plan/modals/TimelineSelectorModal.svelte';
	import SectionContainer from '$lib/components/practice-plan/sections/SectionContainer.svelte';
	import PlanMetadataFields from '$lib/components/practice-plan/PlanMetadataFields.svelte';
	import { Button } from '$lib/components/ui/button';
	import Spinner from '$lib/components/Spinner.svelte'; // Assuming Spinner is top-level

	// Import TinyMCE editor
	let Editor;

	// Add proper prop definitions with defaults
	export let practicePlan = null;
	export let mode = practicePlan ? 'edit' : 'create';
	export let skillOptions = [];
	export let focusAreaOptions = [];

	// UI state
	let showDrillSearch = false;
	let showTimelineSelector = false;
	let selectedSectionForDrill = null;
	let submitting = false; // State for progressive enhancement

	// Initialize the form when practice plan or pending data is provided
	// NOTE: Pending plan data logic might need re-evaluation after store refactor.
	// The `load` function in `create/+page.server.js` was removed.
	// For now, focus on initializing from `practicePlan` prop (for edit).
	$: {
		// Only initialize from practicePlan prop (edit mode)
		if (practicePlan) {
			console.log('[PracticePlanForm] Initializing with EXISTING plan data:', practicePlan);
			initializeForm(practicePlan);
			initializeSections(practicePlan);
			initializeHistory(); // Initialize history for existing plan too
		} else {
			// If creating a new plan (practicePlan is null), ensure form is reset
			// This might happen if navigating back/forth
			// resetForm(); // Consider if a full reset is needed or if stores default correctly
		}
	}

	// Update visibility based on user session
	$: {
		if (!$page.data.session) {
			visibility.set('public');
			isEditableByOthers.set(true);
		}
	}

	// Handle modal controls
	function handleOpenDrillSearch(event) {
		selectedSectionForDrill = event.detail.sectionId;
		showDrillSearch = true;
	}

        function handleOpenTimelineSelector() {
                showTimelineSelector = true;
        }

        function handleAddDrillEvent(event) {
                const { drill, sectionId } = event.detail;
                addDrillToPlan(drill, sectionId);
        }

        function handleAddBreakEvent(event) {
                const { sectionId } = event.detail;
                addBreak(sectionId);
        }

        function handleAddOneOffEvent(event) {
                const { sectionId, name } = event.detail;
                addOneOffDrill(sectionId, name);
        }

        function handleUpdateTimelineNameEvent(event) {
                const { timeline, name } = event.detail;
                updateTimelineName(timeline, name);
        }

        function handleUpdateTimelineColorEvent(event) {
                const { timeline, color } = event.detail;
                updateTimelineColor(timeline, color);
        }

        function handleSaveTimelinesEvent(event) {
                // In this implementation we just call the existing store handler
                // to persist selected timelines
                handleTimelineSave();
        }

	// Component initialization
	onMount(async () => {
		// Initialize history store regardless of data source
		// Note: If pendingPlanData exists, it will re-initialize history above in the reactive block.
		// If only practicePlan exists, it also initializes above.
		// If neither exists (fresh create), initialize here.
		if (!practicePlan) {
			initializeHistory();
		}

		// Removed pendingPlanData logic
		if (!practicePlan) {
			if ($cart.length > 0) {
				const cartItems = $cart.map((drill) => ({
					id: drill.id,
					type: 'drill',
					name: drill.name,
					drill: drill,
					expanded: false,
					selected_duration: 15,
					diagram_data: null,
					parallel_group_id: null
				}));

				// Add cart items to sections
				if (cartItems.length > 0 && $sections.length > 0) {
					sections.update((currentSections) => {
						const newSections = [...currentSections];

						// Add all drills to the "Skill Building" section (index 1) if it exists
						const skillBuildingIndex =
							newSections.findIndex((s) => s.name === 'Skill Building') ?? 1; // Default to 1 if not found

						if (newSections[skillBuildingIndex]) {
							// Add all drills to the Skill Building section
							cartItems.forEach((item) => {
								newSections[skillBuildingIndex].items.push({
									id: item.id,
									type: 'drill',
									name: item.name,
									drill: item.drill,
									duration: 15,
									selected_duration: 15
								});
							});
						} else {
							// Fallback: Add to the first section if Skill Building doesn't exist
							cartItems.forEach((item) => {
								newSections[0].items.push({
									id: item.id,
									type: 'drill',
									name: item.name,
									drill: item.drill,
									duration: 15,
									selected_duration: 15
								});
							});
						}

						return newSections;
					});
				}

				selectedItems.set(cartItems);
			}
		} else if (practicePlan) {
			// If editing an existing plan (and not restoring pending), initialize timelines
			initializeTimelinesFromPlan(practicePlan);
		}

		// Add keyboard shortcuts
		function handleKeydown(e) {
			// Check if the active element is an input field or textarea
			const activeElement = document.activeElement;
			const isEditing =
				activeElement &&
				(activeElement.tagName === 'INPUT' ||
					activeElement.tagName === 'TEXTAREA' ||
					activeElement.tagName === 'SELECT' ||
					activeElement.closest('.tox-tinymce')); // Check if inside TinyMCE

			// Only process shortcuts if we're not in an input field
			if (!isEditing) {
				// Undo: Ctrl/Cmd + Z
				if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
					e.preventDefault();
					if ($canUndo) undo();
				}

				// Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
				if (
					((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
					((e.ctrlKey || e.metaKey) && e.key === 'y')
				) {
					e.preventDefault();
					if ($canRedo) redo();
				}
			}
		}

		// Add event listener for keyboard shortcuts
		window.addEventListener('keydown', handleKeydown);

		// Load TinyMCE Editor
		try {
			console.log('[DEBUG] Loading TinyMCE editor...');
			const module = await import('@tinymce/tinymce-svelte');
			Editor = module.default;
			console.log('[DEBUG] TinyMCE editor loaded successfully');
		} catch (error) {
			console.log('[DEBUG] Error loading TinyMCE', error);
		}
		// Clean up event listener on component destruction
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			// Consider resetting form state if navigating away?
			// resetForm();
		};
	});

	function onRemoveSection(sectionId) {
		removeSection(sectionId);
	}

	function onRemoveItem(sectionIndex, itemIndex) {
		removeItem(sectionIndex, itemIndex);
	}

	function onDurationChange(sectionIndex, itemIndex, newDuration) {
		handleDurationChange(sectionIndex, itemIndex, newDuration);
	}

	function onUngroup(groupId) {
		handleUngroup(groupId);
	}
</script>

<!-- Wrap form in <form> tag and apply enhance -->
<form
	method="POST"
	action="?"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		submitting = true;

		const sectionsValueForSubmission = get(sections);

		formData.set('sections', JSON.stringify(sectionsValueForSubmission));

		return async ({ result, update }) => {
			submitting = false;

			if (result.type === 'redirect' && result.location) {
				toast.push(mode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!');
				if (!practicePlan) {
					cart.clear();
				}
				goto(result.location);
			} else if (result.type === 'failure' && result.data) {
				const errorData = result.data;
				// Make sure to access nested errors if your server sends them that way
				const generalError =
					errorData.errors?.general ||
					errorData.message ||
					(errorData.errors && Object.values(errorData.errors).flat().join('; ')) ||
					'Failed to save plan.';
				toast.push(`Error: ${generalError}`);
			} else if (result.type === 'error' && result.error) {
				const errorMessage =
					result.error.message ||
					(typeof result.error === 'string' ? result.error : 'Please try again.');
				toast.push(`An unexpected error occurred: ${errorMessage}`);
			} else if (result.type === 'success') {
				toast.push(mode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!');
				if (!practicePlan) {
					cart.clear();
				}
			} else {
				if (
					result.status &&
					result.status >= 200 &&
					result.status < 300 &&
					result.type !== 'redirect'
				) {
					toast.push(mode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!');
					if (!practicePlan) {
						cart.clear();
					}
				} else if (!result.type && result.status === 200) {
					// A plain successful action without specific type
					toast.push('Action completed successfully.');
				} else {
					toast.push('An unknown issue occurred after submission.');
				}
			}
		};
	}}
	class="container mx-auto p-4 space-y-6"
>
	<h1 class="text-2xl font-bold">
		{mode === 'edit' ? 'Edit Practice Plan' : 'Create Practice Plan'}
	</h1>

	<!-- Duration Summary -->
	<div class="bg-blue-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
		<div>
			<h2 class="font-semibold text-blue-800">Practice Duration</h2>
			<p class="text-blue-600">
				Start: {formatTime($startTime)} • Total: {$totalPlanDuration} minutes
			</p>
			<p class="text-xs text-blue-500 mt-1">
				Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)
			</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" size="icon" on:click={undo} disabled={!$canUndo} title="Undo">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
					/></svg
				>
			</Button>
			<Button variant="outline" size="icon" on:click={redo} disabled={!$canRedo} title="Redo">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
					/></svg
				>
			</Button>
			<div class="text-3xl font-bold text-blue-700">{$totalPlanDuration}m</div>
		</div>
	</div>

	<!-- Metadata Fields -->
	<PlanMetadataFields {skillOptions} {focusAreaOptions} />

	<!-- Practice Plan Sections -->
	<div class="practice-plan-sections space-y-4">
		<h2 class="text-xl font-semibold">Plan Sections & Items</h2>
		{#each $sections as section, sectionIndex}
			<SectionContainer
				{section}
				{sectionIndex}
				on:openDrillSearch={handleOpenDrillSearch}
				on:openTimelineSelector={handleOpenTimelineSelector}
				{onRemoveSection}
				{onRemoveItem}
				{onDurationChange}
				{onUngroup}
				timelineNameGetter={getTimelineName}
				customTimelineNamesData={$customTimelineNames}
			/>
		{/each}

		<div class="flex gap-2 mt-4">
			<Button variant="outline" class="flex-1" on:click={() => sections.addSection()}
				>+ Add Section</Button
			>
			<Button
				variant="outline"
				class="flex-1"
				on:click={() => handleOpenDrillSearch({ detail: { sectionId: $sections[0]?.id } })}
				disabled={$sections.length === 0}>+ Add Drill to First Section</Button
			>
		</div>
	</div>

	<!-- Visibility controls are handled within PlanMetadataFields -->

	<!-- Submit button -->
	<div class="flex justify-end mt-8">
		<Button type="submit" variant="default" class="min-w-[120px]" disabled={submitting}>
			{#if submitting}
				<Spinner class="inline-block w-4 h-4 mr-2" />
			{/if}
			{submitting
				? mode === 'edit'
					? 'Updating...'
					: 'Creating...'
				: mode === 'edit'
					? 'Update Plan'
					: 'Create Plan'}
		</Button>
	</div>
</form>

<!-- Modals -->
<DrillSearchModal
       bind:show={showDrillSearch}
       bind:selectedSectionId={selectedSectionForDrill}
       on:addDrill={handleAddDrillEvent}
       on:addBreak={handleAddBreakEvent}
       on:addOneOffDrill={handleAddOneOffEvent}
/>
<TimelineSelectorModal
       bind:show={showTimelineSelector}
       {selectedTimelines}
       {getTimelineColor}
       {getTimelineName}
       {customTimelineNames}
       on:updateTimelineName={handleUpdateTimelineNameEvent}
       on:updateTimelineColor={handleUpdateTimelineColorEvent}
       on:saveTimelines={handleSaveTimelinesEvent}
/>

<!-- Display general form errors from server action -->
{#if $page.form?.errors?.general}
	<p class="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{$page.form.errors.general}</p>
{/if}
