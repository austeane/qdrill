export async function load({ fetch, url }) {
    try {
        const params = new URLSearchParams(url.search);
        const page = params.get('page') || 1;
        const limit = params.get('limit') || 9;
        
        console.log('Loading drills with params:', {
            page,
            limit,
            allParams: Object.fromEntries(params.entries())
        });
        
        // Forward all query parameters to the API
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        
        // Fetch paginated drills and filter options in parallel
        const [drillsResponse, filterOptionsResponse] = await Promise.all([
            fetch(`/api/drills?${params.toString()}`),
            fetch('/api/drills/filter-options')
        ]);

        if (!drillsResponse.ok || !filterOptionsResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const [drillsData, filterOptions] = await Promise.all([
            drillsResponse.json(),
            filterOptionsResponse.json()
        ]);

        return {
            drills: drillsData.drills,
            pagination: drillsData.pagination,
            filterOptions
        };
    } catch (error) {
        console.error('Error loading drills:', error);
        return {
            status: 500,
            error: 'Failed to load drills'
        };
    }
}