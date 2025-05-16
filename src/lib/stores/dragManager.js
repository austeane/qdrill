import { writable, derived, get } from 'svelte/store';
import { sections, selectedItems } from './sectionsStore';
import { addToHistory } from './historyStore';

// ----------------------------------------
// LOGGER CONFIGURATION
// ----------------------------------------
const DEBUG_MODE = typeof window !== 'undefined' && window.location.search.includes('debug=true');

// Simple logger utility to control console output
const logger = {
	debug: (...args) => DEBUG_MODE && console.log('[DEBUG]', ...args),
	error: (...args) => console.error('[ERROR]', ...args),
	warn: (...args) => console.warn('[WARN]', ...args)
};

// ----------------------------------------
// DRAG STATE
// ----------------------------------------
export const dragState = writable({
	isDragging: false,
	dragType: null, // 'item', 'group', 'section'

	// Source info
	sourceSection: null,
	sourceIndex: null,
	sourceGroupId: null,
	sourceTimeline: null,
	sourceTimelineIndex: null,

	// Item-specific stable tracking
	itemId: null,
	itemName: null,

	// Target info
	targetSection: null,
	targetIndex: null,
	targetGroupId: null,
	targetTimeline: null,
	targetTimelineIndex: null,

	// Position/dropping style
	dropPosition: null, // 'before', 'after', 'inside'

	// Timeline-specific flags
	isSameTimeline: false,

	// Element IDs for visuals
	draggedElementId: null,
	dropTargetElementId: null
});

export const isDragging = derived(dragState, ($s) => $s.isDragging);
export const isItemDrag = derived(dragState, ($s) => $s.dragType === 'item');
export const isGroupDrag = derived(dragState, ($s) => $s.dragType === 'group');
export const isSectionDrag = derived(dragState, ($s) => $s.dragType === 'section');

// ----------------------------------------
// INTERNAL CONSTANTS
// ----------------------------------------
// Setting to always use test mode for tests
// const TEST_MODE = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

// Timing constraints (always disabled for testing)
const MIN_DRAG_INTERVAL = 0; // ms between drags
const MIN_DRAGOVER_INTERVAL = 0; // ms between dragover events
const DROP_HISTORY_THROTTLE = 5; // Only store history every n drops

// CSS classes used for drag/drop indicators
const INDICATOR_CLASSES = [
	'dragging',
	'drop-before',
	'drop-after',
	'section-drop-before',
	'section-drop-after',
	'timeline-drop-target',
	'empty-section-target'
];

// Internal tracking variables
let lastDragStartTime = 0;
let lastDragOverTime = 0;
let dropOperationCount = 0;

// ----------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------

/**
 * Clears all drag/drop indicator classes from the DOM.
 */
function clearAllDragIndicators() {
	document.querySelectorAll(`.${INDICATOR_CLASSES.join(', .')}`).forEach((el) => {
		el.classList.remove(...INDICATOR_CLASSES);
	});
}

/**
 * Calls clearAllDragIndicators() in multiple phases
 * to ensure all elements are properly updated.
 */
function multiPhaseCleanup() {
	clearAllDragIndicators();
	setTimeout(() => clearAllDragIndicators(), 50);
	setTimeout(() => clearAllDragIndicators(), 200);
}

/**
 * Remove indicator classes from a specific element.
 */
function clearDropIndicators(element) {
	if (!element) return;
	element.classList.remove(...INDICATOR_CLASSES);
}

/**
 * Updates visual indicators on an element based on drop position.
 */
function updateDropIndicators(element, position, isSection = false) {
	try {
		if (!element) return;

		clearDropIndicators(element);

		if (position === 'before') {
			element.classList.add(isSection ? 'section-drop-before' : 'drop-before');
		} else if (position === 'after') {
			element.classList.add(isSection ? 'section-drop-after' : 'drop-after');
		}
	} catch (error) {
		logger.error('Error updating drop indicators:', error);
	}
}

/**
 * Resets the drag state to its default values.
 */
// Make resetDragState exportable for testing
export function resetDragState() {
	dragState.set({
		isDragging: false,
		dragType: null,
		sourceSection: null,
		sourceIndex: null,
		sourceTimelineIndex: null,
		sourceGroupId: null,
		sourceTimeline: null,
		draggedElementId: null,
		itemId: null,
		itemName: null,
		targetSection: null,
		targetIndex: null,
		targetTimelineIndex: null,
		targetGroupId: null,
		targetTimeline: null,
		dropPosition: null,
		dropTargetElementId: null,
		isSameTimeline: false
	});
}

/**
 * Generates a unique element ID from the given parameters.
 * This is used as a CSS class (not HTML ID) to identify elements.
 *
 * @returns {string} A CSS class name for identifying the element
 */
function generateElementId(type, sectionIndex, itemIndex = null, groupId = null, timeline = null) {
	const parts = [type, sectionIndex];
	if (itemIndex !== null) parts.push(`item-${itemIndex}`);
	if (groupId !== null) parts.push(`group-${groupId}`);
	if (timeline !== null) parts.push(`timeline-${timeline}`);
	return parts.join('-');
}

/**
 * Finds an item in a section using multiple search methods:
 * 1. By ID (most reliable)
 * 2. By name (fallback)
 * 3. By index (last resort)
 *
 * Returns { item, index } or { item: null, index: -1 } if not found.
 */
function findSourceItem(secs, state) {
	// Validate section first
	if (!isValidSectionIndex(secs, state.sourceSection)) {
		logger.error(`Invalid source section index: ${state.sourceSection}`);
		return { item: null, index: -1 };
	}

	const srcSection = secs[state.sourceSection];

	// Ensure section has items array
	if (!srcSection || !Array.isArray(srcSection.items)) {
		logger.error(`Source section at index ${state.sourceSection} has no items array`);
		return { item: null, index: -1 };
	}

	let idx = state.sourceIndex ?? -1;
	let foundItem = null;
	let searchMethods = [];

	// 1) By ID (most reliable)
	if (state.itemId) {
		searchMethods.push('ID');
		const idIndex = srcSection.items.findIndex((it) => it.id === state.itemId);
		if (idIndex !== -1) {
			idx = idIndex;
			foundItem = srcSection.items[idIndex];
			logger.debug(`Found item by ID ${state.itemId} at index ${idx} (was ${state.sourceIndex})`);
		}
	}

	// 2) By name (fallback)
	if (!foundItem && state.itemName) {
		searchMethods.push('name');
		const nameIndex = srcSection.items.findIndex((it) => it.name === state.itemName);
		if (nameIndex !== -1) {
			idx = nameIndex;
			foundItem = srcSection.items[nameIndex];
			logger.debug(`Found item by name "${state.itemName}" at index ${idx}`);
		}
	}

	// 3) By index (last resort)
	if (!foundItem && state.sourceIndex !== null && state.sourceIndex < srcSection.items.length) {
		searchMethods.push('index');
		idx = state.sourceIndex;
		foundItem = srcSection.items[idx];
		if (foundItem) {
			logger.debug(`Using original source index ${idx} for item "${foundItem.name}"`);
		}
	}

	// If we couldn't find the item, log an error with debugging info
	if (!foundItem) {
		logger.error(`Failed to find source item. Tried: ${searchMethods.join(', ')}`, {
			sourceSection: state.sourceSection,
			sourceIndex: state.sourceIndex,
			itemId: state.itemId,
			itemName: state.itemName,
			sectionItemCount: srcSection.items.length
		});
	}

	return { item: foundItem, index: idx };
}

