import { writable, derived, get } from 'svelte/store';
import { sections, selectedItems } from './sectionsStore';
import { addToHistory } from './historyStore';

// --- CORE DRAG STATE ---
export const dragState = writable({
  isDragging: false,
  
  // Item type being dragged
  dragType: null, // 'item', 'group', 'section'
  
  // Source information
  sourceSection: null,
  sourceIndex: null, 
  sourceGroupId: null,
  sourceTimeline: null,
  
  // Item specific tracking (more stable than indexes)
  itemId: null,      // Stable ID of the item being dragged
  itemName: null,    // Name of the item for debugging
  
  // Target information
  targetSection: null,
  targetIndex: null,
  targetGroupId: null,
  targetTimeline: null,
  
  // Position indicators
  dropPosition: null, // 'before', 'after', 'inside'
  
  // Element identifiers (not DOM elements themselves)
  draggedElementId: null,
  dropTargetElementId: null
});

// --- DERIVED STORES ---
export const isDragging = derived(dragState, $state => $state.isDragging);
export const isItemDrag = derived(dragState, $state => $state.dragType === 'item');
export const isGroupDrag = derived(dragState, $state => $state.dragType === 'group');
export const isSectionDrag = derived(dragState, $state => $state.dragType === 'section');

// --- HELPER FUNCTIONS ---

// Calculate drop position (before, after) based on mouse position in element
export function calculateDropPosition(event, element) {
  try {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    // Top 50% = before, Bottom 50% = after (simplified from previous 3-position logic)
    if (y < height * 0.5) {
      return 'before';
    } else {
      return 'after';
    }
  } catch (error) {
    console.error('Error calculating drop position:', error);
    return 'after'; // Default fallback
  }
}

// Calculate drop position for sections (only before/after)
export function calculateSectionDropPosition(event, element) {
  try {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    // Top 50% = before, Bottom 50% = after
    return y < height * 0.5 ? 'before' : 'after';
  } catch (error) {
    console.error('Error calculating section drop position:', error);
    return 'after'; // Default fallback
  }
}

// Generate a unique ID for an element
function generateElementId(type, sectionIndex, itemIndex = null, groupId = null, timeline = null) {
  const parts = [type, sectionIndex];
  
  if (itemIndex !== null) parts.push(`item-${itemIndex}`);
  if (groupId !== null) parts.push(`group-${groupId}`);
  if (timeline !== null) parts.push(`timeline-${timeline}`);
  
  return parts.join('-');
}

// Helper function to find item in a section by ID - for stable item tracking
function findItemIndexById(sections, sectionIndex, itemId) {
  if (!sections[sectionIndex] || !itemId) return -1;
  
  return sections[sectionIndex].items.findIndex(item => item.id === itemId);
}

// --- DRAG START HANDLERS ---

// Expose dragState methods to window for emergency access by timeline components
if (typeof window !== 'undefined') {
  window.__dragManager = {
    get: () => get(dragState),
    update: (updateFn) => dragState.update(updateFn)
  };
}

// Keep track of the last drag/dragover time to prevent excessive events
let lastDragStartTime = 0;
let lastDragOverTime = 0;
const MIN_DRAG_INTERVAL = 100; // milliseconds between drag starts
const MIN_DRAGOVER_INTERVAL = 40;  // milliseconds between drag over events - throttle these heavily

