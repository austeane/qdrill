import { writable } from 'svelte/store';

/**
 * Create a loading state store with helper methods
 * @param {boolean} initialState - Initial loading state
 * @returns {object} Store with loading state and helper methods
 */
export function createLoadingState(initialState = false) {
	const { subscribe, set, update } = writable(initialState);

	return {
		subscribe,
		start: () => set(true),
		stop: () => set(false),
		toggle: () => update(state => !state),
		/**
		 * Wrap an async function with loading state management
		 * @param {Function} asyncFn - Async function to wrap
		 * @returns {Function} Wrapped function
		 */
		wrap: (asyncFn) => {
			return async (...args) => {
				set(true);
				try {
					return await asyncFn(...args);
				} finally {
					set(false);
				}
			};
		}
	};
}

/**
 * Global loading states for common operations
 */
export const globalLoadingStates = {
	// API requests
	fetchingDrills: createLoadingState(),
	fetchingPracticePlans: createLoadingState(),
	fetchingFormations: createLoadingState(),
	
	// Form submissions
	submittingForm: createLoadingState(),
	deletingItem: createLoadingState(),
	
	// File operations
	uploadingFile: createLoadingState(),
	
	// User actions
	voting: createLoadingState(),
	commenting: createLoadingState()
};

/**
 * Debounced loading state - useful for search inputs
 * @param {number} delay - Delay in milliseconds
 * @returns {object} Loading state with debounced methods
 */
export function createDebouncedLoadingState(delay = 300) {
	const loadingState = createLoadingState();
	let timeoutId = null;

	return {
		...loadingState,
		startDebounced: () => {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => loadingState.start(), delay);
		},
		stopDebounced: () => {
			if (timeoutId) clearTimeout(timeoutId);
			loadingState.stop();
		}
	};
}

/**
 * Loading state with minimum duration (prevents flashing)
 * @param {number} minDuration - Minimum duration in milliseconds
 * @returns {object} Loading state with minimum duration
 */
export function createMinDurationLoadingState(minDuration = 500) {
	const loadingState = createLoadingState();
	let startTime = null;

	return {
		...loadingState,
		start: () => {
			startTime = Date.now();
			loadingState.start();
		},
		stop: () => {
			if (startTime) {
				const elapsed = Date.now() - startTime;
				const remaining = Math.max(0, minDuration - elapsed);
				setTimeout(() => loadingState.stop(), remaining);
			} else {
				loadingState.stop();
			}
		}
	};
} 