/**
 * Verifies if a section index is valid.
 * Properly handles section index 0.
 */
function isValidSectionIndex(secs, idx) {
	return idx !== null && idx !== undefined && idx >= 0 && idx < secs.length;
}

/**
 * Calculate drop position based on mouse position in element.
 * Returns 'before' or 'after'.
 */
export function calculateDropPosition(event, element) {
	try {
		const rect = element.getBoundingClientRect();
		const y = event.clientY - rect.top;
		return y < rect.height * 0.5 ? 'before' : 'after';
	} catch (error) {
		logger.error('Error calculating drop position:', error);
		return 'after'; // Default fallback
	}
}

/**
 * Calculate drop position for sections (uses same logic).
 */
export function calculateSectionDropPosition(event, element) {
	return calculateDropPosition(event, element);
}

/**
 * Prepares for a new drag operation, handling common validation.
 * Returns true if the drag should proceed, false otherwise.
 */
function initializeDrag(event) {
	// Check for and clear any prior drag state
	const priorState = get(dragState);
	if (priorState.isDragging) {
		logger.debug('Clearing stuck prior drag state before starting new drag');
		clearAllDragIndicators();
	}

	// Prevent rapid consecutive drags that could corrupt state
	// This is disabled in TEST_MODE (defined above)
	const now = Date.now();
	if (now - lastDragStartTime < MIN_DRAG_INTERVAL) {
		logger.debug('Preventing rapid consecutive drag, wait a moment...');
		event.preventDefault();
		return false;
	}
	lastDragStartTime = now;

	event.stopPropagation();
	event.dataTransfer.effectAllowed = 'move';
	return true;
}

// ----------------------------------------
// EXPOSE DRAG STATE FOR DEBUG
// ----------------------------------------
if (typeof window !== 'undefined') {
	window.__dragManager = {
		get: () => get(dragState),
		update: (fn) => dragState.update(fn)
	};
}

// ----------------------------------------
// DRAG START HANDLERS
// ----------------------------------------
export function startItemDrag(
	event,
	sectionIndex,
	itemIndex,
	item,
	itemId,
	timelineItemIndex = null
) {
	try {
		if (!initializeDrag(event)) return;

		// Validate the drag information to ensure we have an item ID
		if (!itemId && item && item.id) {
			itemId = item.id;
			logger.debug('Using item.id instead of provided itemId');
		}

		if (!itemId) {
			logger.error('No valid itemId for drag:', { sectionIndex, itemIndex, itemName: item?.name });
			// Try to recover from dataset
			if (event.currentTarget?.dataset?.itemId) {
				itemId = parseInt(event.currentTarget.dataset.itemId);
				logger.debug('Recovered itemId from dataset:', itemId);
			}
		}

		// Try to get timeline position from dataset if not provided
		if (timelineItemIndex === null && event.currentTarget?.dataset?.timelineIndex) {
			timelineItemIndex = parseInt(event.currentTarget.dataset.timelineIndex);
			logger.debug('Recovered timelineItemIndex from dataset:', timelineItemIndex);
		}

		// Generate a unique ID for this element
		const draggedElementId = generateElementId('item', sectionIndex, itemIndex);

		// Store the item ID for stable tracking
		const actualItemId = itemId || item.id;

		// Log the drag start with stable identifiers
		logger.debug('Starting drag for item:', {
			name: item.name,
			id: actualItemId,
			sectionIndex,
			itemIndex,
			timelineItemIndex,
			timeline: item.parallel_timeline,
			groupId: item.parallel_group_id
		});

		// Set dataTransfer data for redundancy
		if (event.dataTransfer) {
			// This adds the crucial drag data so we can recover it if needed
			event.dataTransfer.setData(
				'text/plain',
				JSON.stringify({
					type: 'item',
					id: actualItemId,
					name: item.name,
					sectionIndex,
					itemIndex,
					timelineItemIndex,
					timeline: item.parallel_timeline,
					groupId: item.parallel_group_id
				})
			);

			// Store a direct reference to the item ID for easier access
			event.dataTransfer.setData('application/x-item-id', actualItemId.toString());
			event.dataTransfer.setData('application/x-item-name', item.name);
			if (timelineItemIndex !== null) {
				event.dataTransfer.setData('application/x-timeline-index', timelineItemIndex.toString());
			}
		}

		// Store state without references to DOM elements, but with item ID
		dragState.set({
			isDragging: true,
			dragType: 'item',
			sourceSection: sectionIndex,
			sourceIndex: itemIndex,
			sourceTimelineIndex: timelineItemIndex,
			sourceGroupId: item.parallel_group_id,
			sourceTimeline: item.parallel_timeline,
			draggedElementId,
			itemId: actualItemId, // Store the actual item ID
			itemName: item.name, // Store item name for debugging
			targetSection: null,
			targetIndex: null,
			targetTimelineIndex: null,
			targetGroupId: null,
			targetTimeline: null,
			dropPosition: null,
			dropTargetElementId: null
		});

		// Add a class to the dragged element
		if (event.currentTarget) {
			event.currentTarget.classList.add('dragging');
		}
	} catch (error) {
		logger.error('Error starting item drag:', error);
		resetDragState();
	}
}

