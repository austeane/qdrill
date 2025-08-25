<script lang="ts">
  import Topbar from '$lib/components/nav/Topbar.svelte';
  import Sidebar from '$lib/components/nav/Sidebar.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import { onMount } from 'svelte';

  let sidebarOpen = false;    // mobile drawer
  let sidebarCollapsed = false; // desktop collapsed
  let cmdOpen = false;

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      cmdOpen = true;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<Topbar
  {sidebarOpen}
  on:toggleSidebar={(e) => (sidebarOpen = e.detail.open)}
  on:openCommandPalette={() => (cmdOpen = true)}
/>

<div class="appshell">
  <Sidebar bind:open={sidebarOpen} bind:collapsed={sidebarCollapsed} />

  <div class="appshell__content" id="main-content" tabindex="-1">
    <slot />
  </div>
</div>

<CommandPalette bind:open={cmdOpen} onClose={() => (cmdOpen = false)} />

<style>
  .appshell { display: grid; grid-template-columns: 1fr; }
  @media (min-width: 768px) { .appshell { grid-template-columns: 240px 1fr; } }
  @media (min-width: 768px) {
    :global(.appshell .sidebar.collapsed) ~ .appshell__content { margin-left: -176px; }
  }
  .appshell__content { padding: var(--space-6) var(--space-4); }
  @media (max-width: 767px) {
    .appshell__content { padding: var(--space-4) var(--space-3); }
  }
</style>

