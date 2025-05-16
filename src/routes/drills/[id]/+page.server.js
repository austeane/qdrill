export async function load({ params, fetch }) {
	const { id } = params;
	console.log('[Page Server] Loading drill with ID:', id);

	try {
		const response = await fetch(`/api/drills/${id}?includeVariants=true`);

		if (!response.ok) {
			throw new Error('Failed to fetch drill details');
		}

		const drill = await response.json();

		return { drill };
	} catch (error) {
		console.error('[Page Server] Error:', error);
		return { status: 500, error: 'Internal Server Error' };
	}
}