export function startGroupDrag(event, sectionIndex, groupId) {
	try {
		if (!initializeDrag(event)) return;

		// Generate a unique ID for this element
		const draggedElementId = generateElementId('group', sectionIndex, null, groupId);

		// Store state without references to DOM elements
		dragState.set({
			isDragging: true,
			dragType: 'group',
			sourceSection: sectionIndex,
			sourceGroupId: groupId,
			draggedElementId,
			sourceIndex: null,
			sourceTimeline: null,
			itemId: null, // No item ID for group drags
			itemName: null, // No item name for group drags
			targetSection: null,
			targetIndex: null,
			targetGroupId: null,
			targetTimeline: null,
			dropPosition: null,
			dropTargetElementId: null
		});

		// Add a class to the dragged element
		if (event.currentTarget) {
			event.currentTarget.classList.add('dragging');
		}
	} catch (error) {
		logger.error('Error starting group drag:', error);
		resetDragState();
	}
}

export function startSectionDrag(event, sectionIndex) {
	try {
		if (!initializeDrag(event)) return;

		// Generate a unique ID for this element
		const draggedElementId = generateElementId('section', sectionIndex);

		// Store state without references to DOM elements
		dragState.set({
			isDragging: true,
			dragType: 'section',
			sourceSection: sectionIndex,
			draggedElementId,
			sourceIndex: null,
			sourceGroupId: null,
			sourceTimeline: null,
			itemId: null, // No item ID for section drags
			itemName: null, // No item name for section drags
			targetSection: null,
			targetIndex: null,
			targetGroupId: null,
			targetTimeline: null,
			dropPosition: null,
			dropTargetElementId: null
		});

		// Add a class to the dragged element
		if (event.currentTarget) {
			event.currentTarget.classList.add('dragging');
		}
	} catch (error) {
		logger.error('Error starting section drag:', error);
		resetDragState();
	}
}

// ----------------------------------------
// DRAG OVER HANDLERS
// ----------------------------------------
export function handleItemDragOver(
	event,
	sectionIndex,
	itemIndex,
	item,
	element,
	timelineItemIndex = null
) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Throttle dragover events to prevent excessive updates
		const now = Date.now();
		if (now - lastDragOverTime < MIN_DRAGOVER_INTERVAL) {
			return;
		}
		lastDragOverTime = now;

		// Get current drag state
		const state = get(dragState);

		// Only allow item and group drags over items
		if (state.dragType !== 'item' && state.dragType !== 'group') {
			dragState.update((current) => ({
				...current,
				targetSection: null,
				targetIndex: null,
				targetGroupId: null,
				targetTimeline: null,
				dropPosition: null,
				dropTargetElementId: null
			}));
			return;
		}

		// Determine drop position - returns 'before' or 'after'
		const dropPosition = calculateDropPosition(event, element);

		// Don't allow dropping on itself
		if (
			state.dragType === 'item' &&
			state.sourceSection === sectionIndex &&
			state.sourceIndex === itemIndex
		) {
			return;
		}

		// Try to get timeline position from dataset if not provided
		if (timelineItemIndex === null && element?.dataset?.timelineIndex) {
			timelineItemIndex = parseInt(element.dataset.timelineIndex);
		}

		// Generate a unique ID for this element
		const dropTargetElementId = generateElementId('item', sectionIndex, itemIndex);

		// Check if we need to update the state (only update if something changed)
		const needsUpdate =
			state.targetSection !== sectionIndex ||
			state.targetIndex !== itemIndex ||
			state.targetTimelineIndex !== timelineItemIndex ||
			state.targetGroupId !== item.parallel_group_id ||
			state.targetTimeline !== item.parallel_timeline ||
			state.dropPosition !== dropPosition;

		if (needsUpdate) {
			// Update the drag state with target information
			dragState.update((current) => ({
				...current,
				targetSection: sectionIndex,
				targetIndex: itemIndex,
				targetTimelineIndex: timelineItemIndex,
				targetGroupId: item.parallel_group_id,
				targetTimeline: item.parallel_timeline,
				dropPosition: dropPosition,
				dropTargetElementId
			}));

			// Add visual indicators using classes
			updateDropIndicators(element, dropPosition);

			// Log for debugging timeline reordering
			if (
				state.sourceGroupId === item.parallel_group_id &&
				state.sourceTimeline === item.parallel_timeline
			) {
				console.log('[DEBUG] Timeline item reordering:', {
					fromIndex: state.sourceIndex,
					fromTimelineIndex: state.sourceTimelineIndex,
					toIndex: itemIndex,
					toTimelineIndex: timelineItemIndex,
					position: dropPosition,
					timeline: item.parallel_timeline
				});
			}
		}
	} catch (error) {
		logger.error('Error handling item drag over:', error);
	}
}

export function handleGroupDragOver(event, sectionIndex, groupId, element) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Get current drag state
		const state = get(dragState);

		// Only allow item and group drags (not sections)
		if (state.dragType === 'section') {
			dragState.update((current) => ({
				...current,
				targetSection: null,
				targetIndex: null,
				targetGroupId: null,
				targetTimeline: null,
				dropPosition: null,
				dropTargetElementId: null
			}));
			return;
		}

		// Calculate drop position - before or after
		const dropPosition = calculateDropPosition(event, element);

		// Don't allow dropping on itself
		if (
			state.dragType === 'group' &&
			state.sourceSection === sectionIndex &&
			state.sourceGroupId === groupId
		) {
			return;
		}

		// Generate a unique ID for this element
		const dropTargetElementId = generateElementId('group', sectionIndex, null, groupId);

		// Update the drag state with target information
		dragState.update((current) => ({
			...current,
			targetSection: sectionIndex,
			targetGroupId: groupId,
			targetIndex: null,
			targetTimeline: null,
			dropPosition: dropPosition,
			dropTargetElementId
		}));

		// Add visual indicators
		updateDropIndicators(element, dropPosition);
	} catch (error) {
		logger.error('Error handling group drag over:', error);
	}
}

export function handleSectionDragOver(event, sectionIndex, element) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Get current drag state
		const state = get(dragState);

		// Only allow section drags
		if (state.dragType !== 'section') {
			dragState.update((current) => ({
				...current,
				targetSection: null,
				targetIndex: null,
				targetGroupId: null,
				targetTimeline: null,
				dropPosition: null,
				dropTargetElementId: null
			}));
			return;
		}

		// Calculate drop position - before or after
		const dropPosition = calculateSectionDropPosition(event, element);

		// Don't allow dropping on itself
		if (state.sourceSection === sectionIndex) {
			return;
		}

		// Generate a unique ID for this element
		const dropTargetElementId = generateElementId('section', sectionIndex);

		// Update the drag state with target information
		dragState.update((current) => ({
			...current,
			targetSection: sectionIndex,
			targetIndex: null,
			targetGroupId: null,
			targetTimeline: null,
			dropPosition: dropPosition,
			dropTargetElementId
		}));

		// Add visual indicators
		updateDropIndicators(element, dropPosition, true);
	} catch (error) {
		logger.error('Error handling section drag over:', error);
	}
}

