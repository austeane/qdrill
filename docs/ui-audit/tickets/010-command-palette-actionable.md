# Ticket 010: Command Palette Enhancement - ACTIONABLE

## Overview
This ticket enhances the basic command palette from Ticket 002 with search providers, recent items, and actions.

## Prerequisites
- [x] Basic CommandPalette from Ticket 002
- [x] `cmdk-sv` library installed

## Implementation Steps

### Step 1: Enhanced Command Palette (`src/lib/components/CommandPaletteEnhanced.svelte`)

```svelte
<script>
  import { Command } from 'cmdk-sv';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { 
    Search, 
    Target, 
    Calendar, 
    Users, 
    PenTool,
    Clock,
    Star,
    Plus,
    Settings,
    FileText,
    ArrowRight,
    Hash
  } from 'lucide-svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  import { logger } from '$lib/utils/logger';
  
  export let open = false;
  
  let searchQuery = '';
  let searchResults = {
    drills: [],
    plans: [],
    teams: []
  };
  let recentItems = [];
  let isSearching = false;
  let selectedGroup = null;
  
  // Command categories
  const commands = {
    navigation: [
      { id: 'nav-drills', label: 'Go to Drills', icon: Target, action: () => goto('/drills') },
      { id: 'nav-plans', label: 'Go to Practice Plans', icon: Calendar, action: () => goto('/practice-plans') },
      { id: 'nav-teams', label: 'Go to Teams', icon: Users, action: () => goto('/teams') },
      { id: 'nav-whiteboard', label: 'Go to Whiteboard', icon: PenTool, action: () => goto('/whiteboard') },
      { id: 'nav-settings', label: 'Settings', icon: Settings, action: () => goto('/settings') }
    ],
    actions: [
      { id: 'create-drill', label: 'Create New Drill', icon: Plus, action: () => goto('/drills/create') },
      { id: 'create-plan', label: 'Create Practice Plan', icon: Plus, action: () => goto('/practice-plans/wizard') },
      { id: 'create-team', label: 'Create Team', icon: Plus, action: () => goto('/teams/create') }
    ]
  };
  
  // Load recent items from localStorage
  onMount(() => {
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      recentItems = JSON.parse(stored);
    }
  });
  
  // Search functionality
  let searchTimeout;
  async function handleSearch(query) {
    searchQuery = query;
    
    if (query.length < 2) {
      searchResults = { drills: [], plans: [], teams: [] };
      return;
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      isSearching = true;
      
      try {
        // Search different resources in parallel
        const [drillsRes, plansRes] = await Promise.all([
          apiFetch(`/api/drills/search?q=${encodeURIComponent(query)}&limit=5`),
          apiFetch(`/api/practice-plans?search=${encodeURIComponent(query)}&limit=5`)
        ]);
        
        searchResults = {
          drills: drillsRes.drills || [],
          plans: plansRes.plans || [],
          teams: [] // Add team search when available
        };
      } catch (error) {
        logger.error('Command palette search failed:', error);
      } finally {
        isSearching = false;
      }
    }, 300);
  }
  
  // Handle selection
  function handleSelect(item, type) {
    // Add to recent items
    addToRecent({ ...item, type });
    
    // Navigate based on type
    switch (type) {
      case 'drill':
        goto(`/drills/${item.id}`);
        break;
      case 'plan':
        goto(`/practice-plans/${item.id}`);
        break;
      case 'team':
        goto(`/teams/${item.id}`);
        break;
      case 'command':
        item.action();
        break;
    }
    
    // Close palette
    open = false;
    searchQuery = '';
  }
  
  function addToRecent(item) {
    // Remove if already exists
    recentItems = recentItems.filter(i => i.id !== item.id);
    
    // Add to beginning
    recentItems = [item, ...recentItems].slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('command-palette-recent', JSON.stringify(recentItems));
  }
  
  // Keyboard shortcuts
  function handleKeydown(e) {
    // Cmd+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
    }
    
    // Escape to close
    if (e.key === 'Escape' && open) {
      open = false;
    }
    
    // Quick shortcuts when palette is closed
    if (!open && !e.target.matches('input, textarea')) {
      // G then D for drills
      if (e.key === 'g') {
        window.lastKey = 'g';
        setTimeout(() => window.lastKey = null, 1000);
      } else if (window.lastKey === 'g') {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            goto('/drills');
            break;
          case 'p':
            e.preventDefault();
            goto('/practice-plans');
            break;
          case 't':
            e.preventDefault();
            goto('/teams');
            break;
        }
        window.lastKey = null;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Command.Root 
  bind:open 
  shouldFilter={false}
  onValueChange={handleSearch}
>
  <Command.Dialog class="command-dialog">
    <Command.Input 
      placeholder="Search or type a command..." 
      class="command-input"
    />
    
    <Command.List class="command-list">
      {#if isSearching}
        <Command.Loading class="command-loading">
          Searching...
        </Command.Loading>
      {:else if searchQuery.length < 2}
        <!-- Recent items -->
        {#if recentItems.length > 0}
          <Command.Group heading="Recent" class="command-group">
            {#each recentItems as item}
              <Command.Item 
                onSelect={() => handleSelect(item, item.type)}
                class="command-item"
              >
                <Clock size={16} class="item-icon" />
                <span class="item-label">{item.name || item.label}</span>
                <span class="item-type">{item.type}</span>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        <!-- Navigation -->
        <Command.Group heading="Navigation" class="command-group">
          {#each commands.navigation as cmd}
            <Command.Item 
              onSelect={() => handleSelect(cmd, 'command')}
              class="command-item"
            >
              <svelte:component this={cmd.icon} size={16} class="item-icon" />
              <span class="item-label">{cmd.label}</span>
              <ArrowRight size={14} class="item-arrow" />
            </Command.Item>
          {/each}
        </Command.Group>
        
        <!-- Actions -->
        <Command.Group heading="Actions" class="command-group">
          {#each commands.actions as cmd}
            <Command.Item 
              onSelect={() => handleSelect(cmd, 'command')}
              class="command-item"
            >
              <svelte:component this={cmd.icon} size={16} class="item-icon" />
              <span class="item-label">{cmd.label}</span>
              <ArrowRight size={14} class="item-arrow" />
            </Command.Item>
          {/each}
        </Command.Group>
      {:else}
        <!-- Search results -->
        {#if searchResults.drills.length > 0}
          <Command.Group heading="Drills" class="command-group">
            {#each searchResults.drills as drill}
              <Command.Item 
                onSelect={() => handleSelect(drill, 'drill')}
                class="command-item"
              >
                <Target size={16} class="item-icon" />
                <div class="item-content">
                  <span class="item-label">{drill.name}</span>
                  <span class="item-description">{drill.description}</span>
                </div>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        {#if searchResults.plans.length > 0}
          <Command.Group heading="Practice Plans" class="command-group">
            {#each searchResults.plans as plan}
              <Command.Item 
                onSelect={() => handleSelect(plan, 'plan')}
                class="command-item"
              >
                <Calendar size={16} class="item-icon" />
                <div class="item-content">
                  <span class="item-label">{plan.name}</span>
                  <span class="item-description">{plan.description}</span>
                </div>
                <ArrowRight size={14} class="item-arrow" />
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
        
        {#if searchResults.drills.length === 0 && searchResults.plans.length === 0}
          <Command.Empty class="command-empty">
            No results found for "{searchQuery}"
          </Command.Empty>
        {/if}
      {/if}
    </Command.List>
    
    <div class="command-footer">
      <div class="footer-hints">
        <kbd>↑↓</kbd> Navigate
        <kbd>↵</kbd> Select
        <kbd>esc</kbd> Close
      </div>
      <div class="footer-shortcuts">
        Type <kbd>></kbd> for commands
      </div>
    </div>
  </Command.Dialog>
</Command.Root>

<style>
  :global(.command-dialog) {
    max-width: 640px;
    width: 100%;
    max-height: 500px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  :global(.command-input) {
    width: 100%;
    padding: var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--color-border-default);
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
  }
  
  :global(.command-input:focus) {
    outline: none;
  }
  
  :global(.command-list) {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2);
    max-height: 400px;
  }
  
  :global(.command-group) {
    padding: var(--space-2) 0;
  }
  
  :global(.command-group [cmdk-group-heading]) {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  
  :global(.command-item) {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  :global(.command-item[aria-selected="true"]) {
    background: var(--color-accent-3);
    color: var(--color-accent-11);
  }
  
  :global(.item-icon) {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  
  :global(.command-item[aria-selected="true"] .item-icon) {
    color: var(--color-accent-9);
  }
  
  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }
  
  .item-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-type {
    padding: 0.125rem 0.375rem;
    background: var(--color-bg-muted);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: capitalize;
  }
  
  :global(.item-arrow) {
    flex-shrink: 0;
    color: var(--color-text-muted);
    margin-left: auto;
  }
  
  :global(.command-loading) {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
  }
  
  :global(.command-empty) {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
  }
  
  .command-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .footer-hints,
  .footer-shortcuts {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .command-footer kbd {
    padding: 0.125rem 0.25rem;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: var(--font-size-xs);
  }
</style>
```

