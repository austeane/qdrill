const groupColors = new Map();

const colorPalette = [
	'#3B82F6', // Blue
	'#EF4444', // Red
	'#F59E0B', // Amber
	'#10B981', // Green
	'#8B5CF6', // Purple
	'#EC4899', // Pink
	'#14B8A6', // Teal
	'#F97316', // Orange
	'#0EA5E9', // Sky
	'#A855F7' // Violet
];

let colorIndex = 0;

export function getGroupColor(groupName) {
	if (!groupName) return '#6B7280';
	if (!groupColors.has(groupName)) {
		groupColors.set(groupName, colorPalette[colorIndex % colorPalette.length]);
		colorIndex++;
	}
	return groupColors.get(groupName);
}