export function handleTimelineDragOver(event, sectionIndex, timelineName, groupId, element) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Throttle dragover events to prevent excessive updates
		const now = Date.now();
		if (now - lastDragOverTime < MIN_DRAGOVER_INTERVAL) {
			return;
		}
		lastDragOverTime = now;

		// Get current drag state
		const state = get(dragState);

		// Only allow item drags into timelines
		if (state.dragType !== 'item') {
			dragState.update((current) => ({
				...current,
				targetSection: null,
				targetIndex: null,
				targetGroupId: null,
				targetTimeline: null,
				dropPosition: null,
				dropTargetElementId: null
			}));
			return;
		}

		// Generate a unique ID for this element
		const dropTargetElementId = generateElementId(
			'timeline',
			sectionIndex,
			null,
			groupId,
			timelineName
		);

		// Add data attributes to the element for redundancy
		if (element) {
			element.setAttribute('data-section-index', sectionIndex);
			element.setAttribute('data-timeline', timelineName);
			element.setAttribute('data-group-id', groupId);
		}

		// Check if this is the same timeline as the source
		const isSameTimeline =
			state.sourceSection === sectionIndex &&
			state.sourceGroupId === groupId &&
			state.sourceTimeline === timelineName;

		// Check if we need to update the state (only update if something changed)
		const needsUpdate =
			state.targetSection !== sectionIndex ||
			state.targetGroupId !== groupId ||
			state.targetTimeline !== timelineName;

		if (needsUpdate) {
			// Update the drag state with target information
			dragState.update((current) => ({
				...current,
				targetSection: sectionIndex,
				targetGroupId: groupId,
				targetTimeline: timelineName,
				targetIndex: null,
				targetTimelineIndex: null,
				dropPosition: 'inside',
				dropTargetElementId,
				isSameTimeline: isSameTimeline
			}));

			// Add visual indicators
			if (element) {
				element.classList.add('timeline-drop-target');
			}

			logger.debug('Timeline drag over updated state:', {
				sectionIndex,
				timelineName,
				groupId,
				isSameTimeline,
				dragType: state.dragType
			});
		}
	} catch (error) {
		logger.error('Error handling timeline drag over:', error);
	}
}

export function handleEmptySectionDragOver(event, sectionIndex, element) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Get current drag state
		const state = get(dragState);

		// Sections can't be dropped inside other sections
		if (state.dragType === 'section') {
			dragState.update((current) => ({
				...current,
				targetSection: null,
				targetIndex: null,
				targetGroupId: null,
				targetTimeline: null,
				dropPosition: null,
				dropTargetElementId: null
			}));
			return;
		}

		// Check if the section is truly empty at this point
		const secs = get(sections);
		const currentItems = secs[sectionIndex]?.items || [];

		// If not empty anymore, calculate the proper target index
		const targetIndex = currentItems.length; // Put at the end

		// Generate a unique ID for this element
		const dropTargetElementId = generateElementId('empty-section', sectionIndex);

		// Update the drag state with target information
		dragState.update((current) => ({
			...current,
			targetSection: sectionIndex,
			targetIndex: targetIndex, // Position at the end if not empty
			targetGroupId: null,
			targetTimeline: null,
			dropPosition: 'inside',
			dropTargetElementId
		}));

		// Add visual indicators
		element.classList.add('empty-section-target');
	} catch (error) {
		logger.error('Error handling empty section drag over:', error);
	}
}

// ----------------------------------------
// DRAG LEAVE / DRAG END
// ----------------------------------------
export function handleDragLeave(event) {
	try {
		// Only need to check if we're leaving the target element
		if (!event.currentTarget.contains(event.relatedTarget)) {
			// Remove visual indicators
			clearDropIndicators(event.currentTarget);

			// Clear target info when leaving the element to avoid flickering
			dragState.update((current) => {
				if (
					event.currentTarget.matches(`.${current.dropTargetElementId}`) ||
					event.currentTarget.id === current.dropTargetElementId
				) {
					return {
						...current,
						targetSection: null,
						targetIndex: null,
						targetGroupId: null,
						targetTimeline: null,
						dropPosition: null,
						dropTargetElementId: null
					};
				}
				return current;
			});
		}
	} catch (error) {
		console.error('Error handling drag leave:', error);
	}
}

export function handleDragEnd(event) {
	try {
		// Stop event propagation
		if (event) event.stopPropagation();

		// Clean up any visual indicators from the dragged element
		if (event?.currentTarget) {
			event.currentTarget.classList.remove('dragging');
		}

		// Clean up drop target if it exists
		const state = get(dragState);
		if (state.dropTargetElementId) {
			// dropTargetElementId is used as a class selector
			const selector = `.${state.dropTargetElementId}`;
			const dropTarget = document.querySelector(selector);
			if (dropTarget) {
				clearDropIndicators(dropTarget);
			}
		}

		// Multi-phase cleanup of all indicators
		multiPhaseCleanup();

		// Reset drag state
		resetDragState();
	} catch (error) {
		console.error('Error handling drag end:', error);
	}
}

