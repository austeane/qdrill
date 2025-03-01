import { writable, get } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';
import { addToHistory } from './historyStore';

// Section counter for generating unique IDs
let sectionCounter = 0;

// Default sections for new practice plans
const DEFAULT_SECTIONS = [
  {
    id: `section-${++sectionCounter}`,
    name: 'Warmup',
    order: 0,
    goals: [],
    notes: '',
    items: []
  },
  {
    id: `section-${++sectionCounter}`,
    name: 'Skill Building',
    order: 1,
    goals: [],
    notes: '',
    items: []
  },
  {
    id: `section-${++sectionCounter}`,
    name: 'Half Court',
    order: 2,
    goals: [],
    notes: '',
    items: []
  }
];

// Timeline constants
export const PARALLEL_TIMELINES = {
  BEATERS: { name: 'Beaters', color: 'bg-gray-500' },
  CHASERS: { name: 'Chasers', color: 'bg-green-500' },
  SEEKERS: { name: 'Seekers', color: 'bg-yellow-500' }
};

// Create the sections store
export const sections = writable(DEFAULT_SECTIONS);
export const selectedItems = writable([]);
export const selectedTimelines = writable(new Set(['BEATERS', 'CHASERS']));
export const selectedSectionId = writable(null);

// Helper function to format drill items
export function formatDrillItem(item, sectionId) {
  console.log('[DEBUG] formatDrillItem - input item:', {
    id: item.id,
    type: item.type,
    drill_id: item.drill_id,
    parallel_group_id: item.parallel_group_id,
    parallel_timeline: item.parallel_timeline,
    groupTimelines: item.groupTimelines || item.group_timelines
  });

  // Determine if this is a one-off drill
  // One-off drills have either: 
  // 1. type 'drill' with null drill_id and no drill object, or
  // 2. A negative numeric ID (our new approach)
  const isOneOff = (item.type === 'drill' && !item.drill && !item.drill_id) || 
                   (typeof item.id === 'number' && item.id < 0);
  
  const base = {
    id: item.drill?.id || item.id,
    // Convert to 'one-off' type if identified as such
    type: isOneOff ? 'one-off' : item.type,
    name: item.type === 'break' && !item.name ? 'Break' : (item.drill?.name || item.name || ''),
    duration: item.duration,
    drill: item.drill,
    selected_duration: item.duration,
    parallel_group_id: item.parallel_group_id,
    parallel_timeline: item.parallel_timeline,
    diagram_data: item.diagram_data,
    skill_level: item.drill?.skill_level || [],
    skills_focused_on: item.drill?.skills_focused_on || [],
    brief_description: item.drill?.brief_description || '',
    video_link: item.drill?.video_link || null,
    diagrams: item.drill?.diagrams || [],
    section_id: sectionId
  };

  if (item.parallel_group_id) {
    // First check for groupTimelines (either camelCase or snake_case)
    if (Array.isArray(item.groupTimelines) && item.groupTimelines.length > 0) {
      base.groupTimelines = item.groupTimelines;
    } else if (Array.isArray(item.group_timelines) && item.group_timelines.length > 0) {
      base.groupTimelines = item.group_timelines;
    } else {
      // If no groupTimelines, create an array with at least the parallel_timeline
      const timelines = new Set();
      if (item.parallel_timeline) {
        timelines.add(item.parallel_timeline);
      }
      // Convert back to array
      base.groupTimelines = Array.from(timelines);
    }
  } else {
    base.groupTimelines = null;
  }

  console.log('[DEBUG] formatDrillItem - output base:', {
    id: base.id,
    type: base.type,
    parallel_group_id: base.parallel_group_id,
    parallel_timeline: base.parallel_timeline,
    groupTimelines: base.groupTimelines
  });

  return base;
}

