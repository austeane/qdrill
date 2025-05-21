import { writable, get, derived } from 'svelte/store';
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
export const DEFAULT_TIMELINE_NAMES = {
	BEATERS: 'Beaters',
	CHASERS: 'Chasers',
	SEEKERS: 'Seekers'
};

export const DEFAULT_TIMELINE_COLORS = {
	BEATERS: 'bg-gray-500',
	CHASERS: 'bg-green-500',
	SEEKERS: 'bg-yellow-500'
};

// Initialize PARALLEL_TIMELINES with default values
// This will be updated by updateTimelineName() to keep in sync with customTimelineNames
export const PARALLEL_TIMELINES = {
	BEATERS: { name: DEFAULT_TIMELINE_NAMES.BEATERS, color: DEFAULT_TIMELINE_COLORS.BEATERS },
	CHASERS: { name: DEFAULT_TIMELINE_NAMES.CHASERS, color: DEFAULT_TIMELINE_COLORS.CHASERS },
	SEEKERS: { name: DEFAULT_TIMELINE_NAMES.SEEKERS, color: DEFAULT_TIMELINE_COLORS.SEEKERS }
};

// Available colors for timelines
export const TIMELINE_COLORS = {
	'bg-red-500': 'Red',
	'bg-orange-500': 'Orange',
	'bg-amber-500': 'Amber',
	'bg-yellow-500': 'Yellow',
	'bg-lime-500': 'Lime',
	'bg-green-500': 'Green',
	'bg-emerald-500': 'Emerald',
	'bg-teal-500': 'Teal',
	'bg-cyan-500': 'Cyan',
	'bg-sky-500': 'Sky',
	'bg-blue-500': 'Blue',
	'bg-indigo-500': 'Indigo',
	'bg-violet-500': 'Violet',
	'bg-purple-500': 'Purple',
	'bg-fuchsia-500': 'Fuchsia',
	'bg-pink-500': 'Pink',
	'bg-rose-500': 'Rose',
	'bg-gray-500': 'Gray',
	'bg-slate-500': 'Slate',
	'bg-zinc-500': 'Zinc'
};

// Create the sections store
export const sections = writable(DEFAULT_SECTIONS);
export const selectedTimelines = writable(new Set(['BEATERS', 'CHASERS']));
export const selectedSectionId = writable(null);
export const customTimelineColors = writable({});
export const customTimelineNames = writable({});

// Helper function to get a timeline's color (custom or default)
export function getTimelineColor(timeline) {
	const customColors = get(customTimelineColors);
	if (customColors[timeline]) {
		return customColors[timeline];
	}
	return DEFAULT_TIMELINE_COLORS[timeline] || 'bg-gray-500';
}

// Helper function to get a timeline's name (custom or default)
export function getTimelineName(timeline) {
	if (!timeline) {
		console.warn('[DEBUG] getTimelineName called with undefined timeline');
		return '';
	}

	// Always get a fresh copy of the store
	const customNames = get(customTimelineNames);

	// Check if there's a custom name for this timeline
	if (customNames && customNames[timeline]) {
		console.log(`[DEBUG] Using custom name for ${timeline}: ${customNames[timeline]}`);
		return customNames[timeline];
	}

	// Check if there's a default name
	if (DEFAULT_TIMELINE_NAMES[timeline]) {
		console.log(`[DEBUG] Using default name for ${timeline}: ${DEFAULT_TIMELINE_NAMES[timeline]}`);
		return DEFAULT_TIMELINE_NAMES[timeline];
	}

	// If all else fails, use the timeline key
	console.log(`[DEBUG] No name found for ${timeline}, using key as name`);
	return timeline;
}

