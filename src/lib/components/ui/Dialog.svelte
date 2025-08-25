<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { X } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  export let open = false;
  export let title = '';
  export let description = '';
  
  let scrollPosition = 0;
  
  $: if (typeof window !== 'undefined') {
    if (open) {
      scrollPosition = window.pageYOffset;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition);
    }
  }
  
  onMount(() => {
    return () => {
      // Cleanup on unmount
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    };
  });
</script>

<DialogPrimitive.Root bind:open>
  {#if $$slots.trigger}
    <DialogPrimitive.Trigger asChild let:builder>
      <slot name="trigger" {builder} />
    </DialogPrimitive.Trigger>
  {/if}
  
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class="dialog-overlay" />
    <DialogPrimitive.Content class="dialog-content">
      <div class="dialog-header">
        {#if title}
          <DialogPrimitive.Title class="dialog-title">
            {title}
          </DialogPrimitive.Title>
        {/if}
        <DialogPrimitive.Close class="dialog-close">
          <X size={20} />
          <span class="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      
      {#if description}
        <DialogPrimitive.Description class="dialog-description">
          {description}
        </DialogPrimitive.Description>
      {/if}
      
      <div class="dialog-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="dialog-footer">
          <slot name="footer" />
        </div>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>

<style>
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    animation: fadeIn 150ms ease;
    z-index: 50;
  }
  
  :global(.dialog-content) {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 500px;
    max-height: 85vh;
    background: var(--color-surface-1);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    animation: contentShow 150ms ease;
    z-index: 51;
    overflow: auto;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  :global(.dialog-title) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-close) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  :global(.dialog-close:hover) {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-description) {
    padding: 0 var(--space-4);
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .dialog-body {
    padding: var(--space-4);
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border-default);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>