// ----------------------------------------
// DROP HANDLER (MAIN ENTRY)
// ----------------------------------------
export function handleDrop(event) {
	try {
		event.preventDefault();
		event.stopPropagation();

		// Clean up any visual indicators immediately
		document.querySelectorAll('.timeline-drop-target').forEach((el) => {
			el.classList.remove('timeline-drop-target');
		});

		// Try to recover drag data from dataTransfer if available
		let recoveredItemId = null;
		let recoveredItemName = null;

		if (event.dataTransfer) {
			try {
				// Try to get the direct item ID first
				recoveredItemId = event.dataTransfer.getData('application/x-item-id');
				recoveredItemName = event.dataTransfer.getData('application/x-item-name');

				if (!recoveredItemId) {
					// Fall back to the JSON data
					const jsonData = event.dataTransfer.getData('text/plain');
					if (jsonData) {
						const parsedData = JSON.parse(jsonData);
						if (parsedData.id) {
							recoveredItemId = parsedData.id;
							recoveredItemName = parsedData.name;
							console.log('[DEBUG] Recovered item data from JSON:', {
								id: recoveredItemId,
								name: recoveredItemName
							});
						}
					}
				} else {
					console.log('[DEBUG] Recovered item data from dataTransfer:', {
						id: recoveredItemId,
						name: recoveredItemName
					});
				}
			} catch (e) {
				console.error('Failed to parse dataTransfer data:', e);
			}
		}

		// Also try to get data from the target element
		if (!recoveredItemId && event.currentTarget && event.currentTarget.dataset) {
			recoveredItemId = event.currentTarget.dataset.itemId;
			recoveredItemName = event.currentTarget.dataset.itemName;
			if (recoveredItemId) {
				console.log('[DEBUG] Recovered item data from dataset:', {
					id: recoveredItemId,
					name: recoveredItemName
				});
			}
		}

		// Get current drag state
		let state = get(dragState);

		// Update the drag state with the recovered information if needed
		if (recoveredItemId && (!state.itemId || state.itemId !== parseInt(recoveredItemId))) {
			console.log('[DEBUG] Updating drag state with recovered item ID:', recoveredItemId);
			dragState.update((s) => ({
				...s,
				itemId: parseInt(recoveredItemId),
				itemName: recoveredItemName
			}));
			// Refresh state after update
			state = get(dragState);
		}

		console.log('[DEBUG] Drop handler called with state:', {
			isDragging: state.isDragging,
			dragType: state.dragType,
			sourceSection: state.sourceSection,
			targetSection: state.targetSection,
			targetTimeline: state.targetTimeline,
			targetGroupId: state.targetGroupId,
			dropPosition: state.dropPosition
		});

		// Check for timeline drop data attributes as backup
		if (
			(state.targetSection === null || state.targetSection === undefined) &&
			event?.currentTarget
		) {
			const targetEl = event.currentTarget;
			if (targetEl.classList.contains('timeline-column')) {
				const sectionIndex = parseInt(targetEl.getAttribute('data-section-index'));
				const timelineName = targetEl.getAttribute('data-timeline');
				const groupId = targetEl.getAttribute('data-group-id');

				if (!isNaN(sectionIndex) && timelineName && groupId) {
					console.log('[DEBUG] Recovering drop target from attributes:', {
						sectionIndex,
						timelineName,
						groupId
					});

					// Update state with recovered info
					dragState.update((current) => ({
						...current,
						targetSection: sectionIndex, // This can be 0 which is valid
						targetGroupId: groupId,
						targetTimeline: timelineName,
						dropPosition: 'inside'
					}));

					// Refresh state
					state = get(dragState);
				}
			}
		}

		// Clear any indicators from the target element
		clearDropIndicators(event.currentTarget);
		multiPhaseCleanup();

		// If there's no valid drop target, abort
		if (
			state.targetSection === null ||
			state.targetSection === undefined ||
			state.dropPosition === null
		) {
			console.log('[DEBUG] No valid drop target, aborting drop:', {
				targetSection: state.targetSection,
				dropPosition: state.dropPosition
			});
			handleDragEnd(event);
			return;
		}

		// Increment drop counter
		dropOperationCount++;

		// Check if we should record history (throttled)
		const shouldRecordHistory = dropOperationCount % DROP_HISTORY_THROTTLE === 0;

		// Record state before drop for history (only if needed)
		let sectionsBeforeDrop;
		if (shouldRecordHistory) {
			sectionsBeforeDrop = get(sections);
		}

		// Make a full backup of sections in case anything goes wrong during the drop operation
		const sectionsBeforeAllDrops = JSON.parse(JSON.stringify(get(sections)));

		console.log('[DEBUG] About to process drop with type:', state.dragType);

		// Create a copy of state to prevent modifications during async operations
		const dragParams = { ...state };

		// Handle drop based on drag type
		try {
			switch (dragParams.dragType) {
				case 'item':
					handleItemDrop(dragParams);
					break;
				case 'group':
					handleGroupDrop(dragParams);
					break;
				case 'section':
					handleSectionDrop(dragParams);
					break;
				default:
					break;
			}

			// Add to history (only if throttling allows)
			if (shouldRecordHistory) {
				addToHistory(
					'DRAG_DROP',
					{
						...dragParams,
						oldSections: sectionsBeforeDrop
					},
					`Moved ${state.dragType}`
				);
			}
		} catch (error) {
			console.error('Error handling drop:', error);

			// Try to recover state using the backup if anything went wrong
			try {
				console.warn('Trying to recover state from backup after drop error');
				sections.set(sectionsBeforeAllDrops);
			} catch (recoveryError) {
				console.error('Failed to recover state:', recoveryError);
			}
		}

		// Cleanup after drop
		resetDragState();
		if (event?.currentTarget) {
			event.currentTarget.classList.remove('dragging');
		}
		multiPhaseCleanup();
	} catch (error) {
		console.error('Error in main drop handler:', error);
		handleDragEnd(event);
	}
}

// ----------------------------------------
// ITEM / GROUP / SECTION DROP HANDLERS
// ----------------------------------------

/**
 * Handle dropping an item onto another item or into a timeline.
 */
function handleItemDrop(state) {
	try {
		console.log('[DEBUG] handleItemDrop called with state:', state);

		// Get the current sections
		const allSections = get(sections);

		// Validate section indices
		if (
			!isValidSectionIndex(allSections, state.sourceSection) ||
			!isValidSectionIndex(allSections, state.targetSection)
		) {
			console.error('Invalid section indexes:', {
				sourceSection: state.sourceSection,
				targetSection: state.targetSection,
				sectionCount: allSections.length
			});
			return;
		}

		// Find the source item using our helper function
		const { item: itemToMove, index: sourceItemIndex } = findSourceItem(allSections, state);

		// If we couldn't find the item, log and abort
		if (!itemToMove) {
			console.error('Could not find item to move:', state);
			return;
		}

		// Clone the item to avoid reference issues
		const movedItem = {
			...itemToMove,
			groupTimelines: itemToMove.groupTimelines ? [...itemToMove.groupTimelines] : null
		};

		// Log what we're moving for debugging
		console.log('[DEBUG] Moving item:', {
			id: movedItem.id,
			name: movedItem.name,
			from: {
				section: state.sourceSection,
				index: sourceItemIndex,
				timeline: movedItem.parallel_timeline
			},
			to: {
				section: state.targetSection,
				timeline: state.targetTimeline
			}
		});

		// Different handling based on drop type
		if (state.targetTimeline) {
			// Dropping into a timeline
			handleTimelineDrop(state, movedItem, sourceItemIndex);
		} else {
			// Regular drop before/after another item
			handleRegularDrop(state, movedItem, sourceItemIndex);
		}

		// Final cleanup of any indicators
		multiPhaseCleanup();
	} catch (error) {
		console.error('Error handling item drop:', error);
		throw error; // Re-throw to allow recovery in main handler
	}
}