export function startItemDrag(event, sectionIndex, itemIndex, item, itemId) {
  try {
    // Stop event propagation to prevent parent elements from also handling the drag
    event.stopPropagation();
    
    // Validate the drag information to ensure we have an item ID
    if (!itemId && item && item.id) {
      itemId = item.id;
      console.log('[DEBUG] Using item.id instead of provided itemId');
    }
    
    if (!itemId) {
      console.error('[ERROR] No valid itemId for drag:', { sectionIndex, itemIndex, itemName: item?.name });
      // Try to recover from dataset
      if (event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.itemId) {
        itemId = parseInt(event.currentTarget.dataset.itemId);
        console.log('[DEBUG] Recovered itemId from dataset:', itemId);
      }
    }
    
    // Prevent rapid consecutive drags that could corrupt state
    const now = Date.now();
    if (now - lastDragStartTime < MIN_DRAG_INTERVAL) {
      console.log('Preventing rapid consecutive drag, wait a moment...');
      event.preventDefault();
      return;
    }
    lastDragStartTime = now;
    
    // First ensure any prior drag state is fully cleared
    const priorState = get(dragState);
    if (priorState.isDragging) {
      // Force clear drag state - something went wrong with prior drag end
      console.log('Clearing stuck prior drag state before starting new drag');
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }
    
    event.dataTransfer.effectAllowed = 'move';
    
    // Generate a unique ID for this element
    const draggedElementId = generateElementId('item', sectionIndex, itemIndex);
    
    // Store the item ID for stable tracking
    const actualItemId = itemId || item.id;
    
    // Log the drag start with stable identifiers
    console.log('[DEBUG] Starting drag for item:', {
      name: item.name,
      id: actualItemId,
      sectionIndex,
      itemIndex
    });
    
    // Set dataTransfer data for redundancy
    if (event.dataTransfer) {
      // This adds the crucial drag data so we can recover it if needed
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'item',
        id: actualItemId,
        name: item.name,
        sectionIndex,
        itemIndex
      }));
      
      // Store a direct reference to the item ID for easier access
      event.dataTransfer.setData('application/x-item-id', actualItemId.toString());
      event.dataTransfer.setData('application/x-item-name', item.name);
    }
    
    // Store state without references to DOM elements, but with item ID
    dragState.set({
      isDragging: true,
      dragType: 'item',
      sourceSection: sectionIndex,
      sourceIndex: itemIndex,
      sourceGroupId: item.parallel_group_id,
      sourceTimeline: item.parallel_timeline,
      draggedElementId,
      itemId: actualItemId, // Store the actual item ID
      itemName: item.name,  // Store item name for debugging
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
    
    // Add a class to the dragged element instead of modifying style directly
    if (event.currentTarget) {
      event.currentTarget.classList.add('dragging');
    }
  } catch (error) {
    console.error('Error starting item drag:', error);
    // Reset state on error
    dragState.set({
      isDragging: false,
      dragType: null,
      sourceSection: null,
      sourceIndex: null,
      sourceGroupId: null,
      sourceTimeline: null,
      draggedElementId: null,
      itemId: null,
      itemName: null,
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
  }
}

export function startGroupDrag(event, sectionIndex, groupId) {
  try {
    // Stop event propagation to prevent parent elements from also handling the drag
    event.stopPropagation();
    
    // Prevent rapid consecutive drags that could corrupt state
    const now = Date.now();
    if (now - lastDragStartTime < MIN_DRAG_INTERVAL) {
      console.log('Preventing rapid consecutive group drag, wait a moment...');
      event.preventDefault();
      return;
    }
    lastDragStartTime = now;
    
    // First ensure any prior drag state is fully cleared
    const priorState = get(dragState);
    if (priorState.isDragging) {
      // Force clear drag state - something went wrong with prior drag end
      console.log('Clearing stuck prior drag state before starting new group drag');
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }
    
    event.dataTransfer.effectAllowed = 'move';
    
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
      itemId: null,     // No item ID for group drags
      itemName: null,   // No item name for group drags
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
    
    // Add a class to the dragged element instead of modifying style directly
    if (event.currentTarget) {
      event.currentTarget.classList.add('dragging');
    }
  } catch (error) {
    console.error('Error starting group drag:', error);
    // Reset state on error
    dragState.set({
      isDragging: false,
      dragType: null,
      sourceSection: null,
      sourceIndex: null,
      sourceGroupId: null,
      sourceTimeline: null,
      draggedElementId: null,
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
  }
}

export function startSectionDrag(event, sectionIndex) {
  try {
    // Stop event propagation to prevent parent elements from also handling the drag
    event.stopPropagation();
    
    // Prevent rapid consecutive drags that could corrupt state
    const now = Date.now();
    if (now - lastDragStartTime < MIN_DRAG_INTERVAL) {
      console.log('Preventing rapid consecutive section drag, wait a moment...');
      event.preventDefault();
      return;
    }
    lastDragStartTime = now;
    
    // First ensure any prior drag state is fully cleared
    const priorState = get(dragState);
    if (priorState.isDragging) {
      // Force clear drag state - something went wrong with prior drag end
      console.log('Clearing stuck prior drag state before starting new section drag');
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }
    
    event.dataTransfer.effectAllowed = 'move';
    
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
      itemId: null,     // No item ID for section drags
      itemName: null,   // No item name for section drags
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
    
    // Add a class to the dragged element instead of modifying style directly
    if (event.currentTarget) {
      event.currentTarget.classList.add('dragging');
    }
  } catch (error) {
    console.error('Error starting section drag:', error);
    // Reset state on error
    dragState.set({
      isDragging: false,
      dragType: null,
      sourceSection: null,
      sourceIndex: null,
      sourceGroupId: null,
      sourceTimeline: null,
      draggedElementId: null,
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
  }
}

// --- DRAG OVER HANDLERS ---

export function handleItemDragOver(event, sectionIndex, itemIndex, item, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
    // Throttle dragover events to prevent excessive updates
    const now = Date.now();
    if (now - lastDragOverTime < MIN_DRAGOVER_INTERVAL) {
      return;
    }
    lastDragOverTime = now;
    
    // Get current drag state
    const state = get(dragState);
    
    // Determine drop position - now only returns 'before' or 'after'
    let dropPosition;
    
    if (state.dragType === 'item') {
      dropPosition = calculateDropPosition(event, element);
    } else if (state.dragType === 'group') {
      dropPosition = calculateDropPosition(event, element);
    } else {
      return; // Sections can't be dropped on items
    }
    
    // Don't allow dropping on itself
    if (state.dragType === 'item' && 
        state.sourceSection === sectionIndex && 
        state.sourceIndex === itemIndex) {
      return;
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('item', sectionIndex, itemIndex);
    
    // Check if we need to update the state (only update if something changed)
    const needsUpdate = state.targetSection !== sectionIndex || 
                        state.targetIndex !== itemIndex || 
                        state.targetGroupId !== item.parallel_group_id || 
                        state.targetTimeline !== item.parallel_timeline ||
                        state.dropPosition !== dropPosition;
    
    if (needsUpdate) {
      // Update the drag state with target information
      dragState.update(current => ({
        ...current,
        targetSection: sectionIndex,
        targetIndex: itemIndex,
        targetGroupId: item.parallel_group_id,
        targetTimeline: item.parallel_timeline,
        dropPosition: dropPosition,
        dropTargetElementId
      }));
      
      // Add visual indicators using classes
      updateDropIndicators(element, dropPosition);
    }
  } catch (error) {
    console.error('Error handling item drag over:', error);
  }
}

export function handleGroupDragOver(event, sectionIndex, groupId, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
    // Get current drag state
    const state = get(dragState);
    
    if (state.dragType === 'section') {
      return; // Sections can't be dropped on groups
    }
    
    // Groups can only be dropped before or after other groups
    const dropPosition = calculateDropPosition(event, element);
    
    // Don't allow dropping on itself
    if (state.dragType === 'group' && 
        state.sourceSection === sectionIndex && 
        state.sourceGroupId === groupId) {
      return;
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('group', sectionIndex, null, groupId);
    
    // Update the drag state with target information
    dragState.update(current => ({
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
    console.error('Error handling group drag over:', error);
  }
}

export function handleSectionDragOver(event, sectionIndex, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
    // Get current drag state
    const state = get(dragState);
    
    if (state.dragType !== 'section') {
      return; // Only sections can be dropped on sections
    }
    
    const dropPosition = calculateSectionDropPosition(event, element);
    
    // Don't allow dropping on itself
    if (state.sourceSection === sectionIndex) {
      return;
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('section', sectionIndex);
    
    // Update the drag state with target information
    dragState.update(current => ({
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
    console.error('Error handling section drag over:', error);
  }
}

export function handleTimelineDragOver(event, sectionIndex, timelineName, groupId, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
    // Throttle dragover events to prevent excessive updates
    const now = Date.now();
    if (now - lastDragOverTime < MIN_DRAGOVER_INTERVAL) {
      return;
    }
    lastDragOverTime = now;
    
    // Get current drag state
    const state = get(dragState);
    
    if (state.dragType !== 'item') {
      return; // Only items can be dropped in timelines
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('timeline', sectionIndex, null, groupId, timelineName);
    
    // Add data attributes to the element for redundancy
    if (element) {
      element.setAttribute('data-section-index', sectionIndex);
      element.setAttribute('data-timeline', timelineName);
      element.setAttribute('data-group-id', groupId);
    }
    
    // Check if we need to update the state (only update if something changed)
    const needsUpdate = state.targetSection !== sectionIndex || 
                        state.targetGroupId !== groupId || 
                        state.targetTimeline !== timelineName;
    
    if (needsUpdate) {
      // Update the drag state with target information
      dragState.update(current => ({
        ...current,
        targetSection: sectionIndex,
        targetGroupId: groupId,
        targetTimeline: timelineName,
        targetIndex: null,
        dropPosition: 'inside',
        dropTargetElementId
      }));
      
      // Add visual indicators
      if (element) {
        element.classList.add('timeline-drop-target');
      }
      
      // Log important timeline drag over state (only log when state actually changes)
      console.log('[DEBUG] Timeline drag over updated state:', { 
        sectionIndex, 
        timelineName, 
        groupId,
        dragType: state.dragType
      });
    }
  } catch (error) {
    console.error('Error handling timeline drag over:', error);
  }
}

export function handleEmptySectionDragOver(event, sectionIndex, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
    // Get current drag state
    const state = get(dragState);
    
    if (state.dragType === 'section') {
      return; // Sections can't be dropped inside other sections
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('empty-section', sectionIndex);
    
    // Update the drag state with target information
    dragState.update(current => ({
      ...current,
      targetSection: sectionIndex,
      targetIndex: 0, // First position in the section
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: 'inside',
      dropTargetElementId
    }));
    
    // Add visual indicators
    element.classList.add('empty-section-target');
  } catch (error) {
    console.error('Error handling empty section drag over:', error);
  }
}

// --- DRAG LEAVE/END HANDLERS ---

export function handleDragLeave(event) {
  try {
    // Only need to check if we're leaving the target element
    if (!event.currentTarget.contains(event.relatedTarget)) {
      // Remove visual indicators
      clearDropIndicators(event.currentTarget);
      
      // We'll only clear target information if we're actually leaving the element
      // This helps avoid flickering during drag events
      dragState.update(current => {
        // Make sure we only clear the target when we're leaving the current target
        if (event.currentTarget.matches(`.${current.dropTargetElementId}`) ||
            event.currentTarget.id === current.dropTargetElementId) {
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
    if (event) {
      event.stopPropagation();
    }
    
    // Clean up any visual indicators by removing classes
    if (event?.currentTarget) {
      event.currentTarget.classList.remove('dragging');
    }
    
    // Find and clean up the drop target if it exists (using ID selector)
    const state = get(dragState);
    if (state.dropTargetElementId) {
      const selector = `.${state.dropTargetElementId}`;
      const dropTarget = document.querySelector(selector) || document.getElementById(state.dropTargetElementId);
      if (dropTarget) {
        clearDropIndicators(dropTarget);
      }
    }
    
    // Thorough cleanup of all drop indicators - ensure nothing remains
    document.querySelectorAll('.drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target, .timeline-item, .parallel-group-container, .section-container').forEach(el => {
      // Remove all possible indicator classes directly
      el.classList.remove(
        'drop-before', 
        'drop-after', 
        'section-drop-before', 
        'section-drop-after',
        'timeline-drop-target',
        'empty-section-target'
      );
    });
    
    // Also remove any pseudo-elements that might be showing after the drop
    // This is handled with class removal above, but we're being thorough
    
    // Reset drag state
    dragState.set({
      isDragging: false,
      dragType: null,
      sourceSection: null,
      sourceIndex: null,
      sourceGroupId: null,
      sourceTimeline: null,
      draggedElementId: null,
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
  } catch (error) {
    console.error('Error handling drag end:', error);
  }
}

// --- DROP HANDLERS ---

// Track history updates to avoid excessive history entries
let dropOperationCount = 0;
const DROP_HISTORY_THROTTLE = 5; // Only store history every 5 drops (reduced from 10 for better history accuracy)

export function handleDrop(event) {
  try {
    event.preventDefault();
    // Stop event propagation
    event.stopPropagation();
    
    // Clean up any visual indicators immediately
    document.querySelectorAll('.timeline-drop-target').forEach(el => {
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
              console.log('[DEBUG] Recovered item data from JSON:', { id: recoveredItemId, name: recoveredItemName });
            }
          }
        } else {
          console.log('[DEBUG] Recovered item data from dataTransfer:', { id: recoveredItemId, name: recoveredItemName });
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
        console.log('[DEBUG] Recovered item data from dataset:', { id: recoveredItemId, name: recoveredItemName });
      }
    }
    
    let state = get(dragState);
    
    // Update the drag state with the recovered information if needed
    if (recoveredItemId && (!state.itemId || state.itemId !== parseInt(recoveredItemId))) {
      console.log('[DEBUG] Updating drag state with recovered item ID:', recoveredItemId);
      dragState.update(s => ({
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
    if ((state.targetSection === null || state.targetSection === undefined) && event?.currentTarget) {
      const targetEl = event.currentTarget;
      if (targetEl.classList.contains('timeline-column')) {
        const sectionIndex = parseInt(targetEl.getAttribute('data-section-index'));
        const timelineName = targetEl.getAttribute('data-timeline');
        const groupId = targetEl.getAttribute('data-group-id');
        
        if (!isNaN(sectionIndex) && timelineName && groupId) {
          console.log('[DEBUG] Recovering drop target from attributes:', { sectionIndex, timelineName, groupId });
          
          // Update state with recovered info
          dragState.update(current => ({
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
    
    // Remove all indicator classes immediately to avoid stuck indicators
    const targetEl = event?.currentTarget;
    if (targetEl) {
      targetEl.classList.remove(
        'timeline-drop-target',
        'drop-before',
        'drop-after',
        'section-drop-before',
        'section-drop-after'
      );
    }
    
    // If there's no valid drop target, abort
    if (state.targetSection === null || state.targetSection === undefined || state.dropPosition === null) {
      console.log('[DEBUG] No valid drop target, aborting drop:', {
        targetSection: state.targetSection, 
        dropPosition: state.dropPosition
      });
      handleDragEnd(event);
      return;
    }
    
    // Find and clean up the drop target if it exists (using ID selector)
    if (state.dropTargetElementId) {
      const selector = `.${state.dropTargetElementId}`;
      const dropTarget = document.querySelector(selector) || document.getElementById(state.dropTargetElementId);
      if (dropTarget) {
        clearDropIndicators(dropTarget);
      }
    }
    
    // Clear any lingering drop indicator elements with immediate focus on visual indicators
    document.querySelectorAll('.drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
      // Direct class removal for faster operation
      el.classList.remove(
        'drop-before', 
        'drop-after', 
        'section-drop-before', 
        'section-drop-after',
        'timeline-drop-target',
        'empty-section-target'
      );
    });
    
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
    
    // Explicitly copy state values to ensure they're not lost during async operations
    const dragParams = {
      dragType: state.dragType,
      sourceSection: state.sourceSection,
      sourceIndex: state.sourceIndex,
      sourceGroupId: state.sourceGroupId,
      sourceTimeline: state.sourceTimeline,
      targetSection: state.targetSection,
      targetIndex: state.targetIndex,
      targetGroupId: state.targetGroupId,
      targetTimeline: state.targetTimeline,
      dropPosition: state.dropPosition,
      // Add the stable identifiers to the params as well
      itemId: state.itemId,
      itemName: state.itemName
    };
    
    // Handle drop based on drag type
    if (dragParams.dragType === 'item') {
      handleItemDrop(dragParams);
    } else if (dragParams.dragType === 'group') {
      handleGroupDrop(dragParams);
    } else if (dragParams.dragType === 'section') {
      handleSectionDrop(dragParams);
    }
    
    // Add to history (only if throttling allows)
    if (shouldRecordHistory) {
      addToHistory('DRAG_DROP', {
        ...dragParams,
        oldSections: sectionsBeforeDrop
      }, `Moved ${state.dragType}`);
    }
    
    // Clear drag state immediately
    dragState.set({
      isDragging: false,
      dragType: null,
      sourceSection: null,
      sourceIndex: null,
      sourceGroupId: null,
      sourceTimeline: null,
      draggedElementId: null,
      itemId: null,     // Clear item ID
      itemName: null,   // Clear item name
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
    
    console.log('[DEBUG] Drag state cleared after drop');
    
    // Remove dragging classes
    if (event?.currentTarget) {
      event.currentTarget.classList.remove('dragging');
    }
    
    // Final cleanup pass for any remaining indicators
    setTimeout(() => {
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }, 10);
  } catch (error) {
    console.error('Error handling drop:', error);
    
    // Try to recover state using the backup if anything went wrong
    if (sectionsBeforeAllDrops) {
      try {
        console.warn('Trying to recover state from backup after drop error');
        sections.set(sectionsBeforeAllDrops);
      } catch (recoveryError) {
        console.error('Failed to recover state:', recoveryError);
      }
    }
    
    handleDragEnd(event);
  }
}

function handleItemDrop(state) {
  try {
    console.log('[DEBUG] handleItemDrop called with state:', state);
    
    // Validate state before proceeding
    if (state.sourceSection === null || (state.sourceIndex === null && !state.itemId && !state.itemName)) {
      console.error('Invalid source in drag state:', state);
      return;
    }
    
    // Get the current sections
    const allSections = get(sections);
    
    // Additional validation to prevent errors, carefully checking for invalid indexes including 0
    const validSource = state.sourceSection !== null && state.sourceSection !== undefined && allSections[state.sourceSection];
    const validTarget = state.targetSection !== null && state.targetSection !== undefined && allSections[state.targetSection];
    
    if (!validSource || !validTarget) {
      console.error('Invalid section indexes:', { 
        sourceSection: state.sourceSection, 
        targetSection: state.targetSection,
        validSource,
        validTarget,
        sectionCount: allSections.length
      });
      return;
    }
    
    // Get the source and target sections
    const sourceSection = allSections[state.sourceSection];
    
    // Find the item by ID if available (more reliable than index)
    let sourceItemIndex = state.sourceIndex;
    let actualItemId = state.itemId;
    let itemToMove = null;
    
    // First, search by ID (most reliable)
    if (state.itemId) {
      // Try to find the item by its ID first (most stable)
      const itemByIdIndex = sourceSection.items.findIndex(item => item.id === state.itemId);
      if (itemByIdIndex !== -1) {
        sourceItemIndex = itemByIdIndex;
        itemToMove = sourceSection.items[itemByIdIndex];
        console.log(`[DEBUG] Found item by ID ${state.itemId} at index ${sourceItemIndex} (was ${state.sourceIndex})`);
      }
    }
    
    // If we can't find by ID, try by name
    if (!itemToMove && state.itemName) {
      const itemByNameIndex = sourceSection.items.findIndex(item => item.name === state.itemName);
      if (itemByNameIndex !== -1) {
        sourceItemIndex = itemByNameIndex;
        itemToMove = sourceSection.items[itemByNameIndex];
        console.log(`[DEBUG] Found item by name "${state.itemName}" at index ${sourceItemIndex}`);
      }
    }
    
    // Last resort - use the provided index
    if (!itemToMove && sourceSection.items[sourceItemIndex]) {
      itemToMove = sourceSection.items[sourceItemIndex];
      console.log(`[DEBUG] Using original source index ${sourceItemIndex} for item "${itemToMove.name}"`);
    }
    
    // Final validation for the item
    if (!itemToMove) {
      console.error('Could not find item to move:', { 
        sourceItemIndex, 
        itemId: state.itemId, 
        itemName: state.itemName,
        itemsInSection: sourceSection.items.map(i => ({ id: i.id, name: i.name }))
      });
      return;
    }
    
    const targetSection = allSections[state.targetSection];
    
    // Get the actual item ID from the found item
    actualItemId = itemToMove.id || state.itemId;
    
    // Clone the item to be moved with a deep copy of important properties
    const movedItem = { 
      ...itemToMove,
      // Ensure any arrays are fresh copies
      groupTimelines: itemToMove.groupTimelines 
                     ? [...itemToMove.groupTimelines]
                     : null
    };
    
    // Check for ID mismatch between the drag state itemId and the item we found
    if (state.itemId && movedItem.id !== state.itemId) {
      console.warn('[WARN] ID mismatch between drag state and found item:', {
        dragStateId: state.itemId,
        dragStateName: state.itemName,
        foundItemId: movedItem.id,
        foundItemName: movedItem.name
      });
      
      // Try one more time to find the exact item by ID
      const exactMatch = sourceSection.items.find(item => item.id === state.itemId);
      if (exactMatch) {
        console.log('[DEBUG] Found exact match by ID, using it instead');
        // Replace with exact match
        movedItem = {
          ...exactMatch,
          groupTimelines: exactMatch.groupTimelines ? [...exactMatch.groupTimelines] : null
        };
        sourceItemIndex = sourceSection.items.indexOf(exactMatch);
      }
    }
    
    // Log actual item being moved to verify we're moving the right one
    console.log('[DEBUG] Moving item:', {
      id: movedItem.id,
      itemId: actualItemId,
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
    
    // Handle dropping into a timeline
    if (state.targetTimeline) {
      console.log('[DEBUG] Dropping into timeline:', {
        targetTimeline: state.targetTimeline,
        targetGroupId: state.targetGroupId
      });
      
      // Get the first item in the target group to retrieve groupTimelines
      const groupItems = targetSection.items.filter(item => 
        item.parallel_group_id === state.targetGroupId
      );
      
      // Extract groupTimelines from the first item in the target group
      const groupTimelines = groupItems.length > 0 ? 
        groupItems[0].groupTimelines || [] : 
        [state.targetTimeline]; // Fallback to just the target timeline
      
      console.log('[DEBUG] Group timelines:', groupTimelines);
      
      // Dropping into a timeline
      movedItem.parallel_group_id = state.targetGroupId;
      movedItem.parallel_timeline = state.targetTimeline;
      movedItem.groupTimelines = [...groupTimelines]; // Ensure groupTimelines is preserved
      
      console.log('[DEBUG] Moving item with timeline data:', {
        id: movedItem.id,
        name: movedItem.name,
        parallel_timeline: movedItem.parallel_timeline,
        parallel_group_id: movedItem.parallel_group_id,
        groupTimelines: movedItem.groupTimelines
      });
      
      // Perform update with error handling
      try {
        // First, save a snapshot of the current state in case we need to recover
        const sectionsBeforeUpdate = get(sections);
        let lastError = null;
        
        // Find the target section's items of the same timeline
        sections.update(secs => {
          // Declare newSecs at the top level to avoid initialization issues
          let newSecs = null;
          
          try {
            // Create a copy of the sections
            newSecs = [...secs];
            
            // Validate indices again to be sure, handling section index 0 correctly
            const validSource = state.sourceSection !== null && state.sourceSection !== undefined && secs[state.sourceSection];
            const validTarget = state.targetSection !== null && state.targetSection !== undefined && secs[state.targetSection];
            
            if (!validSource || !validTarget) {
              console.error('Section indices invalid during update:', {
                sourceSection: state.sourceSection,
                targetSection: state.targetSection,
                sectionCount: secs.length
              });
              return secs; // Return unchanged
            }
          
            // Get correct source item index using multiple approaches
            let sourceItemIndex = state.sourceIndex;
            let itemToMove = null;
            
            // First try by ID
            if (state.itemId) {
              const idMatch = findItemIndexById(secs, state.sourceSection, state.itemId);
              if (idMatch !== -1) {
                sourceItemIndex = idMatch;
                itemToMove = secs[state.sourceSection].items[idMatch];
                console.log(`[DEBUG] Found item by ID in update: ${state.itemId} at index ${sourceItemIndex}`);
              }
            }
          
            // Then try by name if we didn't find by ID
            if (!itemToMove && state.itemName) {
              const sourceItems = secs[state.sourceSection].items || [];
              const nameMatch = sourceItems.findIndex(item => item.name === state.itemName);
              if (nameMatch !== -1) {
                sourceItemIndex = nameMatch;
                itemToMove = sourceItems[nameMatch];
                console.log(`[DEBUG] Found item by name instead: "${state.itemName}" at index ${sourceItemIndex}`);
              }
            }
            
            // If we still couldn't find it, use the index as a last resort
            if (!itemToMove && secs[state.sourceSection].items[sourceItemIndex]) {
              itemToMove = secs[state.sourceSection].items[sourceItemIndex];
              console.log(`[DEBUG] Using original source index ${sourceItemIndex} for item "${itemToMove.name}"`);
            }
            
            // If we still couldn't find it, log and return without change
            if (!itemToMove) {
              console.error('Could not find item to move during sections update:', {
                sourceItemIndex, 
                itemId: state.itemId, 
                itemName: state.itemName,
                sourceSection: state.sourceSection,
                itemsInSection: secs[state.sourceSection].items.map(i => ({ id: i.id, name: i.name }))
              });
              return secs; // Return without change
            }
            
            // Special handling for within the same section
            if (state.sourceSection === state.targetSection) {
              // We're moving within the same section
              const sectionItems = [...newSecs[state.sourceSection].items];
              
              // Before removal, make a backup copy of the item for verification
              const itemToRemove = sourceItemIndex < sectionItems.length ? {...sectionItems[sourceItemIndex]} : null;
              
              // Remove the item from its original position using the corrected sourceItemIndex
            if (sourceItemIndex < sectionItems.length) {
              // Log important info before removal
              console.log('[DEBUG] Removing item at index', sourceItemIndex, 'with ID', 
                sectionItems[sourceItemIndex].id, 'name:', sectionItems[sourceItemIndex].name);
                
              sectionItems.splice(sourceItemIndex, 1);
              
              // Verify removal
              if (sectionItems.some(item => item.id === itemToRemove.id)) {
                console.warn('[WARN] Item still exists after removal - may have been duplicated. ID:', itemToRemove.id);
              }
            } else {
              console.error('Item index out of bounds in splice operation:', sourceItemIndex, 'length:', sectionItems.length);
            }
            
            // Find items in the same timeline and group
            const sameTimelineItems = sectionItems.filter(item => 
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
              } else {
                // Fallback if we can't find the index
                sectionItems.push(movedItem);
              }
            } else {
              // No items in this timeline, add to end
              sectionItems.push(movedItem);
            }
            
            // Update the section
            newSecs[state.sourceSection] = {
              ...newSecs[state.sourceSection],
              items: sectionItems
            };
          } else {
            // We're moving between different sections
            
            // Create new section arrays
            const sourceItems = [...newSecs[state.sourceSection].items];
            const targetItems = [...newSecs[state.targetSection].items];
            
            // Before removal, make a backup copy of the item for verification
            const itemToRemove = sourceItemIndex < sourceItems.length ? {...sourceItems[sourceItemIndex]} : null;
            
            // Remove from source using corrected sourceItemIndex
            if (sourceItemIndex < sourceItems.length) {
              // Log important info before removal
              console.log('[DEBUG] Removing item at index', sourceItemIndex, 'with ID', 
                sourceItems[sourceItemIndex].id, 'name:', sourceItems[sourceItemIndex].name);
                
              sourceItems.splice(sourceItemIndex, 1);
              
              // Verify removal
              if (sourceItems.some(item => item.id === itemToRemove.id)) {
                console.warn('[WARN] Item still exists after removal - may have been duplicated. ID:', itemToRemove.id);
              }
            } else {
              console.error('Item index out of bounds in cross-section splice operation:', sourceItemIndex, 'length:', sourceItems.length);
            }
            
            // Find items in the same timeline and group
            const sameTimelineItems = targetItems.filter(item => 
              item.parallel_group_id === state.targetGroupId && 
              item.parallel_timeline === state.targetTimeline
            );
            
            if (sameTimelineItems.length > 0) {
              // Find the last item of this timeline
              const lastItem = sameTimelineItems[sameTimelineItems.length - 1];
              const lastItemIndex = targetItems.indexOf(lastItem);
              
              if (lastItemIndex !== -1) {
                // Insert after the last item of this timeline
                targetItems.splice(lastItemIndex + 1, 0, movedItem);
              } else {
                // Fallback if we can't find the index
                targetItems.push(movedItem);
              }
            } else {
              // No items in this timeline, add to end
              targetItems.push(movedItem);
            }
            
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
          
          } catch (e) {
            lastError = e;
            console.error('Error during section update operation:', e);
            return secs; // Return unchanged on error
          }
          // Make sure to return the newSecs variable that's defined in the try block
          // This is to prevent "ReferenceError: newSecs is not defined"
          return newSecs || secs;
        });
        
        // Check if there was an error and restore state if needed
        if (lastError) {
          console.warn('[WARN] Restoring previous state due to error');
          sections.set(sectionsBeforeUpdate);
        }
      } catch (updateError) {
        console.error('Error updating sections in timeline drop:', updateError);
      }
    } else {
      // Regular drop (before or after)
      let targetIndex;
      
      // Calculate the target index
      if (state.dropPosition === 'before') {
        targetIndex = state.targetIndex;
      } else { // after
        targetIndex = state.targetIndex + 1;
      }
      
      // If source section is same as target and source index is before target,
      // adjust the target index
      if (state.sourceSection === state.targetSection && 
          state.sourceIndex < targetIndex) {
        targetIndex--;
      }
      
      // Reset group properties when moving outside a group
      movedItem.parallel_group_id = null;
      movedItem.parallel_timeline = null;
      movedItem.groupTimelines = null;
      
      // Update the sections store with error handling
      try {
        // First, save a snapshot of the current state in case we need to recover
        const sectionsBeforeUpdate = get(sections);
        let lastError = null;
        
        sections.update(secs => {
          // Define newSecs at the top level to avoid reference errors
          let newSecs = null; 
          
          try {
            // Create a copy of the sections array
            newSecs = [...secs];
            
            // Validate indices again to be sure, handling section index 0 correctly
            const validSource = state.sourceSection !== null && state.sourceSection !== undefined && secs[state.sourceSection];
            const validTarget = state.targetSection !== null && state.targetSection !== undefined && secs[state.targetSection];
            
            if (!validSource || !validTarget) {
              console.error('Section indices invalid during regular drop:', {
                sourceSection: state.sourceSection,
                targetSection: state.targetSection,
                sectionCount: secs.length
              });
              return secs; // Return unchanged
            }
            
            // Special handling for within the same section
            if (state.sourceSection === state.targetSection) {
              // We're moving within the same section
              const sectionItems = [...newSecs[state.sourceSection].items];
              
              // Before removal, make a backup copy of the item for verification
              const itemToRemove = sourceItemIndex < sectionItems.length ? {...sectionItems[sourceItemIndex]} : null;
              
              // Remove the item from its original position
              if (sourceItemIndex < sectionItems.length) {
                // Log important info before removal
                console.log('[DEBUG] Regular drop - Removing item at index', sourceItemIndex, 'with ID', 
                  sectionItems[sourceItemIndex].id, 'name:', sectionItems[sourceItemIndex].name);
                  
                sectionItems.splice(sourceItemIndex, 1);
                
                // Verify removal
                if (sectionItems.some(item => item.id === itemToRemove.id)) {
                  console.warn('[WARN] Item still exists after regular drop removal - may have been duplicated. ID:', itemToRemove.id);
                }
              } else {
                console.error('Item index out of bounds in regular drop splice operation:', sourceItemIndex, 'length:', sectionItems.length);
              }
              
              // Add the item to the target position
              console.log('[DEBUG] Adding item to position', targetIndex, 'name:', movedItem.name, 'id:', movedItem.id);
              sectionItems.splice(
                Math.min(targetIndex, sectionItems.length), 
                0, 
                movedItem
              );
              
              // Update the section
              newSecs[state.sourceSection] = {
                ...newSecs[state.sourceSection],
                items: sectionItems
              };
            } else {
              // We're moving between different sections
              
              // Create new section arrays
              const sourceItems = [...newSecs[state.sourceSection].items];
              const targetItems = [...newSecs[state.targetSection].items];
              
              // Before removal, make a backup copy of the item for verification
              const itemToRemove = sourceItemIndex < sourceItems.length ? {...sourceItems[sourceItemIndex]} : null;
              
              // Remove from source
              if (sourceItemIndex < sourceItems.length) {
                // Log important info before removal
                console.log('[DEBUG] Cross-section drop - Removing item at index', sourceItemIndex, 'with ID', 
                  sourceItems[sourceItemIndex].id, 'name:', sourceItems[sourceItemIndex].name);
                  
                sourceItems.splice(sourceItemIndex, 1);
                
                // Verify removal
                if (sourceItems.some(item => item.id === itemToRemove.id)) {
                  console.warn('[WARN] Item still exists after cross-section removal - may have been duplicated. ID:', itemToRemove.id);
                }
              } else {
                console.error('Item index out of bounds in cross-section splice operation:', sourceItemIndex, 'length:', sourceItems.length);
              }
              
              // Add to target
              console.log('[DEBUG] Adding item to target section at position', targetIndex, 'name:', movedItem.name, 'id:', movedItem.id);
              targetItems.splice(
                Math.min(targetIndex, targetItems.length), 
                0, 
                movedItem
              );
              
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
            
            // Return the updated sections
            return newSecs;
            
          } catch (e) {
            lastError = e;
            console.error('Error during regular drop update operation:', e);
            return secs; // Return unchanged on error
          }
        });
        
        // Check if there was an error and restore state if needed
        if (lastError) {
          console.warn('[WARN] Restoring previous state due to error in regular drop');
          sections.set(sectionsBeforeUpdate);
        }
      } catch (updateError) {
        console.error('Error updating sections in regular drop:', updateError);
      }
    }
    
    // Force clear any potentially stuck drag indicators with a multi-pass cleanup
    // First immediate cleanup
    document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
      el.classList.remove(
        'dragging',
        'drop-before', 
        'drop-after', 
        'section-drop-before', 
        'section-drop-after',
        'timeline-drop-target',
        'empty-section-target'
      );
    });
    
    // Followed by a delayed cleanup (sometimes the first one misses elements that are being rendered)
    setTimeout(() => {
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }, 50);
    
    // Final cleanup pass after state updates have settled
    setTimeout(() => {
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }, 200);
    
  } catch (error) {
    console.error('Error handling item drop:', error);
  }
}

function handleGroupDrop(state) {
  try {
    // Validate state before proceeding
    if (state.sourceSection === null || state.sourceGroupId === null) {
      console.error('Invalid source in group drag state:', state);
      return;
    }
    
    // Get the current sections
    const allSections = get(sections);
    
    // Additional validation to prevent errors
    if (!allSections[state.sourceSection] || !allSections[state.targetSection]) {
      console.error('Invalid section indexes for group drop:', state);
      return;
    }
    
    // Get the source section
    const sourceSection = allSections[state.sourceSection];
    
    // Find all items in the group
    const groupItems = sourceSection.items.filter(
      item => item.parallel_group_id === state.sourceGroupId
    );
    
    if (groupItems.length === 0) {
      console.error('No group items found for group ID:', state.sourceGroupId);
      return;
    }
    
    // Get indexes of all group items
    const groupItemIndexes = groupItems.map(
      item => sourceSection.items.indexOf(item)
    ).sort((a, b) => b - a); // Sort in reverse order for removal
    
    // Calculate the target index
    let targetIndex;
    
    // Handle different drop positions
    if (state.dropPosition === 'before') {
      targetIndex = state.targetIndex;
    } else { // after
      targetIndex = state.targetIndex + 1;
    }
    
    // Update the sections store with error handling
    try {
      sections.update(secs => {
        // Validate indices again
        if (!secs[state.sourceSection] || !secs[state.targetSection]) {
          console.error('Section indices invalid during group update');
          return secs; // Return unchanged
        }
        
        // Create a new clean array of sections
        const newSecs = [...secs];
        
        // Clone the group items to avoid reference issues
        const groupItemsClone = groupItems.map(item => ({...item}));
        
        // Special handling for within the same section
        if (state.sourceSection === state.targetSection) {
          // We're moving within the same section
          // Get all items
          const allSectionItems = [...newSecs[state.sourceSection].items];
          
          // Create a new array without the group items
          const itemsWithoutGroup = allSectionItems.filter(
            item => item.parallel_group_id !== state.sourceGroupId
          );
          
          // Make sure target index is within bounds
          const boundedTargetIndex = Math.min(
            targetIndex, 
            itemsWithoutGroup.length
          );
          
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
          // We're moving between different sections
          // Get both section's items
          const sourceItems = [...newSecs[state.sourceSection].items];
          const targetItems = [...newSecs[state.targetSection].items];
          
          // Filter out the group items from source
          const sourceItemsWithoutGroup = sourceItems.filter(
            item => item.parallel_group_id !== state.sourceGroupId
          );
          
          // Calculate target index in bounds
          const boundedTargetIndex = Math.min(
            targetIndex, 
            targetItems.length
          );
          
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
      });
    } catch (updateError) {
      console.error('Error updating sections in group drop:', updateError);
    }
    
    // Force clear any potentially stuck drag indicators
    setTimeout(() => {
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }, 50);
  } catch (error) {
    console.error('Error handling group drop:', error);
  }
}

function handleSectionDrop(state) {
  try {
    // Validate state before proceeding
    if (state.sourceSection === null || state.targetSection === null) {
      console.error('Invalid source or target in section drag state:', state);
      return;
    }
    
    // Update the sections store with error handling
    try {
      sections.update(secs => {
        // Additional validation
        if (state.sourceSection < 0 || state.sourceSection >= secs.length ||
            state.targetSection < 0 || state.targetSection >= secs.length) {
          console.error('Section indices out of bounds:', state);
          return secs; // Return unchanged
        }
        
        // Create a defensive copy of the sections array
        const newSecs = [...secs];
        
        // Get the section to move (without modifying original yet)
        const movedSection = {...newSecs[state.sourceSection]};
        
        // Create a new array without the source section
        const secsWithoutSource = newSecs.filter((_, i) => i !== state.sourceSection);
        
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
        targetIndex = Math.max(0, Math.min(targetIndex, secsWithoutSource.length));
        
        // Create the final array with the section inserted at the target position
        const result = [
          ...secsWithoutSource.slice(0, targetIndex),
          movedSection,
          ...secsWithoutSource.slice(targetIndex)
        ];
        
        return result;
      });
    } catch (updateError) {
      console.error('Error updating sections in section drop:', updateError);
    }
    
    // Force clear any potentially stuck drag indicators
    setTimeout(() => {
      document.querySelectorAll('.dragging, .drop-before, .drop-after, .section-drop-before, .section-drop-after, .timeline-drop-target, .empty-section-target').forEach(el => {
        el.classList.remove(
          'dragging',
          'drop-before', 
          'drop-after', 
          'section-drop-before', 
          'section-drop-after',
          'timeline-drop-target',
          'empty-section-target'
        );
      });
    }, 50);
  } catch (error) {
    console.error('Error handling section drop:', error);
  }
}

// --- VISUAL INDICATOR HELPERS ---

function updateDropIndicators(element, position, isSection = false) {
  try {
    if (!element) return;
    
    // Clear any existing indicators
    clearDropIndicators(element);
    
    // Add appropriate indicator classes based on position
    if (position === 'before') {
      element.classList.add(isSection ? 'section-drop-before' : 'drop-before');
    } else if (position === 'after') {
      element.classList.add(isSection ? 'section-drop-after' : 'drop-after');
    }
  } catch (error) {
    console.error('Error updating drop indicators:', error);
  }
}

function clearDropIndicators(element) {
  try {
    if (!element) return;
    
    element.classList.remove(
      'drop-before', 
      'drop-after', 
      'section-drop-before', 
      'section-drop-after',
      'timeline-drop-target',
      'empty-section-target'
    );
  } catch (error) {
    console.error('Error clearing drop indicators:', error);
  }
} 