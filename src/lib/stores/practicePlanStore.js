import { writable, derived, get } from 'svelte/store';
import { FILTER_STATES } from '$lib/constants';
import { toast } from '@zerodevx/svelte-toast';
import { sections } from './sectionsStore';

// Filter-related stores (existing)
export const selectedPhaseOfSeason = writable({});
export const selectedPracticeGoals = writable({});
export const selectedEstimatedParticipantsMin = writable(null);
export const selectedEstimatedParticipantsMax = writable(null);
export const selectedVisibility = writable('public');
export const selectedEditability = writable(false);

// Form-related stores (new)
export const planName = writable('');
export const planDescription = writable('');
export const phaseOfSeason = writable('');
export const estimatedNumberOfParticipants = writable('');
export const practiceGoals = writable(['']);
export const visibility = writable('public');
export const isEditableByOthers = writable(false);
export const startTime = writable('09:00'); // Default to 9 AM
export const isSubmitting = writable(false);
export const errors = writable({});
export const formInitialized = writable(false);
export const initialLoadComplete = writable(false);

// Constants
export const phaseOfSeasonOptions = [
  'Offseason',
  'Early season, new players',
  'Mid season, skill building',
  'Tournament tuneup',
  'End of season, peaking'
];

// Time and duration utilities
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes);
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
}

// Create a derived store for total duration
export const totalPlanDuration = derived(sections, ($sections) => {
  let total = 0;
  
  for (const section of $sections) {
    for (const item of section.items) {
      // For parallel groups, only count the maximum duration per group
      if (item.parallel_group_id) {
        // Get all items in this group
        const groupItems = section.items.filter(i => i.parallel_group_id === item.parallel_group_id);
        // Group items by timeline
        const timelineDurations = {};
        groupItems.forEach(groupItem => {
          const timeline = groupItem.parallel_timeline;
          if (!timeline) return;
          
          if (!timelineDurations[timeline]) {
            timelineDurations[timeline] = 0;
          }
          
          timelineDurations[timeline] += parseInt(groupItem.selected_duration) || 0;
        });
        
        // Find the max duration across timelines
        const maxDuration = Math.max(...Object.values(timelineDurations), 0);
        
        // Only add to total once per group
        if (item === groupItems[0]) {
          total += maxDuration;
        }
      } else {
        // For regular items, add the duration
        total += parseInt(item.selected_duration) || 0;
      }
    }
  }
  
  return total;
});

// Form validation
export function validateForm() {
  const formErrors = {};
  
  if (!get(planName)) {
    formErrors.planName = 'Plan name is required';
  }

  if (get(phaseOfSeason) && !phaseOfSeasonOptions.includes(get(phaseOfSeason))) {
    formErrors.phaseOfSeason = 'Invalid phase of season selected';
  }

  if (get(estimatedNumberOfParticipants) !== '') {
    const numParticipants = parseInt(get(estimatedNumberOfParticipants), 10);
    if (isNaN(numParticipants) || numParticipants <= 0 || !Number.isInteger(parseFloat(get(estimatedNumberOfParticipants)))) {
      formErrors.estimatedNumberOfParticipants = 'Estimated number of participants must be a positive integer';
    }
  }

  errors.set(formErrors);
  return Object.keys(formErrors).length === 0;
}

