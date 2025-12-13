<!-- src/routes/practice-plans/components/SimpleButton.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		className?: string;
		children?: Snippet;
	};

	let { className = undefined, children, ...restProps }: Props = $props();

	// Base classes from the original buttonVariants
	const baseClasses =
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	// Outline variant + default size classes
	const styleClasses =
		'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2';

	const combinedClasses = $derived(`${baseClasses} ${styleClasses} ${className || ''}`.trim());
</script>

<button type="button" class={combinedClasses} {...restProps}>
	{@render children?.()}
</button>

<style>
	/* Basic styling to make it look like a button */
	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 0.25rem;
		background-color: #f0f0f0;
		cursor: pointer;
	}
	button:hover {
		background-color: #e0e0e0;
	}
</style>
