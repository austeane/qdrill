<script>
	import { FILTER_STATES } from '$lib/constants';
	import { Check, X } from 'lucide-svelte';

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
			<Check size={16} class="text-white" />
		{:else if state === FILTER_STATES.EXCLUDED}
			<X size={16} class="text-white" />
		{/if}
	</div>
	<span>{label}</span>
</label>
