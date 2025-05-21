<script>
	import { FILTER_STATES } from '$lib/constants';

	export let value;
	export let state = FILTER_STATES.NEUTRAL;
	export let label;
	export let onChange;

	function toggleState() {
		const newState =
			state === FILTER_STATES.NEUTRAL
				? FILTER_STATES.REQUIRED
				: state === FILTER_STATES.REQUIRED
					? FILTER_STATES.EXCLUDED
					: FILTER_STATES.NEUTRAL;

		console.log(`Toggling ${label} (${value}) from ${state} to ${newState}`);
		onChange(value, newState);
	}
</script>

<label
	class="flex items-center mt-2 text-gray-700 hover:bg-gray-100 p-1 rounded cursor-pointer"
	data-testid={`filter-skill-level-${value.toLowerCase()}`}
>
	<div
		class="w-5 h-5 border rounded mr-2 flex items-center justify-center"
		data-testid={`checkbox-control-${value.toLowerCase()}`}
		class:bg-blue-500={state === FILTER_STATES.REQUIRED}
		class:bg-red-500={state === FILTER_STATES.EXCLUDED}
		class:border-gray-300={state === FILTER_STATES.NEUTRAL}
		class:border-transparent={state !== FILTER_STATES.NEUTRAL}
		role="checkbox"
		tabindex="0"
		aria-checked={state === FILTER_STATES.REQUIRED
			? 'true'
			: state === FILTER_STATES.EXCLUDED
				? 'mixed'
				: 'false'}
		on:click|preventDefault={toggleState}
		on:keydown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), toggleState())}
	>
		{#if state === FILTER_STATES.REQUIRED}
			<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		{:else if state === FILTER_STATES.EXCLUDED}
			<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		{/if}
	</div>
	<span>{label}</span>
</label>
