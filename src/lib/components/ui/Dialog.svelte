<script>
	import { X } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';

	let { open = $bindable(false), title = '', description = '', children, footer, onClose } = $props();

	const baseId = $props.id();
	const titleId = $derived(`dialog-title-${baseId}`);
	const descriptionId = $derived(`dialog-description-${baseId}`);

	let dialogRef = $state(null);

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleKeydown(e) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (!open) return;

		const scrollPosition = window.pageYOffset;
		document.body.style.overflow = 'hidden';
		document.body.style.position = 'fixed';
		document.body.style.top = `-${scrollPosition}px`;
		document.body.style.width = '100%';

		return () => {
			document.body.style.overflow = '';
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			window.scrollTo(0, scrollPosition);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog-overlay" transition:fade={{ duration: 150 }} onclick={handleOverlayClick}>
		<div
			class="dialog-content"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			aria-describedby={description ? descriptionId : undefined}
			bind:this={dialogRef}
			transition:scale={{ duration: 150, start: 0.96 }}
		>
			<div class="dialog-header">
				{#if title}
					<h2 id={titleId} class="dialog-title">
						{title}
					</h2>
				{/if}
				<button class="dialog-close" onclick={handleClose} aria-label="Close dialog">
					<X size={20} />
				</button>
			</div>

			{#if description}
				<p id={descriptionId} class="dialog-description">
					{description}
				</p>
			{/if}

			<div class="dialog-body">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="dialog-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dialog-content {
		width: 90vw;
		max-width: 500px;
		max-height: 85vh;
		background: var(--color-surface-1);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		z-index: 51;
		overflow: auto;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border-default);
	}

	.dialog-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.dialog-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.dialog-close:hover {
		background: var(--color-bg-subtle);
		color: var(--color-text-primary);
	}

	.dialog-description {
		padding: 0 var(--space-4);
		margin-top: var(--space-2);
		margin-bottom: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.dialog-body {
		padding: var(--space-4);
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		padding: var(--space-4);
		border-top: 1px solid var(--color-border-default);
	}
</style>