// Form submission
export async function submitPracticePlan(sectionsData, practicePlan) {
  try {
    isSubmitting.set(true);
    errors.set({});

    // Validate form
    if (!validateForm()) {
      return false;
    }

    // Check if plan has any items
    const totalItems = sectionsData.reduce((total, section) => 
      total + (section.items?.length || 0), 0);
    if (totalItems === 0) {
      errors.update(e => ({ ...e, selectedItems: 'At least one drill or break is required' }));
      return false;
    }

    const planData = {
      name: get(planName),
      description: get(planDescription),
      phase_of_season: get(phaseOfSeason) || null,
      estimated_number_of_participants: get(estimatedNumberOfParticipants) ? parseInt(get(estimatedNumberOfParticipants)) : null,
      practice_goals: get(practiceGoals).filter(goal => goal.trim() !== ''),
      visibility: get(visibility),
      is_editable_by_others: get(isEditableByOthers),
      start_time: get(startTime) + ':00',
      sections: sectionsData.map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        goals: section.goals || [],
        notes: section.notes || '',
        items: normalizeItems(section.items)
      }))
    };

    const url = practicePlan ? `/api/practice-plans/${practicePlan.id}` : '/api/practice-plans';
    const method = practicePlan ? 'PUT' : 'POST';

    console.log('[PracticePlanForm] Sending request:', { url, method });

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      let errorData;
      const errorText = await response.text();
      console.log('[PracticePlanForm] Error response text', errorText);

      try {
        errorData = JSON.parse(errorText);
        console.log('[PracticePlanForm] Parsed error data', errorData);
      } catch (e) {
        console.log('[PracticePlanForm] Failed to parse error response', String(e));
        errorData = { error: String(errorText) };
      }
      
      const errorMessage = errorData.errors 
        ? Object.values(errorData.errors).join(', ')
        : errorData.error || 'An error occurred while saving the practice plan';
      
      errors.set({ general: errorMessage });
      toast.push('Failed to save practice plan: ' + errorMessage, { 
        theme: { '--toastBackground': 'red' } 
      });
      return false;
    }

    const data = await response.json();
    toast.push(`Practice plan ${practicePlan ? 'updated' : 'created'} successfully`);

    // Clean up pending plan data after successful save
    try {
        console.log('[PracticePlanStore] Deleting pending plan data after successful save...');
        const deleteResponse = await fetch('/api/pending-plans', {
            method: 'DELETE'
        });
        if (!deleteResponse.ok) {
            // Log error but don't fail the overall success flow
            const errorData = await deleteResponse.text(); // Might not be JSON
            console.error('[PracticePlanStore] Failed to delete pending plan data:', deleteResponse.status, errorData);
            toast.push('Note: Could not clear draft data automatically.', { theme: { '--toastBackground': 'orange' } });
        } else {
            console.log('[PracticePlanStore] Pending plan data deleted successfully.');
        }
    } catch (cleanupError) {
        console.error('[PracticePlanStore] Error during pending plan cleanup:', cleanupError);
        toast.push('Note: Error during draft cleanup.', { theme: { '--toastBackground': 'orange' } });
    }

    return data.id;
  } catch (error) {
    console.log('[PracticePlanForm] Error', String(error));
    console.log('[PracticePlanForm] Error stack', String(error.stack || ''));
    errors.set({ general: 'An unexpected error occurred' });
    toast.push('An unexpected error occurred', { theme: { '--toastBackground': 'red' } });
    return false;
  } finally {
    isSubmitting.set(false);
  }
}

// Practice goals management
export function addPracticeGoal() {
  practiceGoals.update(goals => [...goals, '']);
}

export function removePracticeGoal(index) {
  practiceGoals.update(goals => goals.filter((_, i) => i !== index));
}

export function updatePracticeGoal(index, value) {
  practiceGoals.update(goals => goals.map((goal, i) => (i === index ? value : goal)));
}

// Initialize form with practice plan data
export function initializeForm(practicePlan) {
  if (!practicePlan || get(formInitialized)) return;

  console.log('[DEBUG] Initializing form with practice plan data', practicePlan);
  
  planName.set(practicePlan.name || '');
  planDescription.set(practicePlan.description || '');
  phaseOfSeason.set(practicePlan.phase_of_season || '');
  estimatedNumberOfParticipants.set(practicePlan.estimated_number_of_participants?.toString() || '');
  practiceGoals.set(practicePlan.practice_goals || ['']);
  visibility.set(practicePlan.visibility || 'public');
  isEditableByOthers.set(practicePlan.is_editable_by_others || false);
  startTime.set(practicePlan.start_time?.slice(0, 5) || '09:00');
  
  formInitialized.set(true);
}

