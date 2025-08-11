# Ticket 004: Drills Library Revamp - ACTIONABLE

## Overview
Improve drills discoverability with enhanced search, filters, grid/list views, and better visual hierarchy.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Navigation, Components)
- [x] Existing drill data structure in database

## Current State Analysis
- Current file: `src/routes/drills/+page.svelte`
- API endpoint: `/api/drills`
- Filter component: `src/lib/components/DrillSearchFilter.svelte`

## File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── drills/
│   │       ├── DrillCard.svelte (NEW)
│   │       ├── DrillFilters.svelte (NEW)
│   │       ├── DrillGrid.svelte (NEW)
│   │       └── DrillSearchBar.svelte (NEW)
│   └── stores/
│       └── drillFilterStore.ts (NEW)
└── routes/
    └── drills/
        └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Drill Filter Store (`src/lib/stores/drillFilterStore.ts`)

```typescript
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface FilterState {
  search: string;
  positions: string[];
  skills: string[];
  difficulty: string[];
  duration: { min: number; max: number };
  tags: string[];
  sortBy: 'name' | 'created' | 'updated' | 'votes';
  sortOrder: 'asc' | 'desc';
  view: 'grid' | 'list';
  density: 'compact' | 'comfortable' | 'spacious';
}

const STORAGE_KEY = 'drill-filters';

function createDrillFilterStore() {
  // Load saved filters from localStorage
  const savedFilters = browser && localStorage.getItem(STORAGE_KEY);
  const initialState: FilterState = savedFilters ? JSON.parse(savedFilters) : {
    search: '',
    positions: [],
    skills: [],
    difficulty: [],
    duration: { min: 0, max: 120 },
    tags: [],
    sortBy: 'created',
    sortOrder: 'desc',
    view: 'grid',
    density: 'comfortable'
  };

  const { subscribe, set, update } = writable<FilterState>(initialState);

  // Save to localStorage on change
  subscribe(value => {
    if (browser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }
  });

  return {
    subscribe,
    setSearch: (search: string) => update(s => ({ ...s, search })),
    togglePosition: (position: string) => update(s => ({
      ...s,
      positions: s.positions.includes(position)
        ? s.positions.filter(p => p !== position)
        : [...s.positions, position]
    })),
    toggleSkill: (skill: string) => update(s => ({
      ...s,
      skills: s.skills.includes(skill)
        ? s.skills.filter(sk => sk !== skill)
        : [...s.skills, skill]
    })),
    setDuration: (duration: { min: number; max: number }) => update(s => ({ ...s, duration })),
    setSortBy: (sortBy: FilterState['sortBy']) => update(s => ({ ...s, sortBy })),
    setSortOrder: (sortOrder: FilterState['sortOrder']) => update(s => ({ ...s, sortOrder })),
    setView: (view: FilterState['view']) => update(s => ({ ...s, view })),
    setDensity: (density: FilterState['density']) => update(s => ({ ...s, density })),
    clearAll: () => set(initialState),
    savePreset: (name: string) => {
      const presets = JSON.parse(localStorage.getItem('drill-filter-presets') || '{}');
      subscribe(value => {
        presets[name] = value;
        localStorage.setItem('drill-filter-presets', JSON.stringify(presets));
      })();
    },
    loadPreset: (name: string) => {
      const presets = JSON.parse(localStorage.getItem('drill-filter-presets') || '{}');
      if (presets[name]) {
        set(presets[name]);
      }
    }
  };
}

export const drillFilters = createDrillFilterStore();

// Derived store for active filter count
export const activeFilterCount = derived(drillFilters, $filters => {
  let count = 0;
  if ($filters.search) count++;
  count += $filters.positions.length;
  count += $filters.skills.length;
  count += $filters.difficulty.length;
  count += $filters.tags.length;
  if ($filters.duration.min > 0 || $filters.duration.max < 120) count++;
  return count;
});
```

### Step 1.1: URL-Sync Filter State (Shareable, Back/Forward-Friendly)

Make filters shareable and restore on reload/navigation by syncing with URLSearchParams. This augments the localStorage persistence and greatly improves UX.

