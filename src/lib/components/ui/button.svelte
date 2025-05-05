<script>
	export let href = null;
	export let type = 'button';
	export let variant = 'default'; // 'default', 'destructive', 'outline', 'secondary', 'ghost', 'link'
	export let size = 'default'; // 'default', 'sm', 'lg', 'icon'
	// Add other props you might need, e.g., disabled, class
	export let disabled = false;
	export let className = '';

	// Basic styling - you can customize this further with Tailwind variants
	const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
		destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
		outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	const sizes = {
		default: 'h-9 px-4 py-2',
		sm: 'h-8 rounded-md px-3 text-xs',
		lg: 'h-10 rounded-md px-8',
		icon: 'h-9 w-9'
	};

	$: buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
</script>

{#if href}
	<a {href} class={buttonClasses} {...$$restProps} aria-disabled={disabled}>
		<slot />
	</a>
{:else}
	<button {type} class={buttonClasses} {disabled} {...$$restProps}>
		<slot />
	</button>
{/if} 