/**
 * Prepare a timeline item for drop operation by setting required properties
 *
 * @param {Object} movedItem - The item being moved
 * @param {Object} state - Current drag state
 * @param {Array} secs - All sections
 * @returns {Object} The prepared item
 */
function prepareTimelineItem(movedItem, state, secs) {
	// Get the first item in the target group to retrieve groupTimelines
	const groupItems = secs[state.targetSection].items.filter(
		(item) => item.parallel_group_id === state.targetGroupId
	);

	// Extract groupTimelines from the first item in the target group
	const groupTimelines =
		groupItems.length > 0 ? groupItems[0].groupTimelines || [] : [state.targetTimeline]; // Fallback to just the target timeline

	// Update the item with timeline data
	movedItem.parallel_group_id = state.targetGroupId;
	movedItem.parallel_timeline = state.targetTimeline;
	movedItem.groupTimelines = [...groupTimelines]; // Ensure groupTimelines is preserved

	return movedItem;
}

/**
 * Handle reordering within the same timeline
 *
 * @param {Array} sectionItems - Items in the current section
 * @param {Object} movedItem - The item being moved
 * @param {Object} state - Current drag state
 * @param {Array} originalSectionItems - Original items before removing the source
 * @returns {Array} Updated section items
 */
function handleSameTimelineReordering(sectionItems, movedItem, state, originalSectionItems) {
	logger.debug('Reordering within same timeline at specific position');

	// Get all items in the timeline before we made any modifications
	const originalTimelineItems = originalSectionItems.filter(
		(item) =>
			item.parallel_group_id === state.targetGroupId &&
			item.parallel_timeline === state.targetTimeline
	);

	// Look for target by timeline position if available
	let targetItemIndex = -1;

	if (
		state.targetTimelineIndex !== null &&
		state.targetTimelineIndex < originalTimelineItems.length
	) {
		// We have the position within the timeline - use it directly
		const targetItem = originalTimelineItems[state.targetTimelineIndex];
		targetItemIndex = originalSectionItems.indexOf(targetItem);
		logger.debug(
			`Found target by timelineIndex: ${state.targetTimelineIndex}, absoluteIndex: ${targetItemIndex}`
		);
	} else if (state.targetIndex !== null) {
		// Fall back to using the absolute index
		targetItemIndex = state.targetIndex;
		logger.debug(`Using absolute targetIndex: ${targetItemIndex}`);
	}

	if (targetItemIndex === -1 || targetItemIndex >= originalSectionItems.length) {
		logger.error('Could not find target item or index is out of bounds');
		return appendToTimeline(sectionItems, movedItem, state);
	}

	if (targetItemIndex !== -1) {
		// For same timeline reordering, we need to adjust the position
		// based on whether the source was before or after the target
		const sourceIndexInSectionItems = state.sourceIndex;
		let insertAt;

		if (state.dropPosition === 'before') {
			// If dropping before the target
			if (sourceIndexInSectionItems < targetItemIndex) {
				// Source was before target, so target index shifted down by one
				insertAt = targetItemIndex - 1;
			} else {
				// Source was after target, target index unchanged
				insertAt = targetItemIndex;
			}
		} else {
			// 'after'
			// If dropping after the target
			if (sourceIndexInSectionItems <= targetItemIndex) {
				// Source was before or at target, target index shifted down by one
				insertAt = targetItemIndex;
			} else {
				// Source was after target, target index unchanged + 1
				insertAt = targetItemIndex + 1;
			}
		}

		// Insert at the calculated position
		logger.debug(
			`Inserting at position ${insertAt} (${state.dropPosition} item at original index ${targetItemIndex})`
		);
		sectionItems.splice(insertAt, 0, movedItem);
		return sectionItems;
	}

	// If we couldn't find the target, append to the end of the timeline items
	return appendToTimeline(sectionItems, movedItem, state);
}

/**
 * Append an item to the end of a specific timeline
 */
function appendToTimeline(sectionItems, movedItem, state) {
	logger.debug('Appending to end of timeline');

	// Find items in the same timeline and group
	const sameTimelineItems = sectionItems.filter(
		(item) =>
			item.parallel_group_id === state.targetGroupId &&
			item.parallel_timeline === state.targetTimeline
	);

	if (sameTimelineItems.length > 0) {
		// Find the last item of this timeline
		const lastItem = sameTimelineItems[sameTimelineItems.length - 1];
		const lastItemIndex = sectionItems.indexOf(lastItem);

		if (lastItemIndex !== -1) {
			// Insert after the last item of this timeline
			sectionItems.splice(lastItemIndex + 1, 0, movedItem);
			return sectionItems;
		}
	}

	// No items in this timeline or couldn't find last item, add to end
	sectionItems.push(movedItem);
	return sectionItems;
}

/**
 * Handle dropping an item into a timeline.
 */
