<script>
  import { Loader2 } from 'lucide-svelte';
  
  export let variant = 'primary'; // primary, secondary, ghost, destructive
  export let size = 'md'; // sm, md, lg
  export let loading = false;
  export let disabled = false;
  export let type = 'button';
  export let href = null;
  
  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  {href}
  {type}
  disabled={disabled || loading}
  aria-disabled={disabled || loading}
  class="btn btn-{variant} btn-{size}"
  class:loading
  on:click
  {...$$restProps}
>
  {#if loading}
    <Loader2 class="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
  {/if}
  <slot />
</svelte:element>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    border: 1px solid transparent;
  }
  
  /* Sizes */
  .btn-sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-sm);
  }
  
  .btn-md {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-base);
  }
  
  .btn-lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-lg);
  }
  
  /* Variants */
  .btn-primary {
    background: var(--color-accent-9);
    color: white;
    border-color: var(--color-accent-9);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-10);
    border-color: var(--color-accent-10);
  }
  
  .btn-secondary {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-muted);
    border-color: var(--color-border-strong);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-text-primary);
  }
  
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-subtle);
  }
  
  .btn-destructive {
    background: var(--color-error);
    color: white;
    border-color: var(--color-error);
  }
  
  .btn-destructive:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn.loading {
    position: relative;
    color: transparent;
  }
  
  .btn.loading > :global(svg) {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: currentColor;
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
</style>