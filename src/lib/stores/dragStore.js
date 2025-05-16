import { writable, get } from 'svelte/store';
import { sections } from './sectionsStore';
import { addToHistory } from './historyStore';

// Drag state stores
export const draggedItem = writable(null);
export const draggedGroup = writable(null);
export const draggedSection = writable(null);

export const dragOverItem = writable(null);
export const dragOverGroupSection = writable(null);
export const dragOverSection = writable(null);

export const dragOverPosition = writable(null); // 'top', 'middle', or 'bottom'
export const sectionDragPosition = writable(null); // 'top' or 'bottom'
export const groupDragPosition = writable(null); // 'top' or 'bottom'

// Item drag functions
export function handleDragStart(e, sectionIndex, itemIndex) {
	const sectionsList = get(sections);
	const item = sectionsList[sectionIndex].items[itemIndex];

	// Set type based on whether item is part of a group
	draggedItem.set({
		sectionIndex,
		itemIndex,
		type: item.parallel_group_id ? 'group' : 'drill'
	});

	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', JSON.stringify({ sectionIndex, itemIndex }));
}

export function handleDragOver(e, sectionIndex, itemIndex) {
	e.preventDefault();
	e.stopPropagation();

	if (!get(draggedItem)) return;

	const targetElement = e.currentTarget;
	const rect = targetElement.getBoundingClientRect();
	const y = e.clientY - rect.top;

	// Clear previous drag indicators
	targetElement.classList.remove(
		'border-t-4',
		'border-t-blue-500',
		'border-b-4',
		'border-b-blue-500',
		'bg-blue-100',
		'scale-95'
	);

	// If we're in the same section, allow grouping in the middle zone
	if (get(draggedItem).sectionIndex === sectionIndex) {
		// Make the middle zone larger (40% of height)
		const middleZoneStart = rect.height * 0.3;
		const middleZoneEnd = rect.height * 0.7;

		if (y < middleZoneStart) {
			dragOverPosition.set('top');
			targetElement.classList.add('border-t-4', 'border-t-blue-500');
		} else if (y > middleZoneEnd) {
			dragOverPosition.set('bottom');
			targetElement.classList.add('border-b-4', 'border-b-blue-500');
		} else {
			dragOverPosition.set('middle');
			targetElement.classList.add('bg-blue-100', 'scale-95');
		}
	} else {
		// For different sections, use a simpler top/bottom split
		if (y < rect.height / 2) {
			dragOverPosition.set('top');
			targetElement.classList.add('border-t-4', 'border-t-blue-500');
		} else {
			dragOverPosition.set('bottom');
			targetElement.classList.add('border-b-4', 'border-b-blue-500');
		}
	}

	dragOverItem.set({ sectionIndex, itemIndex });
}

export function handleDragLeave(e) {
	e.currentTarget.classList.remove(
		'bg-blue-100',
		'scale-95',
		'transform',
		'border-t-4',
		'border-t-blue-500',
		'border-b-4',
		'border-b-blue-500'
	);
	dragOverPosition.set(null);
}

