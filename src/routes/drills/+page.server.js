import { drillService } from '$lib/server/services/drillService.js';

export async function load({ fetch, url }) {
    try {
        const params = new URLSearchParams(url.search);
        const page = parseInt(params.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
        const sortBy = params.get('sort');
        const sortOrder = params.get('order') || 'desc';
        
        console.log('Loading drills with params:', {
            page,
            limit,
            sortBy,
            sortOrder,
            allParams: Object.fromEntries(params.entries())
        });
        
        // Define options for the service call
        const serviceOptions = { page, limit, sortBy, sortOrder };
        // Define filters (currently none, but could be added from params)
        const filters = {}; 

        // Fetch drills from service and filter options from API in parallel
        const [drillsResult, filterOptionsResponse] = await Promise.all([
            drillService.getFilteredDrills(filters, serviceOptions),
            fetch('/api/drills/filter-options')
        ]);

        if (!filterOptionsResponse.ok) {
            throw new Error('Failed to fetch filter options');
        }

        const [drillsData, filterOptions] = await Promise.all([
            Promise.resolve(drillsResult),
            filterOptionsResponse.json()
        ]);

        return {
            drills: drillsData.items,
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