function handleTimelineDrop(state, movedItem, sourceItemIndex) {
	logger.debug('Dropping into timeline:', {
		targetTimeline: state.targetTimeline,
		targetGroupId: state.targetGroupId,
		targetIndex: state.targetIndex,
		dropPosition: state.dropPosition
	});

	try {
		// First, save a snapshot of the current state in case we need to recover
		const sectionsBeforeUpdate = get(sections);
		let errorOccurred = false;

		sections.update((secs) => {
			try {
				// Create a new copy of the sections array
				const newSecs = [...secs];

				// Re-validate indices to be safe
				if (
					!isValidSectionIndex(newSecs, state.sourceSection) ||
					!isValidSectionIndex(newSecs, state.targetSection)
				) {
					logger.error('Section indices invalid during update');
					return secs; // Return unchanged
				}

				// Prepare the item with timeline data
				movedItem = prepareTimelineItem(movedItem, state, secs);

				// Get correct source item index using our helper
				const { item: sourceItem, index: finalSourceItemIndex } = findSourceItem(secs, state);

				if (!sourceItem) {
					logger.error('Source item not found during timeline drop');
					return secs; // Return unchanged
				}

				// Check if this is a reordering within the same timeline or a move to a different timeline
				const isSameTimeline =
					state.sourceSection === state.targetSection &&
					state.sourceGroupId === state.targetGroupId &&
					state.sourceTimeline === state.targetTimeline;

				// Check if we're dropping on a specific item in the timeline
				const isDroppingOnItem =
					state.targetIndex !== null &&
					(state.dropPosition === 'before' || state.dropPosition === 'after');

				// Starting point for section updates
				if (state.sourceSection === state.targetSection) {
					// Within the same section
					const sectionItems = [...newSecs[state.sourceSection].items];

					// Save the original items before removal for reference
					const originalSectionItems = [...sectionItems];

					// Remove the item from its original position
					if (finalSourceItemIndex < sectionItems.length) {
						sectionItems.splice(finalSourceItemIndex, 1);
					} else {
						logger.error(
							'Item index out of bounds in splice operation:',
							finalSourceItemIndex,
							'length:',
							sectionItems.length
						);
						return secs; // Return unchanged on error
					}

					// REORDERING CASE - If we're reordering within the same timeline and dropping on an item
					if (isSameTimeline && isDroppingOnItem) {
						handleSameTimelineReordering(sectionItems, movedItem, state, originalSectionItems);
					}
					// MOVE TO END CASE - We're moving to the end of a timeline
					else {
						appendToTimeline(sectionItems, movedItem, state);
					}

					// Update the section
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: sectionItems
					};
				} else {
					// Between different sections
					const sourceItems = [...newSecs[state.sourceSection].items];
					const targetItems = [...newSecs[state.targetSection].items];

					// Remove from source
					if (finalSourceItemIndex < sourceItems.length) {
						sourceItems.splice(finalSourceItemIndex, 1);
					} else {
						logger.error(
							'Item index out of bounds in cross-section splice operation:',
							finalSourceItemIndex,
							'length:',
							sourceItems.length
						);
						return secs; // Return unchanged on error
					}

					// Add to target section's timeline
					appendToTimeline(targetItems, movedItem, state);

					// Update both sections
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: sourceItems
					};

					newSecs[state.targetSection] = {
						...newSecs[state.targetSection],
						items: targetItems
					};
				}

				return newSecs;
			} catch (e) {
				logger.error('Error during timeline drop update:', e);
				errorOccurred = true;
				return secs; // Return unchanged on error
			}
		});

		// If an error occurred during the update, restore from backup
		if (errorOccurred) {
			logger.warn('Restoring previous state due to error in timeline drop');
			sections.set(sectionsBeforeUpdate);
		}
	} catch (updateError) {
		logger.error('Error updating sections in timeline drop:', updateError);
		throw updateError; // Re-throw to allow recovery in main handler
	}
}

/**
 * Handle dropping an item before or after another item (not into a timeline).
 */
function handleRegularDrop(state, movedItem, sourceItemIndex) {
	try {
		// Calculate the target index
		let targetIndex;

		if (state.dropPosition === 'before') {
			targetIndex = state.targetIndex;
		} else {
			// after
			targetIndex = state.targetIndex + 1;
		}

		// If source section is same as target and source index is before target,
		// adjust the target index
		if (state.sourceSection === state.targetSection && sourceItemIndex < targetIndex) {
			targetIndex--;
		}

		// Reset group properties when moving outside a group
		movedItem.parallel_group_id = null;
		movedItem.parallel_timeline = null;
		movedItem.groupTimelines = null;

		// Save backup of current state
		const sectionsBeforeUpdate = get(sections);
		let errorOccurred = false;

		sections.update((secs) => {
			try {
				// Create a copy of the sections array
				const newSecs = [...secs];

				// Validate indices again to be sure
				if (
					!isValidSectionIndex(secs, state.sourceSection) ||
					!isValidSectionIndex(secs, state.targetSection)
				) {
					console.error('Section indices invalid during regular drop');
					return secs; // Return unchanged
				}

				// Find source item again to be safe
				const { item: sourceItem, index: finalSourceItemIndex } = findSourceItem(secs, state);

				if (!sourceItem) {
					console.error('Source item not found during regular drop');
					return secs; // Return unchanged
				}

				// Special handling for within the same section
				if (state.sourceSection === state.targetSection) {
					const sectionItems = [...newSecs[state.sourceSection].items];

					// Remove the item from its original position
					if (finalSourceItemIndex < sectionItems.length) {
						sectionItems.splice(finalSourceItemIndex, 1);
					} else {
						console.error(
							'Item index out of bounds in regular drop splice operation:',
							finalSourceItemIndex,
							'length:',
							sectionItems.length
						);
						return secs; // Return unchanged
					}

					// Add the item to the target position
					console.log(
						'[DEBUG] Adding item to position',
						targetIndex,
						'name:',
						movedItem.name,
						'id:',
						movedItem.id
					);
					sectionItems.splice(Math.min(targetIndex, sectionItems.length), 0, movedItem);

					// Update the section
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: sectionItems
					};
				} else {
					// Between different sections
					const sourceItems = [...newSecs[state.sourceSection].items];
					const targetItems = [...newSecs[state.targetSection].items];

					// Remove from source
					if (finalSourceItemIndex < sourceItems.length) {
						sourceItems.splice(finalSourceItemIndex, 1);
					} else {
						console.error(
							'Item index out of bounds in cross-section splice operation:',
							finalSourceItemIndex,
							'length:',
							sourceItems.length
						);
						return secs; // Return unchanged
					}

					// Add to target
					console.log(
						'[DEBUG] Adding item to target section at position',
						targetIndex,
						'name:',
						movedItem.name,
						'id:',
						movedItem.id
					);
					targetItems.splice(Math.min(targetIndex, targetItems.length), 0, movedItem);

					// Update both sections
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: sourceItems
					};

					newSecs[state.targetSection] = {
						...newSecs[state.targetSection],
						items: targetItems
					};
				}

				return newSecs;
			} catch (e) {
				console.error('Error during regular drop update:', e);
				errorOccurred = true;
				return secs; // Return unchanged on error
			}
		});

		// If an error occurred during the update, restore from backup
		if (errorOccurred) {
			console.warn('[WARN] Restoring previous state due to error in regular drop');
			sections.set(sectionsBeforeUpdate);
		}
	} catch (updateError) {
		console.error('Error updating sections in regular drop:', updateError);
		throw updateError; // Re-throw to allow recovery in main handler
	}
}

/**
 * Handle dropping a group onto a target position.
 */