export function handleDrop(e, sectionIndex, itemIndex, targetTimeline = null) {
	e.preventDefault();
	e.stopPropagation();

	const draggedItemValue = get(draggedItem);
	if (!draggedItemValue) return;

	// Create history snapshot before the move
	const sourceSectionIndex = draggedItemValue.sectionIndex;
	const sourceItemIndex = draggedItemValue.itemIndex;

	// Get the original item for history
	const currentSections = get(sections);
	const sourceSection = currentSections[sourceSectionIndex];
	const movedItem = sourceSection?.items[sourceItemIndex];

	if (!movedItem) return;

	const targetSection = currentSections[sectionIndex];
	const targetItem = targetSection?.items[itemIndex];

	// Add to history with relevant details
	addToHistory(
		'MOVE_ITEM',
		{
			sourceSectionIndex,
			sourceItemIndex,
			targetSectionIndex: sectionIndex,
			targetItemIndex: itemIndex,
			movedItem,
			targetTimeline
		},
		`Moved "${movedItem.name || 'Item'}" to ${targetTimeline ? `${targetTimeline} timeline` : 'new position'}`
	);

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const sourceSection = newSections[draggedItemValue.sectionIndex];
		const targetSection = newSections[sectionIndex];

		if (!sourceSection || !targetSection) return currentSections;

		const [movedItem] = sourceSection.items.splice(draggedItemValue.itemIndex, 1);

		// If dropping into a timeline column within a group
		if (targetTimeline) {
			// Get the target group's ID from an existing item
			const targetGroupItem = targetSection.items.find(
				(item) => item.parallel_timeline === targetTimeline
			);

			if (targetGroupItem) {
				movedItem.parallel_group_id = targetGroupItem.parallel_group_id;
				movedItem.parallel_timeline = targetTimeline;
				movedItem.groupTimelines = targetGroupItem.groupTimelines;
			}
		}

		// Calculate insert position
		let insertIndex = itemIndex;
		const dragOverPositionValue = get(dragOverPosition);
		if (dragOverPositionValue === 'bottom') {
			insertIndex++;
		}

		// If we're moving within the same parallel group, maintain the timeline
		if (movedItem.parallel_group_id && !targetTimeline) {
			const targetItem = targetSection.items[itemIndex];
			if (targetItem?.parallel_group_id === movedItem.parallel_group_id) {
				movedItem.parallel_timeline = targetItem.parallel_timeline;
			}
		}

		targetSection.items.splice(insertIndex, 0, movedItem);
		return newSections;
	});

	draggedItem.set(null);
	dragOverPosition.set(null);
}

// Section drag functions
export function handleSectionDragStart(e, sectionIndex) {
	draggedSection.set(sectionIndex);
	e.dataTransfer.effectAllowed = 'move';
}

export function handleSectionDragOver(e, sectionIndex) {
	e.preventDefault();
	const draggedSectionValue = get(draggedSection);
	if (draggedSectionValue === null || draggedSectionValue === sectionIndex) return;

	const rect = e.currentTarget.getBoundingClientRect();
	const y = e.clientY - rect.top;

	// Determine if we're in the top or bottom half
	const position = y < rect.height / 2 ? 'top' : 'bottom';
	sectionDragPosition.set(position);
	dragOverSection.set(sectionIndex);

	// Remove existing indicators
	e.currentTarget.classList.remove('border-t-4', 'border-b-4');

	// Add visual indicator
	if (position === 'top') {
		e.currentTarget.classList.add('border-t-4');
	} else {
		e.currentTarget.classList.add('border-b-4');
	}
}

export function handleSectionDragLeave(e) {
	e.currentTarget.classList.remove('border-t-4', 'border-b-4');
	dragOverSection.set(null);
	sectionDragPosition.set(null);
}

export function handleSectionDrop(e, sectionIndex) {
	e.preventDefault();
	e.currentTarget.classList.remove('border-t-4', 'border-b-4');

	const draggedSectionValue = get(draggedSection);
	if (draggedSectionValue === null || draggedSectionValue === sectionIndex) return;

	// Add to history before making the change
	const currentSections = get(sections);
	const sourceSection = currentSections[draggedSectionValue];

	addToHistory(
		'MOVE_SECTION',
		{ sourceIndex: draggedSectionValue, targetIndex: sectionIndex },
		`Moved section "${sourceSection?.name || 'Section'}"`
	);

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const [movedSection] = newSections.splice(draggedSectionValue, 1);

		// Calculate insert position
		let insertIndex = sectionIndex;
		const sectionDragPositionValue = get(sectionDragPosition);
		if (sectionDragPositionValue === 'bottom') {
			insertIndex++;
		}
		// Adjust index if we're moving to a later position
		if (draggedSectionValue < sectionIndex) {
			insertIndex--;
		}

		newSections.splice(insertIndex, 0, movedSection);

		// Update order property for all sections
		return newSections.map((section, index) => ({
			...section,
			order: index
		}));
	});

	draggedSection.set(null);
	dragOverSection.set(null);
	sectionDragPosition.set(null);
}

// Parallel group drag functions
export function handleParallelGroupDragStart(e, sectionIndex, groupId) {
	draggedGroup.set({ sectionIndex, groupId });
	e.dataTransfer.effectAllowed = 'move';
	e.dataTransfer.setData('text/plain', JSON.stringify({ sectionIndex, groupId }));
}

