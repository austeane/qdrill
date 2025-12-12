<script>
	import { Tabs as TabsPrimitive } from 'bits-ui';

	export let value = '';
	export let tabs = []; // [{value, label}]
</script>

<TabsPrimitive.Root bind:value class="tabs">
	<TabsPrimitive.List class="tabs-list">
		{#each tabs as tab}
			<TabsPrimitive.Trigger value={tab.value} class="tabs-trigger">
				{tab.label}
			</TabsPrimitive.Trigger>
		{/each}
	</TabsPrimitive.List>

	<slot />
</TabsPrimitive.Root>

<style>
	:global(.tabs) {
		width: 100%;
	}

	:global(.tabs-list) {
		display: flex;
		gap: var(--space-1);
		border-bottom: 1px solid var(--color-border-default);
		margin-bottom: var(--space-4);
	}

	:global(.tabs-trigger) {
		padding: var(--space-2) var(--space-4);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-bottom: -1px;
	}

	:global(.tabs-trigger:hover) {
		color: var(--color-text-primary);
	}

	:global(.tabs-trigger[data-state='active']) {
		color: var(--color-accent-9);
		border-bottom-color: var(--color-accent-9);
	}

	:global(.tabs-content) {
		animation: fadeIn 150ms ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
