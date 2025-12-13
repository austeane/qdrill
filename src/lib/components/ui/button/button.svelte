<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import { buttonVariants } from './index.js';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type CommonProps = {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
		size?: 'default' | 'sm' | 'lg' | 'icon' | 'md';
		loading?: boolean;
		disabled?: boolean;
		class?: string;
	};

	type $$Props = (HTMLButtonAttributes & HTMLAnchorAttributes) & CommonProps & { children?: Snippet };

	let {
		variant = 'default',
		size = 'default',
		loading = false,
		disabled = false,
		href = undefined,
		class: className,
		children,
		...restProps
	}: $$Props = $props();

	const isLink = $derived(typeof href === 'string' && href.length > 0);
	const classes = $derived(String(cn(buttonVariants({ variant, size, class: className }))));
</script>

<!--
  When href is provided, render a native <a> directly.
  Otherwise, use bits-ui Button with asChild for proper button behavior.
-->
{#if isLink}
	<a
		class={classes}
		{href}
		aria-disabled={disabled || loading}
		data-loading={loading}
		{...restProps}
	>
		{#if loading}
			<Loader2 class="mr-2 h-4 w-4 animate-spin" />
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		class={classes}
		type="button"
		disabled={disabled || loading}
		aria-disabled={disabled || loading}
		data-loading={loading}
		{...restProps}
	>
		{#if loading}
			<Loader2 class="mr-2 h-4 w-4 animate-spin" />
		{/if}
		{@render children?.()}
	</button>
{/if}

<style>
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
