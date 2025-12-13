import { browser } from '$app/environment';
import { createSubscriber } from 'svelte/reactivity';

function normalizeSectionId(value) {
	if (typeof value !== 'string') return value;
	if (/^\d+$/.test(value)) return Number(value);
	return value;
}

/**
 * Tracks which `[data-section-id]` element is currently intersecting the viewport.
 *
 * This is useful for scrollspy/timeline UIs where the underlying section list can change
 * (for example, due to filtering). Call `refresh()` after the DOM list updates.
 */
export class SectionObserver {
	#subscribe;
	#observer = null;
	#currentSectionId = null;

	#selector;
	#getScope;
	#options;
	#getSectionId;

	constructor({
		selector = '[data-section-id]',
		getScope = () => document,
		options = {},
		getSectionId = (element) => normalizeSectionId(element.getAttribute('data-section-id'))
	} = {}) {
		this.#selector = selector;
		this.#getScope = getScope;
		this.#options = {
			rootMargin: '-50px 0px -50px 0px',
			threshold: 0.1,
			...options
		};
		this.#getSectionId = getSectionId;

		this.#subscribe = createSubscriber((update) => {
			if (!browser) return;

			this.#observer = new IntersectionObserver(
				(entries) => {
					let nextId = this.#currentSectionId;

					for (const entry of entries) {
						if (!entry.isIntersecting) continue;
						const id = this.#getSectionId(entry.target);
						if (id != null) nextId = id;
					}

					if (nextId !== this.#currentSectionId) {
						this.#currentSectionId = nextId;
						update();
					}
				},
				this.#options
			);

			this.refresh();

			return () => {
				this.#observer?.disconnect();
				this.#observer = null;
			};
		});
	}

	refresh() {
		if (!browser) return;
		if (!this.#observer) {
			this.#subscribe();
		}
		if (!this.#observer) return;

		this.#observer.disconnect();

		const scope = this.#getScope?.();
		if (!scope) return;

		scope.querySelectorAll(this.#selector).forEach((element) => {
			this.#observer?.observe(element);
		});
	}

	get currentSectionId() {
		this.#subscribe();
		return this.#currentSectionId;
	}
}
