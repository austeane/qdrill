<script lang="ts">
  import { onMount } from 'svelte';
  import { Search } from 'lucide-svelte';

  export let open = false;
  export let placeholder = 'Search drills, plans, teams…';
  export let onClose: (() => void) | undefined;

  function close() {
    open = false;
    onClose?.();
  }

  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open = !open;
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

{#if open}
  <div class="cp__backdrop" on:click={close} />
  <div class="cp__dialog" role="dialog" aria-modal="true" aria-label="Command Palette">
    <div class="cp__input">
      <Search size={16} />
      <input placeholder={placeholder} autofocus on:keydown={(e) => e.stopPropagation()} />
      <kbd>Esc</kbd>
    </div>
    <div class="cp__results">
      <slot>
        <p class="hint">Type to search. Try: drills, plans, teams…</p>
      </slot>
    </div>
  </div>
{/if}

<style>
  .cp__backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: var(--z-modal-backdrop); }
  .cp__dialog {
    position: fixed;
    top: 10vh; left: 50%; transform: translateX(-50%);
    width: min(720px, calc(100vw - 2rem));
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    z-index: var(--z-modal);
    overflow: hidden;
  }
  .cp__input {
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  input { flex: 1; border: none; outline: none; background: transparent; color: var(--color-text-primary); }
  kbd { padding: 0.125rem 0.375rem; background: var(--color-surface-3); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
  .cp__results { max-height: 60vh; overflow: auto; }
  .hint { padding: var(--space-4); color: var(--color-text-muted); }
  /* Reduce motion inside palette */
  @media (prefers-reduced-motion: reduce) {
    .cp__dialog { transition: none; }
  }
</style>

