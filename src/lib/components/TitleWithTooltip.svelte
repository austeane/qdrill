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
			const tooltipRect = tooltipElement.getBoundingClientRect();
			
			// Position tooltip above the element, centered
			tooltipPosition = {
				top: rect.top - tooltipRect.height - 8, // 8px gap
				left: rect.left + (rect.width / 2) - (tooltipRect.width / 2)
			};
			
			// Adjust if tooltip goes off-screen
			if (tooltipPosition.left < 8) {
				tooltipPosition.left = 8;
			} else if (tooltipPosition.left + tooltipRect.width > window.innerWidth - 8) {
				tooltipPosition.left = window.innerWidth - tooltipRect.width - 8;
			}
			
			// If tooltip would go above viewport, show below instead
			if (tooltipPosition.top < 8) {
				tooltipPosition.top = rect.bottom + 8;
			}
		}
	}
	
	$: if (title && titleElement) {
		// Use a microtask to ensure DOM is updated
		queueMicrotask(checkTruncation);
	}
	
	$: if (showTooltip && tooltipElement) {
		queueMicrotask(updateTooltipPosition);
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
	});
</script>

<div 
	class="inline-block {className}"
	style="max-width: {maxWidth};"
	on:mouseenter={() => showTooltip = isTruncated}
	on:mouseleave={() => showTooltip = false}
>
	<div 
		bind:this={titleElement}
		class="truncate"
		on:resize={checkTruncation}
	>
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