# Ticket 005: Drill Detail Improvements - ACTIONABLE

## Overview
Enhance the drill detail page with better information architecture, tabs for organized content, and related drills section.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Navigation, Components)
- [x] Button, Card, and Tabs components from Ticket 003

## Current State
- Current file: `src/routes/drills/[id]/+page.svelte`
- API endpoint: `/api/drills/[id]`

## File Structure
```
src/
├── lib/
│   └── components/
│       └── drills/
│           ├── DrillDetailHeader.svelte (NEW)
│           ├── DrillDetailTabs.svelte (NEW)
│           ├── RelatedDrills.svelte (NEW)
│           └── DrillActions.svelte (NEW)
└── routes/
    └── drills/
        └── [id]/
            └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Drill Detail Header (`src/lib/components/drills/DrillDetailHeader.svelte`)

```svelte
<script>
  import { Clock, Users, Target, Trophy, Share2, Bookmark, Edit } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { page } from '$app/stores';
  
  export let drill;
  export let isOwner = false;
  
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: drill.name,
        text: drill.description,
        url: window.location.href
      });
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  }
</script>

<header class="drill-header">
  <div class="header-content">
    <div class="header-main">
      <h1>{drill.name}</h1>
      
      <div class="meta-badges">
        <span class="badge badge-position">
          <Users size={14} />
          {drill.position || 'All Positions'}
        </span>
        <span class="badge badge-duration">
          <Clock size={14} />
          {drill.duration} min
        </span>
        <span class="badge badge-difficulty badge-{drill.difficulty?.toLowerCase()}">
          <Target size={14} />
          {drill.difficulty}
        </span>
        {#if drill.is_featured}
          <span class="badge badge-featured">
            <Trophy size={14} />
            Featured
          </span>
        {/if}
      </div>
      
      <p class="description">{drill.description}</p>
    </div>
    
    <div class="header-actions">
      <div class="primary-actions">
        <Button variant="primary" size="lg">
          Add to Practice Plan
        </Button>
        {#if isOwner}
          <Button variant="secondary" href="/drills/{drill.id}/edit">
            <Edit size={16} />
            Edit
          </Button>
        {/if}
      </div>
      
      <div class="secondary-actions">
        <button class="icon-action" on:click={handleShare} aria-label="Share">
          <Share2 size={20} />
        </button>
        <button class="icon-action" aria-label="Bookmark">
          <Bookmark size={20} />
        </button>
      </div>
    </div>
  </div>
  
  {#if drill.image_url}
    <div class="header-image">
      <img src={drill.image_url} alt="{drill.name} diagram" />
    </div>
  {/if}
</header>

<style>
  .drill-header {
    background: var(--color-surface-1);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    border: 1px solid var(--color-border-default);
  }
  
  .header-content {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-6);
    align-items: start;
  }
  
  .header-main h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-3);
  }
  
  .meta-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  
  .badge-beginner {
    background: var(--color-success);
    color: white;
  }
  
  .badge-intermediate {
    background: var(--color-warning);
    color: white;
  }
  
  .badge-advanced {
    background: var(--color-error);
    color: white;
  }
  
  .badge-featured {
    background: var(--color-accent-9);
    color: white;
  }
  
  .description {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-secondary);
  }
  
  .header-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .primary-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .secondary-actions {
    display: flex;
    gap: var(--space-2);
  }
  
  .icon-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .icon-action:hover {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    border-color: var(--color-border-strong);
  }
  
  .header-image {
    margin-top: var(--space-4);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-bg-muted);
  }
  
  .header-image img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  @media (max-width: 768px) {
    .header-content {
      grid-template-columns: 1fr;
    }
    
    .header-actions {
      flex-direction: row;
      justify-content: space-between;
    }
  }
</style>
```

### Step 2: Create Drill Detail Tabs (`src/lib/components/drills/DrillDetailTabs.svelte`)

```svelte
<script>
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import Card from '$lib/components/ui/Card.svelte';
  
  export let drill;
  
  let activeTab = 'description';
</script>