// Initialize sections from practice plan
export function initializeSections(practicePlan) {
  if (!practicePlan?.sections) return;

  // First, collect all parallel groups and their timelines
  const parallelGroups = new Map();
  practicePlan.sections.forEach(section => {
    section.items.forEach(item => {
      if (item.parallel_group_id) {
        if (!parallelGroups.has(item.parallel_group_id)) {
          parallelGroups.set(item.parallel_group_id, new Set());
        }

        if (Array.isArray(item.groupTimelines) && item.groupTimelines.length > 0) {
          for (const t of item.groupTimelines) {
            parallelGroups.get(item.parallel_group_id).add(t);
          }
        } else if (item.parallel_timeline) {
          parallelGroups.get(item.parallel_group_id).add(item.parallel_timeline);
        }
      }
    });
  });

  // Set the sections with the collected group timelines
  sections.set(practicePlan.sections.map(section => ({
    id: section.id,
    name: section.name,
    order: section.order,
    goals: section.goals || [],
    notes: section.notes || '',
    items: section.items.map(item => {
      const formattedItem = {
        ...formatDrillItem(item, section.id),
        // If this item is part of a parallel group, ensure it has the group's timelines
        ...(item.parallel_group_id && {
          groupTimelines: Array.from(parallelGroups.get(item.parallel_group_id) || [])
        })
      };
      console.log('[DEBUG] Formatted item with group timelines:', formattedItem);
      return formattedItem;
    })
  })));

  // Initialize selected items from all sections
  const allItems = practicePlan.sections.flatMap(section =>
    section.items.map(item => ({
      ...formatDrillItem(item, section.id),
      ...(item.parallel_group_id && {
        groupTimelines: Array.from(parallelGroups.get(item.parallel_group_id) || [])
      })
    }))
  );
  selectedItems.set(allItems);

  // Initialize timelines
  initializeTimelinesFromPlan(practicePlan);
}

// Initialize timelines from practice plan
export function initializeTimelinesFromPlan(plan) {
  if (!plan?.sections) return;
  
  const allTimelines = new Set();
  plan.sections.forEach(section => {
    section.items.forEach(item => {
      // Add parallel_timeline if it exists
      if (item.parallel_timeline) {
        allTimelines.add(item.parallel_timeline);
      }
      // Add all timelines from groupTimelines if they exist
      if (Array.isArray(item.groupTimelines)) {
        item.groupTimelines.forEach(timeline => allTimelines.add(timeline));
      }
      // Also check snake_case version
      if (Array.isArray(item.group_timelines)) {
        item.group_timelines.forEach(timeline => allTimelines.add(timeline));
      }
    });
  });
  
  if (allTimelines.size > 0) {
    selectedTimelines.set(allTimelines);
    console.log('[DEBUG] Initialized selectedTimelines from plan:', Array.from(allTimelines));
  }
}

// Section management functions
export function addSection() {
  // Create snapshot for history before changing state
  addToHistory('ADD_SECTION', null, 'Added section');

  sections.update(currentSections => [
    ...currentSections,
    {
      id: `section-${++sectionCounter}`,
      name: 'New Section',
      order: currentSections.length,
      goals: [],
      notes: '',
      items: []
    }
  ]);
}

export function removeSection(sectionId) {
  // Find the section before removing for history
  const sectionToRemove = get(sections).find(s => s.id === sectionId);
  
  addToHistory('REMOVE_SECTION', { sectionId, section: sectionToRemove }, 
               `Removed section "${sectionToRemove?.name || 'Section'}"`);

  sections.update(currentSections => {
    const filteredSections = currentSections.filter(s => s.id !== sectionId);
    // Reassign orders
    return filteredSections.map((s, i) => ({ ...s, order: i }));
  });
}

// Item management functions
export function addBreak(sectionId) {
  addToHistory('ADD_BREAK', { sectionId }, 'Added break');

  sections.update(currentSections => {
    const newSections = [...currentSections];
    const sectionIndex = newSections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return currentSections;
    
    const section = newSections[sectionIndex];
    
    // Create new break item
    const breakItem = {
      id: `break-${Date.now()}`,
      type: 'break',
      name: 'Break',
      duration: 10,
      selected_duration: 10
    };
    
    // Add break to end of section
    section.items.push(breakItem);
    
    return newSections;
  });
}

export function addOneOffDrill(sectionId, name = 'Quick Activity') {
  addToHistory('ADD_ONE_OFF_DRILL', { sectionId, name }, 'Added one-off drill');

  sections.update(currentSections => {
    const newSections = [...currentSections];
    const sectionIndex = newSections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return currentSections;
    
    const section = newSections[sectionIndex];
    
    // Create new one-off drill item with a numeric ID (negative timestamp)
    // This ensures it won't conflict with actual drill IDs but will be treated as an integer
    const oneOffDrillItem = {
      id: -Date.now(), // Use negative timestamp as ID (will be treated as an integer)
      type: 'one-off',
      name: name,
      duration: 10,
      selected_duration: 10
    };
    
    // Add one-off drill to end of section
    section.items.push(oneOffDrillItem);
    
    // Add success toast notification
    toast.push(`Added "${name}" to ${section.name}`, {
      theme: {
        '--toastBackground': '#4CAF50',
        '--toastColor': 'white'
      }
    });
    
    return newSections;
  });
}

