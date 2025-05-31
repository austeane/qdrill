import { writable } from 'svelte/store';
import { page } from '$app/stores';
import { get } from 'svelte/store';

function createCartStore() {
	const initialDrills =
		typeof window !== 'undefined' && localStorage.getItem('cartDrills')
			? JSON.parse(localStorage.getItem('cartDrills'))
			: [];

	const { subscribe, set, update } = writable(initialDrills);

	return {
		subscribe,
               addDrill: (drill) => {
                        // Check authentication before adding
                        const currentPage = get(page);
                        if (!currentPage.data?.session?.user) {
                                console.warn('User must be authenticated to add drills to cart');
                                return false;
                        }

                        update((items) => {
                                if (!items.find((d) => d.id === drill.id)) {
                                        const updatedDrills = [...items, drill];
                                        if (typeof window !== 'undefined') {
                                                localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
                                        }
                                        return updatedDrills;
                                }
                                return items;
                        });
                        return true;
               },
		removeDrill: (id) => {
			update((items) => {
				const updatedDrills = items.filter((d) => d.id !== id);
				if (typeof window !== 'undefined') {
					localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
				}
				return updatedDrills;
			});
		},
		toggleDrill: (drill) => {
			update((items) => {
				const index = items.findIndex((d) => d.id === drill.id);
				let updatedDrills;
				if (index === -1) {
					updatedDrills = [...items, drill];
				} else {
					updatedDrills = items.filter((d) => d.id !== drill.id);
				}
				if (typeof window !== 'undefined') {
					localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
				}
				return updatedDrills;
			});
		},
		clear: () => {
			set([]);
			if (typeof window !== 'undefined') {
				localStorage.removeItem('cartDrills');
			}
		}
	};
}

export const cart = createCartStore();
