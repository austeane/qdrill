# Ticket 006: Practice Plan Viewer Revamp - ACTIONABLE

## Overview
Improve practice plan readability with two-pane layout, scrollspy navigation, drill overlays, and better visual hierarchy.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Components)
- [x] Dialog component from Ticket 003
- [x] Current viewer components in `src/routes/practice-plans/viewer/`

## File Structure
```
src/
├── lib/
│   └── components/
│       └── practice-plans/
│           ├── PlanOutline.svelte (NEW)
│           ├── PlanScrollspy.svelte (NEW)
│           └── DrillOverlay.svelte (NEW)
└── routes/
    └── practice-plans/
        ├── viewer/
        │   ├── Section.svelte (MODIFY)
        │   ├── ParallelGroup.svelte (MODIFY)
        │   └── DrillCard.svelte (MODIFY)
        └── [id]/
            └── +page.svelte (MODIFY)
```

## Implementation Steps

### Step 1: Create Plan Outline with Scrollspy (`src/lib/components/practice-plans/PlanOutline.svelte`)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { Clock, Users } from 'lucide-svelte';
  
  export let sections = [];
  export let currentSectionId = null;
  
  let observer;
  let sectionElements = new Map();
  
  onMount(() => {
    // Set up intersection observer for scrollspy
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            currentSectionId = entry.target.id;
          }
        });
      },
      {
        rootMargin: '-20% 0% -70% 0%',
        threshold: 0
      }
    );
    
    // Observe all section elements
    sections.forEach(section => {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        sectionElements.set(section.id, element);
        observer.observe(element);
      }
    });
  });
  
  onDestroy(() => {
    observer?.disconnect();
  });
  
  function scrollToSection(sectionId) {
    const element = sectionElements.get(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  function calculateSectionDuration(section) {
    if (!section.drills) return 0;
    return section.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0);
  }
  
  $: totalDuration = sections.reduce((sum, section) => 
    sum + calculateSectionDuration(section), 0
  );
</script>

<nav class="plan-outline">
  <div class="outline-header">
    <h3>Plan Overview</h3>
    <div class="plan-stats">
      <span class="stat">
        <Clock size={14} />
        {totalDuration} min total
      </span>
      <span class="stat">
        <Users size={14} />
        {sections.length} sections
      </span>
    </div>
  </div>
  
  <ol class="section-list">
    {#each sections as section, index}
      {@const duration = calculateSectionDuration(section)}
      <li>
        <button
          class="section-link"
          class:active={currentSectionId === `section-${section.id}`}
          on:click={() => scrollToSection(section.id)}
        >
          <span class="section-number">{index + 1}</span>
          <div class="section-info">
            <span class="section-name">{section.name}</span>
            <span class="section-meta">
              {section.drills?.length || 0} drills · {duration} min
            </span>
          </div>
          <div class="section-progress" 
               class:current={currentSectionId === `section-${section.id}`}
          />
        </button>
        
        {#if section.parallel_groups?.length}
          <ul class="parallel-list">
            {#each section.parallel_groups as group}
              <li class="parallel-item">
                <span class="parallel-indicator">║</span>
                {group.name || 'Parallel Group'}
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .plan-outline {
    position: sticky;
    top: var(--space-4);
    height: calc(100vh - var(--space-8));
    overflow-y: auto;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
  }
  
  .outline-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .outline-header h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .plan-stats {
    display: flex;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .section-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .section-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: none;
    border-left: 3px solid transparent;
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
    position: relative;
  }
  
  .section-link:hover {
    background: var(--color-bg-subtle);
  }
  
  .section-link.active {
    background: var(--color-accent-1);
    border-left-color: var(--color-accent-9);
  }
  
  .section-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }
  
  .section-link.active .section-number {
    background: var(--color-accent-9);
    color: white;
  }
  
  .section-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .section-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .section-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .parallel-list {
    list-style: none;
    padding: 0;
    margin: 0;
    margin-left: var(--space-10);
  }
  
  .parallel-item {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .parallel-indicator {
    color: var(--color-accent-9);
    font-weight: bold;
  }
</style>
```

### Step 2: Update Section Component (`src/routes/practice-plans/viewer/Section.svelte`)

```svelte
<script>
  import { Clock, ChevronDown, ChevronRight } from 'lucide-svelte';
  import ParallelGroup from './ParallelGroup.svelte';
  import DrillCard from './DrillCard.svelte';
  
  export let section;
  export let index;
  export let expanded = true;
  
  $: sectionDuration = calculateDuration();
  
  function calculateDuration() {
    let duration = 0;
    
    // Regular drills
    if (section.drills) {
      duration += section.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0);
    }
    
    // Parallel groups (take max duration)
    if (section.parallel_groups) {
      section.parallel_groups.forEach(group => {
        const groupDuration = Math.max(...group.timelines.map(timeline => 
          timeline.drills.reduce((sum, drill) => sum + (drill.duration || 0), 0)
        ));
        duration += groupDuration;
      });
    }
    
    return duration;
  }
  
  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<section id="section-{section.id}" class="plan-section">
  <header class="section-header">
    <button 
      class="section-toggle"
      on:click={toggleExpanded}
      aria-expanded={expanded}
    >
      {#if expanded}
        <ChevronDown size={20} />
      {:else}
        <ChevronRight size={20} />
      {/if}
    </button>
    
    <div class="section-title">
      <h2>
        <span class="section-number">{index + 1}.</span>
        {section.name}
      </h2>
      {#if section.description}
        <p class="section-description">{section.description}</p>
      {/if}
    </div>
    
    <div class="section-meta">
      <span class="duration">
        <Clock size={16} />
        {sectionDuration} min
      </span>
      <span class="drill-count">
        {section.drills?.length || 0} drills
      </span>
    </div>
  </header>
  
  {#if expanded}
    <div class="section-content">
      <!-- Regular drills -->
      {#if section.drills?.length}
        <div class="drills-grid">
          {#each section.drills as drill}
            <DrillCard {drill} />
          {/each}
        </div>
      {/if}
      
      <!-- Parallel groups -->
      {#if section.parallel_groups?.length}
        {#each section.parallel_groups as group}
          <ParallelGroup {group} />
        {/each}
      {/if}
    </div>
  {/if}
</section>

<style>
  .plan-section {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    overflow: hidden;
    scroll-margin-top: var(--space-4);
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .section-toggle:hover {
    background: var(--color-surface-2);
    color: var(--color-text-primary);
  }
  
  .section-title {
    flex: 1;
  }
  
  .section-title h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .section-number {
    color: var(--color-accent-9);
  }
  
  .section-description {
    margin-top: var(--space-1);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
  
  .section-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .duration,
  .drill-count {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .section-content {
    padding: var(--space-4);
  }
  
  .drills-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
  }
  
  @media (max-width: 768px) {
    .drills-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

### Step 3: Update Drill Card with Overlay (`src/routes/practice-plans/viewer/DrillCard.svelte`)

```svelte
<script>
  import { Clock, Users, ExternalLink, Info } from 'lucide-svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  
  export let drill;
  
  let detailOpen = false;
</script>

<article class="drill-card">
  <a 
    href="/drills/{drill.id}" 
    class="drill-link"
    on:click|preventDefault={() => detailOpen = true}
  >
    <div class="drill-header">
      <h3>{drill.name}</h3>
      <a 
        href="/drills/{drill.id}"
        class="external-link"
        on:click|stopPropagation
        aria-label="Open in new tab"
      >
        <ExternalLink size={16} />
      </a>
    </div>
    
    <p class="drill-description">{drill.description}</p>
    
    <div class="drill-meta">
      <span class="meta-item">
        <Clock size={14} />
        {drill.duration} min
      </span>
      {#if drill.position}
        <span class="meta-item">
          <Users size={14} />
          {drill.position}
        </span>
      {/if}
      <span class="meta-item difficulty-{drill.difficulty?.toLowerCase()}">
        {drill.difficulty}
      </span>
    </div>
  </a>
  
  <button 
    class="info-button"
    on:click={() => detailOpen = true}
    aria-label="View drill details"
  >
    <Info size={16} />
  </button>
</article>

<!-- Drill Detail Overlay -->
<Dialog bind:open={detailOpen} title={drill.name}>
  <div class="drill-detail">
    <div class="detail-section">
      <h4>Description</h4>
      <p>{drill.description}</p>
    </div>
    
    {#if drill.objectives}
      <div class="detail-section">
        <h4>Objectives</h4>
        <ul>
          {#each drill.objectives as objective}
            <li>{objective}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    {#if drill.setup}
      <div class="detail-section">
        <h4>Setup</h4>
        <p>{drill.setup}</p>
      </div>
    {/if}
    
    {#if drill.equipment}
      <div class="detail-section">
        <h4>Equipment</h4>
        <ul>
          {#each drill.equipment as item}
            <li>{item}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <div class="detail-actions">
      <a href="/drills/{drill.id}" class="detail-link">
        View Full Details
        <ExternalLink size={16} />
      </a>
    </div>
  </div>
</Dialog>

<style>
  .drill-card {
    position: relative;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover {
    border-color: var(--color-accent-9);
    box-shadow: var(--shadow-sm);
  }
  
  .drill-link {
    display: block;
    color: inherit;
    text-decoration: none;
  }
  
  .drill-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: var(--space-2);
  }
  
  .drill-header h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    flex: 1;
  }
  
  .external-link {
    opacity: 0;
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover .external-link {
    opacity: 1;
  }
  
  .external-link:hover {
    color: var(--color-accent-9);
  }
  
  .drill-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .drill-meta {
    display: flex;
    gap: var(--space-3);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  
  .difficulty-beginner { color: var(--color-success); }
  .difficulty-intermediate { color: var(--color-warning); }
  .difficulty-advanced { color: var(--color-error); }
  
  .info-button {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all var(--transition-fast);
  }
  
  .drill-card:hover .info-button {
    opacity: 1;
  }
  
  .info-button:hover {
    background: var(--color-accent-1);
    color: var(--color-accent-9);
    border-color: var(--color-accent-9);
  }
  
  /* Overlay styles */
  .drill-detail {
    padding: var(--space-2);
  }
  
  .detail-section {
    margin-bottom: var(--space-4);
  }
  
  .detail-section h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
    color: var(--color-text-secondary);
  }
  
  .detail-section ul {
    list-style: disc;
    padding-left: var(--space-4);
  }
  
  .detail-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-default);
  }
  
  .detail-link {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-accent-9);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
</style>
```

### Step 4: Update Practice Plan Viewer Page (`src/routes/practice-plans/[id]/+page.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { apiFetch } from '$lib/utils/apiFetch';
  import PlanOutline from '$lib/components/practice-plans/PlanOutline.svelte';
  import Section from '../viewer/Section.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Download, Print, Share2, Edit } from 'lucide-svelte';
  
  export let data;
  
  let plan = null;
  let loading = true;
  let currentSectionId = null;
  let showOutline = true;
  
  onMount(async () => {
    await loadPlan();
  });
  
  async function loadPlan() {
    try {
      const response = await apiFetch(`/api/practice-plans/${$page.params.id}`);
      plan = response;
    } catch (error) {
      console.error('Failed to load practice plan:', error);
    } finally {
      loading = false;
    }
  }
  
  function handlePrint() {
    window.print();
  }
  
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: plan.name,
        text: plan.description,
        url: window.location.href
      });
    }
  }
  
  function handleExport() {
    // Export as PDF or structured format
    console.log('Export functionality to be implemented');
  }
</script>

<svelte:head>
  <title>{plan?.name || 'Loading...'} - Practice Plan</title>
  <meta name="description" content={plan?.description || ''} />
</svelte:head>

<div class="plan-viewer" class:with-outline={showOutline}>
  {#if loading}
    <div class="loading-state">
      <p>Loading practice plan...</p>
    </div>
  {:else if plan}
    <!-- Plan Header -->
    <header class="plan-header">
      <div class="header-content">
        <h1>{plan.name}</h1>
        {#if plan.description}
          <p class="plan-description">{plan.description}</p>
        {/if}
        
        <div class="plan-meta">
          <span>Duration: {plan.total_duration} minutes</span>
          <span>•</span>
          <span>{plan.sections?.length || 0} sections</span>
          <span>•</span>
          <span>Created by {plan.author_name || 'Unknown'}</span>
        </div>
      </div>
      
      <div class="header-actions">
        <Button variant="ghost" size="sm" on:click={() => showOutline = !showOutline}>
          {showOutline ? 'Hide' : 'Show'} Outline
        </Button>
        <Button variant="ghost" size="sm" on:click={handlePrint}>
          <Print size={16} />
          Print
        </Button>
        <Button variant="ghost" size="sm" on:click={handleExport}>
          <Download size={16} />
          Export
        </Button>
        <Button variant="ghost" size="sm" on:click={handleShare}>
          <Share2 size={16} />
          Share
        </Button>
        {#if plan.can_edit}
          <Button variant="primary" size="sm" href="/practice-plans/{plan.id}/edit">
            <Edit size={16} />
            Edit
          </Button>
        {/if}
      </div>
    </header>
    
    <div class="plan-content">
      <!-- Left: Outline with Scrollspy -->
      {#if showOutline}
        <aside class="plan-sidebar">
          <PlanOutline 
            sections={plan.sections || []} 
            bind:currentSectionId
          />
        </aside>
      {/if}
      
      <!-- Right: Plan Content -->
      <main class="plan-main">
        {#if plan.sections?.length}
          {#each plan.sections as section, index}
            <Section {section} {index} />
          {/each}
        {:else}
          <p>No sections in this practice plan.</p>
        {/if}
      </main>
    </div>
  {:else}
    <div class="error-state">
      <h2>Practice plan not found</h2>
      <Button href="/practice-plans">Browse Practice Plans</Button>
    </div>
  {/if}
</div>

<style>
  .plan-viewer {
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .plan-header {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: var(--space-4);
  }
  
  .header-content {
    flex: 1;
  }
  
  .header-content h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-2);
  }
  
  .plan-description {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
  }
  
  .plan-meta {
    display: flex;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .header-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  
  .plan-content {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--space-6);
  }
  
  .plan-viewer:not(.with-outline) .plan-content {
    grid-template-columns: 1fr;
  }
  
  .plan-sidebar {
    display: block;
  }
  
  .plan-main {
    min-width: 0;
  }
  
  .loading-state,
  .error-state {
    padding: var(--space-8);
    text-align: center;
  }
  
  /* Print styles */
  @media print {
    .plan-header,
    .plan-sidebar {
      display: none;
    }
    
    .plan-content {
      grid-template-columns: 1fr;
    }
    
    .plan-section {
      page-break-inside: avoid;
    }
  }
  
  @media (max-width: 1024px) {
    .plan-content {
      grid-template-columns: 1fr;
    }
    
    .plan-sidebar {
      display: none;
    }
    
    .plan-header {
      flex-direction: column;
    }
  }
</style>
```

## Testing Checklist

- [ ] Two-pane layout displays correctly on desktop
- [ ] Outline collapses/expands with button
- [ ] Scrollspy highlights current section
- [ ] Clicking outline items scrolls to section
- [ ] Section collapse/expand works
- [ ] Drill cards display properly in grid
- [ ] Drill overlay opens on click
- [ ] External link opens drill in new tab
- [ ] Middle-click opens drill in new tab
- [ ] Print view hides navigation chrome
- [ ] Export functionality prepared (stub)
- [ ] Share functionality works
- [ ] Parallel groups display correctly
- [ ] Time calculations are accurate
- [ ] Mobile responsive layout

## Visual Improvements

- Replaced heavy tinted backgrounds with subtle borders and rails
- Used `border-left` accent rails instead of full backgrounds
- Improved visual hierarchy with proper spacing
- Added hover states for better interactivity
- Consistent use of design tokens from Ticket 001

## Integration Notes

- Uses Dialog component from Ticket 003
- Uses Button component from Ticket 003
- Maintains compatibility with existing data structure
- Preserves existing drill and section functionality

## Next Steps
After completing this ticket, proceed to Ticket 007 (Practice Plan Wizard UX).