export function addDrillToPlan(drill, sectionId) {
  addToHistory('ADD_DRILL', { drill, sectionId }, `Added "${drill.name}" to plan`);

  sections.update(currentSections => {
    const newSections = [...currentSections];
    const targetSection = newSections.find(s => s.id === sectionId);
    
    if (targetSection) {
      const newDrill = {
        id: drill.id,
        type: 'drill',
        name: drill.name,
        drill: drill,
        duration: 15,
        selected_duration: 15
      };
      
      targetSection.items = [...targetSection.items, newDrill];
      
      // Add success toast notification
      toast.push(`Added "${drill.name}" to ${targetSection.name}`, {
        theme: {
          '--toastBackground': '#4CAF50',
          '--toastColor': 'white'
        }
      });
    }
    
    return newSections;
  });
}

export function removeItem(sectionIndex, itemIndex) {
  // Get the item before removing for history
  const currentSections = get(sections);
  const section = currentSections[sectionIndex];
  const itemToRemove = section?.items[itemIndex];
  
  if (!itemToRemove) return;
  
  addToHistory('REMOVE_ITEM', 
              { sectionIndex, itemIndex, item: itemToRemove }, 
              `Removed "${itemToRemove.name || 'Item'}"`);

  sections.update(currentSections => {
    const newSections = [...currentSections];
    const section = newSections[sectionIndex];
    const itemToRemove = section.items[itemIndex];
    
    // Remove the item from the section
    section.items.splice(itemIndex, 1);
    
    // If the removed item was part of a group, check remaining group size
    if (itemToRemove.parallel_group_id) {
      const remainingGroupItems = section.items.filter(
        item => item.parallel_group_id === itemToRemove.parallel_group_id
      );
      
      // If only one item remains in the group, remove the group
      if (remainingGroupItems.length === 1) {
        section.items = section.items.map(item => {
          if (item.parallel_group_id === itemToRemove.parallel_group_id) {
            const { parallel_group_id, ...rest } = item;
            return {
              ...rest,
              id: item.drill?.id || item.id,
              drill: item.drill || { id: item.id, name: item.name }
            };
          }
          return item;
        });
      }
    }
    
    return newSections;
  });
}

export function handleDurationChange(sectionIndex, itemIndex, newDuration) {
  console.log('[DEBUG] Updating duration', { sectionIndex, itemIndex, newDuration });
  
  // Validate the duration - allow empty string during editing
  if (newDuration === '' || (newDuration >= 1 && newDuration <= 120)) {
    // Get the item before changing for history
    const currentSections = get(sections);
    const section = currentSections[sectionIndex];
    const item = section?.items[itemIndex];
    
    if (!item) return;
    
    const oldDuration = item.selected_duration || item.duration;
    
    addToHistory('CHANGE_DURATION', 
                { sectionIndex, itemIndex, oldDuration, newDuration }, 
                `Changed duration from ${oldDuration} to ${newDuration}`);

    sections.update(currentSections => {
      const newSections = [...currentSections];
      const section = newSections[sectionIndex];
      const item = section.items[itemIndex];

      if (item.type === 'break') {
        // For breaks, update the duration directly
        section.items[itemIndex] = {
          ...item,
          duration: newDuration || item.duration,
          selected_duration: newDuration || item.duration
        };
      } else if (item.parallel_group_id) {
        // For a drill in a parallel group, update only the current drill
        section.items[itemIndex] = {
          ...item,
          selected_duration: newDuration || item.duration,
          duration: newDuration || item.duration
        };
      } else {
        // For single drills, update normally
        section.items[itemIndex] = {
          ...item,
          selected_duration: newDuration || item.duration,
          duration: newDuration || item.duration
        };
      }

      return newSections;
    });
  }
}

// Parallel group management functions
export function handleUngroup(groupId) {
  console.log('[DEBUG] Starting ungroup for groupId', groupId);
  
  if (!groupId) {
    console.log('[DEBUG] No groupId provided');
    return;
  }
  
  // Get group items before ungrouping for history
  const currentSections = get(sections);
  const groupItems = [];
  
  for (const section of currentSections) {
    const sectionGroupItems = section.items.filter(item => item.parallel_group_id === groupId);
    if (sectionGroupItems.length > 0) {
      groupItems.push(...sectionGroupItems);
    }
  }
  
  addToHistory('UNGROUP', { groupId, groupItems }, 'Ungrouped parallel drills');
  
  sections.update(currentSections => {
    console.log('[DEBUG] Current sections', currentSections);
    
    return currentSections.map(section => {
      // Find all items in this group
      const groupItems = section.items.filter(item => 
        item.parallel_group_id === groupId
      );
      
      console.log('[DEBUG] Found group items count', groupItems.length);
      
      if (groupItems.length === 0) return section;

      // Update all items in the section
      const updatedItems = section.items.map(item => {
        if (item.parallel_group_id === groupId) {
          // Remove parallel group info but preserve drill information
          const { parallel_group_id, parallel_timeline, ...rest } = item;
          return {
            ...rest,
            id: item.drill?.id || item.id,
            drill: item.drill || { id: item.id, name: item.name }
          };
        }
        return item;
      });

      return {
        ...section,
        items: updatedItems
      };
    });
  });

  toast.push('Ungrouped parallel drills');
}

