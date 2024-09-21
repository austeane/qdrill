import { writable } from 'svelte/store';

function createCartStore() {
  const initialDrills = typeof window !== 'undefined' && localStorage.getItem('cartDrills')
    ? JSON.parse(localStorage.getItem('cartDrills'))
    : [];

  const { subscribe, set, update } = writable(initialDrills);

  return {
    subscribe,
    addDrill: (drill) => {
      update(drills => {
        if (!drills.find(d => d.id === drill.id)) {
          const updatedDrills = [...drills, drill];
          if (typeof window !== 'undefined') {
            localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
          }
          return updatedDrills;
        }
        return drills;
      });
    },
    removeDrill: (id) => {
      update(drills => {
        const updatedDrills = drills.filter(d => d.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
        }
        return updatedDrills;
      });
    },
    toggleDrill: (drill) => {
      update(drills => {
        const index = drills.findIndex(d => d.id === drill.id);
        let updatedDrills;
        if (index === -1) {
          updatedDrills = [...drills, drill];
        } else {
          updatedDrills = drills.filter(d => d.id !== drill.id);
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
    },
    // Remove loadFromStorage method as it's no longer needed
  };
}

export const cart = createCartStore();