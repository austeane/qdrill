<script>
	import Dialog from './Dialog.svelte';

	let {
		open = $bindable(false),
		title = 'Confirm Action',
		message = 'Are you sure you want to proceed?',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		confirmVariant = 'destructive', // 'primary'|'secondary'|'destructive'
		loading = false,
		onConfirm,
		onCancel
	} = $props();

	function handleConfirm() {
		onConfirm?.();
	}

	function handleCancel() {
		open = false;
		onCancel?.();
	}
</script>

{#snippet footer()}
	<div class="confirm-footer">
		<button class="button button-secondary" onclick={handleCancel} disabled={loading}>
			{cancelText}
		</button>
		<button class="button button-{confirmVariant}" onclick={handleConfirm} disabled={loading}>
			{loading ? 'Processing...' : confirmText}
		</button>
	</div>
{/snippet}

<Dialog bind:open {title} description="" {footer}>
	<div class="confirm-content">
		<p class="confirm-message">{message}</p>
	</div>
</Dialog>

<style>
	.confirm-content {
		padding: 16px 0;
	}

	.confirm-message {
		color: #4b5563;
		font-size: 14px;
		line-height: 1.5;
	}

	.confirm-footer {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		padding-top: 16px;
	}

	.button {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-secondary {
		background-color: #f3f4f6;
		color: #374151;
	}

	.button-secondary:hover:not(:disabled) {
		background-color: #e5e7eb;
	}

	.button-primary {
		background-color: #3b82f6;
		color: white;
	}

	.button-primary:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.button-destructive {
		background-color: #ef4444;
		color: white;
	}

	.button-destructive:hover:not(:disabled) {
		background-color: #dc2626;
	}
</style>
