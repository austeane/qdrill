<script>
	import { onMount, onDestroy } from 'svelte';

	export let title = '';
	export let maxWidth = '100%';
	export let className = '';

	let showTooltip = false;
	let titleElement;
	let tooltipElement;
	let isTruncated = false;
	let tooltipPosition = { top: 0, left: 0 };
	let hoverTimeout;

	// Check if text is truncated
	function checkTruncation() {
		if (titleElement) {
			isTruncated = titleElement.scrollWidth > titleElement.clientWidth;
		}
	}

	// Calculate tooltip position
	function updateTooltipPosition() {
		if (titleElement && tooltipElement && showTooltip) {
			const rect = titleElement.getBoundingClientRect();

			// Get computed dimensions after render
			const tooltipStyles = window.getComputedStyle(tooltipElement);
			const tooltipWidth = tooltipElement.offsetWidth;
			const tooltipHeight = tooltipElement.offsetHeight;

			// Calculate initial position (centered above the element)
			let top = rect.top - tooltipHeight - 8; // 8px gap
			let left = rect.left + rect.width / 2 - tooltipWidth / 2;

			// Adjust horizontal position if tooltip goes off-screen
			if (left < 8) {
				left = 8;
			} else if (left + tooltipWidth > window.innerWidth - 8) {
				left = window.innerWidth - tooltipWidth - 8;
			}

			// If tooltip would go above viewport, show below instead
			if (top < 8) {
				top = rect.bottom + 8;
			}

			// Update position
			tooltipPosition = { top, left };
		}
	}

	$: if (title && titleElement) {
		// Use a microtask to ensure DOM is updated
		queueMicrotask(checkTruncation);
	}

	$: if (showTooltip && tooltipElement) {
		// Use setTimeout to ensure tooltip is rendered before positioning
		setTimeout(updateTooltipPosition, 0);
	}

	// Update position on scroll/resize
	let scrollListener;
	let resizeListener;

	onMount(() => {
		scrollListener = () => {
			if (showTooltip) {
				updateTooltipPosition();
			}
		};
		resizeListener = () => {
			checkTruncation();
			if (showTooltip) {
				updateTooltipPosition();
			}
		};

		window.addEventListener('scroll', scrollListener, true);
		window.addEventListener('resize', resizeListener);
	});

	onDestroy(() => {
		if (scrollListener) {
			window.removeEventListener('scroll', scrollListener, true);
		}
		if (resizeListener) {
			window.removeEventListener('resize', resizeListener);
		}
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
		}
	});
</script>

<div
	class="inline-block {className}"
	style="max-width: {maxWidth};"
	on:mouseenter={() => {
		if (isTruncated) {
			clearTimeout(hoverTimeout);
			hoverTimeout = setTimeout(() => {
				showTooltip = true;
			}, 200); // 200ms delay
		}
	}}
	on:mouseleave={() => {
		clearTimeout(hoverTimeout);
		showTooltip = false;
	}}
>
	<div bind:this={titleElement} class="truncate" on:resize={checkTruncation}>
		{title}
	</div>
</div>

<!-- Render tooltip in body using fixed positioning -->
{#if showTooltip && isTruncated}
	<div
		bind:this={tooltipElement}
		class="fixed z-[9999] px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg pointer-events-none whitespace-normal"
		style="
			top: {tooltipPosition.top}px;
			left: {tooltipPosition.left}px;
			max-width: 300px;
			word-wrap: break-word;
		"
	>
		{title}
		<!-- Arrow pointing down (or up if tooltip is below) -->
		<div
			class="absolute w-0 h-0 border-l-4 border-r-4 border-transparent"
			class:border-t-4={tooltipPosition.top < titleElement?.getBoundingClientRect().top}
			class:border-t-gray-900={tooltipPosition.top < titleElement?.getBoundingClientRect().top}
			class:border-b-4={tooltipPosition.top > titleElement?.getBoundingClientRect().top}
			class:border-b-gray-900={tooltipPosition.top > titleElement?.getBoundingClientRect().top}
			style="
				{tooltipPosition.top < titleElement?.getBoundingClientRect().top ? 'bottom: -4px' : 'top: -4px'};
				left: 50%;
				transform: translateX(-50%);
			"
		></div>
	</div>
{/if}

<style>
	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
