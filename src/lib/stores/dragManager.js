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

// --- DRAG START HANDLERS ---

export function startItemDrag(event, sectionIndex, itemIndex, item) {
  try {
    // Stop event propagation to prevent parent elements from also handling the drag
    event.stopPropagation();
    
    event.dataTransfer.effectAllowed = 'move';
    
    // Generate a unique ID for this element
    const draggedElementId = generateElementId('item', sectionIndex, itemIndex);
    
    // Store state without references to DOM elements
    dragState.set({
      isDragging: true,
      dragType: 'item',
      sourceSection: sectionIndex,
      sourceIndex: itemIndex,
      sourceGroupId: item.parallel_group_id,
      sourceTimeline: item.parallel_timeline,
      draggedElementId,
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
  }
}

export function startGroupDrag(event, sectionIndex, groupId) {
  try {
    // Stop event propagation to prevent parent elements from also handling the drag
    event.stopPropagation();
    
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
  }
}

export function startSectionDrag(event, sectionIndex) {
  try {
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
  }
}

// --- DRAG OVER HANDLERS ---

export function handleItemDragOver(event, sectionIndex, itemIndex, item, element) {
  try {
    event.preventDefault();
    // Stop event propagation to prevent parent elements from also handling the drag over
    event.stopPropagation();
    
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
    
    // Get current drag state
    const state = get(dragState);
    
    if (state.dragType !== 'item') {
      return; // Only items can be dropped in timelines
    }
    
    // Generate a unique ID for this element
    const dropTargetElementId = generateElementId('timeline', sectionIndex, null, groupId, timelineName);
    
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
    element.classList.add('timeline-drop-target');
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
const DROP_HISTORY_THROTTLE = 10; // Only store history every 10 drops

export function handleDrop(event) {
  try {
    event.preventDefault();
    // Stop event propagation
    event.stopPropagation();
    
    const state = get(dragState);
    
    // If there's no valid drop target, abort
    if (state.targetSection === null || state.dropPosition === null) {
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
    
    // Handle drop based on drag type
    if (state.dragType === 'item') {
      handleItemDrop(state);
    } else if (state.dragType === 'group') {
      handleGroupDrop(state);
    } else if (state.dragType === 'section') {
      handleSectionDrop(state);
    }
    
    // Add to history (only if throttling allows)
    if (shouldRecordHistory) {
      addToHistory('DRAG_DROP', {
        dragType: state.dragType,
        sourceSection: state.sourceSection,
        sourceIndex: state.sourceIndex,
        sourceGroupId: state.sourceGroupId,
        targetSection: state.targetSection,
        targetIndex: state.targetIndex,
        targetGroupId: state.targetGroupId,
        targetTimeline: state.targetTimeline,
        dropPosition: state.dropPosition,
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
      targetSection: null,
      targetIndex: null,
      targetGroupId: null,
      targetTimeline: null,
      dropPosition: null,
      dropTargetElementId: null
    });
    
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
    handleDragEnd(event);
  }
}

function handleItemDrop(state) {
  try {
    // Get the current sections
    const allSections = get(sections);
    
    // Get the source and target sections
    const sourceSection = allSections[state.sourceSection];
    const targetSection = allSections[state.targetSection];
    
    // Clone the item to be moved
    const movedItem = { ...sourceSection.items[state.sourceIndex] };
    
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
      
      // Find the target section's items of the same timeline
      sections.update(secs => {
        // Remove from source
        secs[state.sourceSection].items.splice(state.sourceIndex, 1);
        
        // Find items in the same timeline and group
        const sameTimelineItems = secs[state.targetSection].items.filter(item => 
          item.parallel_group_id === state.targetGroupId && 
          item.parallel_timeline === state.targetTimeline
        );
        
        if (sameTimelineItems.length > 0) {
          // Find the last item of this timeline
          const lastItem = sameTimelineItems[sameTimelineItems.length - 1];
          const lastItemIndex = secs[state.targetSection].items.indexOf(lastItem);
          
          // Insert after the last item of this timeline
          secs[state.targetSection].items.splice(lastItemIndex + 1, 0, movedItem);
        } else {
          // No items in this timeline, add to end
          secs[state.targetSection].items.push(movedItem);
        }
        
        return secs;
      });
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
      
      // Update the sections store
      sections.update(secs => {
        // Remove from source
        secs[state.sourceSection].items.splice(state.sourceIndex, 1);
        
        // Add to target
        secs[state.targetSection].items.splice(targetIndex, 0, movedItem);
        
        return secs;
      });
    }
  } catch (error) {
    console.error('Error handling item drop:', error);
  }
}

function handleGroupDrop(state) {
  try {
    // Get the current sections
    const allSections = get(sections);
    
    // Get the source section
    const sourceSection = allSections[state.sourceSection];
    
    // Find all items in the group
    const groupItems = sourceSection.items.filter(
      item => item.parallel_group_id === state.sourceGroupId
    );
    
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
    
    // Update the sections store
    sections.update(secs => {
      // Clone the group items to avoid reference issues
      const groupItemsClone = groupItems.map(item => ({...item}));
      
      // Remove items from source section (in reverse order)
      groupItemIndexes.forEach(index => {
        secs[state.sourceSection].items.splice(index, 1);
      });
      
      // Add items to target section
      secs[state.targetSection].items.splice(targetIndex, 0, ...groupItemsClone);
      
      return secs;
    });
  } catch (error) {
    console.error('Error handling group drop:', error);
  }
}

function handleSectionDrop(state) {
  try {
    // Update the sections store to reorder sections
    sections.update(secs => {
      // Get the section to move
      const [movedSection] = secs.splice(state.sourceSection, 1);
      
      // Calculate the target index
      let targetIndex = state.targetSection;
      if (state.dropPosition === 'after') {
        targetIndex++;
      }
      
      // Adjust index if moving from before to after
      if (state.sourceSection < targetIndex) {
        targetIndex--;
      }
      
      // Insert at the target position
      secs.splice(targetIndex, 0, movedSection);
      
      return secs;
    });
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