```typescript
// src/lib/stores/drillFilterStore.ts (ADD BELOW existing code)
import { browser } from '$app/environment';

function serializeToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.positions.length) params.set('pos', filters.positions.join(','));
  if (filters.skills.length) params.set('skills', filters.skills.join(','));
  if (filters.difficulty.length) params.set('diff', filters.difficulty.join(','));
  if (filters.tags.length) params.set('tags', filters.tags.join(','));
  if (filters.duration.min > 0) params.set('min', String(filters.duration.min));
  if (filters.duration.max < 120) params.set('max', String(filters.duration.max));
  if (filters.sortBy !== 'created') params.set('sort', filters.sortBy);
  if (filters.sortOrder !== 'desc') params.set('order', filters.sortOrder);
  if (filters.view !== 'grid') params.set('view', filters.view);
  if (filters.density !== 'comfortable') params.set('density', filters.density);
  return params;
}

function parseFromSearchParams(params: URLSearchParams): Partial<FilterState> {
  const getList = (key: string) => (params.get(key)?.split(',').filter(Boolean)) || [];
  const toNum = (key: string, fallback: number) => Number(params.get(key) ?? fallback) || fallback;
  const sortBy = (params.get('sort') as FilterState['sortBy']) || 'created';
  const sortOrder = (params.get('order') as FilterState['sortOrder']) || 'desc';
  const view = (params.get('view') as FilterState['view']) || 'grid';
  const density = (params.get('density') as FilterState['density']) || 'comfortable';
  return {
    search: params.get('q') || '',
    positions: getList('pos'),
    skills: getList('skills'),
    difficulty: getList('diff'),
    tags: getList('tags'),
    duration: { min: toNum('min', 0), max: toNum('max', 120) },
    sortBy,
    sortOrder,
    view,
    density
  };
}

export function enableURLSync(store = drillFilters) {
  if (!browser) return;

  // 1) Initialize from URL (does not clobber localStorage defaults unless present)
  const initial = parseFromSearchParams(new URLSearchParams(window.location.search));
  if (Object.keys(initial).length) {
    // Merge: preserve defaults for missing keys
    store.update((s) => ({ ...s, ...initial }));
  }

  // 2) Write changes to URL without full navigation
  let block = false; // prevent feedback loop on popstate
  store.subscribe((filters) => {
    if (block) return;
    const url = new URL(window.location.href);
    const params = serializeToSearchParams(filters);
    // Keep existing unrelated params
    // Clear managed params first
    ['q','pos','skills','diff','tags','min','max','sort','order','view','density'].forEach((k) => url.searchParams.delete(k));
    params.forEach((value, key) => url.searchParams.set(key, value));
    window.history.replaceState(window.history.state, '', url);
  });

  // 3) Support Back/Forward buttons
  window.addEventListener('popstate', () => {
    block = true;
    const next = parseFromSearchParams(new URLSearchParams(window.location.search));
    store.update((s) => ({ ...s, ...next }));
    // Allow outgoing writes again
    queueMicrotask(() => (block = false));
  });
}
```

Usage: call `enableURLSync()` once in the drills page on mount (see Step 5 below).

### Step 2: Create Drill Search Bar (`src/lib/components/drills/DrillSearchBar.svelte`)

