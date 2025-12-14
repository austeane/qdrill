import { browser, dev } from '$app/environment';
import { toast } from '@zerodevx/svelte-toast';
import { SvelteSet } from 'svelte/reactivity';
import { addToHistory, setSnapshotGetter, setSnapshotApplier } from './historyStore';

// NOTE: This module is being migrated to runes-based shared state. The `.svelte.js` extension
// enables runes in the module once we remove `svelte/store` usage.

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
export const sections = $state(DEFAULT_SECTIONS);
export const selectedTimelines = new SvelteSet(['BEATERS', 'CHASERS']);
let selectedSectionId = $state(null);
export const customTimelineColors = $state({});
export const customTimelineNames = $state({});

function isDebugEnabled() {
	if (!dev || !browser) return false;
	try {
		const params = new URLSearchParams(window.location.search);
		return params.has('debug') || window.localStorage.getItem('qdrill_debug') === '1';
	} catch {
		return false;
	}
}

function debug(...args) {
	if (isDebugEnabled()) console.log(...args);
}

function debugWarn(...args) {
	if (isDebugEnabled()) console.warn(...args);
}

function replaceSections(nextSections) {
	sections.splice(0, sections.length, ...nextSections);
}

function replaceRecord(target, next) {
	for (const key of Object.keys(target)) delete target[key];
	Object.assign(target, next);
}

function replaceSelectedTimelines(next) {
	selectedTimelines.clear();
	for (const timeline of next) selectedTimelines.add(timeline);
}

function updateSections(updater) {
	const nextSections = updater($state.snapshot(sections));
	replaceSections(nextSections);
}

// Inject snapshot getter for historyStore to avoid circular imports
setSnapshotGetter(() => $state.snapshot(sections));
setSnapshotApplier((snapshot) => replaceSections(snapshot));

// Helper function to get a timeline's color (custom or default)
export function getTimelineColor(timeline) {
	const customColors = customTimelineColors;
	if (customColors[timeline]) {
		return customColors[timeline];
	}
	return DEFAULT_TIMELINE_COLORS[timeline] || 'bg-gray-500';
}

// Helper function to get a timeline's name (custom or default)
export function getTimelineName(timeline) {
	if (!timeline) {
		debugWarn('[sectionsStore] getTimelineName called with undefined timeline');
		return '';
	}

	const customNames = customTimelineNames;

	// Check if there's a custom name for this timeline
	if (customNames && customNames[timeline]) {
		debug(`[sectionsStore] Using custom name for ${timeline}: ${customNames[timeline]}`);
		return customNames[timeline];
	}

	// Check if there's a default name
	if (DEFAULT_TIMELINE_NAMES[timeline]) {
		debug(
			`[sectionsStore] Using default name for ${timeline}: ${DEFAULT_TIMELINE_NAMES[timeline]}`
		);
		return DEFAULT_TIMELINE_NAMES[timeline];
	}

	// If all else fails, use the timeline key
	debug(`[sectionsStore] No name found for ${timeline}, using key as name`);
	return timeline;
}

