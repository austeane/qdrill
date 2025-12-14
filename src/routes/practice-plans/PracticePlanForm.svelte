<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { page } from '$app/state';
	import { enhance } from '$app/forms'; // Import enhance
	import { cart } from '$lib/stores/cartStore';
	import { undo, redo, getCanUndo, getCanRedo, initializeHistory } from '$lib/stores/historyStore';
	import { onWindowEvent } from '$lib/utils/windowEvents.svelte.js';

	// Import NEW stores and utils
	import {
		practicePlanMetadataStore,
		initializeForm, // Keep initializeForm for setting initial state
		validateMetadataForm
	} from '$lib/stores/practicePlanMetadataStore';

	import {
		sections,
		setSections,
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
	let _Editor; // Loaded dynamically, kept for potential future use

	// Add proper prop definitions with defaults
	import PlanMetadataFields from '$lib/components/practice-plan/PlanMetadataFields.svelte';
	import PracticePlanActions from '$lib/components/practice-plan/PracticePlanActions.svelte';
	import PracticePlanSectionsEditor from '$lib/components/practice-plan/PracticePlanSectionsEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import Spinner from '$lib/components/Spinner.svelte';
	import { practicePlanAuthHandler } from '$lib/utils/actions/practicePlanAuthHandler.js';

	let {
		practicePlan = null,
		mode = undefined,
		skillOptions = [],
		focusAreaOptions = []
	} = $props();

	const effectiveMode = $derived(mode ?? (practicePlan ? 'edit' : 'create'));
	const canUndo = $derived(getCanUndo());
	const canRedo = $derived(getCanRedo());

	function handleKeydown(e) {
		const activeElement = document.activeElement;
		const isEditing =
			activeElement &&
			(activeElement.tagName === 'INPUT' ||
				activeElement.tagName === 'TEXTAREA' ||
				activeElement.tagName === 'SELECT' ||
				activeElement.closest('.tox-tinymce'));

		if (isEditing) return;

		if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			if (canUndo) undo();
			return;
		}

		if (
			((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
			((e.ctrlKey || e.metaKey) && e.key === 'y')
		) {
			e.preventDefault();
			if (canRedo) redo();
		}
	}
	onWindowEvent('keydown', handleKeydown);

	// UI state
	let showDrillSearch = $state(false);
	let showTimelineSelector = $state(false);
	let selectedSectionForDrill = $state(null);
	let submitting = $state(false); // State for progressive enhancement

	// Initialize the form when practice plan or pending data is provided
	// NOTE: Pending plan data logic might need re-evaluation after store refactor.
	// The `load` function in `create/+page.server.js` was removed.
	// For now, focus on initializing from `practicePlan` prop (for edit).
	$effect(() => {
		// Only initialize from practicePlan prop (edit mode)
		if (!practicePlan) return;

		initializeForm(practicePlan);
		initializeSections(practicePlan);
		initializeHistory(); // Initialize history for existing plan too
	});

	// Update visibility based on user session
	$effect(() => {
		if (page.data.session) return;

		practicePlanMetadataStore.visibility = 'public';
		practicePlanMetadataStore.isEditableByOthers = true;
	});

	// Handle modal controls
	function handleOpenDrillSearch(detail) {
		selectedSectionForDrill = detail.sectionId;
		showDrillSearch = true;
	}

	function handleOpenTimelineSelector(detail) {
		const { sectionId, parallelGroupId } = detail;
		if (handleTimelineSelect(sectionId, parallelGroupId)) {
			showTimelineSelector = true;
		}
	}

	function handleAddDrillEvent(detail) {
		const { drill, sectionId } = detail;
		addDrillToPlan(drill, sectionId);
	}

	function handleAddBreakEvent(detail) {
		const { sectionId } = detail;
		addBreak(sectionId);
	}

	function handleAddOneOffEvent(detail) {
		const { sectionId, name } = detail;
		addOneOffDrill(sectionId, name);
	}

	function handleUpdateTimelineNameEvent(event) {
		const { timeline, name } = event;
		updateTimelineName(timeline, name);
	}

	function handleUpdateTimelineColorEvent(event) {
		const { timeline, color } = event;
		updateTimelineColor(timeline, color);
	}

	function handleSaveTimelinesEvent(_event) {
		// In this implementation we just call the existing store handler
		// to persist selected timelines
		handleTimelineSave();
	}

	// Component initialization
	onMount(() => {
		(async () => {
			// Initialize history store regardless of data source
			// Note: If pendingPlanData exists, it will re-initialize history above in the reactive block.
			// If only practicePlan exists, it also initializes above.
			// If neither exists (fresh create), initialize here.
			if (!practicePlan) {
				initializeHistory();
			}

			// Removed pendingPlanData logic
			if (!practicePlan) {
				if (cart.drills.length > 0) {
					const cartItems = cart.drills.map((drill) => ({
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
					if (cartItems.length > 0 && sections.length > 0) {
						const nextSections = $state.snapshot(sections);

						const skillBuildingIndex = nextSections.findIndex((s) => s.name === 'Skill Building');
						const targetIndex =
							skillBuildingIndex !== -1 ? skillBuildingIndex : Math.min(1, nextSections.length - 1);

						const targetSection = nextSections[targetIndex] ?? nextSections[0];
						if (!targetSection) return;

						targetSection.items = [
							...targetSection.items,
							...cartItems.map((item) => ({
								id: item.id,
								type: 'drill',
								name: item.name,
								drill: item.drill,
								duration: 15,
								selected_duration: 15
							}))
						];

						setSections(nextSections);
					}
				}
			} else if (practicePlan) {
				// If editing an existing plan (and not restoring pending), initialize timelines
				initializeTimelinesFromPlan(practicePlan);
			}

			// Load TinyMCE Editor
			try {
				const module = await import('@tinymce/tinymce-svelte');
				_Editor = module.default;
			} catch (error) {
				console.error('Failed to load TinyMCE editor:', error);
			}
		})();
	});

	// Modal event handlers
	// handleAddDrillEvent is already defined above

	function handleAddFormationEvent(detail) {
		const { formation, sectionId } = detail;
		addFormationToPlan(formation, sectionId);
	}

	function handleAddParallelActivitiesEvent(detail) {
		const { activities, sectionId } = detail;
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
	use:enhance={({ formData, cancel }) => {
		submitting = true;

		// Validate metadata fields before submitting
		const validation = validateMetadataForm();
		if (!validation.success) {
			submitting = false;
			toast.push('Please correct the highlighted errors.');
			cancel();
			return;
		}

		const sectionsValueForSubmission = $state.snapshot(sections);

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

		return async ({ result }) => {
			submitting = false;

			if (result.type === 'redirect' && result.location) {
				toast.push(effectiveMode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!');
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
				toast.push(effectiveMode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!');
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
					toast.push(
						effectiveMode === 'edit' ? 'Practice plan updated!' : 'Practice plan created!'
					);
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
		{effectiveMode === 'edit' ? 'Edit Practice Plan' : 'Create Practice Plan'}
	</h1>

	<!-- Duration Summary -->
	<PracticePlanActions />

	<!-- Metadata Fields -->
	<PlanMetadataFields {skillOptions} {focusAreaOptions} />

	<PracticePlanSectionsEditor
		onOpenDrillSearch={handleOpenDrillSearch}
		onOpenTimelineSelector={handleOpenTimelineSelector}
	/>

	<!-- Visibility controls are handled within PlanMetadataFields -->

	<!-- Submit button -->
	<div class="flex justify-end mt-8">
		<Button type="submit" variant="default" class="min-w-[120px]" disabled={submitting}>
			{#if submitting}
				<Spinner class="inline-block w-4 h-4 mr-2" />
			{/if}
			{submitting
				? effectiveMode === 'edit'
					? 'Updating...'
					: 'Creating...'
				: effectiveMode === 'edit'
					? 'Update Plan'
					: 'Create Plan'}
		</Button>
	</div>
</form>

<!-- Modals -->
<EnhancedAddItemModal
	bind:show={showDrillSearch}
	bind:selectedSectionId={selectedSectionForDrill}
	onAddDrill={handleAddDrillEvent}
	onAddFormation={handleAddFormationEvent}
	onAddParallelActivities={handleAddParallelActivitiesEvent}
	onAddBreak={handleAddBreakEvent}
	onAddOneOff={handleAddOneOffEvent}
/>
<TimelineSelectorModal
	bind:show={showTimelineSelector}
	{selectedTimelines}
	{getTimelineColor}
	{getTimelineName}
	{customTimelineNames}
	parallelTimelines={PARALLEL_TIMELINES}
	timelineColors={TIMELINE_COLORS}
	onUpdateTimelineName={handleUpdateTimelineNameEvent}
	onUpdateTimelineColor={handleUpdateTimelineColorEvent}
	onSaveTimelines={handleSaveTimelinesEvent}
/>

<!-- Display general form errors from server action -->
{#if page.form?.errors?.general}
	<p class="text-red-500 text-sm mb-4 bg-red-100 p-2 rounded">{page.form.errors.general}</p>
{/if}