```svelte
<script>
  import { Search, SlidersHorizontal, Grid, List, X } from 'lucide-svelte';
  import { drillFilters, activeFilterCount } from '$lib/stores/drillFilterStore';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let searchInput;
  let searchValue = '';
  let searchTimeout;
  
  // Subscribe to filter store
  $: searchValue = $drillFilters.search;
  
  function handleSearch(e) {
    const value = e.target.value;
    searchValue = value;
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      drillFilters.setSearch(value);
    }, 300);
  }
  
  function clearSearch() {
    searchValue = '';
    drillFilters.setSearch('');
    searchInput?.focus();
  }
  
  function toggleView() {
    drillFilters.setView($drillFilters.view === 'grid' ? 'list' : 'grid');
  }
  
  // Focus search on / key
  function handleKeydown(e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      searchInput?.focus();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="search-bar">
  <div class="search-input-wrapper">
    <Search size={20} class="search-icon" />
    <input
      bind:this={searchInput}
      type="text"
      value={searchValue}
      on:input={handleSearch}
      placeholder="Search drills... (Press / to focus)"
      class="search-input"
    />
    {#if searchValue}
      <button on:click={clearSearch} class="clear-button" aria-label="Clear search">
        <X size={16} />
      </button>
    {/if}
  </div>
  
  <div class="search-actions">
    <button 
      on:click={() => dispatch('toggleFilters')}
      class="filter-button"
      class:active={$activeFilterCount > 0}
    >
      <SlidersHorizontal size={20} />
      <span>Filters</span>
      {#if $activeFilterCount > 0}
        <span class="filter-count">{$activeFilterCount}</span>
      {/if}
    </button>
    
    <div class="view-toggle">
      <button 
        on:click={toggleView}
        class="view-button"
        class:active={$drillFilters.view === 'grid'}
        aria-label="Grid view"
      >
        <Grid size={20} />
      </button>
      <button 
        on:click={toggleView}
        class="view-button"
        class:active={$drillFilters.view === 'list'}
        aria-label="List view"
      >
        <List size={20} />
      </button>
    </div>
  </div>
</div>

<style>
  .search-bar {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  
  .search-input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  
  :global(.search-icon) {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-muted);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: var(--space-2) var(--space-10);
    padding-right: var(--space-8);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    transition: all var(--transition-fast);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .clear-button {
    position: absolute;
    right: var(--space-2);
    padding: var(--space-1);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .clear-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .search-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .filter-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .filter-button:hover,
  .filter-button.active {
    border-color: var(--color-accent-9);
    color: var(--color-accent-9);
  }
  
  .filter-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 var(--space-1);
    background: var(--color-accent-9);
    color: white;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .view-toggle {
    display: flex;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  .view-button {
    padding: var(--space-2);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .view-button:not(:last-child) {
    border-right: 1px solid var(--color-border-default);
  }
  
  .view-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .view-button.active {
    background: var(--color-accent-3);
    color: var(--color-accent-9);
  }
  
  @media (max-width: 640px) {
    .search-bar {
      flex-direction: column;
    }
    
    .search-actions {
      justify-content: space-between;
    }
  }
</style>
```

### Step 3: Create Drill Card (`src/lib/components/drills/DrillCard.svelte`)

