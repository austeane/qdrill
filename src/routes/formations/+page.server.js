import { formationService } from '$lib/server/services/formationService.js';

/**
 * Load function for the formations list page.
 * Fetches filtered, sorted, and paginated formations based on URL query parameters.
 */
export async function load({ url }) {
    try {
        // Pagination
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        // Sorting
        const sortBy = url.searchParams.get('sort') || 'created_at'; // Default sort
        const sortOrder = url.searchParams.get('order') || 'desc';

        // Filters
        const filters = {};
        const tagsParam = url.searchParams.get('tags'); 
        if (tagsParam) {
            filters.tags = tagsParam.split(',').map(t => t.trim()).filter(t => t);
        }
        filters.formation_type = url.searchParams.get('type');
        filters.searchQuery = url.searchParams.get('q');

        // Remove undefined/null filters
        Object.keys(filters).forEach(key => 
            (filters[key] === undefined || filters[key] === null || filters[key] === '') && delete filters[key]
        );

        console.log('Loading formations page with:', {
            page,
            limit,
            sortBy,
            sortOrder,
            filters
        });

        // Define options for the service call
        const sortOptions = { sortBy, sortOrder };
        const paginationOptions = { 
            page, 
            limit, 
            columns: ['id', 'name', 'brief_description', 'tags', 'formation_type', 'created_at'] 
        };
        // Pass userId to filters (assuming null if not logged in, handled by service)
        // const session = await locals.getSession(); // Need locals if getting session
        // filters.userId = session?.user?.id;
        // NOTE: Getting session in load requires passing `locals` to the function
        // Since this is a public list page, we might skip userId filtering here 
        // unless we specifically want to show private formations owned by the user on this page.
        // For now, we'll assume the default public/unlisted filtering in the service is sufficient.

        // Fetch formations using the service
        // Pass combined options to the base getAll method
        const formationsResult = await formationService.getAll({
            filters,
            sort: sortOptions, 
            pagination: paginationOptions
        });

        // TODO: Fetch filter options if needed (e.g., list of all tags, all formation types)
        // const filterOptions = await fetchFilterOptions(); 
        
        return {
            items: formationsResult.items,
            pagination: formationsResult.pagination,
            // filterOptions: filterOptions // Pass filter options if fetched
        };

    } catch (error) {
        console.error('Error loading formations page:', error);
        // Return an error structure
        return {
            status: 500,
            error: 'Failed to load formations',
            items: [],
            pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
            // filterOptions: {} 
        };
    }
}

// Example function to fetch filter options (implement if needed)
// async function fetchFilterOptions() {
//     // Fetch distinct tags and types from the database or a dedicated endpoint
//     // Example: const tags = await db.query('SELECT DISTINCT unnest(tags) as tag FROM formations ORDER BY tag');
//     //          const types = await db.query('SELECT DISTINCT formation_type FROM formations ORDER BY formation_type');
//     // return { tags: tags.rows.map(r => r.tag), types: types.rows.map(r => r.formation_type) };
//     return {}; // Placeholder
// } 