// Helper function from original component
function normalizeItems(items) {
  const normalized = [];
  const processedGroups = new Set();

  items.forEach(item => {
    if (item.parallel_group_id) {
      if (!processedGroups.has(item.parallel_group_id)) {
        processedGroups.add(item.parallel_group_id);

        // Get all items in the same group
        const groupItems = items.filter(i => i.parallel_group_id === item.parallel_group_id);

        // Add each item with its own duration
        groupItems.forEach(groupItem => {
          // Ensure ID is numeric for database (either from drill.id or item.id)
          const itemId = groupItem.drill?.id || groupItem.id;
          // Convert string IDs to numbers if needed
          const numericId = typeof itemId === 'string' && !isNaN(parseInt(itemId)) ? parseInt(itemId) : itemId;
          
          // Fix drill_id logic for different types of items
          let drillId = null;
          if (groupItem.type === 'one-off' || (typeof groupItem.id === 'number' && groupItem.id < 0)) {
            drillId = null;
          } else if (groupItem.type === 'drill') {
            drillId = groupItem.drill_id || (groupItem.drill?.id || null);
          }
          
          // Determine the name to use
          let itemName = '';
          if (groupItem.type === 'break') {
            itemName = groupItem.name || 'Break';
          } else if (groupItem.type === 'one-off') {
            itemName = groupItem.name || 'Quick Activity';
          } else {
            itemName = groupItem.name || (groupItem.drill?.name || '');
          }
          
          normalized.push({
            id: numericId,
            // Map 'one-off' type to 'drill' to conform to database constraints
            type: groupItem.type === 'one-off' ? 'drill' : groupItem.type,
            name: itemName,
            duration: parseInt(groupItem.selected_duration || groupItem.duration, 10),
            // Use the fixed drill_id logic
            drill_id: drillId,
            diagram_data: groupItem.diagram_data || null,
            parallel_group_id: groupItem.parallel_group_id,
            parallel_timeline: groupItem.parallel_timeline || null,
            groupTimelines: groupItem.groupTimelines
          });
        });
      }
    } else {
      // Non-parallel items remain unchanged
      // Ensure ID is numeric for database (either from drill.id or item.id)
      const itemId = item.drill?.id || item.id;
      // Convert string IDs to numbers if needed
      const numericId = typeof itemId === 'string' && !isNaN(parseInt(itemId)) ? parseInt(itemId) : itemId;
      
      // Fix drill_id logic for different types of items
      let drillId = null;
      if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
        drillId = null;
      } else if (item.type === 'drill') {
        drillId = item.drill_id || (item.drill?.id || null);
      }
      
      // Determine the name to use
      let itemName = '';
      if (item.type === 'break') {
        itemName = item.name || 'Break';
      } else if (item.type === 'one-off') {
        itemName = item.name || 'Quick Activity';
      } else {
        itemName = item.name || (item.drill?.name || '');
      }
      
      normalized.push({
        id: numericId,
        // Map 'one-off' type to 'drill' to conform to database constraints
        type: item.type === 'one-off' ? 'drill' : item.type,
        name: itemName,
        duration: parseInt(item.selected_duration || item.duration, 10),
        // Use the fixed drill_id logic
        drill_id: drillId,
        diagram_data: item.diagram_data || null,
        parallel_group_id: null,
        parallel_timeline: null
      });
    }
  });
  return normalized;
}

// === Existing functions from original practicePlanStore.js ===

export function updateFilterState(store, value, newState) {
    store.update(current => {
        const updated = { ...current };
        if (newState === FILTER_STATES.NEUTRAL) {
            delete updated[value];
        } else {
            updated[value] = newState;
        }
        return updated;
    });
}

export function handleDrillMove(sourceIndex, targetIndex, items, isGrouping) {
    if (isGrouping) {
        // Handle grouping (when dragged on top)
        return mergeIntoParallelGroup(sourceIndex, targetIndex, items);
    } else {
        // Handle reordering (when dragged between)
        const newItems = [...items];
        const [removed] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        return newItems;
    }
}

export function mergeIntoParallelGroup(sourceIndex, targetIndex, items) {
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];
    
    if (!sourceItem || !targetItem || sourceIndex === targetIndex) return items;
    
    if (sourceItem.parallel_group_id && sourceItem.parallel_group_id === targetItem.parallel_group_id) {
        return items;
    }
    
    const newItems = [...items];
    
    if (targetItem.parallel_group_id) {
        // Add to existing group
        const groupId = targetItem.parallel_group_id;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
    } else {
        // Create new group
        const groupId = `group_${Date.now()}`;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
        newItems[targetIndex] = {
            ...targetItem,
            parallel_group_id: groupId
        };
    }
    
    // Update durations for all items in the group
    const groupDuration = Math.max(
        sourceItem.selected_duration || sourceItem.duration,
        targetItem.selected_duration || targetItem.duration
    );
    
    return newItems.map(item => {
        if (item.parallel_group_id === newItems[sourceIndex].parallel_group_id) {
            return {
                ...item,
                selected_duration: groupDuration,
                duration: groupDuration
            };
        }
        return item;
    });
}

export function removeFromParallelGroup(itemId, items) {
    // First, find the group ID of the item being removed
    const itemToRemove = items.find(item => item.id === itemId);
    const groupId = itemToRemove?.parallel_group_id;
    
    if (!groupId) return items;

    // Count how many items will remain in the group
    const remainingGroupItems = items.filter(
        item => item.parallel_group_id === groupId && item.id !== itemId
    );

    // If only one item would remain in the group, remove the group entirely
    if (remainingGroupItems.length === 1) {
        return items.map(item => {
            if (item.parallel_group_id === groupId) {
                const { parallel_group_id, ...rest } = item;
                return rest;
            }
            return item;
        });
    }

    // Otherwise, just remove the one item from the group
    return items.map(item => {
        if (item.id === itemId) {
            const { parallel_group_id, ...rest } = item;
            return rest;
        }
        return item;
    });
}