```svelte
<script>
  import { Target, Clock, Users, ArrowUp, Plus, Eye } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  
  export let drill;
  export let view = 'grid'; // grid or list
  export let density = 'comfortable'; // compact, comfortable, spacious
  
  $: imageUrl = drill.image_url || '/placeholder-drill.svg';
</script>

<article class="drill-card view-{view} density-{density}">
  <a href="/drills/{drill.id}" class="card-link">
    {#if view === 'grid'}
      <div class="card-image">
        <img src={imageUrl} alt={drill.name} loading="lazy" />
        <div class="card-badges">
          {#if drill.is_new}
            <span class="badge badge-new">New</span>
          {/if}
          {#if drill.is_featured}
            <span class="badge badge-featured">Featured</span>
          {/if}
        </div>
      </div>
    {/if}
    
    <div class="card-content">
      <h3 class="card-title">{drill.name}</h3>
      
      <div class="card-meta">
        <span class="meta-item">
          <Clock size={14} />
          {drill.duration} min
        </span>
        <span class="meta-item">
          <Users size={14} />
          {drill.position || 'All'}
        </span>
        <span class="meta-item difficulty-{drill.difficulty}">
          {drill.difficulty}
        </span>
      </div>
      
      {#if density !== 'compact'}
        <p class="card-description">
          {drill.description}
        </p>
      {/if}
      
      <div class="card-tags">
        {#each (drill.tags || []).slice(0, 3) as tag}
          <span class="tag">{tag}</span>
        {/each}
        {#if drill.tags?.length > 3}
          <span class="tag">+{drill.tags.length - 3}</span>
        {/if}
      </div>
    </div>
  </a>
  
  <div class="card-actions">
    <div class="card-stats">
      <button class="stat-button" aria-label="Upvote">
        <ArrowUp size={16} />
        <span>{drill.votes || 0}</span>
      </button>
    </div>
    
    <div class="action-buttons">
      <Button size="sm" variant="ghost" href="/drills/{drill.id}">
        <Eye size={16} />
        View
      </Button>
      <Button size="sm" variant="primary">
        <Plus size={16} />
        Add to Plan
      </Button>
    </div>
  </div>
</article>

<style>
  .drill-card {
    display: flex;
    flex-direction: column;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
  }
  
  .card-link {
    display: flex;
    flex-direction: column;
    flex: 1;
    color: inherit;
    text-decoration: none;
  }
  
  /* Grid view styles */
  .view-grid .card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: var(--color-bg-muted);
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .card-badges {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: flex;
    gap: var(--space-1);
  }
  
  .badge {
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-1);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .badge-new {
    background: var(--color-success);
    color: white;
  }
  
  .badge-featured {
    background: var(--color-accent-9);
    color: white;
  }
  
  /* List view styles */
  .view-list {
    flex-direction: row;
  }
  
  .view-list .card-link {
    flex-direction: row;
    align-items: center;
    padding: var(--space-3);
  }
  
  .view-list .card-content {
    flex: 1;
  }
  
  /* Content styles */
  .card-content {
    padding: var(--space-3);
    flex: 1;
  }
  
  .card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
    line-height: var(--line-height-snug);
  }
  
  .card-meta {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .difficulty-beginner {
    color: var(--color-success);
  }
  
  .difficulty-intermediate {
    color: var(--color-warning);
  }
  
  .difficulty-advanced {
    color: var(--color-error);
  }
  
  .card-description {
    margin-bottom: var(--space-2);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
  
  .tag {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
  
  /* Actions */
  .card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
  }
  
  .card-stats {
    display: flex;
    gap: var(--space-2);
  }
  
  .stat-button {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .stat-button:hover {
    background: var(--color-surface-1);
    color: var(--color-accent-9);
  }
  
  .action-buttons {
    display: flex;
    gap: var(--space-2);
  }
  
  /* Density variations */
  .density-compact .card-content {
    padding: var(--space-2);
  }
  
  .density-compact .card-title {
    font-size: var(--font-size-base);
  }
  
  .density-spacious .card-content {
    padding: var(--space-4);
  }
  
  .density-spacious .card-description {
    -webkit-line-clamp: 3;
  }
</style>
```

### Step 4: Create Drill Filters Panel (`src/lib/components/drills/DrillFilters.svelte`)

