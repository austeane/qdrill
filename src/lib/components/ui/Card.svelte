<script>
	export let variant = 'default'; // default, bordered, elevated
	export let padding = 'md'; // sm, md, lg
</script>

<div class="card card-{variant} padding-{padding}" {...$$restProps}>
	{#if $$slots.header}
		<div class="card-header">
			<slot name="header" />
		</div>
	{/if}

	<div class="card-content">
		<slot />
	</div>

	{#if $$slots.footer}
		<div class="card-footer">
			<slot name="footer" />
		</div>
	{/if}
</div>

<style>
	.card {
		background: var(--color-surface-1);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.card-default {
		/* No additional styling */
	}

	.card-bordered {
		border: 1px solid var(--color-border-default);
	}

	.card-elevated {
		box-shadow: var(--shadow-md);
	}

	.card-header {
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border-default);
		font-weight: var(--font-weight-semibold);
	}

	.card-content {
		padding: var(--space-4);
	}

	.padding-sm .card-content {
		padding: var(--space-2);
	}

	.padding-lg .card-content {
		padding: var(--space-6);
	}

	.card-footer {
		padding: var(--space-4);
		border-top: 1px solid var(--color-border-default);
		background: var(--color-bg-subtle);
	}
</style>
