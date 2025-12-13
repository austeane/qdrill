function loadCartDrills() {
	// SSR-safe defaults
	if (typeof window === 'undefined') return [];

	try {
		const stored = localStorage.getItem('cartDrills');
		if (!stored) return [];

		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		console.error('Error loading cart from localStorage:', error);

		// Clear corrupted data
		try {
			localStorage.removeItem('cartDrills');
		} catch {
			// Ignore if we can't clear it
		}

		return [];
	}
}

class CartStore {
	drills = $state(loadCartDrills());

	persist() {
		if (typeof window === 'undefined') return;

		try {
			if (this.drills.length === 0) {
				localStorage.removeItem('cartDrills');
				return;
			}

			localStorage.setItem('cartDrills', JSON.stringify(this.drills));
		} catch (error) {
			console.error('Error saving cart to localStorage:', error);
		}
	}

	addDrill(drill) {
		if (!drill || !drill.id) {
			console.warn('Attempted to add invalid drill to cart:', drill);
			return;
		}

		if (this.drills.some((d) => d.id === drill.id)) return;
		this.drills = [...this.drills, drill];
		this.persist();
	}

	removeDrill(id) {
		if (!id) {
			console.warn('Attempted to remove drill with invalid id:', id);
			return;
		}
		this.drills = this.drills.filter((d) => d.id !== id);
		this.persist();
	}

	toggleDrill(drill) {
		if (!drill || !drill.id) {
			console.warn('Attempted to toggle invalid drill in cart:', drill);
			return;
		}

		if (this.drills.some((d) => d.id === drill.id)) {
			this.removeDrill(drill.id);
		} else {
			this.addDrill(drill);
		}
	}

	clear() {
		this.drills = [];
		this.persist();
	}
}

export const cart = new CartStore();
