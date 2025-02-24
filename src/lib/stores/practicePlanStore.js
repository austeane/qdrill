import { writable, derived, get } from 'svelte/store';
import { FILTER_STATES } from '$lib/constants';
import { toast } from '@zerodevx/svelte-toast';

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
          normalized.push({
            id: groupItem.id,
            type: groupItem.type,
            name: groupItem.type === 'break' && !groupItem.name ? 'Break' : (groupItem.drill?.name || groupItem.name || ''),
            duration: parseInt(groupItem.selected_duration || groupItem.duration, 10),
            drill_id: groupItem.drill?.id || groupItem.id,
            diagram_data: groupItem.diagram_data || null,
            parallel_group_id: groupItem.parallel_group_id,
            parallel_timeline: groupItem.parallel_timeline || null,
            groupTimelines: groupItem.groupTimelines
          });
        });
      }
    } else {
      // Non-parallel items remain unchanged
      normalized.push({
        id: item.drill?.id || item.id,
        type: item.type,
        name: item.type === 'break' && !item.name ? 'Break' : (item.drill?.name || item.name || ''),
        duration: parseInt(item.selected_duration || item.duration, 10),
        drill_id: item.type === 'drill' ? (item.drill?.id || item.id) : null,
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

// Add error handling wrapper
async function withErrorHandling(operation) {
    try {
        return await operation();
    } catch (error) {
        console.error('Database operation failed:', error);
        if (error.code === '57P01') {
            // If connection was terminated, retry once
            try {
                return await operation();
            } catch (retryError) {
                console.error('Retry failed:', retryError);
                throw retryError;
            }
        }
        throw error;
    }
}

// Modify existing functions to use error handling
export async function fetchPracticePlans() {
    return await withErrorHandling(async () => {
        const response = await fetch('/api/practice-plans');
        if (!response.ok) {
            throw new Error('Failed to fetch practice plans');
        }
        return await response.json();
    });
}