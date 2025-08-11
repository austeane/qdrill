<script>
  export let variant = 'default'; // default, secondary, success, warning, error, info
  export let size = 'md'; // sm, md, lg
</script>

<span class="badge badge-{variant} badge-{size}" {...$$restProps}>
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-full);
    white-space: nowrap;
  }
  
  /* Sizes */
  .badge-sm {
    padding: 0 var(--space-2);
    height: 20px;
    font-size: var(--font-size-xs);
  }
  
  .badge-md {
    padding: 0 var(--space-3);
    height: 24px;
    font-size: var(--font-size-sm);
  }
  
  .badge-lg {
    padding: 0 var(--space-4);
    height: 28px;
    font-size: var(--font-size-base);
  }
  
  /* Variants */
  .badge-default {
    background: var(--color-bg-muted);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
  }
  
  .badge-secondary {
    background: var(--color-surface-3);
    color: var(--color-text-secondary);
  }
  
  .badge-success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid var(--color-success-border);
  }
  
  .badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: 1px solid var(--color-warning-border);
  }
  
  .badge-error {
    background: var(--color-error-bg);
    color: var(--color-error);
    border: 1px solid var(--color-error-border);
  }
  
  .badge-info {
    background: var(--color-info-bg);
    color: var(--color-info);
    border: 1px solid var(--color-info-border);
  }
</style>