function handleGroupDrop(state) {
	try {
		// Get the current sections
		const allSections = get(sections);

		// Validate section indices and group ID
		if (
			!isValidSectionIndex(allSections, state.sourceSection) ||
			!isValidSectionIndex(allSections, state.targetSection) ||
			!state.sourceGroupId
		) {
			console.error('Invalid section indexes or group ID for group drop:', state);
			return;
		}

		// Get all items in the group from the source section
		const sourceSection = allSections[state.sourceSection];
		const groupItems = sourceSection.items.filter(
			(item) => item.parallel_group_id === state.sourceGroupId
		);

		if (groupItems.length === 0) {
			console.error('No group items found for group ID:', state.sourceGroupId);
			return;
		}

		// Save backup of current state
		const sectionsBeforeUpdate = get(sections);
		let errorOccurred = false;

		sections.update((secs) => {
			try {
				// Validate indices again
				if (
					!isValidSectionIndex(secs, state.sourceSection) ||
					!isValidSectionIndex(secs, state.targetSection)
				) {
					console.error('Section indices invalid during group update');
					return secs; // Return unchanged
				}

				// Create a new clean array of sections
				const newSecs = [...secs];

				// Clone the group items to avoid reference issues
				const groupItemsClone = groupItems.map((item) => ({ ...item }));

				// Calculate the target index
				let targetIndex =
					state.dropPosition === 'before' ? state.targetIndex : state.targetIndex + 1;

				// Special handling for within the same section vs. different sections
				if (state.sourceSection === state.targetSection) {
					// Within the same section
					const allSectionItems = [...newSecs[state.sourceSection].items];

					// Create a new array without the group items
					const itemsWithoutGroup = allSectionItems.filter(
						(item) => item.parallel_group_id !== state.sourceGroupId
					);

					// Adjust target index to account for removed group items
					// If target index is after the original position of the group
					let adjustedTargetIndex = targetIndex;

					// Find the index of the first group item in the original array
					const firstGroupItemIndex = allSectionItems.findIndex(
						(item) => item.parallel_group_id === state.sourceGroupId
					);

					// Get the count of group items
					const groupItemCount = groupItemsClone.length;

					// If the group was before our target and we're removing it, we need to adjust
					if (firstGroupItemIndex !== -1 && firstGroupItemIndex < targetIndex) {
						adjustedTargetIndex = Math.max(0, targetIndex - groupItemCount);
					}

					// Make sure target index is within bounds
					const boundedTargetIndex = Math.min(adjustedTargetIndex, itemsWithoutGroup.length);

					// Insert group items at the target position
					const finalItems = [
						...itemsWithoutGroup.slice(0, boundedTargetIndex),
						...groupItemsClone,
						...itemsWithoutGroup.slice(boundedTargetIndex)
					];

					// Update the section
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: finalItems
					};
				} else {
					// Between different sections
					const sourceItems = [...newSecs[state.sourceSection].items];
					const targetItems = [...newSecs[state.targetSection].items];

					// Filter out the group items from source
					const sourceItemsWithoutGroup = sourceItems.filter(
						(item) => item.parallel_group_id !== state.sourceGroupId
					);

					// Calculate target index in bounds
					const boundedTargetIndex = Math.min(targetIndex, targetItems.length);

					// Insert group items at the target position
					const finalTargetItems = [
						...targetItems.slice(0, boundedTargetIndex),
						...groupItemsClone,
						...targetItems.slice(boundedTargetIndex)
					];

					// Update both sections
					newSecs[state.sourceSection] = {
						...newSecs[state.sourceSection],
						items: sourceItemsWithoutGroup
					};

					newSecs[state.targetSection] = {
						...newSecs[state.targetSection],
						items: finalTargetItems
					};
				}

				return newSecs;
			} catch (e) {
				console.error('Error during group drop operation:', e);
				errorOccurred = true;
				return secs; // Return unchanged on error
			}
		});

		// If an error occurred during the update, restore from backup
		if (errorOccurred) {
			console.warn('[WARN] Restoring previous state due to error in group drop');
			sections.set(sectionsBeforeUpdate);
		}

		// Additional cleanup after group drop
		setTimeout(() => multiPhaseCleanup(), 50);
	} catch (error) {
		console.error('Error handling group drop:', error);
		throw error; // Re-throw to allow recovery in main handler
	}
}

/**
 * Handle dropping a section before or after another section.
 */
function handleSectionDrop(state) {
	try {
		// Validate section indices
		if (state.sourceSection === null || state.targetSection === null) {
			console.error('Invalid source or target in section drag state:', state);
			return;
		}

		// Get the current sections
		const allSections = get(sections);

		if (
			!isValidSectionIndex(allSections, state.sourceSection) ||
			!isValidSectionIndex(allSections, state.targetSection)
		) {
			console.error('Section indices out of bounds:', state);
			return;
		}

		// Save backup of current state
		const sectionsBeforeUpdate = get(sections);
		let errorOccurred = false;

		sections.update((secs) => {
			try {
				// Validate indices again
				if (
					!isValidSectionIndex(secs, state.sourceSection) ||
					!isValidSectionIndex(secs, state.targetSection)
				) {
					console.error('Section indices invalid during section drop');
					return secs; // Return unchanged
				}

				// Create a defensive copy of the sections array
				const newSecs = [...secs];

				// Get the section to move (without modifying original yet)
				const movedSection = { ...newSecs[state.sourceSection] };

				// Remove the source section
				newSecs.splice(state.sourceSection, 1);

				// Calculate the target index
				let targetIndex = state.targetSection;
				if (state.dropPosition === 'after') {
					targetIndex++;
				}

				// Adjust index if moving from before to after
				if (state.sourceSection < targetIndex) {
					targetIndex--;
				}

				// Bound the target index to be within array limits
				targetIndex = Math.max(0, Math.min(targetIndex, newSecs.length));

				// Insert the section at the target position
				newSecs.splice(targetIndex, 0, movedSection);

				return newSecs;
			} catch (e) {
				console.error('Error during section drop operation:', e);
				errorOccurred = true;
				return secs; // Return unchanged on error
			}
		});

		// If an error occurred during the update, restore from backup
		if (errorOccurred) {
			console.warn('[WARN] Restoring previous state due to error in section drop');
			sections.set(sectionsBeforeUpdate);
		}

		// Additional cleanup after section drop
		setTimeout(() => multiPhaseCleanup(), 50);
	} catch (error) {
		console.error('Error handling section drop:', error);
		throw error; // Re-throw to allow recovery in main handler
	}
}
