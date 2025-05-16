export async function load({ fetch }) {
	try {
		// Fetch all drills for validation using the all parameter
		const response = await fetch('/api/drills?all=true');
		if (!response.ok) {
			throw new Error('Failed to fetch drills for bulk upload');
		}
		const drills = await response.json();

		return { drills: drills.drills };
	} catch (error) {
		console.error('Error fetching drills for bulk upload:', error);
		return { status: 500, error: 'Internal Server Error' };
	}
}
