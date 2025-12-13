<script>
	let { value = $bindable(''), tabs = [], children, onChange } = $props();

	function selectTab(tabValue) {
		value = tabValue;
		onChange?.({ value: tabValue });
	}

	function handleKeydown(e, tabValue, index) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectTab(tabValue);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			const nextIndex = (index + 1) % tabs.length;
			selectTab(tabs[nextIndex].value);
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			const prevIndex = (index - 1 + tabs.length) % tabs.length;
			selectTab(tabs[prevIndex].value);
		}
	}
</script>

<div class="tabs">
	<div class="tabs-list" role="tablist">
		{#each tabs as tab, index (tab.value)}
			<button
				class="tabs-trigger"
				class:active={value === tab.value}
				role="tab"
				aria-selected={value === tab.value}
				tabindex={value === tab.value ? 0 : -1}
				onclick={() => selectTab(tab.value)}
				onkeydown={(e) => handleKeydown(e, tab.value, index)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{@render children?.()}
</div>

<style>
	.tabs {
		width: 100%;
	}

	.tabs-list {
		display: flex;
		gap: var(--space-1);
		border-bottom: 1px solid var(--color-border-default);
		margin-bottom: var(--space-4);
	}

	.tabs-trigger {
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

	.tabs-trigger:hover {
		color: var(--color-text-primary);
	}

	.tabs-trigger.active {
		color: var(--color-accent-9);
		border-bottom-color: var(--color-accent-9);
	}
</style>
