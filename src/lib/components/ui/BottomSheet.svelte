<script>
	import { scale, fade } from 'svelte/transition';
	import { portal } from '$lib/actions/portal.js';
	import { getSafeAreaInsets } from '$lib/utils/mobile.js';
	import { X } from 'lucide-svelte';
	import { onWindowEvent } from '$lib/utils/windowEvents';

	let {
		open = $bindable(false),
		title = '',
		height = 'auto',
		closeOnOverlay = true,
		closeOnEscape = true,
		closeOnSwipeDown = true,
		showHandle = true,
		maxWidth = '640px',
		header,
		footer,
		children,
		onClose
	} = $props(); // height: 'auto'|'full'|'50%'|'400px' etc | maxWidth: tablets/desktop

	let sheetElement = $state(null);
	let contentElement = $state(null);
	let isDragging = $state(false);
	let startY = 0;
	let currentY = 0;
	let translateY = $state(0);
	let safeAreaBottom = $state(0);
	let savedScrollY = 0;

	$effect(() => {
		if (typeof window === 'undefined') return;

		if (!open) {
			translateY = 0;
			return;
		}

		lockBodyScroll();
		safeAreaBottom = getSafeAreaInsets().bottom;

		return () => {
			unlockBodyScroll();
			translateY = 0;
		};
	});

	function lockBodyScroll() {
		if (typeof document === 'undefined') return;
		savedScrollY = window.scrollY || 0;
		document.body.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.width = '100%';
	}

	function unlockBodyScroll() {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = '';
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.width = '';
		window.scrollTo(0, savedScrollY);
	}

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleOverlayClick() {
		if (closeOnOverlay) {
			handleClose();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && closeOnEscape) {
			handleClose();
		}
	}

	// Touch/drag handling for swipe-to-close
	function handleTouchStart(e) {
		if (!closeOnSwipeDown || !showHandle) return;
		isDragging = true;
		startY = e.touches[0].clientY;
		currentY = startY;
	}

	function handleTouchMove(e) {
		if (!isDragging) return;
		currentY = e.touches[0].clientY;
		const deltaY = currentY - startY;

		// Only allow dragging down
		if (deltaY > 0) {
			translateY = deltaY;
			e.preventDefault(); // Prevent scrolling while dragging
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;

		// If dragged more than 100px or 25% of sheet height, close
		const threshold = Math.min(100, sheetElement?.offsetHeight * 0.25 || 100);

		if (translateY > threshold) {
			handleClose();
		} else {
			// Animate back to original position
			translateY = 0;
		}
	}

	// Mouse events for desktop testing
	function handleMouseDown(e) {
		if (!closeOnSwipeDown || !showHandle) return;
		isDragging = true;
		startY = e.clientY;
		currentY = startY;
		e.preventDefault();
	}

	function handleMouseMove(e) {
		if (!isDragging) return;
		currentY = e.clientY;
		const deltaY = currentY - startY;

		if (deltaY > 0) {
			translateY = deltaY;
		}
	}

	function handleMouseUp() {
		handleTouchEnd();
	}

	onWindowEvent('keydown', (event) => {
		if (!open) return;
		handleKeydown(event);
	});

	onWindowEvent('mousemove', handleMouseMove);
	onWindowEvent('mouseup', handleMouseUp);
</script>

{#if open}
	<div class="bottom-sheet-container" use:portal transition:fade={{ duration: 200 }}>
		<!-- Overlay -->
		<div
			class="overlay"
			onclick={handleOverlayClick}
			onkeydown={(e) => e.key === 'Enter' && handleOverlayClick()}
			role="button"
			tabindex="-1"
			aria-label="Close bottom sheet"
		></div>

		<!-- Sheet -->
		<div
			bind:this={sheetElement}
			class="sheet"
			class:dragging={isDragging}
			style="
        transform: translateY({translateY}px);
        height: {height};
        max-width: {maxWidth};
        padding-bottom: {safeAreaBottom}px;
      "
			transition:scale={{ duration: 200, start: 0.95, opacity: 0 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheet-title"
		>
			<!-- Drag handle -->
			{#if showHandle}
				<div
					class="handle-container"
					ontouchstart={handleTouchStart}
					ontouchmove={handleTouchMove}
					ontouchend={handleTouchEnd}
					onmousedown={handleMouseDown}
					role="button"
					tabindex="-1"
					aria-label="Drag to close"
				>
					<div class="handle"></div>
				</div>
			{/if}

			<!-- Header -->
			{#if title || header}
				<div class="header">
					{#if header}
						{@render header()}
					{:else}
						<h2 id="sheet-title" class="title">{title}</h2>
					{/if}
					<button class="close-button" onclick={handleClose} aria-label="Close">
						<X size={24} />
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div bind:this={contentElement} class="content">
				{@render children?.()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-container {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.sheet {
		position: relative;
		background: white;
		border-radius: 16px 16px 0 0;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s ease-out;
	}

	.sheet.dragging {
		transition: none;
	}

	@media (min-width: 640px) {
		.sheet {
			margin: 0 auto;
			border-radius: 16px;
			margin-bottom: 20px;
		}
	}

	.handle-container {
		padding: 12px;
		cursor: grab;
		touch-action: none;
	}

	.handle-container:active {
		cursor: grabbing;
	}

	.handle {
		width: 48px;
		height: 4px;
		background-color: #d1d5db;
		border-radius: 2px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: #111827;
	}

	.close-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 8px;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background-color: #f3f4f6;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		-webkit-overflow-scrolling: touch;
	}

	.footer {
		padding: 16px 20px;
		border-top: 1px solid #e5e7eb;
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	/* Dark mode support */
	:global(.dark) .sheet {
		background: #1f2937;
		color: #f3f4f6;
	}

	:global(.dark) .handle {
		background-color: #4b5563;
	}

	:global(.dark) .header {
		border-bottom-color: #374151;
	}

	:global(.dark) .title {
		color: #f3f4f6;
	}

	:global(.dark) .close-button {
		color: #9ca3af;
	}

	:global(.dark) .close-button:hover {
		background-color: #374151;
	}

	:global(.dark) .footer {
		border-top-color: #374151;
	}
</style>