```svelte
<script>
  import { X, Filter, Save } from 'lucide-svelte';
  import { drillFilters, activeFilterCount } from '$lib/stores/drillFilterStore';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  export let open = false;
  
  // Filter options (would come from API in real app)
  const positions = ['Chaser', 'Beater', 'Keeper', 'Seeker', 'All'];
  const skills = ['Passing', 'Shooting', 'Defense', 'Speed', 'Teamwork'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  
  let presetName = '';
  
  function clearAll() {
    drillFilters.clearAll();
  }
  
  function savePreset() {
    if (presetName) {
      drillFilters.savePreset(presetName);
      presetName = '';
    }
  }
</script>

<aside class="filters-panel" class:open>
  <div class="filters-header">
    <h2>Filters</h2>
    <button on:click={() => open = false} class="close-button" aria-label="Close filters">
      <X size={20} />
    </button>
  </div>
  
  <div class="filters-content">
    <!-- Active filters summary -->
    {#if $activeFilterCount > 0}
      <div class="active-filters">
        <span>{$activeFilterCount} active filters</span>
        <button on:click={clearAll} class="clear-all">Clear all</button>
      </div>
    {/if}
    
    <!-- Position filter -->
    <div class="filter-group">
      <h3>Position</h3>
      <div class="filter-options">
        {#each positions as position}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.positions.includes(position)}
              on:change={() => drillFilters.togglePosition(position)}
            />
            <span>{position}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Skills filter -->
    <div class="filter-group">
      <h3>Skills</h3>
      <div class="filter-options">
        {#each skills as skill}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.skills.includes(skill)}
              on:change={() => drillFilters.toggleSkill(skill)}
            />
            <span>{skill}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Difficulty filter -->
    <div class="filter-group">
      <h3>Difficulty</h3>
      <div class="filter-options">
        {#each difficulties as difficulty}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$drillFilters.difficulty.includes(difficulty)}
              on:change={() => drillFilters.toggleDifficulty(difficulty)}
            />
            <span>{difficulty}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <!-- Duration filter -->
    <div class="filter-group">
      <h3>Duration (minutes)</h3>
      <div class="range-inputs">
        <Input
          type="number"
          placeholder="Min"
          value={$drillFilters.duration.min}
          on:change={(e) => drillFilters.setDuration({
            ...$drillFilters.duration,
            min: parseInt(e.target.value) || 0
          })}
        />
        <span>to</span>
        <Input
          type="number"
          placeholder="Max"
          value={$drillFilters.duration.max}
          on:change={(e) => drillFilters.setDuration({
            ...$drillFilters.duration,
            max: parseInt(e.target.value) || 120
          })}
        />
      </div>
    </div>
    
    <!-- Sort options -->
    <div class="filter-group">
      <h3>Sort By</h3>
      <select 
        class="sort-select"
        value={$drillFilters.sortBy}
        on:change={(e) => drillFilters.setSortBy(e.target.value)}
      >
        <option value="name">Name</option>
        <option value="created">Newest</option>
        <option value="updated">Recently Updated</option>
        <option value="votes">Most Popular</option>
      </select>
    </div>
    
    <!-- Preset management -->
    <div class="filter-group">
      <h3>Filter Presets</h3>
      <div class="preset-controls">
        <Input
          bind:value={presetName}
          placeholder="Preset name"
        />
        <Button size="sm" on:click={savePreset}>
          <Save size={16} />
          Save
        </Button>
      </div>
    </div>
  </div>
</aside>

<style>
  .filters-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: var(--color-surface-1);
    border-left: 1px solid var(--color-border-default);
    transform: translateX(100%);
    transition: transform var(--transition-base);
    z-index: 40;
    overflow-y: auto;
  }
  
  .filters-panel.open {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    position: sticky;
    top: 0;
    background: var(--color-surface-1);
  }
  
  .filters-header h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }
  
  .close-button {
    padding: var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .close-button:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  .filters-content {
    padding: var(--space-4);
  }
  
  .active-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    background: var(--color-accent-1);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-size: var(--font-size-sm);
  }
  
  .clear-all {
    background: transparent;
    border: none;
    color: var(--color-accent-9);
    cursor: pointer;
    font-weight: var(--font-weight-medium);
  }
  
  .filter-group {
    margin-bottom: var(--space-6);
  }
  
  .filter-group h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .filter-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  
  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent-9);
  }
  
  .range-inputs {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .sort-select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    cursor: pointer;
  }
  
  .preset-controls {
    display: flex;
    gap: var(--space-2);
  }
  
  @media (max-width: 640px) {
    .filters-panel {
      width: 100%;
    }
  }
</style>
```

### Step 5: Update Drills Page (`src/routes/drills/+page.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  import { drillFilters } from '$lib/stores/drillFilterStore';
  import DrillSearchBar from '$lib/components/drills/DrillSearchBar.svelte';
  import DrillFilters from '$lib/components/drills/DrillFilters.svelte';
  import DrillCard from '$lib/components/drills/DrillCard.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  
  export let data;
  
  let drills = [];
  let loading = true;
  let filtersOpen = false;
  
  onMount(async () => {
    // Enable shareable, URL-synced filters
    const { enableURLSync } = await import('$lib/stores/drillFilterStore');
    enableURLSync();
    await loadDrills();
  });
  
  async function loadDrills() {
    loading = true;
    try {
      const response = await apiFetch('/api/drills');
      drills = response.drills || [];
    } catch (error) {
      console.error('Failed to load drills:', error);
    } finally {
      loading = false;
    }
  }
  
  // Filter and sort drills based on store values
  $: filteredDrills = filterDrills(drills, $drillFilters);
  
  function filterDrills(drills, filters) {
    let result = [...drills];
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(drill => 
        drill.name.toLowerCase().includes(searchLower) ||
        drill.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Position filter
    if (filters.positions.length > 0) {
      result = result.filter(drill => 
        filters.positions.includes(drill.position) || 
        filters.positions.includes('All')
      );
    }
    
    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter(drill => 
        drill.skills?.some(skill => filters.skills.includes(skill))
      );
    }
    
    // Difficulty filter
    if (filters.difficulty.length > 0) {
      result = result.filter(drill => 
        filters.difficulty.includes(drill.difficulty)
      );
    }
    
    // Duration filter
    result = result.filter(drill => 
      drill.duration >= filters.duration.min && 
      drill.duration <= filters.duration.max
    );
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = new Date(b.created_at) - new Date(a.created_at);
          break;
        case 'updated':
          comparison = new Date(b.updated_at) - new Date(a.updated_at);
          break;
        case 'votes':
          comparison = (b.votes || 0) - (a.votes || 0);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }
