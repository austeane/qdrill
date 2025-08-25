<script lang="ts">
  import { Button as ButtonPrimitive } from 'bits-ui';
  import { Loader2 } from 'lucide-svelte';
  import { buttonVariants } from './index.js';
  import { cn } from '$lib/utils.js';
  import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

  type CommonProps = {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'md';
    loading?: boolean;
    disabled?: boolean;
    class?: string;
  };

  type $$Props = (HTMLButtonAttributes & HTMLAnchorAttributes) & CommonProps;

  let className: $$Props['class'] = undefined;
  export let variant: $$Props['variant'] = 'default';
  export let size: $$Props['size'] = 'default';
  export let loading: boolean = false;
  export let disabled: boolean = false;
  // Explicitly accept href so we can render an anchor when provided
  export let href: string | undefined = undefined;
  export { className as class };

  $: isLink = typeof href === 'string' && href.length > 0;
  $: classes = cn(buttonVariants({ variant, size, className }));
</script>

<!--
  When href is provided, render a native <a> directly.
  Otherwise, use bits-ui Button with asChild for proper button behavior.
-->
{#if isLink}
  <a
    class={classes}
    href={href}
    aria-disabled={disabled || loading}
    data-loading={loading}
    {...$$restProps}
  >
    {#if loading}
      <Loader2 class="mr-2 h-4 w-4 animate-spin" />
    {/if}
    <slot />
  </a>
{:else}
  <ButtonPrimitive.Root asChild>
    <button
      class={classes}
      type="button"
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      data-loading={loading}
      {...$$restProps}
    >
      {#if loading}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
      {/if}
      <slot />
    </button>
  </ButtonPrimitive.Root>
{/if}

<style>
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
