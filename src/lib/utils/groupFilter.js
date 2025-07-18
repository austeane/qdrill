export function getAvailableGroupFilters(sections) {
  const filters = new Set(['All Groups']);
  sections.forEach(section => {
    section.items?.forEach(item => {
      if (item.parallel_timeline) {
        filters.add(item.parallel_timeline);
      }
    });
  });
  return Array.from(filters);
}

export function filterSectionsByGroup(sections, selectedGroup) {
  if (selectedGroup === 'All Groups') return sections;
  return sections
    .map(section => {
      const items = section.items?.filter(
        item => item.parallel_timeline === selectedGroup
      ) || [];
      return { ...section, items };
    })
    .filter(section => section.items.length > 0);
}