export function createParallelBlock() {
  const sectionId = get(selectedSectionId);
  if (!sectionId) return;
  
  console.log('[DEBUG] createParallelBlock - starting. Global selectedTimelines:', Array.from(get(selectedTimelines)));
  
  if (get(selectedTimelines).size < 2) {
    toast.push('Please select at least two timelines');
    return;
  }

  sections.update(currentSections => {
    const newSections = [...currentSections];
    const section = newSections.find(s => s.id === sectionId);
    if (!section) {
      console.log('[DEBUG] createParallelBlock - section not found for selectedSectionId:', sectionId);
      return currentSections;
    }

    const parallelGroupId = `group_${Date.now()}`;
    // Capture the timelines at this moment
    const groupTimelines = Array.from(get(selectedTimelines));
    console.log('[DEBUG] createParallelBlock - captured groupTimelines for new block:', groupTimelines);

    // Create placeholders with the block's timeline configuration
    const placeholderDrills = groupTimelines.map(timeline => ({
      id: `placeholder_${timeline}_${Date.now()}`,
      type: 'break',
      name: `${PARALLEL_TIMELINES[timeline].name} Drill`,
      duration: 15,
      selected_duration: 15,
      parallel_group_id: parallelGroupId,
      parallel_timeline: timeline,
      groupTimelines // Store the block's timeline configuration
    }));
    
    console.log('[DEBUG] createParallelBlock - placeholderDrills to be added:', placeholderDrills);
    section.items = [...section.items, ...placeholderDrills];
    return newSections;
  });

  toast.push('Created parallel block. Drag drills into each timeline.');
  console.log('[DEBUG] createParallelBlock - parallel block created in section:', sectionId);
}

export function updateParallelBlockTimelines(sectionId, parallelGroupId, newTimelines) {
  sections.update(currentSections => {
    return currentSections.map(section => {
      if (section.id !== sectionId) return section;

      // Get all items in this group
      const groupItems = section.items.filter(item => 
        item.parallel_group_id === parallelGroupId
      );

      // Get timelines that are being removed
      const removedTimelines = groupItems
        .map(item => item.parallel_timeline)
        .filter(timeline => !newTimelines.includes(timeline));

      // Update items
      const updatedItems = section.items.filter(item => {
        // Remove items from timelines that are being removed
        if (item.parallel_group_id === parallelGroupId && 
            removedTimelines.includes(item.parallel_timeline)) {
          return false;
        }
        return true;
      }).map(item => {
        // Update groupTimelines for all items in the group
        if (item.parallel_group_id === parallelGroupId) {
          return {
            ...item,
            groupTimelines: newTimelines
          };
        }
        return item;
      });

      // Add placeholder drills for new timelines
      const existingTimelines = groupItems.map(item => item.parallel_timeline);
      const newTimelinesToAdd = newTimelines.filter(t => !existingTimelines.includes(t));

      const newPlaceholders = newTimelinesToAdd.map(timeline => ({
        id: `placeholder_${timeline}_${Date.now()}`,
        type: 'break',
        name: `${PARALLEL_TIMELINES[timeline].name} Drill`,
        duration: 15,
        selected_duration: 15,
        parallel_group_id: parallelGroupId,
        parallel_timeline: timeline,
        groupTimelines: newTimelines
      }));

      return {
        ...section,
        items: [...updatedItems, ...newPlaceholders]
      };
    });
  });
}

export function handleTimelineSelect(sectionId, parallelGroupId) {
  selectedSectionId.set(sectionId);
  
  // Initialize selectedTimelines with the block's current timelines
  const section = get(sections).find(s => s.id === sectionId);
  const blockItem = section?.items.find(i => i.parallel_group_id === parallelGroupId);
  if (blockItem?.groupTimelines) {
    selectedTimelines.set(new Set(blockItem.groupTimelines));
  }
  
  return true; // Return true to indicate the modal should be shown
}

