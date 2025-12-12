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
		addPracticeGoal,
		removePracticeGoal,
		updatePracticeGoal,
		validateMetadataForm
	} from '$lib/stores/practicePlanMetadataStore';
	import { formatTime } from '$lib/utils/timeUtils';

	import {
		sections,
		initializeSections,
		initializeTimelinesFromPlan,
		getTimelineName,
		getTimelineColor,
		customTimelineNames,
		selectedTimelines,
		addBreak,
		addDrillToPlan,
		addOneOffDrill,
		addFormationToPlan,
		addParallelActivities,
		updateTimelineColor,
		updateTimelineName,
		handleTimelineSave,
		handleTimelineSelect,
		PARALLEL_TIMELINES,
		TIMELINE_COLORS
	} from '$lib/stores/sectionsStore';

	// Import component modules
	import EnhancedAddItemModal from '$lib/components/practice-plan/modals/EnhancedAddItemModal.svelte';
	import TimelineSelectorModal from '$lib/components/practice-plan/modals/TimelineSelectorModal.svelte';
	let Editor;

	// Add proper prop definitions with defaults
	import PlanMetadataFields from '$lib/components/practice-plan/PlanMetadataFields.svelte';
	import PracticePlanActions from '$lib/components/practice-plan/PracticePlanActions.svelte';
	import PracticePlanSectionsEditor from '$lib/components/practice-plan/PracticePlanSectionsEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import Spinner from '$lib/components/Spinner.svelte';
	import { practicePlanAuthHandler } from '$lib/utils/actions/practicePlanAuthHandler.js';
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

	function handleOpenTimelineSelector(event) {
		const { sectionId, parallelGroupId } = event.detail;
		if (handleTimelineSelect(sectionId, parallelGroupId)) {
			showTimelineSelector = true;
		}
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
		};
	});

	// Modal event handlers
	// handleAddDrillEvent is already defined above

	function handleAddFormationEvent(event) {
		const { formation, sectionId } = event.detail;
		addFormationToPlan(formation, sectionId);
	}

	function handleAddParallelActivitiesEvent(event) {
		const { activities, sectionId } = event.detail;
		addParallelActivities(sectionId, activities);
	}

	// handleAddBreakEvent is already defined above
	// handleAddOneOffEvent is already defined above
	// handleUpdateTimelineNameEvent is already defined above
	// handleUpdateTimelineColorEvent is already defined above
	// handleSaveTimelinesEvent is already defined above
</script>

<!-- Wrap form in <form> tag and apply enhance -->
<form
	use:practicePlanAuthHandler
	method="POST"
	action="?"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		submitting = true;

		// Validate metadata fields before submitting
		const validation = validateMetadataForm();
		if (!validation.success) {
			submitting = false;
			toast.push('Please correct the highlighted errors.');
			cancel();
			return;
		}

		const sectionsValueForSubmission = get(sections);

		// Clean up sections to remove circular references and unnecessary data
		const cleanedSections = sectionsValueForSubmission.map((section) => ({
			...section,
			items: section.items.map((item) => {
				// Create a clean copy without the full formation object
				const cleanItem = { ...item };
				// Remove the formation object but keep formation_id
				if (item.type === 'formation' && item.formation) {
					delete cleanItem.formation;
				}
				// Remove the drill object but keep drill_id
				if (item.drill) {
					delete cleanItem.drill;
				}
				return cleanItem;
			})
		}));

		formData.set('sections', JSON.stringify(cleanedSections));

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
	<PracticePlanActions />

	<!-- Metadata Fields -->
	<PlanMetadataFields {skillOptions} {focusAreaOptions} />

	<PracticePlanSectionsEditor
		on:openDrillSearch={handleOpenDrillSearch}
		on:openTimelineSelector={handleOpenTimelineSelector}
	/>

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
<EnhancedAddItemModal
	bind:show={showDrillSearch}
	bind:selectedSectionId={selectedSectionForDrill}
	on:addDrill={handleAddDrillEvent}
	on:addFormation={handleAddFormationEvent}
	on:addParallelActivities={handleAddParallelActivitiesEvent}
	on:addBreak={handleAddBreakEvent}
	on:addOneOff={handleAddOneOffEvent}
/>
<TimelineSelectorModal
	bind:show={showTimelineSelector}
	{selectedTimelines}
	{getTimelineColor}
	{getTimelineName}
	{customTimelineNames}
	parallelTimelines={PARALLEL_TIMELINES}
	timelineColors={TIMELINE_COLORS}
	on:updateTimelineName={handleUpdateTimelineNameEvent}
	on:updateTimelineColor={handleUpdateTimelineColorEvent}
	on:saveTimelines={handleSaveTimelinesEvent}
/>

<!-- Display general form errors from server action -->
{#if $page.form?.errors?.general}
	<p class="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{$page.form.errors.general}</p>
{/if}
