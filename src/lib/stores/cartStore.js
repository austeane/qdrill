import { writable } from 'svelte/store';

function createCartStore() {
  const storedDrills = typeof window !== 'undefined' && localStorage.getItem('cartDrills')
    ? JSON.parse(localStorage.getItem('cartDrills'))
    : [];

  const { subscribe, set, update } = writable(storedDrills);

  return {
    subscribe,
    addDrill: (drill) => {
      update(drills => {
        if (!drills.find(d => d.id === drill.id)) {
          const updatedDrills = [...drills, drill];
          localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
          return updatedDrills;
        }
        return drills;
      });
    },
    removeDrill: (id) => {
      update(drills => {
        const updatedDrills = drills.filter(d => d.id !== id);
        localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
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
        localStorage.setItem('cartDrills', JSON.stringify(updatedDrills));
        return updatedDrills;
      });
    },
    clearCart: () => {
      set([]);
      localStorage.removeItem('cartDrills');
    },
    loadFromStorage: () => {
      if (typeof window !== 'undefined') {
        const storedDrills = localStorage.getItem('cartDrills');
        if (storedDrills) {
          set(JSON.parse(storedDrills));
        }
      }
    },
  };
}

export const cart = createCartStore();