<TabsPrimitive.Root bind:value={activeTab} class="drill-tabs">
  <TabsPrimitive.List class="tabs-list">
    <TabsPrimitive.Trigger value="description" class="tab-trigger">
      Description
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="steps" class="tab-trigger">
      Steps
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="equipment" class="tab-trigger">
      Equipment
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="variations" class="tab-trigger">
      Variations ({drill.variations?.length || 0})
    </TabsPrimitive.Trigger>
    <TabsPrimitive.Trigger value="coaching" class="tab-trigger">
      Coaching Points
    </TabsPrimitive.Trigger>
  </TabsPrimitive.List>
  
  <div class="tab-content">
    <TabsPrimitive.Content value="description" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Overview</h3>
          <p>{drill.long_description || drill.description}</p>
          
          {#if drill.objectives}
            <h3>Learning Objectives</h3>
            <ul>
              {#each drill.objectives as objective}
                <li>{objective}</li>
              {/each}
            </ul>
          {/if}
          
          {#if drill.key_skills}
            <h3>Key Skills Developed</h3>
            <div class="skill-tags">
              {#each drill.key_skills as skill}
                <span class="skill-tag">{skill}</span>
              {/each}
            </div>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="steps" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Setup</h3>
          <p>{drill.setup || 'No specific setup required.'}</p>
          
          <h3>Instructions</h3>
          {#if drill.steps}
            <ol class="steps-list">
              {#each drill.steps as step, i}
                <li>
                  <span class="step-number">{i + 1}</span>
                  <span class="step-text">{step}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p>No step-by-step instructions available.</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="equipment" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Required Equipment</h3>
          {#if drill.equipment?.length}
            <ul class="equipment-list">
              {#each drill.equipment as item}
                <li>
                  <span class="equipment-name">{item.name}</span>
                  {#if item.quantity}
                    <span class="equipment-quantity">× {item.quantity}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <p>No special equipment required.</p>
          {/if}
          
          {#if drill.space_requirements}
            <h3>Space Requirements</h3>
            <p>{drill.space_requirements}</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="variations" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Drill Variations</h3>
          {#if drill.variations?.length}
            <div class="variations-grid">
              {#each drill.variations as variation}
                <a href="/drills/{variation.id}" class="variation-card">
                  <h4>{variation.name}</h4>
                  <p>{variation.description}</p>
                  <span class="variation-difficulty">{variation.difficulty}</span>
                </a>
              {/each}
            </div>
          {:else}
            <p>No variations available for this drill.</p>
            <Button variant="secondary">
              Suggest a Variation
            </Button>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
    
    <TabsPrimitive.Content value="coaching" class="tab-panel">
      <Card>
        <div class="content-section">
          <h3>Coaching Points</h3>
          {#if drill.coaching_points}
            <ul class="coaching-list">
              {#each drill.coaching_points as point}
                <li>{point}</li>
              {/each}
            </ul>
          {:else}
            <p>No specific coaching points available.</p>
          {/if}
          
          {#if drill.common_mistakes}
            <h3>Common Mistakes to Avoid</h3>
            <ul class="mistakes-list">
              {#each drill.common_mistakes as mistake}
                <li>{mistake}</li>
              {/each}
            </ul>
          {/if}
          
          {#if drill.progressions}
            <h3>Progressions</h3>
            <p>{drill.progressions}</p>
          {/if}
        </div>
      </Card>
    </TabsPrimitive.Content>
  </div>
</TabsPrimitive.Root>

<style>
  :global(.drill-tabs) {
    margin-bottom: var(--space-6);
  }
  
  :global(.tabs-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border-default);
    margin-bottom: var(--space-4);
    overflow-x: auto;
  }
  
  :global(.tab-trigger) {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
    white-space: nowrap;
  }
  
  :global(.tab-trigger:hover) {
    color: var(--color-text-primary);
  }
  
  :global(.tab-trigger[data-state="active"]) {
    color: var(--color-accent-9);
    border-bottom-color: var(--color-accent-9);
  }
  
  .content-section {
    padding: var(--space-4);
  }
  
  .content-section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-3);
    margin-top: var(--space-6);
  }
  
  .content-section h3:first-child {
    margin-top: 0;
  }
  
  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .skill-tag {
    padding: var(--space-1) var(--space-3);
    background: var(--color-accent-2);
    color: var(--color-accent-11);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
  }
  
  .steps-list {
    counter-reset: step;
    padding-left: 0;
  }
  
  .steps-list li {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    align-items: flex-start;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    background: var(--color-accent-9);
    color: white;
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  
  .step-text {
    flex: 1;
    padding-top: var(--space-1);
  }
  
  .equipment-list {
    list-style: none;
    padding: 0;
  }
  
  .equipment-list li {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .equipment-quantity {
    color: var(--color-text-muted);
  }
  
  .variations-grid {
    display: grid;
    gap: var(--space-3);
  }
  
  .variation-card {
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-default);
    transition: all var(--transition-fast);
    text-decoration: none;
    color: inherit;
  }
  
  .variation-card:hover {
    background: var(--color-surface-2);
    border-color: var(--color-accent-9);
  }
  
  .variation-card h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-1);
  }
  
  .variation-card p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-2);
  }
  
  .variation-difficulty {
    font-size: var(--font-size-xs);
    padding: var(--space-1) var(--space-2);
    background: var(--color-surface-3);
    border-radius: var(--radius-sm);
  }
</style>
```

### Step 3: Create Related Drills Component (`src/lib/components/drills/RelatedDrills.svelte`)

```svelte
<script>
  import DrillCard from './DrillCard.svelte';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  export let drills = [];
  export let currentDrillId;
  
  // Filter out current drill
  $: relatedDrills = drills.filter(d => d.id !== currentDrillId);
  
  let scrollContainer;
  
  function scrollLeft() {
    scrollContainer.scrollBy({ left: -320, behavior: 'smooth' });
  }
  
  function scrollRight() {
    scrollContainer.scrollBy({ left: 320, behavior: 'smooth' });
  }
</script>

{#if relatedDrills.length > 0}
  <section class="related-drills">
    <div class="section-header">
      <h2>Related Drills</h2>
      <div class="scroll-controls">
        <button on:click={scrollLeft} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>
        <button on:click={scrollRight} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
    
    <div class="drills-scroll" bind:this={scrollContainer}>
      {#each relatedDrills as drill}
        <div class="drill-item">
          <DrillCard {drill} view="grid" density="compact" />
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .related-drills {
    margin-top: var(--space-8);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }
  
  .section-header h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
  }
  
  .scroll-controls {
    display: flex;
    gap: var(--space-2);
  }
  
  .scroll-controls button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .scroll-controls button:hover {
    background: var(--color-surface-2);
    border-color: var(--color-border-strong);
  }
  
  .drills-scroll {
    display: flex;
    gap: var(--space-4);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: var(--space-2);
  }
  
  .drills-scroll::-webkit-scrollbar {
    height: 8px;
  }
  
  .drill-item {
    flex: 0 0 320px;
    scroll-snap-align: start;
  }
  
  @media (max-width: 768px) {
    .scroll-controls {
      display: none;
    }
    
    .drill-item {
      flex: 0 0 280px;
    }
  }
</style>
```

### Step 4: Update Drill Detail Page (`src/routes/drills/[id]/+page.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/utils/apiFetch';
  import { useSession } from '$lib/auth-client';
  import DrillDetailHeader from '$lib/components/drills/DrillDetailHeader.svelte';
  import DrillDetailTabs from '$lib/components/drills/DrillDetailTabs.svelte';
  import RelatedDrills from '$lib/components/drills/RelatedDrills.svelte';
  import Comments from '$lib/components/Comments.svelte';
  import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  
  export let data;
  
  const session = useSession();
  
  let drill = null;
  let relatedDrills = [];
  let loading = true;
  
  $: isOwner = $session.data?.user?.id === drill?.user_id;
  
  onMount(async () => {
    await loadDrill();
    await loadRelatedDrills();
  });
  
  async function loadDrill() {
    try {
      const response = await apiFetch(`/api/drills/${$page.params.id}`);
      drill = response;
    } catch (error) {
      console.error('Failed to load drill:', error);
    } finally {
      loading = false;
    }
  }
  
  async function loadRelatedDrills() {
    try {
      // Load drills with similar tags or position
      const response = await apiFetch(`/api/drills?position=${drill?.position}&limit=8`);
      relatedDrills = response.drills || [];
    } catch (error) {
      console.error('Failed to load related drills:', error);
    }
  }
</script>

<svelte:head>
  <title>{drill?.name || 'Loading...'} - QDrill</title>
  <meta name="description" content={drill?.description || ''} />
  
  <!-- Open Graph tags for sharing -->
  <meta property="og:title" content={drill?.name} />
  <meta property="og:description" content={drill?.description} />
  <meta property="og:image" content={drill?.image_url} />
  <meta property="og:url" content={$page.url.href} />
</svelte:head>

<div class="drill-detail-page">
  {#if loading}
    <div class="loading-state">
      <Skeleton variant="rect" height="200px" />
      <Skeleton variant="line" width="60%" />
      <Skeleton variant="line" />
      <Skeleton variant="line" />
    </div>
  {:else if drill}
    <DrillDetailHeader {drill} {isOwner} />
    
    <div class="drill-content">
      <div class="main-content">
        <DrillDetailTabs {drill} />
        
        <!-- Voting section -->
        <div class="engagement-section">
          <UpvoteDownvote 
            entityType="drill" 
            entityId={drill.id} 
            initialVotes={drill.votes}
          />
        </div>
        
        <!-- Comments section -->
        <div class="comments-section">
          <h2>Discussion</h2>
          <Comments 
            entityType="drill" 
            entityId={drill.id}
          />
        </div>
      </div>
      
      <aside class="sidebar">
        <!-- Statistics -->
        <div class="stats-card">
          <h3>Statistics</h3>
          <dl class="stats-list">
            <div class="stat-item">
              <dt>Views</dt>
              <dd>{drill.views || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Used in Plans</dt>
              <dd>{drill.usage_count || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Favorites</dt>
              <dd>{drill.favorites || 0}</dd>
            </div>
            <div class="stat-item">
              <dt>Created</dt>
              <dd>{new Date(drill.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
        
        <!-- Tags -->
        {#if drill.tags?.length}
          <div class="tags-card">
            <h3>Tags</h3>
            <div class="tag-list">
              {#each drill.tags as tag}
                <a href="/drills?tag={tag}" class="tag-link">
                  #{tag}
                </a>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Author -->
        <div class="author-card">
          <h3>Created by</h3>
          <a href="/profile/{drill.user_id}" class="author-link">
            <img src={drill.user_avatar || '/default-avatar.svg'} alt="" />
            <span>{drill.user_name || 'Anonymous'}</span>
          </a>
        </div>
      </aside>
    </div>
    
    <RelatedDrills drills={relatedDrills} currentDrillId={drill.id} />
  {:else}
    <div class="error-state">
      <h2>Drill not found</h2>
      <p>The drill you're looking for doesn't exist or has been removed.</p>
      <Button href="/drills">Browse Drills</Button>
    </div>
  {/if}
</div>

<style>
  .drill-detail-page {
    max-width: 1280px;
    margin: 0 auto;
  }
  
  .drill-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }
  
  .main-content {
    min-width: 0;
  }
  
  .engagement-section {
    margin-bottom: var(--space-6);
  }
  
  .comments-section h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-4);
  }
  
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .stats-card,
  .tags-card,
  .author-card {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  
  .stats-card h3,
  .tags-card h3,
  .author-card h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-3);
  }
  
  .stats-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .stat-item:last-child {
    border-bottom: none;
  }
  
  .stat-item dt {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  
  .stat-item dd {
    font-weight: var(--font-weight-semibold);
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  
  .tag-link {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-subtle);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-accent-9);
    transition: all var(--transition-fast);
  }
  
  .tag-link:hover {
    background: var(--color-accent-2);
    text-decoration: none;
  }
  
  .author-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-primary);
    text-decoration: none;
  }
  
  .author-link img {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
  }
  
  .author-link:hover {
    color: var(--color-accent-9);
  }
  
  .loading-state,
  .error-state {
    padding: var(--space-8);
    text-align: center;
  }
  
  @media (max-width: 1024px) {
    .drill-content {
      grid-template-columns: 1fr;
    }
    
    .sidebar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
  }
</style>
```

## Testing Checklist

- [ ] Drill header displays all metadata correctly
- [ ] Share button works (native share or clipboard)
- [ ] Tabs switch content smoothly
- [ ] All tab content renders properly
- [ ] Related drills scroll horizontally
- [ ] Related drills exclude current drill
- [ ] Voting component integrates properly
- [ ] Comments section loads and functions
- [ ] Statistics display in sidebar
- [ ] Tags link to filtered drill list
- [ ] Author link navigates to profile
- [ ] Edit button appears for owner
- [ ] Mobile responsive layout
- [ ] SEO meta tags present
- [ ] Loading state displays

## Integration Notes

- Uses Button and Card components from Ticket 003
- DrillCard component from Ticket 004
- Existing Comments and UpvoteDownvote components
- Auth state from `$lib/auth-client`

## Next Steps
After completing this ticket, proceed to Ticket 006 (Practice Plan Viewer Revamp).