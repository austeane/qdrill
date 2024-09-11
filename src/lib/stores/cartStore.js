import { writable } from 'svelte/store';

function createCartStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    addDrill: (drill) => update(drills => {
      const updatedDrills = [...drills, drill];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
      }
      return updatedDrills;
    }),
    removeDrill: (id) => update(drills => drills.filter(d => d.id !== id)),
    loadFromStorage: () => {
      if (typeof window !== 'undefined') {
        const storedDrills = localStorage.getItem('cartDrills');
        if (storedDrills) {
          set(JSON.parse(storedDrills));
        }
      }
    },
    saveToStorage: (drills) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cartDrills', JSON.stringify(drills));
      }
    }
  };
}

export const cart = createCartStore();