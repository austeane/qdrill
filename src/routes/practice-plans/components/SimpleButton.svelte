<!-- src/routes/practice-plans/components/SimpleButton.svelte -->
<script lang="ts">
	export let className: string | undefined = undefined;

	// Base classes from the original buttonVariants
	const baseClasses =
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	// Outline variant + default size classes
	const styleClasses =
		'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2';

	let combinedClasses: string;
	$: combinedClasses = `${baseClasses} ${styleClasses} ${className || ''}`.trim();
</script>

<button type="button" class={combinedClasses} on:click {...$$restProps}>
	<slot />
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