export function handleParallelGroupDragOver(e, sectionIndex) {
	e.preventDefault();
	e.stopPropagation();

	if (!get(draggedGroup)) return;

	const rect = e.currentTarget.getBoundingClientRect();
	const y = e.clientY - rect.top;

	e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');

	const position = y < rect.height / 2 ? 'top' : 'bottom';
	groupDragPosition.set(position);

	if (position === 'top') {
		e.currentTarget.classList.add('border-t-4', 'border-blue-500');
	} else {
		e.currentTarget.classList.add('border-b-4', 'border-blue-500');
	}

	dragOverGroupSection.set(sectionIndex);
}

export function handleParallelGroupDragLeave(e) {
	e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');
}

export function handleParallelGroupDrop(e, sectionIndex) {
	e.preventDefault();
	e.stopPropagation();

	e.currentTarget.classList.remove('border-t-4', 'border-b-4', 'border-blue-500');

	const draggedGroupValue = get(draggedGroup);
	if (!draggedGroupValue) return;

	sections.update((current) => {
		const newSections = [...current];
		const sourceSection = newSections[draggedGroupValue.sectionIndex];
		const targetSection = newSections[sectionIndex];
		if (!sourceSection || !targetSection) return current;

		const groupItems = removeGroup(sourceSection.items, draggedGroupValue.groupId);

		const groupDragPositionValue = get(groupDragPosition);
		let insertIndex;
		if (groupDragPositionValue === 'top') {
			insertIndex = 0;
		} else {
			insertIndex = targetSection.items.length;
		}

		targetSection.items.splice(insertIndex, 0, ...groupItems);

		return newSections;
	});

	draggedGroup.set(null);
	dragOverGroupSection.set(null);
	groupDragPosition.set(null);
}

// Helper function for removing a group of items
function removeGroup(items, groupId) {
	const chunk = [];
	for (let i = items.length - 1; i >= 0; i--) {
		if (items[i].parallel_group_id === groupId) {
			chunk.unshift(items[i]);
			items.splice(i, 1);
		}
	}
	return chunk;
}

// Empty section drop handler
export function handleEmptySectionDrop(e, sectionIndex) {
	e.preventDefault();
	e.stopPropagation();

	const draggedItemValue = get(draggedItem);
	if (!draggedItemValue) return;

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const sourceSection = newSections[draggedItemValue.sectionIndex];
		const targetSection = newSections[sectionIndex];

		if (!sourceSection || !targetSection) return currentSections;

		// Remove item from source section
		const [movedItem] = sourceSection.items.splice(draggedItemValue.itemIndex, 1);

		// Add to target section
		targetSection.items.push(movedItem);

		return newSections;
	});

	draggedItem.set(null);
	dragOverItem.set(null);
	dragOverPosition.set(null);
}

// Top of section drop handler
export function handleDropOnTop(e, sectionIndex) {
	e.preventDefault();
	e.stopPropagation();

	console.log('[DEBUG] Drop on top:', {
		sectionIndex,
		draggedItem: get(draggedItem),
		draggedGroup: get(draggedGroup)
	});

	const draggedItemValue = get(draggedItem);
	const draggedGroupValue = get(draggedGroup);

	if (!draggedItemValue && !draggedGroupValue) return;

	sections.update((currentSections) => {
		const newSections = [...currentSections];
		const targetSection = newSections[sectionIndex];

		if (draggedItemValue) {
			const sourceSection = newSections[draggedItemValue.sectionIndex];
			const [movedItem] = sourceSection.items.splice(draggedItemValue.itemIndex, 1);
			targetSection.items.unshift(movedItem);
		} else if (draggedGroupValue) {
			const sourceSection = newSections[draggedGroupValue.sectionIndex];
			const groupItems = sourceSection.items.filter(
				(item) => item.parallel_group_id === draggedGroupValue.groupId
			);
			sourceSection.items = sourceSection.items.filter(
				(item) => item.parallel_group_id !== draggedGroupValue.groupId
			);
			targetSection.items.unshift(...groupItems);
		}

		return newSections;
	});

	draggedItem.set(null);
	draggedGroup.set(null);
	dragOverPosition.set(null);
}