</script>

<div class="drills-page">
  <div class="page-header">
    <h1>Drill Library</h1>
    <Button variant="primary" href="/drills/create">
      Create New Drill
    </Button>
  </div>
  
  <DrillSearchBar on:toggleFilters={() => filtersOpen = !filtersOpen} />
  
  <div class="drills-container">
    {#if loading}
      <div class="loading-grid">
        {#each Array(12) as _, i}
          <div class="skeleton-card">
            <Skeleton variant="rect" height="180px" />
            <div class="skeleton-content">
              <Skeleton variant="line" width="70%" />
              <Skeleton variant="line" width="50%" />
              <Skeleton variant="line" />
            </div>
          </div>
        {/each}
      </div>
    {:else if filteredDrills.length === 0}
      <div class="empty-state">
        <img src="/empty-drills.svg" alt="No drills found" />
        <h2>No drills found</h2>
        <p>Try adjusting your filters or search terms</p>
        <Button variant="secondary" on:click={() => drillFilters.clearAll()}>
          Clear Filters
        </Button>
      </div>
    {:else}
      <div class="drills-grid" class:list-view={$drillFilters.view === 'list'}>
        {#each filteredDrills as drill (drill.id)}
          <DrillCard 
            {drill} 
            view={$drillFilters.view}
            density={$drillFilters.density}
          />
        {/each}
      </div>
    {/if}
  </div>
  
  <DrillFilters bind:open={filtersOpen} />
</div>

<style>
  .drills-page {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }
  
  .page-header h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
  }
  
  .drills-container {
    min-height: 400px;
  }
  
  .drills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }
  
  .drills-grid.list-view {
    grid-template-columns: 1fr;
  }
  
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }
  
  .skeleton-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .skeleton-content {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12);
    text-align: center;
  }
  
  .empty-state img {
    width: 200px;
    height: 200px;
    margin-bottom: var(--space-4);
    opacity: 0.5;
  }
  
  .empty-state h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-2);
  }
  
  .empty-state p {
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }
    
    .drills-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## Testing Checklist

- [ ] Search filters drills in real-time with debouncing
- [ ] Position, skill, difficulty filters work correctly
- [ ] Duration range filter limits results appropriately
- [ ] Grid/list view toggle changes layout
- [ ] Density settings adjust card size and information
- [ ] Filter panel opens/closes smoothly
- [ ] Active filter count displays correctly
- [ ] Clear all filters resets to defaults
- [ ] Preset saving and loading works
- [ ] Sorting changes order correctly
- [ ] Empty state displays when no results
- [ ] Loading skeletons show during data fetch
- [ ] Cards link to drill detail pages
- [ ] Add to plan button functions (or shows appropriate state)
- [ ] Mobile responsive layout works
- [ ] URL reflects current filters (q, pos, skills, diff, tags, min, max, sort, order, view, density)
- [ ] Reloading the page restores filters from the URL
- [ ] Copy/paste URL shares the same filtered view
- [ ] Browser Back/Forward restores prior filter states without full reload

## API Integration Notes

- Modify `/api/drills` endpoint to accept filter parameters
- Add endpoints for filter options: `/api/drills/filter-options`
- Implement server-side pagination for large datasets
- Add search indexing for better performance
- Optional: have the `+page.server.js`/`load` function parse URL params and pass initial filters for SSR; client store still syncs URL thereafter

## Performance Optimizations

1. Virtual scrolling for > 100 drills
2. Image lazy loading with IntersectionObserver
3. Debounced search input
4. Memoized filter calculations
5. localStorage caching of filter preferences

## Next Steps
After completing this ticket, proceed to Ticket 005 (Drill Detail Improvements) to enhance individual drill pages.