### Step 2: Command Palette Provider (`src/lib/stores/commandPalette.ts`)

```typescript
import { writable, derived } from 'svelte/store';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  action: () => void;
  keywords?: string[];
  category?: string;
}

interface CommandPaletteState {
  open: boolean;
  query: string;
  selectedIndex: number;
  commands: CommandItem[];
  recentCommands: CommandItem[];
}

function createCommandPalette() {
  const { subscribe, set, update } = writable<CommandPaletteState>({
    open: false,
    query: '',
    selectedIndex: 0,
    commands: [],
    recentCommands: []
  });

  return {
    subscribe,
    open: () => update(state => ({ ...state, open: true })),
    close: () => update(state => ({ ...state, open: false, query: '', selectedIndex: 0 })),
    toggle: () => update(state => ({ ...state, open: !state.open })),
    setQuery: (query: string) => update(state => ({ ...state, query })),
    registerCommand: (command: CommandItem) => {
      update(state => ({
        ...state,
        commands: [...state.commands, command]
      }));
    },
    registerCommands: (commands: CommandItem[]) => {
      update(state => ({
        ...state,
        commands: [...state.commands, ...commands]
      }));
    },
    executeCommand: (commandId: string) => {
      let command: CommandItem | undefined;
      
      update(state => {
        command = state.commands.find(cmd => cmd.id === commandId);
        if (command) {
          // Add to recent commands
          const recentCommands = [
            command,
            ...state.recentCommands.filter(cmd => cmd.id !== commandId)
          ].slice(0, 5);
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('recent-commands', JSON.stringify(recentCommands));
          }
          
          return {
            ...state,
            recentCommands,
            open: false,
            query: ''
          };
        }
        return state;
      });
      
      // Execute the command action
      if (command) {
        command.action();
      }
    }
  };
}

export const commandPalette = createCommandPalette();

// Derived store for filtered commands
export const filteredCommands = derived(
  commandPalette,
  $state => {
    if (!$state.query) {
      return $state.recentCommands.length > 0 
        ? $state.recentCommands 
        : $state.commands.slice(0, 10);
    }
    
    const query = $state.query.toLowerCase();
    return $state.commands.filter(cmd => {
      const inLabel = cmd.label.toLowerCase().includes(query);
      const inDescription = cmd.description?.toLowerCase().includes(query);
      const inKeywords = cmd.keywords?.some(k => k.toLowerCase().includes(query));
      return inLabel || inDescription || inKeywords;
    });
  }
);
```

