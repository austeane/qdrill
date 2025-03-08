import { writable, derived, get } from 'svelte/store';

// Pagination stores
export const currentPage = writable(1);
export const formationsPerPage = writable(10);
export const totalPages = writable(1);
export const isLoading = writable(false);

// Data stores
export const formations = writable([]);
export const allFormations = writable([]);
export const allFormationsLoaded = writable(false);

// Filter stores
export const selectedTags = writable({});
export const searchQuery = writable('');
export const selectedFormationType = writable(null);

// Function to sort formations consistently
function sortFormations(formations, sortOption = null, sortOrder = 'desc') {
  return [...formations].sort((a, b) => {
    if (!sortOption) {
      // Default sort by date_created DESC
      return new Date(b.created_at) - new Date(a.created_at);
    }

    let comparison = 0;
    switch (sortOption) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        comparison = new Date(a.created_at) - new Date(b.created_at);
        break;
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// Function to fetch all formations
export async function fetchAllFormations() {
  if (get(allFormationsLoaded)) return;
  
  try {
    isLoading.set(true);
    const response = await fetch('/api/formations?all=true');
    if (!response.ok) throw new Error('Failed to fetch all formations');
    
    const data = await response.json();
    
    // Sort the formations before storing them
    const sortedFormations = sortFormations(data.items);
    
    allFormations.set(sortedFormations);
    allFormationsLoaded.set(true);
    
    return data;
  } catch (error) {
    console.error('Error fetching all formations:', error);
    throw error;
  } finally {
    isLoading.set(false);
  }
}

// Function to fetch paginated formations
export async function fetchFormations(page = 1, limit = 10, params = new URLSearchParams()) {
  isLoading.set(true);
  try {
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    const response = await fetch(`/api/formations?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch formations');
    
    const data = await response.json();
    
    formations.set(data.items);
    currentPage.set(data.pagination.page);
    totalPages.set(data.pagination.totalPages);
    
    return data;
  } catch (error) {
    console.error('Error fetching formations:', error);
    throw error;
  } finally {
    isLoading.set(false);
  }
}

// Filtered formations
export const filteredFormations = derived(
  [allFormations, allFormationsLoaded, selectedTags, searchQuery, selectedFormationType],
  ([$allFormations, $allFormationsLoaded, $selectedTags, $searchQuery, $selectedFormationType]) => {
    
    if (!$allFormationsLoaded) return [];

    let filtered = [...$allFormations];

    // Apply filters
    filtered = filtered.filter(formation => {
      // Apply tag filtering
      const tagsMatch = Object.entries($selectedTags)
        .every(([tag, selected]) => {
          if (!selected) return true;
          return formation.tags?.includes(tag);
        });

      // Formation type filtering
      const typeMatch = !$selectedFormationType || 
        formation.formation_type === $selectedFormationType;

      // Search query
      const searchMatch = !$searchQuery || 
        formation.name.toLowerCase().includes($searchQuery.toLowerCase()) ||
        formation.brief_description?.toLowerCase().includes($searchQuery.toLowerCase()) ||
        formation.detailed_description?.toLowerCase().includes($searchQuery.toLowerCase());

      return tagsMatch && typeMatch && searchMatch;
    });

    // Default sort by creation date, newest first
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered;
  }
);

// Function to initialize formations data
export function initializeFormations(data) {
  formations.set(data.items || []);
  if (data.pagination) {
    currentPage.set(data.pagination.page);
    totalPages.set(data.pagination.totalPages);
  }
}