<script>
	export let text = '';
	export let position = 'top';

	let showTooltip = false;
	let timeout;

	function handleMouseEnter() {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			showTooltip = true;
		}, 500);
	}

	function handleMouseLeave() {
		clearTimeout(timeout);
		showTooltip = false;
	}

	function containerClasses(pos) {
		switch (pos) {
			case 'bottom':
				return 'top-full mt-2 left-1/2 -translate-x-1/2';
			case 'left':
				return 'right-full mr-2 top-1/2 -translate-y-1/2';
			case 'right':
				return 'left-full ml-2 top-1/2 -translate-y-1/2';
			default:
				return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
		}
	}

	function arrowClasses(pos) {
		switch (pos) {
			case 'bottom':
				return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
			case 'left':
				return 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2';
			case 'right':
				return 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2';
			default:
				return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
		}
	}
</script>

<div
	class="relative inline-block"
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	role="tooltip"
>
	<slot />

	{#if showTooltip}
		<div
			class={`absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap ${containerClasses(position)}`}
		>
			{text}
			<div class={`absolute w-2 h-2 bg-gray-900 rotate-45 ${arrowClasses(position)}`}></div>
		</div>
	{/if}
</div>
