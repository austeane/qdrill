<script>
	import Spinner from '$lib/components/Spinner.svelte';

	export let loading = false;
	export let loadingText = 'Loading...';
	export let disabled = false;
	export let variant = 'default';
	export let size = 'default';
	export let className = '';

	$: isDisabled = loading || disabled;

	// Button variant classes
	const variants = {
		default: 'bg-blue-600 hover:bg-blue-700 text-white',
		destructive: 'bg-red-600 hover:bg-red-700 text-white',
		outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
		secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
		ghost: 'hover:bg-gray-100 text-gray-700',
		link: 'text-blue-600 hover:text-blue-800 underline'
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 px-3 text-sm',
		lg: 'h-11 px-8',
		icon: 'h-10 w-10'
	};

	$: buttonClasses = `
		inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium 
		transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
		disabled:pointer-events-none disabled:opacity-50
		${variants[variant] || variants.default}
		${sizes[size] || sizes.default}
		${className}
	`
		.trim()
		.replace(/\s+/g, ' ');
</script>

<button
	class={buttonClasses}
	disabled={isDisabled}
	type="button"
	{...$$restProps}
	on:click
	on:keydown
>
	{#if loading}
		<div class="flex items-center justify-center">
			<Spinner
				size="sm"
				color={variant === 'default' || variant === 'destructive' || variant === 'secondary'
					? 'white'
					: 'blue'}
			/>
			<span class="ml-2">{loadingText}</span>
		</div>
	{:else}
		<slot />
	{/if}
</button>
