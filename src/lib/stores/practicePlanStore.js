import { writable } from 'svelte/store';
import { FILTER_STATES } from '$lib/constants';

export const selectedPhaseOfSeason = writable({});
export const selectedPracticeGoals = writable({});
export const selectedEstimatedParticipantsMin = writable(null);
export const selectedEstimatedParticipantsMax = writable(null);
export const selectedVisibility = writable('public');
export const selectedEditability = writable(false);

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