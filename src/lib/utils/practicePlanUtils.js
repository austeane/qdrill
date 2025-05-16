// Helper function to normalize practice plan items for database submission
// Handles parallel groups and maps 'one-off' type correctly.
export function normalizeItems(items) {
	const normalized = [];
	const processedGroups = new Set();

	items.forEach((item) => {
		if (item.parallel_group_id) {
			if (!processedGroups.has(item.parallel_group_id)) {
				processedGroups.add(item.parallel_group_id);

				// Get all items in the same group
				const groupItems = items.filter((i) => i.parallel_group_id === item.parallel_group_id);

				// Add each item with its own duration and timeline details
				groupItems.forEach((groupItem) => {
					const itemId = groupItem.drill?.id || groupItem.id;
					const numericId =
						typeof itemId === 'string' && !isNaN(parseInt(itemId)) ? parseInt(itemId) : itemId;

					let drillId = null;
					// One-off drills are identified by negative numeric ID or type 'one-off'
					if (
						groupItem.type === 'one-off' ||
						(typeof groupItem.id === 'number' && groupItem.id < 0)
					) {
						drillId = null;
					} else if (groupItem.type === 'drill') {
						// Ensure drill_id is correctly assigned from drill object if available
						drillId = groupItem.drill_id || groupItem.drill?.id || null;
					}

					let itemName = '';
					if (groupItem.type === 'break') {
						itemName = groupItem.name || 'Break';
					} else if (groupItem.type === 'one-off') {
						itemName = groupItem.name || 'Quick Activity';
					} else {
						itemName = groupItem.name || groupItem.drill?.name || '';
					}

					normalized.push({
						id: numericId, // Use the potentially converted numeric ID
						type: groupItem.type === 'one-off' ? 'drill' : groupItem.type, // Map 'one-off' to 'drill' type for DB
						name: itemName,
						duration: parseInt(groupItem.selected_duration || groupItem.duration, 10),
						drill_id: drillId, // Use the determined drillId
						diagram_data: groupItem.diagram_data || null,
						parallel_group_id: groupItem.parallel_group_id,
						parallel_timeline: groupItem.parallel_timeline || null,
						// Include timeline details if available
						timeline_name: groupItem.timeline_name || null,
						timeline_color: groupItem.timeline_color || null,
						// Include groupTimelines to store all timelines in the group for reconstruction
						groupTimelines: groupItem.groupTimelines || null
					});
				});
			}
		} else {
			// Non-parallel items
			const itemId = item.drill?.id || item.id;
			const numericId =
				typeof itemId === 'string' && !isNaN(parseInt(itemId)) ? parseInt(itemId) : itemId;

			let drillId = null;
			if (item.type === 'one-off' || (typeof item.id === 'number' && item.id < 0)) {
				drillId = null;
			} else if (item.type === 'drill') {
				drillId = item.drill_id || item.drill?.id || null;
			}

			let itemName = '';
			if (item.type === 'break') {
				itemName = item.name || 'Break';
			} else if (item.type === 'one-off') {
				itemName = item.name || 'Quick Activity';
			} else {
				itemName = item.name || item.drill?.name || '';
			}

			normalized.push({
				id: numericId,
				type: item.type === 'one-off' ? 'drill' : item.type,
				name: itemName,
				duration: parseInt(item.selected_duration || item.duration, 10),
				drill_id: drillId,
				diagram_data: item.diagram_data || null,
				parallel_group_id: null,
				parallel_timeline: null,
				timeline_name: null, // Ensure these are null for non-parallel
				timeline_color: null,
				groupTimelines: null
			});
		}
	});
	return normalized;
}
