import { writable } from 'svelte/store';

function createCartStore() {
	let initialDrills = [];
	
	// Safely parse localStorage with error handling
	if (typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem('cartDrills');
			if (stored) {
				const parsed = JSON.parse(stored);
				// Ensure it's an array
				if (Array.isArray(parsed)) {
					initialDrills = parsed;
				}
			}
		} catch (error) {
			console.error('Error loading cart from localStorage:', error);
			// Clear corrupted data
			try {
				localStorage.removeItem('cartDrills');
			} catch (e) {
				// Ignore if we can't clear it
			}
		}
	}

	const { subscribe, set, update } = writable(initialDrills);

	return {
		subscribe,
		addDrill: (drill) => {
			if (!drill || !drill.id) {
				console.warn('Attempted to add invalid drill to cart:', drill);
				return;
			}
			update((items) => {
				// Ensure items is an array
				const currentItems = Array.isArray(items) ? items : [];
				if (!currentItems.find((d) => d.id === drill.id)) {
					const updatedDrills = [...currentItems, drill];
					if (typeof window !== 'undefined') {
						try {
							localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
						} catch (error) {
							console.error('Error saving cart to localStorage:', error);
						}
					}
					return updatedDrills;
				}
				return currentItems;
			});
		},
		removeDrill: (id) => {
			if (!id) {
				console.warn('Attempted to remove drill with invalid id:', id);
				return;
			}
			update((items) => {
				// Ensure items is an array
				const currentItems = Array.isArray(items) ? items : [];
				const updatedDrills = currentItems.filter((d) => d.id !== id);
				if (typeof window !== 'undefined') {
					try {
						localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
					} catch (error) {
						console.error('Error saving cart to localStorage:', error);
					}
				}
				return updatedDrills;
			});
		},
		toggleDrill: (drill) => {
			if (!drill || !drill.id) {
				console.warn('Attempted to toggle invalid drill in cart:', drill);
				return;
			}
			update((items) => {
				// Ensure items is an array
				const currentItems = Array.isArray(items) ? items : [];
				const index = currentItems.findIndex((d) => d.id === drill.id);
				let updatedDrills;
				if (index === -1) {
					updatedDrills = [...currentItems, drill];
				} else {
					updatedDrills = currentItems.filter((d) => d.id !== drill.id);
				}
				if (typeof window !== 'undefined') {
					try {
						localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
					} catch (error) {
						console.error('Error saving cart to localStorage:', error);
					}
				}
				return updatedDrills;
			});
		},
		clear: () => {
			set([]);
			if (typeof window !== 'undefined') {
				try {
					localStorage.removeItem('cartDrills');
				} catch (error) {
					console.error('Error clearing cart from localStorage:', error);
				}
			}
		}
	};
}

export const cart = createCartStore();
