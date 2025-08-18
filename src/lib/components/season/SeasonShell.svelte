<script>
  import { createEventDispatcher } from 'svelte';
  import { device } from '$lib/stores/deviceStore';
  
  export let activeTab = 'overview';
  export let season = null;
  export let sections = [];
  export let markers = [];
  export let practices = [];
  export let isAdmin = false;
  export let teamId = '';
  
  const dispatch = createEventDispatcher();
  
  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'layers',
      adminOnly: false
    },
    {
      id: 'schedule',
      label: 'Schedule', 
      icon: 'calendar',
      adminOnly: false
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: 'settings',
      adminOnly: true
    }
  ];
  
  $: visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);
  
  function handleTabChange(tab) {
    activeTab = tab;
    dispatch('tabChange', tab);
  }
</script>

<div class="season-shell" class:mobile={$device.isMobile}>
  {#if $device.isMobile}
    <!-- Mobile Layout -->
    <header class="mobile-header">
      <div class="header-content">
        <h1 class="season-name">{season?.name || 'Season'}</h1>
        <div class="header-info">
          <span class="date-badge">
            {#if season}
              {new Date(season.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              –
              {new Date(season.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {/if}
          </span>
        </div>
      </div>
    </header>
    
    <main class="mobile-content">
      <slot />
    </main>
    
    <nav class="mobile-nav">
      {#each visibleTabs as tab}
        <button
          class="nav-tab"
          class:active={activeTab === tab.id}
          on:click={() => handleTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <div class="nav-icon">
            {#if tab.icon === 'layers'}
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="6" rx="1" />
                <rect x="3" y="11" width="18" height="6" rx="1" />
                <rect x="3" y="19" width="18" height="2" rx="1" />
              </svg>
            {:else if tab.icon === 'calendar'}
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            {:else if tab.icon === 'settings'}
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m4.22-13.22l-3.39 3.39m-1.66 1.66l-3.39 3.39M21 12h-6m-6 0H3m16.22 4.22l-3.39-3.39m-1.66-1.66l-3.39-3.39" />
              </svg>
            {/if}
          </div>
          <span class="nav-label">{tab.label}</span>
        </button>
      {/each}
    </nav>
  {:else}
    <!-- Desktop Layout -->
    <div class="desktop-container">
      <header class="desktop-header">
        <div class="header-left">
          <h1 class="season-name">{season?.name || 'Season'}</h1>
          {#if season}
            <span class="date-range">
              {new Date(season.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              –
              {new Date(season.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          {/if}
        </div>
        
        <nav class="desktop-nav">
          {#each visibleTabs as tab}
            <button
              class="desktop-tab"
              class:active={activeTab === tab.id}
              on:click={() => handleTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {#if tab.icon === 'layers'}
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="14" height="4" rx="1" />
                  <rect x="3" y="9" width="14" height="4" rx="1" />
                  <rect x="3" y="15" width="14" height="2" rx="1" />
                </svg>
              {:else if tab.icon === 'calendar'}
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="14" height="14" rx="2" />
                  <line x1="13" y1="2" x2="13" y2="6" />
                  <line x1="7" y1="2" x2="7" y2="6" />
                  <line x1="3" y1="9" x2="17" y2="9" />
                </svg>
              {:else if tab.icon === 'settings'}
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="10" cy="10" r="2.5" />
                  <path d="M10 1v5m0 4v5m3.5-11.5l-2.5 2.5m-2 2l-2.5 2.5M19 10h-5m-4 0H1m15.5 3.5l-2.5-2.5m-2-2l-2.5-2.5" />
                </svg>
              {/if}
              <span>{tab.label}</span>
            </button>
          {/each}
        </nav>
      </header>
      
      <main class="desktop-content">
        <slot />
      </main>
    </div>
  {/if}
</div>

<style>
  .season-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-primary, #f9fafb);
  }
  
  /* Mobile Styles */
  .mobile-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 12px 16px;
    flex-shrink: 0;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .season-name {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #111827;
  }
  
  .date-badge {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .mobile-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .mobile-nav {
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    flex-shrink: 0;
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    min-height: 56px;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: color 0.2s;
    position: relative;
  }
  
  .nav-tab:active {
    background: #f3f4f6;
  }
  
  .nav-tab.active {
    color: #2563eb;
  }
  
  .nav-tab.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: #2563eb;
  }
  
  .nav-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .nav-label {
    font-size: 11px;
    font-weight: 500;
  }
  
  /* Desktop Styles */
  .desktop-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .desktop-header {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  
  .header-left {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }
  
  .desktop-header .season-name {
    font-size: 24px;
  }
  
  .date-range {
    font-size: 14px;
    color: #6b7280;
  }
  
  .desktop-nav {
    display: flex;
    gap: 4px;
  }
  
  .desktop-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: none;
    border: none;
    border-radius: 8px;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .desktop-tab:hover {
    background: #f3f4f6;
    color: #111827;
  }
  
  .desktop-tab.active {
    background: #eff6ff;
    color: #2563eb;
  }
  
  .desktop-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }
  
  /* Dark mode support */
  :global(.dark) .season-shell {
    background: #111827;
  }
  
  :global(.dark) .mobile-header,
  :global(.dark) .desktop-header {
    background: #1f2937;
    border-bottom-color: #374151;
  }
  
  :global(.dark) .season-name {
    color: #f3f4f6;
  }
  
  :global(.dark) .date-badge,
  :global(.dark) .date-range {
    color: #9ca3af;
  }
  
  :global(.dark) .date-badge {
    background: #374151;
  }
  
  :global(.dark) .mobile-nav {
    background: #1f2937;
    border-top-color: #374151;
  }
  
  :global(.dark) .nav-tab,
  :global(.dark) .desktop-tab {
    color: #9ca3af;
  }
  
  :global(.dark) .nav-tab:active,
  :global(.dark) .desktop-tab:hover {
    background: #374151;
  }
  
  :global(.dark) .nav-tab.active,
  :global(.dark) .desktop-tab.active {
    color: #3b82f6;
  }
  
  :global(.dark) .desktop-tab.active {
    background: #1e3a8a;
  }
  
  /* Responsive adjustments */
  @media (min-width: 768px) and (max-width: 1024px) {
    .desktop-header {
      padding: 12px 16px;
    }
    
    .desktop-header .season-name {
      font-size: 20px;
    }
    
    .desktop-tab {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
</style>