// Helper function to update a timeline's name
export function updateTimelineName(timeline, name) {
	console.log('[DEBUG] updateTimelineName called with:', { timeline, name });

	if (!name || name.trim() === '') {
		console.warn(`Cannot use empty name for timeline "${timeline}". Using default instead.`);
		name = DEFAULT_TIMELINE_NAMES[timeline] || timeline;
	}

	// Update the customTimelineNames store
	customTimelineNames.update((names) => {
		const updatedNames = { ...names, [timeline]: name };
		console.log('[DEBUG] Updated customTimelineNames:', updatedNames);
		return updatedNames;
	});

	// Update the PARALLEL_TIMELINES for compatibility with existing code
	if (PARALLEL_TIMELINES[timeline]) {
		PARALLEL_TIMELINES[timeline] = {
			...PARALLEL_TIMELINES[timeline],
			name: name
		};
		console.log('[DEBUG] Updated PARALLEL_TIMELINES entry:', PARALLEL_TIMELINES[timeline]);
	} else {
		console.warn(`[DEBUG] Could not update PARALLEL_TIMELINES for ${timeline} - entry not found`);
	}

	// Log the result of getting the timeline name to verify it works
	console.log('[DEBUG] getTimelineName result after update:', getTimelineName(timeline));

	// Update all section items that use this timeline to ensure reactivity
	sections.update((currentSections) => {
		return currentSections.map((section) => {
			// Update the timeline_name property on all items with this timeline
			const updatedItems = section.items.map((item) => {
				if (item.parallel_timeline === timeline) {
					return {
						...item,
						timeline_name: name
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
}

// Helper function to update a timeline's color
export function updateTimelineColor(timeline, color) {
	// Validate that the color is a valid Tailwind color class
	if (!Object.keys(TIMELINE_COLORS).includes(color)) {
		console.warn(
			`Invalid color class "${color}" for timeline "${timeline}". Must be one of: ${Object.keys(TIMELINE_COLORS).join(', ')}. Using default bg-gray-500 instead.`
		);
		// Use a safe default color if invalid
		color = 'bg-gray-500';
	}

	// Update the customTimelineColors store
	customTimelineColors.update((colors) => {
		return { ...colors, [timeline]: color };
	});

	// Also update all items with this timeline in the sections store
	sections.update((currentSections) => {
		return currentSections.map((section) => {
			const updatedItems = section.items.map((item) => {
				if (item.parallel_timeline === timeline) {
					return {
						...item,
						timeline_color: color
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

	// Update the PARALLEL_TIMELINES for compatibility with existing code
	if (PARALLEL_TIMELINES[timeline]) {
		PARALLEL_TIMELINES[timeline] = {
			...PARALLEL_TIMELINES[timeline],
			color: color
		};
	}

	// Update DEFAULT_TIMELINE_COLORS for future use
	DEFAULT_TIMELINE_COLORS[timeline] = color;
}

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
	const isOneOff =
		(item.type === 'drill' && !item.drill && !item.drill_id) ||
		(typeof item.id === 'number' && item.id < 0);

	const base = {
		id: item.drill?.id || item.id,
		// Convert to 'one-off' type if identified as such
		type: isOneOff ? 'one-off' : item.type,
		name: item.type === 'break' && !item.name ? 'Break' : item.drill?.name || item.name || '',
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
		section_id: sectionId,
		// Preserve the group name
		group_name: item.groupName || item.group_name,
		// Preserve the timeline color and name
		timeline_color: item.timeline_color,
		timeline_name: item.timeline_name
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
		groupTimelines: base.groupTimelines,
		group_name: base.group_name,
		timeline_color: base.timeline_color,
		timeline_name: base.timeline_name
	});

	return base;
}

// Initialize sections from practice plan
export function initializeSections(practicePlan) {
	if (!practicePlan?.sections) return;

	// First, collect all parallel groups and their timelines
	const parallelGroups = new Map();
	practicePlan.sections.forEach((section) => {
		section.items.forEach((item) => {
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
	sections.set(
		practicePlan.sections.map((section) => ({
			id: section.id,
			name: section.name,
			order: section.order,
			goals: section.goals || [],
			notes: section.notes || '',
			items: section.items.map((item) => {
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
		}))
	);

	// Initialize timelines
	initializeTimelinesFromPlan(practicePlan);
}

// Initialize timelines from practice plan
export function initializeTimelinesFromPlan(plan) {
	if (!plan?.sections) return;

	const allTimelines = new Set();
	const colors = {};
	const names = {};

	plan.sections.forEach((section) => {
		section.items.forEach((item) => {
			// Add parallel_timeline if it exists
			if (item.parallel_timeline) {
				allTimelines.add(item.parallel_timeline);

				// Check for custom colors and names
				if (item.timeline_color) {
					colors[item.parallel_timeline] = item.timeline_color;
				}

				if (item.timeline_name) {
					names[item.parallel_timeline] = item.timeline_name;
				}
			}
			// Add all timelines from groupTimelines if they exist
			if (Array.isArray(item.groupTimelines)) {
				item.groupTimelines.forEach((timeline) => allTimelines.add(timeline));
			}
			// Also check snake_case version
			if (Array.isArray(item.group_timelines)) {
				item.group_timelines.forEach((timeline) => allTimelines.add(timeline));
			}
		});
	});

	if (allTimelines.size > 0) {
		selectedTimelines.set(allTimelines);
		console.log('[DEBUG] Initialized selectedTimelines from plan:', Array.from(allTimelines));
	}

	// Initialize custom colors if any were found
	if (Object.keys(colors).length > 0) {
		customTimelineColors.set(colors);
		console.log('[DEBUG] Initialized customTimelineColors from plan:', colors);
	}

	// Initialize custom names if any were found
	if (Object.keys(names).length > 0) {
		customTimelineNames.set(names);
		console.log('[DEBUG] Initialized customTimelineNames from plan:', names);

		// Update PARALLEL_TIMELINES for compatibility
		Object.entries(names).forEach(([timeline, name]) => {
			if (PARALLEL_TIMELINES[timeline]) {
				PARALLEL_TIMELINES[timeline] = {
					...PARALLEL_TIMELINES[timeline],
					name: name
				};
			}
		});
	}
}

// Section management functions
export function addSection() {
	console.log('[sectionsStore.js] addSection called');
	// Create snapshot for history before changing state
	addToHistory('ADD_SECTION', null, 'Added section');

	sections.update((currentSections) => {
		console.log(
			'[sectionsStore.js] sections.update started. Current sections count:',
			currentSections.length
		);
		const newSectionData = {
			id: `section-${++sectionCounter}`,
			name: 'New Section',
			order: currentSections.length,
			goals: [],
			notes: '',
			items: []
		};
		const newSectionsArray = [...currentSections, newSectionData];
		console.log(
			'[sectionsStore.js] sections.update finished. New sections count:',
			newSectionsArray.length
		);
		return newSectionsArray;
	});
}

export function removeSection(sectionId) {
	// Find the section before removing for history
	const sectionToRemove = get(sections).find((s) => s.id === sectionId);

	addToHistory(
		'REMOVE_SECTION',
		{ sectionId, section: sectionToRemove },
		`Removed section "${sectionToRemove?.name || 'Section'}"`
	);

	sections.update((currentSections) => {
		const filteredSections = currentSections.filter((s) => s.id !== sectionId);
		// Reassign orders
		return filteredSections.map((s, i) => ({ ...s, order: i }));
	});
}

// Item management functions
export function addBreak(sectionId) {
	addToHistory('ADD_BREAK', { sectionId }, 'Added break');

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const sectionIndex = newSections.findIndex((s) => s.id === sectionId);
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

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const sectionIndex = newSections.findIndex((s) => s.id === sectionId);
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

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const targetSection = newSections.find((s) => s.id === sectionId);

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

	addToHistory(
		'REMOVE_ITEM',
		{ sectionIndex, itemIndex, item: itemToRemove },
		`Removed "${itemToRemove.name || 'Item'}"`
	);

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const section = newSections[sectionIndex];
		const itemToRemove = section.items[itemIndex];

		// Remove the item from the section
		section.items.splice(itemIndex, 1);

		// If the removed item was part of a group, check remaining group size
		if (itemToRemove.parallel_group_id) {
			const remainingGroupItems = section.items.filter(
				(item) => item.parallel_group_id === itemToRemove.parallel_group_id
			);

			// If only one item remains in the group, remove the group
			if (remainingGroupItems.length === 1) {
				section.items = section.items.map((item) => {
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

		addToHistory(
			'CHANGE_DURATION',
			{ sectionIndex, itemIndex, oldDuration, newDuration },
			`Changed duration from ${oldDuration} to ${newDuration}`
		);

		sections.update((currentSections) => {
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
		const sectionGroupItems = section.items.filter((item) => item.parallel_group_id === groupId);
		if (sectionGroupItems.length > 0) {
			groupItems.push(...sectionGroupItems);
		}
	}

	addToHistory('UNGROUP', { groupId, groupItems }, 'Ungrouped parallel drills');

	sections.update((currentSections) => {
		console.log('[DEBUG] Current sections', currentSections);

		return currentSections.map((section) => {
			// Find all items in this group
			const groupItems = section.items.filter((item) => item.parallel_group_id === groupId);

			console.log('[DEBUG] Found group items count', groupItems.length);

			if (groupItems.length === 0) return section;

			// Update all items in the section
			const updatedItems = section.items.map((item) => {
				if (item.parallel_group_id === groupId) {
					// Remove parallel group info but preserve drill information and important properties
					const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
					return {
						...rest,
						id: item.drill?.id || item.id,
						drill: item.drill || { id: item.id, name: item.name },
						// Preserve these properties when ungrouping with prefixes
						// This allows us to potentially recover them if the item is grouped again
						// without interfering with the normal item structure
						_previous_timeline: parallel_timeline,
						_previous_color: item.timeline_color,
						_previous_group_name: item.group_name
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

	console.log(
		'[DEBUG] createParallelBlock - starting. Global selectedTimelines:',
		Array.from(get(selectedTimelines))
	);

	if (get(selectedTimelines).size < 2) {
		toast.push('Please select at least two timelines');
		return;
	}

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const section = newSections.find((s) => s.id === sectionId);
		if (!section) {
			console.log(
				'[DEBUG] createParallelBlock - section not found for selectedSectionId:',
				sectionId
			);
			return currentSections;
		}

		const parallelGroupId = `group_${Date.now()}`;
		// Capture the timelines at this moment
		const groupTimelines = Array.from(get(selectedTimelines));
		// Use a fixed group name now
		const groupName = 'Parallel Activities';

		console.log(
			'[DEBUG] createParallelBlock - captured groupTimelines for new block:',
			groupTimelines
		);

		// Create placeholders with the block's timeline configuration
		const placeholderDrills = groupTimelines.map((timeline) => {
			// Debug the timeline name that will be used
			const timelineName = getTimelineName(timeline);
			console.log(`[DEBUG] Creating placeholder for ${timeline}, using name: ${timelineName}`);

			return {
				id: `placeholder_${timeline}_${Date.now()}`,
				type: 'break',
				name: `${timelineName} Drill`,
				duration: 15,
				selected_duration: 15,
				parallel_group_id: parallelGroupId,
				parallel_timeline: timeline,
				groupTimelines, // Store the block's timeline configuration
				group_name: 'Parallel Activities', // Fixed group name
				timeline_color:
					get(customTimelineColors)[timeline] || DEFAULT_TIMELINE_COLORS[timeline] || 'bg-gray-500',
				timeline_name: timelineName // Store the name directly
			};
		});

		console.log('[DEBUG] createParallelBlock - placeholderDrills to be added:', placeholderDrills);
		section.items = [...section.items, ...placeholderDrills];
		return newSections;
	});

	toast.push('Created parallel block. Drag drills into each timeline.');
	console.log('[DEBUG] createParallelBlock - parallel block created in section:', sectionId);
}

export function updateParallelBlockTimelines(sectionId, parallelGroupId, newTimelines) {
	sections.update((currentSections) => {
		return currentSections.map((section) => {
			if (section.id !== sectionId) return section;

			// Get all items in this group
			const groupItems = section.items.filter((item) => item.parallel_group_id === parallelGroupId);

			// Get the existing group name (simplified approach - always use 'Parallel Activities')
			const groupName = 'Parallel Activities';

			// Get timelines that are being removed
			const removedTimelines = groupItems
				.map((item) => item.parallel_timeline)
				.filter((timeline) => !newTimelines.includes(timeline));

			// Update items
			const updatedItems = section.items
				.filter((item) => {
					// Remove items from timelines that are being removed
					if (
						item.parallel_group_id === parallelGroupId &&
						removedTimelines.includes(item.parallel_timeline)
					) {
						return false;
					}
					return true;
				})
				.map((item) => {
					// Update groupTimelines for all items in the group
					if (item.parallel_group_id === parallelGroupId) {
						return {
							...item,
							groupTimelines: newTimelines,
							group_name: groupName,
							timeline_color:
								get(customTimelineColors)[item.parallel_timeline] ||
								DEFAULT_TIMELINE_COLORS[item.parallel_timeline] ||
								'bg-gray-500',
							timeline_name:
								get(customTimelineNames)[item.parallel_timeline] ||
								DEFAULT_TIMELINE_NAMES[item.parallel_timeline]
						};
					}
					return item;
				});

			// Add placeholder drills for new timelines
			const existingTimelines = groupItems.map((item) => item.parallel_timeline);
			const newTimelinesToAdd = newTimelines.filter((t) => !existingTimelines.includes(t));

			const newPlaceholders = newTimelinesToAdd.map((timeline) => {
				// Debug the timeline name that will be used
				const timelineName = getTimelineName(timeline);
				console.log(
					`[DEBUG] Creating placeholder in updateParallelBlockTimelines for ${timeline}, using name: ${timelineName}`
				);

				return {
					id: `placeholder_${timeline}_${Date.now()}`,
					type: 'break',
					name: `${timelineName} Drill`,
					duration: 15,
					selected_duration: 15,
					parallel_group_id: parallelGroupId,
					parallel_timeline: timeline,
					groupTimelines: newTimelines,
					group_name: groupName,
					timeline_color:
						get(customTimelineColors)[timeline] ||
						DEFAULT_TIMELINE_COLORS[timeline] ||
						'bg-gray-500',
					timeline_name: timelineName // Store the name directly
				};
			});

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
	const section = get(sections).find((s) => s.id === sectionId);
	const blockItem = section?.items.find((i) => i.parallel_group_id === parallelGroupId);
	if (blockItem?.groupTimelines) {
		selectedTimelines.set(new Set(blockItem.groupTimelines));
	}

	// We don't need to set the group name since we're using a fixed group name

	return true; // Return true to indicate the modal should be shown
}

export function handleTimelineSave() {
	if (get(selectedTimelines).size < 2) {
		toast.push('Please select at least two timelines');
		return false;
	}

	const sectionId = get(selectedSectionId);
	if (sectionId) {
		const section = get(sections).find((s) => s.id === sectionId);
		const parallelGroupId = section?.items.find((i) => i.parallel_group_id)?.parallel_group_id;

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
	sections.update((currentSections) => {
		const section = currentSections.find((s) => s.id === sectionId);
		if (!section) return currentSections;

		// Find items in this timeline
		const timelineItems = section.items.filter(
			(item) => item.parallel_group_id === parallelGroupId && item.parallel_timeline === timeline
		);

		// If this is the last or second-to-last timeline, ungroup everything
		const groupItems = section.items.filter((item) => item.parallel_group_id === parallelGroupId);
		if (groupItems.length <= 2) {
			return currentSections.map((s) => ({
				...s,
				items: s.items.map((item) => {
					if (item.parallel_group_id === parallelGroupId) {
						const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
						return {
							...rest,
							// Preserve these properties when ungrouping with prefixes
							// This allows us to potentially recover them if the item is grouped again
							// without interfering with the normal item structure
							_previous_timeline: parallel_timeline,
							_previous_color: item.timeline_color,
							_previous_group_name: item.group_name
						};
					}
					return item;
				})
			}));
		}

		// Remove items from this timeline
		return currentSections.map((s) => ({
			...s,
			items: s.items
				.filter(
					(item) =>
						!(item.parallel_group_id === parallelGroupId && item.parallel_timeline === timeline)
				)
				.map((item) => {
					// Update groupTimelines for remaining items in the group
					if (item.parallel_group_id === parallelGroupId) {
						return {
							...item,
							groupTimelines: item.groupTimelines.filter((t) => t !== timeline),
							// Preserve the group name and color when removing a timeline
							group_name: item.group_name
						};
					}
					return item;
				})
		}));
	});

	toast.push(`Removed ${getTimelineName(timeline)} timeline`);
}

// Timeline duration calculation
export function getParallelBlockDuration(items, groupId) {
	if (!groupId) return 0;

	const groupItems = items.filter((item) => item.parallel_group_id === groupId);
	if (!groupItems.length) return 0;

	// Get all unique timelines in this group
	const timelines = new Set(groupItems.map((item) => item.parallel_timeline));

	// Calculate total duration for each timeline
	const timelineDurations = Array.from(timelines).map((timeline) => {
		const timelineItems = groupItems.filter((item) => item.parallel_timeline === timeline);
		return timelineItems.reduce(
			(total, item) => total + (parseInt(item.selected_duration || item.duration, 10) || 0),
			0
		);
	});

	// Return the maximum duration across all timelines
	return Math.max(...timelineDurations);
}

// Cache for previous duration calculations to avoid duplicate warnings
let lastDurationWarnings = new Map();

export function calculateTimelineDurations(items, groupId) {
	if (!groupId) return {};

	// Get all items in this specific parallel group
	const groupItems = items.filter((item) => item.parallel_group_id === groupId);
	if (groupItems.length === 0) return {};

	// Get the timelines that are actually used in this group
	const firstItem = groupItems[0];
	const groupTimelines = firstItem?.groupTimelines || [];

	// Calculate duration for each timeline in this group
	const durations = {};
	groupTimelines.forEach((timeline) => {
		const timelineItems = groupItems.filter((item) => item.parallel_timeline === timeline);
		durations[timeline] = timelineItems.reduce(
			(total, item) => total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0),
			0
		);
	});

	// Find the maximum duration among the timelines in this group
	const maxDuration = Math.max(...Object.values(durations), 0);

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

	// Create a unique warning signature for this group's mismatches
	const warningSig = mismatches
		.map((m) => `${m.timeline}:${m.difference}`)
		.sort()
		.join('|');

	// Only show warning if the signature has changed or hasn't been shown for this group
	if (
		mismatches.length > 0 &&
		(!lastDurationWarnings.has(groupId) || lastDurationWarnings.get(groupId) !== warningSig)
	) {
		const warningMessage = mismatches
			.map(({ timeline, difference }) => `${getTimelineName(timeline)} (${difference}min shorter)`)
			.join(', ');

		// Store the current warning signature
		lastDurationWarnings.set(groupId, warningSig);

		// Show the toast
		toast.push(`Timeline duration mismatch in group: ${warningMessage}`, {
			theme: {
				'--toastBackground': '#FFA500',
				'--toastColor': 'black'
			}
		});
	}

	return durations;
}

// DEBUG function to check the state of the timeline names
export function debugTimelineNames() {
	const customNames = get(customTimelineNames);
	console.log('[DEBUG] Current custom timeline names:', customNames);

	console.log('[DEBUG] Current PARALLEL_TIMELINES:', JSON.stringify(PARALLEL_TIMELINES, null, 2));

	Object.keys(DEFAULT_TIMELINE_NAMES).forEach((key) => {
		console.log(`[DEBUG] Timeline ${key} name:`, getTimelineName(key));
	});

	return customNames;
}

// Create a derived store for total duration
export const totalPlanDuration = derived(sections, ($sections) => {
	let total = 0;

	for (const section of $sections) {
		for (const item of section.items) {
			// For parallel groups, only count the maximum duration per group
			if (item.parallel_group_id) {
				// Get all items in this group
				const groupItems = section.items.filter(
					(i) => i.parallel_group_id === item.parallel_group_id
				);
				// Group items by timeline
				const timelineDurations = {};
				groupItems.forEach((groupItem) => {
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

// === Drag/Drop Helper Functions (Moved from practicePlanStore) ===

/**
 * Handles reordering or grouping of items within a section's items list based on drag-and-drop.
 * @param {number} sourceIndex - The original index of the item being moved.
 * @param {number} targetIndex - The index where the item is being dropped.
 * @param {Array} items - The current array of items in the section.
 * @param {boolean} isGrouping - True if the drop target indicates grouping (e.g., dropping onto an item), false for reordering (dropping between items).
 * @returns {Array} The new array of items after the move.
 */
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

/**
 * Merges a source item into a parallel group with a target item.
 * If the target item is already in a group, the source item is added to that group.
 * If the target item is not in a group, a new group is created containing both items.
 * Handles duration updates for the group.
 * @param {number} sourceIndex - The index of the item being dragged.
 * @param {number} targetIndex - The index of the item being dropped onto.
 * @param {Array} items - The current array of items in the section.
 * @returns {Array} The new array of items with the merged/new group.
 */
export function mergeIntoParallelGroup(sourceIndex, targetIndex, items) {
	const sourceItem = items[sourceIndex];
	const targetItem = items[targetIndex];

	if (!sourceItem || !targetItem || sourceIndex === targetIndex) return items;

	// Prevent merging an item into its own group again
	if (
		sourceItem.parallel_group_id &&
		sourceItem.parallel_group_id === targetItem.parallel_group_id
	) {
		return items;
	}

	const newItems = [...items];
	let groupId;

	if (targetItem.parallel_group_id) {
		// Add to existing group
		groupId = targetItem.parallel_group_id;
		newItems[sourceIndex] = {
			...sourceItem,
			parallel_group_id: groupId
		};
	} else {
		// Create new group
		groupId = `group_${Date.now()}`;
		newItems[sourceIndex] = {
			...sourceItem,
			parallel_group_id: groupId
		};
		newItems[targetIndex] = {
			...targetItem,
			parallel_group_id: groupId
		};
	}

	// Update durations for all items in the group - This logic likely needs refinement
	// based on how parallel duration should actually work (max of timelines?)
	// For now, keep the original logic (max of the two merged items)
	// A better approach might recalculate based on *all* items in the group
	const groupDuration = Math.max(
		parseInt(sourceItem.selected_duration || sourceItem.duration || 0),
		parseInt(targetItem.selected_duration || targetItem.duration || 0)
	);

	return newItems.map((item) => {
		if (item.parallel_group_id === groupId) {
			return {
				...item,
				selected_duration: groupDuration // Apply the calculated max duration
				// Consider if original `duration` should also be updated or kept separate
			};
		}
		return item;
	});
}

/**
 * Removes an item from its parallel group.
 * If removing the item leaves only one other item in the group, the group is dissolved entirely.
 * @param {string|number} itemId - The ID of the item to remove from its group.
 * @param {Array} items - The current array of items in the section.
 * @returns {Array} The new array of items with the item removed from the group.
 */
export function removeFromParallelGroup(itemId, items) {
	// Find the item being removed and its group ID
	const itemIndex = items.findIndex((item) => item.id === itemId);
	if (itemIndex === -1) return items; // Item not found

	const itemToRemove = items[itemIndex];
	const groupId = itemToRemove?.parallel_group_id;

	if (!groupId) return items; // Item is not in a group

	// Count how many items will remain in the group
	const remainingGroupItems = items.filter(
		(item) => item.parallel_group_id === groupId && item.id !== itemId
	);

	// If only one item would remain, dissolve the group
	if (remainingGroupItems.length <= 1) {
		return items.map((item) => {
			if (item.parallel_group_id === groupId) {
				// Remove group properties
				const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
				// Restore original duration? Or keep selected_duration?
				// Let's keep selected_duration for now, assuming it was manually set.
				return rest;
			}
			return item;
		});
	}

	// Otherwise, just remove the one item from the group
	return items.map((item) => {
		if (item.id === itemId) {
			const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
			return rest;
		}
		return item;
	});
}