// Helper function to update a timeline's name
export function updateTimelineName(timeline, name) {
	debug('[sectionsStore] updateTimelineName called with:', { timeline, name });

	if (!name || name.trim() === '') {
		console.warn(`Cannot use empty name for timeline "${timeline}". Using default instead.`);
		name = DEFAULT_TIMELINE_NAMES[timeline] || timeline;
	}

	customTimelineNames[timeline] = name;
	debug('[sectionsStore] Updated customTimelineNames:', customTimelineNames);

	// Update the PARALLEL_TIMELINES for compatibility with existing code
	if (PARALLEL_TIMELINES[timeline]) {
		PARALLEL_TIMELINES[timeline] = {
			...PARALLEL_TIMELINES[timeline],
			name: name
		};
		debug('[sectionsStore] Updated PARALLEL_TIMELINES entry:', PARALLEL_TIMELINES[timeline]);
	} else {
		debugWarn(
			`[sectionsStore] Could not update PARALLEL_TIMELINES for ${timeline} - entry not found`
		);
	}

	// Log the result of getting the timeline name to verify it works
	debug('[sectionsStore] getTimelineName result after update:', getTimelineName(timeline));

	// Update all section items that use this timeline to ensure reactivity
	updateSections((currentSections) => {
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

	customTimelineColors[timeline] = color;

	// Also update all items with this timeline in the sections store
	updateSections((currentSections) => {
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
		timeline_name: item.timeline_name,
		// Preserve formation data
		formation: item.formation
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

	debug('[sectionsStore] formatDrillItem - output base:', {
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
	replaceSections(
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
				debug('[sectionsStore] Formatted item with group timelines:', formattedItem);
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
		replaceSelectedTimelines(allTimelines);
		debug('[sectionsStore] Initialized selectedTimelines from plan:', Array.from(allTimelines));
	}

	// Initialize custom colors if any were found
	if (Object.keys(colors).length > 0) {
		replaceRecord(customTimelineColors, colors);
		debug('[sectionsStore] Initialized customTimelineColors from plan:', colors);
	}

	// Initialize custom names if any were found
	if (Object.keys(names).length > 0) {
		replaceRecord(customTimelineNames, names);
		debug('[sectionsStore] Initialized customTimelineNames from plan:', names);

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
	debug('[sectionsStore] addSection called');
	// Create snapshot for history before changing state
	addToHistory('ADD_SECTION', null, 'Added section');

	updateSections((currentSections) => {
		debug(
			'[sectionsStore] sections.update started. Current sections count:',
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
		debug('[sectionsStore] sections.update finished. New sections count:', newSectionsArray.length);
		return newSectionsArray;
	});
}

export function removeSection(sectionId) {
	// Find the section before removing for history
	const sectionToRemove = sections.find((s) => s.id === sectionId);

	addToHistory(
		'REMOVE_SECTION',
		{ sectionId, section: sectionToRemove },
		`Removed section "${sectionToRemove?.name || 'Section'}"`
	);

	updateSections((currentSections) => {
		const filteredSections = currentSections.filter((s) => s.id !== sectionId);
		// Reassign orders
		return filteredSections.map((s, i) => ({ ...s, order: i }));
	});
}

// Item management functions
export function addBreak(sectionId) {
	addToHistory('ADD_BREAK', { sectionId }, 'Added break');

	updateSections((currentSections) => {
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

	updateSections((currentSections) => {
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

export function addDrillToPlan(drill, sectionId, options = {}) {
	const { parallel_timeline = null, parallel_group_id = null } = options;

	addToHistory('ADD_DRILL', { drill, sectionId }, `Added "${drill.name}" to plan`);

	updateSections((currentSections) => {
		const newSections = [...currentSections];
		const targetSection = newSections.find((s) => s.id === sectionId);

		if (targetSection) {
			const newDrill = {
				id: drill.id,
				type: 'drill',
				name: drill.name,
				drill: drill,
				duration: 15,
				selected_duration: 15,
				parallel_timeline: parallel_timeline,
				parallel_group_id: parallel_group_id
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

export function addFormationToPlan(formation, sectionId) {
	addToHistory(
		'ADD_FORMATION',
		{ formation, sectionId },
		`Added "${formation.name}" formation reference`
	);

	updateSections((currentSections) => {
		const newSections = [...currentSections];
		const targetSection = newSections.find((s) => s.id === sectionId);

		if (targetSection) {
			const newFormation = {
				id: `formation-${formation.id}`,
				type: 'formation',
				name: formation.name,
				formation: formation,
				formation_id: formation.id,
				// No duration for formations - they're just references
				duration: 0,
				selected_duration: 0
			};

			targetSection.items = [...targetSection.items, newFormation];

			// Add success toast notification
			toast.push(`Added "${formation.name}" formation reference to ${targetSection.name}`, {
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
	const currentSections = sections;
	const section = currentSections[sectionIndex];
	const itemToRemove = section?.items[itemIndex];

	if (!itemToRemove) return;

	addToHistory(
		'REMOVE_ITEM',
		{ sectionIndex, itemIndex, item: itemToRemove },
		`Removed "${itemToRemove.name || 'Item'}"`
	);

	updateSections((currentSections) => {
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
						const rest = { ...item };
						delete rest.parallel_group_id;
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
	debug('[sectionsStore] Updating duration', { sectionIndex, itemIndex, newDuration });

	// Validate the duration - allow empty string during editing
	if (newDuration === '' || (newDuration >= 1 && newDuration <= 120)) {
		// Get the item before changing for history
		const currentSections = sections;
		const section = currentSections[sectionIndex];
		const item = section?.items[itemIndex];

		if (!item) return;

		const oldDuration = item.selected_duration || item.duration;

		addToHistory(
			'CHANGE_DURATION',
			{ sectionIndex, itemIndex, oldDuration, newDuration },
			`Changed duration from ${oldDuration} to ${newDuration}`
		);

		updateSections((currentSections) => {
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

export function handleTimelineChange(sectionIndex, itemIndex, newTimeline) {
	debug('[sectionsStore] Updating timeline', { sectionIndex, itemIndex, newTimeline });

	// Get the item before changing for history
	const currentSections = sections;
	const section = currentSections[sectionIndex];
	const item = section?.items[itemIndex];

	if (!item) return;

	const oldTimeline = item.parallel_timeline;

	addToHistory(
		'CHANGE_TIMELINE',
		{ sectionIndex, itemIndex, oldTimeline, newTimeline },
		`Changed position from ${oldTimeline || 'All'} to ${newTimeline || 'All'}`
	);

	updateSections((currentSections) => {
		const newSections = [...currentSections];
		const section = newSections[sectionIndex];

		section.items[itemIndex] = {
			...section.items[itemIndex],
			parallel_timeline: newTimeline
		};

		return newSections;
	});
}

// Function to add parallel activities for positions
export function addParallelActivities(sectionId, activities) {
	const groupId = `parallel-${Date.now()}`;
	const timelines = Object.keys(activities);

	addToHistory(
		'ADD_PARALLEL_ACTIVITIES',
		{ sectionId, activities, groupId },
		'Added parallel activities'
	);

	updateSections((currentSections) => {
		const newSections = [...currentSections];
		const targetSection = newSections.find((s) => s.id === sectionId);

		if (targetSection) {
			// Add each position's activity
			Object.entries(activities).forEach(([timeline, drill]) => {
				if (drill) {
					const newItem = {
						id: drill.id,
						type: 'drill',
						name: drill.name,
						drill: drill,
						duration: drill.duration || 15,
						selected_duration: drill.duration || 15,
						parallel_timeline: timeline,
						parallel_group_id: groupId,
						group_timelines: timelines
					};
					targetSection.items.push(newItem);
				}
			});

			toast.push('Added parallel activities', {
				theme: {
					'--toastBackground': '#4CAF50',
					'--toastColor': 'white'
				}
			});
		}

		return newSections;
	});
}

// Parallel group management functions
export function handleUngroup(groupId) {
	debug('[sectionsStore] Starting ungroup for groupId', groupId);

	if (!groupId) {
		debug('[sectionsStore] No groupId provided');
		return;
	}

	// Get group items before ungrouping for history
	const currentSections = sections;
	const groupItems = [];

	for (const section of currentSections) {
		const sectionGroupItems = section.items.filter((item) => item.parallel_group_id === groupId);
		if (sectionGroupItems.length > 0) {
			groupItems.push(...sectionGroupItems);
		}
	}

	addToHistory('UNGROUP', { groupId, groupItems }, 'Ungrouped parallel drills');

	updateSections((currentSections) => {
		debug('[sectionsStore] Current sections', currentSections);

		return currentSections.map((section) => {
			// Find all items in this group
			const groupItems = section.items.filter((item) => item.parallel_group_id === groupId);

			debug('[sectionsStore] Found group items count', groupItems.length);

			if (groupItems.length === 0) return section;

			// Update all items in the section
			const updatedItems = section.items.map((item) => {
				if (item.parallel_group_id === groupId) {
					// Remove parallel group info but preserve drill information and important properties
					const rest = { ...item };
					const parallelTimeline = rest.parallel_timeline;
					delete rest.parallel_group_id;
					delete rest.parallel_timeline;
					delete rest.groupTimelines;
					return {
						...rest,
						id: item.drill?.id || item.id,
						drill: item.drill || { id: item.id, name: item.name },
						// Preserve these properties when ungrouping with prefixes
						// This allows us to potentially recover them if the item is grouped again
						// without interfering with the normal item structure
						_previous_timeline: parallelTimeline,
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
	const sectionId = selectedSectionId;
	if (!sectionId) return;

	debug(
		'[sectionsStore] createParallelBlock - starting. Global selectedTimelines:',
		Array.from(selectedTimelines)
	);

	if (selectedTimelines.size < 2) {
		toast.push('Please select at least two timelines');
		return;
	}

	updateSections((currentSections) => {
		const newSections = [...currentSections];
		const section = newSections.find((s) => s.id === sectionId);
		if (!section) {
			debug(
				'[sectionsStore] createParallelBlock - section not found for selectedSectionId:',
				sectionId
			);
			return currentSections;
		}

		const parallelGroupId = `group_${Date.now()}`;
		// Capture the timelines at this moment
		const groupTimelines = Array.from(selectedTimelines);

		debug(
			'[sectionsStore] createParallelBlock - captured groupTimelines for new block:',
			groupTimelines
		);

		// Create placeholders with the block's timeline configuration
		const placeholderDrills = groupTimelines.map((timeline) => {
			// Debug the timeline name that will be used
			const timelineName = getTimelineName(timeline);
			debug(`[sectionsStore] Creating placeholder for ${timeline}, using name: ${timelineName}`);

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
					customTimelineColors[timeline] || DEFAULT_TIMELINE_COLORS[timeline] || 'bg-gray-500',
				timeline_name: timelineName // Store the name directly
			};
		});

		debug(
			'[sectionsStore] createParallelBlock - placeholderDrills to be added:',
			placeholderDrills
		);
		section.items = [...section.items, ...placeholderDrills];
		return newSections;
	});

	toast.push('Created parallel block. Drag drills into each timeline.');
	debug('[sectionsStore] createParallelBlock - parallel block created in section:', sectionId);
}

export function updateParallelBlockTimelines(sectionId, parallelGroupId, newTimelines) {
	updateSections((currentSections) => {
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
								customTimelineColors[item.parallel_timeline] ||
								DEFAULT_TIMELINE_COLORS[item.parallel_timeline] ||
								'bg-gray-500',
							timeline_name:
								customTimelineNames[item.parallel_timeline] ||
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
				debug(
					`[sectionsStore] Creating placeholder in updateParallelBlockTimelines for ${timeline}, using name: ${timelineName}`
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
						customTimelineColors[timeline] || DEFAULT_TIMELINE_COLORS[timeline] || 'bg-gray-500',
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
	selectedSectionId = sectionId;

	// Initialize selectedTimelines with the block's current timelines
	const section = sections.find((s) => s.id === sectionId);
	const blockItem = section?.items.find((i) => i.parallel_group_id === parallelGroupId);
	if (blockItem?.groupTimelines) {
		replaceSelectedTimelines(blockItem.groupTimelines);
	}

	// We don't need to set the group name since we're using a fixed group name

	return true; // Return true to indicate the modal should be shown
}

export function handleTimelineSave() {
	if (selectedTimelines.size < 2) {
		toast.push('Please select at least two timelines');
		return false;
	}

	const sectionId = selectedSectionId;
	if (sectionId) {
		const section = sections.find((s) => s.id === sectionId);
		const parallelGroupId = section?.items.find((i) => i.parallel_group_id)?.parallel_group_id;

		if (parallelGroupId) {
			// Updating existing block
			updateParallelBlockTimelines(sectionId, parallelGroupId, Array.from(selectedTimelines));
		} else {
			// Creating new block
			createParallelBlock();
		}
	}

	selectedSectionId = null;
	return true; // Return true to indicate the modal should be closed
}

export function removeTimelineFromGroup(sectionId, parallelGroupId, timeline) {
	updateSections((currentSections) => {
		const section = currentSections.find((s) => s.id === sectionId);
		if (!section) return currentSections;

		// If this is the last or second-to-last timeline, ungroup everything
		const groupItems = section.items.filter((item) => item.parallel_group_id === parallelGroupId);
		if (groupItems.length <= 2) {
			return currentSections.map((s) => ({
				...s,
				items: s.items.map((item) => {
					if (item.parallel_group_id === parallelGroupId) {
						const rest = { ...item };
						const parallelTimeline = rest.parallel_timeline;
						delete rest.parallel_group_id;
						delete rest.parallel_timeline;
						delete rest.groupTimelines;
						return {
							...rest,
							// Preserve these properties when ungrouping with prefixes
							// This allows us to potentially recover them if the item is grouped again
							// without interfering with the normal item structure
							_previous_timeline: parallelTimeline,
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
	const customNames = customTimelineNames;
	debug('[sectionsStore] Current custom timeline names:', customNames);
	debug('[sectionsStore] Current PARALLEL_TIMELINES:', PARALLEL_TIMELINES);

	Object.keys(DEFAULT_TIMELINE_NAMES).forEach((key) => {
		debug(`[sectionsStore] Timeline ${key} name:`, getTimelineName(key));
	});

	return customNames;
}

const totalPlanDuration = $derived.by(() => {
	let total = 0;

	for (const section of sections) {
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

export function getTotalPlanDuration() {
	return totalPlanDuration;
}

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
				const rest = { ...item };
				delete rest.parallel_group_id;
				delete rest.parallel_timeline;
				delete rest.groupTimelines;
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
			const rest = { ...item };
			delete rest.parallel_group_id;
			delete rest.parallel_timeline;
			delete rest.groupTimelines;
			return rest;
		}
		return item;
	});
}

// ------------------------------------------------------
// Drag-and-drop helper APIs used by dragManager
// ------------------------------------------------------

/**
 * Get the current sections value.
 * @returns {Array}
 */
export function getSections() {
	return $state.snapshot(sections);
}

/**
 * Move an item to a new location referenced by stable IDs.
 *
 * @param {object} params
 * @param {string|number} params.itemId - Item ID to move
 * @param {string} params.targetSectionId - ID of section receiving the item
 * @param {string|number|null} [params.targetItemId] - ID of item to position relative to
 * @param {'before'|'after'} [params.position='after'] - Insert position
 * @param {(item:object)=>object} [params.transform] - Optional transform applied to the item
 */
export function moveItem({
	itemId,
	targetSectionId,
	targetItemId = null,
	position = 'after',
	transform
}) {
	// Create backup before operation
	const backup = $state.snapshot(sections);

	try {
		// Validate input parameters
		if (!itemId) {
			console.error('moveItem: itemId is required');
			return false;
		}
		if (!targetSectionId) {
			console.error('moveItem: targetSectionId is required');
			return false;
		}
		if (position && !['before', 'after'].includes(position)) {
			console.error('moveItem: position must be "before" or "after"');
			return false;
		}

		updateSections((secs) => {
			const newSecs = [...secs];

			// Locate the item and its current section
			const srcSectionIndex = newSecs.findIndex((s) => s.items.some((i) => i.id === itemId));
			if (srcSectionIndex === -1) {
				console.error(`moveItem: Item with id ${itemId} not found`);
				throw new Error(`Item with id ${itemId} not found`);
			}

			const srcItems = [...newSecs[srcSectionIndex].items];
			const itemIndex = srcItems.findIndex((i) => i.id === itemId);
			if (itemIndex === -1) {
				console.error(`moveItem: Item with id ${itemId} not found in section`);
				throw new Error(`Item with id ${itemId} not found in section`);
			}

			const [item] = srcItems.splice(itemIndex, 1);

			newSecs[srcSectionIndex] = { ...newSecs[srcSectionIndex], items: srcItems };

			// Optionally transform the item before inserting
			let finalItem;
			try {
				finalItem = transform ? transform(item) : item;
			} catch (transformError) {
				console.error('moveItem: Error in transform function:', transformError);
				throw transformError;
			}

			const targetSectionIndex = newSecs.findIndex((s) => s.id === targetSectionId);
			if (targetSectionIndex === -1) {
				console.error(`moveItem: Target section with id ${targetSectionId} not found`);
				throw new Error(`Target section with id ${targetSectionId} not found`);
			}

			const targetItems = [...newSecs[targetSectionIndex].items];

			let insertIndex = targetItems.length;
			if (targetItemId !== null && targetItemId !== undefined) {
				const idx = targetItems.findIndex((i) => i.id === targetItemId);
				if (idx === -1) {
					console.warn(`moveItem: Target item with id ${targetItemId} not found, adding to end`);
				} else {
					insertIndex = position === 'before' ? idx : idx + 1;
				}
			}

			targetItems.splice(Math.min(insertIndex, targetItems.length), 0, finalItem);
			newSecs[targetSectionIndex] = { ...newSecs[targetSectionIndex], items: targetItems };

			return newSecs;
		});

		addToHistory('MOVE_ITEM', { itemId, targetSectionId, targetItemId, position }, 'Moved item');
		return true;
	} catch (error) {
		console.error('moveItem failed:', error);
		// Restore backup on error
		replaceSections(backup);
		toast.push('Failed to move item: ' + error.message, {
			theme: {
				'--toastBackground': '#f44336',
				'--toastColor': 'white'
			}
		});
		return false;
	}
}

/**
 * Update a single item's properties.
 *
 * @param {string|number} itemId
 * @param {(item:object)=>object} updater
 */
export function updateItem(itemId, updater) {
	updateSections((secs) =>
		secs.map((section) => {
			const idx = section.items.findIndex((i) => i.id === itemId);
			if (idx === -1) return section;
			const items = [...section.items];
			items[idx] = updater(items[idx]);
			return { ...section, items };
		})
	);
}

/**
 * Move a section before or after another section.
 *
 * @param {object} params
 * @param {string} params.sectionId
 * @param {string} params.targetSectionId
 * @param {'before'|'after'} [params.position='after']
 */
export function moveSection({ sectionId, targetSectionId, position = 'after' }) {
	// Create backup before operation
	const backup = $state.snapshot(sections);

	try {
		// Validate input parameters
		if (!sectionId) {
			console.error('moveSection: sectionId is required');
			return false;
		}
		if (!targetSectionId) {
			console.error('moveSection: targetSectionId is required');
			return false;
		}
		if (sectionId === targetSectionId) {
			console.error('moveSection: Cannot move section to itself');
			return false;
		}
		if (position && !['before', 'after'].includes(position)) {
			console.error('moveSection: position must be "before" or "after"');
			return false;
		}

		updateSections((secs) => {
			const newSecs = [...secs];
			const srcIndex = newSecs.findIndex((s) => s.id === sectionId);
			const targetIndex = newSecs.findIndex((s) => s.id === targetSectionId);

			if (srcIndex === -1) {
				console.error(`moveSection: Section with id ${sectionId} not found`);
				throw new Error(`Section with id ${sectionId} not found`);
			}
			if (targetIndex === -1) {
				console.error(`moveSection: Target section with id ${targetSectionId} not found`);
				throw new Error(`Target section with id ${targetSectionId} not found`);
			}

			const [section] = newSecs.splice(srcIndex, 1);

			let insertIndex = targetIndex;
			if (position === 'after') {
				insertIndex = srcIndex < targetIndex ? targetIndex : targetIndex + 1;
			} else {
				insertIndex = srcIndex < targetIndex ? targetIndex - 1 : targetIndex;
			}

			insertIndex = Math.max(0, Math.min(insertIndex, newSecs.length));
			newSecs.splice(insertIndex, 0, section);

			return newSecs.map((s, i) => ({ ...s, order: i }));
		});

		addToHistory('MOVE_SECTION', { sectionId, targetSectionId, position }, 'Moved section');
		return true;
	} catch (error) {
		console.error('moveSection failed:', error);
		// Restore backup on error
		replaceSections(backup);
		toast.push('Failed to move section: ' + error.message, {
			theme: {
				'--toastBackground': '#f44336',
				'--toastColor': 'white'
			}
		});
		return false;
	}
}

/**
 * Replace the entire sections array.
 * @param {Array} newSections
 */
export function setSections(newSections) {
	replaceSections(newSections);
}
