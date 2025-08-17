<script lang="ts">
  import { page } from '$app/stores';
  import { Target, Calendar, Users, PenTool, X, ChevronLeft, ChevronRight } from 'lucide-svelte';

  export let open = false;       // mobile drawer open
  export let collapsed = false;  // desktop collapsed state

  const navItems = [
    { href: '/drills', label: 'Drills', icon: Target },
    { href: '/practice-plans', label: 'Practice Plans', icon: Calendar },
    { href: '/formations', label: 'Formations', icon: Users },
    { href: '/whiteboard', label: 'Whiteboard', icon: PenTool },
    { href: '/teams', label: 'Teams', icon: Users }
  ];

  function isActive(href: string) {
    return $page.url.pathname.startsWith(href);
  }
</script>

<aside class="sidebar" class:open class:collapsed>
  <nav class="sidebar__nav" role="navigation">
    <button class="close md:hidden" on:click={() => (open = false)} aria-label="Close sidebar">
      <X size={18} />
    </button>

    <ul class="nav">
      {#each navItems as item}
        <li>
          <a href={item.href} class="nav__item" class:active={isActive(item.href)} title={collapsed ? item.label : undefined}>
            <svelte:component this={item.icon} size={18} />
            {#if !collapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>

    <button class="collapse hidden md:flex" on:click={() => (collapsed = !collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
      {#if collapsed}
        <ChevronRight size={16} />
      {:else}
        <ChevronLeft size={16} />
      {/if}
    </button>
  </nav>
</aside>

{#if open}
  <div class="overlay md:hidden" on:click={() => (open = false)} />
{/if}

<style>
  .sidebar {
    position: fixed;
    top: 3.5rem;
    left: 0;
    bottom: 0;
    width: 240px;
    background: var(--color-surface-1);
    border-right: 1px solid var(--color-border-default);
    transform: translateX(-100%);
    transition: transform var(--transition-base), width var(--transition-base);
    z-index: var(--z-fixed);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar.collapsed { width: 64px; }
  @media (min-width: 768px) { .sidebar { position: sticky; transform: translateX(0); } }

  .sidebar__nav { display: flex; flex-direction: column; height: 100%; padding: var(--space-4); }
  .close { align-self: flex-end; padding: var(--space-2); border: none; background: transparent; border-radius: var(--radius-md); }
  .nav { flex: 1; list-style: none; margin: 0; padding: 0; }
  .nav__item {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-1);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .nav__item:hover { background: var(--color-bg-subtle); color: var(--color-text-primary); }
  .nav__item.active { background: var(--color-accent-3); color: var(--color-accent-11, var(--color-text-primary)); }
  .collapsed .nav__item { justify-content: center; padding: var(--space-2); }
  .collapse {
    align-items: center; justify-content: center;
    padding: var(--space-2);
    margin-top: auto;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: var(--z-modal-backdrop); }
</style>