### Step 3: Global Command Registration

```typescript
// src/lib/commands/index.ts
import { commandPalette } from '$lib/stores/commandPalette';
import { goto } from '$app/navigation';
import { 
  Target, 
  Calendar, 
  Users, 
  Plus, 
  Settings,
  LogOut,
  Sun,
  Moon
} from 'lucide-svelte';

export function registerGlobalCommands() {
  commandPalette.registerCommands([
    // Navigation
    {
      id: 'go-drills',
      label: 'Go to Drills',
      description: 'Browse drill library',
      icon: Target,
      action: () => goto('/drills'),
      keywords: ['navigate', 'drill', 'exercise'],
      category: 'Navigation'
    },
    {
      id: 'go-plans',
      label: 'Go to Practice Plans',
      description: 'View practice plans',
      icon: Calendar,
      action: () => goto('/practice-plans'),
      keywords: ['navigate', 'practice', 'plan'],
      category: 'Navigation'
    },
    
    // Actions
    {
      id: 'create-drill',
      label: 'Create New Drill',
      description: 'Add a new drill to the library',
      icon: Plus,
      action: () => goto('/drills/create'),
      keywords: ['new', 'add', 'drill'],
      category: 'Actions'
    },
    {
      id: 'create-plan',
      label: 'Create Practice Plan',
      description: 'Start practice plan wizard',
      icon: Plus,
      action: () => goto('/practice-plans/wizard'),
      keywords: ['new', 'add', 'practice', 'plan'],
      category: 'Actions'
    },
    
    // Settings
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: Sun,
      action: () => {
        // Toggle theme
        document.documentElement.setAttribute(
          'data-theme',
          document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
        );
      },
      keywords: ['theme', 'dark', 'light', 'mode'],
      category: 'Settings'
    },
    
    // User
    {
      id: 'sign-out',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: LogOut,
      action: () => {
        // Sign out logic
        goto('/logout');
      },
      keywords: ['logout', 'sign', 'out'],
      category: 'User'
    }
  ]);
}
```

## Testing Checklist

- [ ] Opens with Cmd+K / Ctrl+K
- [ ] Closes with Escape
- [ ] Search filters results in real-time
- [ ] Recent items displayed and work
- [ ] Navigation commands work
- [ ] Action commands work
- [ ] Search results from API display
- [ ] Keyboard navigation works (up/down arrows)
- [ ] Enter selects current item
- [ ] Quick shortcuts (g+d) work when closed
- [ ] Recent items persist across sessions
- [ ] Loading state shows during search
- [ ] Empty state displays for no results
- [ ] Footer hints visible

## Integration Notes

- Replaces basic CommandPalette from Ticket 002
- Uses existing API endpoints for search
- Integrates with theme system from Ticket 001
- Uses logger from Ticket 009

## Next Steps
After completing this ticket, proceed to Ticket 011 (Reduce Tints and Anchor Links).