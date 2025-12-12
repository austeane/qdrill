<script lang="ts">
	import { ChevronRight, Home } from 'lucide-svelte';

	export let segments: { label: string; href?: string }[] = [];
</script>

<nav aria-label="Breadcrumb" class="breadcrumbs">
	<ol>
		<li>
			<a href="/" aria-label="Home"><Home size={16} /></a>
		</li>
		{#each segments as segment, i}
			<li class="sep"><ChevronRight size={14} /></li>
			<li>
				{#if i === segments.length - 1 || !segment.href}
					<span aria-current="page">{segment.label}</span>
				{:else}
					<a href={segment.href}>{segment.label}</a>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumbs {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}
	ol {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0;
		margin: 0;
	}
	a {
		color: inherit;
	}
	.sep {
		color: var(--color-border-strong);
	}
</style>
