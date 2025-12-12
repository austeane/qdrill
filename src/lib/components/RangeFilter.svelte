<script>
	import RangeSlider from 'svelte-range-slider-pips';
	export let label;
	export let range = [0, 0];
	export let min = 0;
	export let max = 100;
	export let step = 1;
	export let open = false;
	export let onToggle = () => {};
	export let onChange = () => {};
	export let display = (r) => `${r[0]} - ${r[1]}`;
	export let sliderProps = {};
</script>

<div class="relative">
	<button
		class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${open ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
		on:click={onToggle}
		aria-expanded={open}
		aria-controls={`${label}-content`}
	>
		{label}
		<span class="ml-2 text-sm font-semibold">{display(range)}</span>
	</button>

	{#if open}
		<div
			id={`${label}-content`}
			class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="menu"
			tabindex="0"
		>
			<span class="block text-sm font-medium text-gray-700 mb-2">{label} Range</span>
			<RangeSlider
				bind:values={range}
				{min}
				{max}
				{step}
				float
				pips
				{...sliderProps}
				on:change={onChange}
			/>
			<div class="text-center mt-2 text-sm font-medium text-gray-700">
				Current: {range[0]} - {range[1]}
			</div>
		</div>
	{/if}
</div>
