<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { Loader2 } from 'lucide-svelte';
	import { buttonVariants } from './index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type $$Props = HTMLButtonAttributes & {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
		size?: 'default' | 'sm' | 'lg' | 'icon' | 'md';
		loading?: boolean;
		disabled?: boolean;
		class?: string;
	};

	let className: $$Props['class'] = undefined;
	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export let loading: boolean = false;
	export let disabled: boolean = false;
	export { className as class };
</script>

<ButtonPrimitive.Root
	class={cn(buttonVariants({ variant, size, className }))}
	type="button"
	disabled={disabled || loading}
	aria-disabled={disabled || loading}
	data-loading={loading}
	{...$$restProps}
	on:click
	on:keydown
>
	{#if loading}
		<Loader2 class="mr-2 h-4 w-4 animate-spin" />
	{/if}
	<slot />
</ButtonPrimitive.Root>

<style>
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