export function handleTimelineSave() {
  if (get(selectedTimelines).size < 2) {
    toast.push('Please select at least two timelines');
    return false;
  }

  const sectionId = get(selectedSectionId);
  if (sectionId) {
    const section = get(sections).find(s => s.id === sectionId);
    const parallelGroupId = section?.items.find(i => i.parallel_group_id)?.parallel_group_id;
    
    if (parallelGroupId) {
      // Updating existing block
      updateParallelBlockTimelines(sectionId, parallelGroupId, Array.from(get(selectedTimelines)));
    } else {
      // Creating new block
      createParallelBlock();
    }
  }

  selectedSectionId.set(null);
  return true; // Return true to indicate the modal should be closed
}

export function removeTimelineFromGroup(sectionId, parallelGroupId, timeline) {
  sections.update(currentSections => {
    const section = currentSections.find(s => s.id === sectionId);
    if (!section) return currentSections;

    // Find items in this timeline
    const timelineItems = section.items.filter(item => 
      item.parallel_group_id === parallelGroupId && 
      item.parallel_timeline === timeline
    );

    // If this is the last or second-to-last timeline, ungroup everything
    const groupItems = section.items.filter(item => item.parallel_group_id === parallelGroupId);
    if (groupItems.length <= 2) {
      return currentSections.map(s => ({
        ...s,
        items: s.items.map(item => {
          if (item.parallel_group_id === parallelGroupId) {
            const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
            return rest;
          }
          return item;
        })
      }));
    }

    // Remove items from this timeline
    return currentSections.map(s => ({
      ...s,
      items: s.items.filter(item => 
        !(item.parallel_group_id === parallelGroupId && item.parallel_timeline === timeline)
      ).map(item => {
        // Update groupTimelines for remaining items in the group
        if (item.parallel_group_id === parallelGroupId) {
          return {
            ...item,
            groupTimelines: item.groupTimelines.filter(t => t !== timeline)
          };
        }
        return item;
      })
    }));
  });

  toast.push(`Removed ${PARALLEL_TIMELINES[timeline].name} timeline`);
}

// Timeline duration calculation
export function getParallelBlockDuration(items, groupId) {
  if (!groupId) return 0;
  
  const groupItems = items.filter(item => item.parallel_group_id === groupId);
  if (!groupItems.length) return 0;

  // Get all unique timelines in this group
  const timelines = new Set(groupItems.map(item => item.parallel_timeline));
  
  // Calculate total duration for each timeline
  const timelineDurations = Array.from(timelines).map(timeline => {
    const timelineItems = groupItems.filter(item => item.parallel_timeline === timeline);
    return timelineItems.reduce((total, item) => 
      total + (parseInt(item.selected_duration || item.duration, 10) || 0), 0
    );
  });

  // Return the maximum duration across all timelines
  return Math.max(...timelineDurations);
}

export function calculateTimelineDurations(items, groupId) {
  if (!groupId) return {};
  
  // Get all items in this specific parallel group
  const groupItems = items.filter(item => item.parallel_group_id === groupId);
  if (groupItems.length === 0) return {};
  
  // Get the timelines that are actually used in this group
  const firstItem = groupItems[0];
  const groupTimelines = firstItem?.groupTimelines || [];
  
  // Calculate duration for each timeline in this group
  const durations = {};
  groupTimelines.forEach(timeline => {
    const timelineItems = groupItems.filter(item => item.parallel_timeline === timeline);
    durations[timeline] = timelineItems.reduce((total, item) => 
      total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0), 0
    );
  });

  // Find the maximum duration among the timelines in this group
  const maxDuration = Math.max(...Object.values(durations));
  
  // Check for mismatches only within this group's timelines
  const mismatches = [];
  Object.entries(durations).forEach(([timeline, duration]) => {
    if (duration < maxDuration) {
      mismatches.push({
        timeline,
        difference: maxDuration - duration
      });
    }
  });

  // If there are mismatches, send a single consolidated warning for this group
  if (mismatches.length > 0) {
    const warningMessage = mismatches
      .map(({ timeline, difference }) => 
        `${PARALLEL_TIMELINES[timeline].name} (${difference}min shorter)`
      )
      .join(', ');

    toast.push(`Timeline duration mismatch in group: ${warningMessage}`, {
      theme: {
        '--toastBackground': '#FFA500',
        '--toastColor': 'black'
      }
    });
  }

  return durations;
} 