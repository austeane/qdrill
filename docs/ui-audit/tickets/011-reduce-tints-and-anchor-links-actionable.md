# Ticket 011: Reduce Tints and Anchor Links - ACTIONABLE

## Overview
Replace heavy tinted backgrounds with subtle rails/borders and ensure all drills have proper anchor links for crawlability and new tab functionality.

## Prerequisites
- [x] Design tokens from Ticket 001
- [x] Components from previous tickets

## Implementation Steps

### Step 1: Update Design Tokens for Rails (`src/lib/styles/rails.css`)

```css
/* Rail and accent styles to replace heavy tints */
:root {
  /* Rail colors for sections */
  --rail-default: var(--color-border-strong);
  --rail-primary: var(--color-accent-9);
  --rail-success: var(--color-success);
  --rail-warning: var(--color-warning);
  --rail-error: var(--color-error);
  --rail-info: var(--color-info);
  
  /* Rail widths */
  --rail-width-sm: 2px;
  --rail-width-md: 3px;
  --rail-width-lg: 4px;
  
  /* Subtle backgrounds to replace tints */
  --bg-subtle-primary: color-mix(in srgb, var(--color-accent-9) 5%, transparent);
  --bg-subtle-success: color-mix(in srgb, var(--color-success) 5%, transparent);
  --bg-subtle-warning: color-mix(in srgb, var(--color-warning) 5%, transparent);
  --bg-subtle-error: color-mix(in srgb, var(--color-error) 5%, transparent);
}

/* Rail utility classes */
.rail-left {
  border-left: var(--rail-width-lg) solid var(--rail-default);
  padding-left: var(--space-4);
}

.rail-left-primary {
  border-left-color: var(--rail-primary);
}

.rail-left-success {
  border-left-color: var(--rail-success);
}

.rail-left-warning {
  border-left-color: var(--rail-warning);
}

.rail-left-error {
  border-left-color: var(--rail-error);
}

/* Subtle background utilities */
.bg-subtle {
  background: var(--color-bg-subtle);
}

.bg-subtle-primary {
  background: var(--bg-subtle-primary);
}

.bg-subtle-success {
  background: var(--bg-subtle-success);
}

.bg-subtle-warning {
  background: var(--bg-subtle-warning);
}

.bg-subtle-error {
  background: var(--bg-subtle-error);
}

/* Remove heavy tints */
.no-tint {
  background: var(--color-surface-1) !important;
}

/* Section styles without heavy backgrounds */
.section-clean {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.section-rail {
  border-left: var(--rail-width-lg) solid var(--rail-primary);
  padding-left: var(--space-4);
  margin-left: var(--space-2);
}

/* Parallel group indicators */
.parallel-indicator {
  position: relative;
  padding-left: var(--space-6);
}

.parallel-indicator::before {
  content: '';
  position: absolute;
  left: var(--space-2);
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--color-accent-9) 0%,
    var(--color-accent-9) 50%,
    transparent 50%,
    transparent 100%
  );
  background-size: 2px 8px;
}
```

### Step 2: Update Practice Plan Section Component

```svelte
<!-- src/routes/practice-plans/viewer/Section.svelte -->
<script>
  export let section;
  export let index;
  export let variant = 'default'; // default, primary, success, warning
</script>

<section 
  class="plan-section section-clean rail-left rail-left-{variant}"
  id="section-{section.id}"
>
  <header class="section-header">
    <h2>
      <span class="section-number">{index + 1}</span>
      {section.name}
    </h2>
    <!-- Rest of header -->
  </header>
  
  <div class="section-content">
    <!-- Content without heavy background -->
    <slot />
  </div>
</section>

<style>
  .plan-section {
    /* Remove old heavy tints */
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-4);
    overflow: hidden;
  }
  
  /* Rail accent instead of full background */
  .plan-section.rail-left {
    border-left: 4px solid var(--color-accent-9);
  }
  
  .section-header {
    /* Light background instead of heavy tint */
    background: var(--color-bg-subtle);
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .section-content {
    padding: var(--space-4);
    /* No background color */
  }
  
  /* Remove all bg-*-50 classes */
  :global(.bg-blue-50),
  :global(.bg-green-50),
  :global(.bg-yellow-50),
  :global(.bg-red-50) {
    background: transparent !important;
  }
</style>
```

### Step 3: Create Proper Drill Link Component (`src/lib/components/DrillLink.svelte`)

```svelte
<script>
  import { ExternalLink } from 'lucide-svelte';
  
  export let drill;
  export let showExternal = true;
  export let className = '';
</script>

<a 
  href="/drills/{drill.id}"
  class="drill-link {className}"
  title="View {drill.name} details"
  data-drill-id={drill.id}
  rel="prefetch"
>
  <slot>
    <span class="drill-name">{drill.name}</span>
  </slot>
  {#if showExternal}
    <ExternalLink size={14} class="external-icon" />
  {/if}
</a>

<style>
  .drill-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-accent-9);
    text-decoration: none;
    transition: all var(--transition-fast);
  }
  
  .drill-link:hover {
    color: var(--color-accent-10);
    text-decoration: underline;
  }
  
  /* Ensure middle-click works */
  .drill-link:active {
    color: var(--color-accent-11);
  }
  
  .drill-name {
    font-weight: var(--font-weight-medium);
  }
  
  :global(.external-icon) {
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
  
  .drill-link:hover :global(.external-icon) {
    opacity: 1;
  }
</style>
```

### Step 4: Update All Drill References

```svelte
<!-- Update DrillCard components -->
<script>
  import DrillLink from '$lib/components/DrillLink.svelte';
  export let drill;
</script>

<article class="drill-card">
  <DrillLink {drill} className="card-title-link">
    <h3>{drill.name}</h3>
  </DrillLink>
  
  <!-- Rest of card content -->
  
  <div class="card-actions">
    <a 
      href="/drills/{drill.id}" 
      class="btn btn-sm"
      target="_blank"
      rel="noopener"
    >
      Open in new tab
    </a>
  </div>
</article>
```

### Step 5: Update Parallel Groups Styling

```svelte
<!-- src/routes/practice-plans/viewer/ParallelGroup.svelte -->
<script>
  export let group;
</script>

<div class="parallel-group">
  <div class="parallel-header">
    <span class="parallel-icon">║</span>
    <h3>{group.name || 'Parallel Activities'}</h3>
  </div>
  
  <div class="parallel-timelines">
    {#each group.timelines as timeline}
      <div class="timeline-column">
        <div class="timeline-header">
          <h4>{timeline.name}</h4>
        </div>
        <div class="timeline-content">
          {#each timeline.drills as drill}
            <DrillLink {drill} showExternal={false} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .parallel-group {
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin: var(--space-4) 0;
  }
  
  .parallel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-bg-subtle);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .parallel-icon {
    color: var(--color-accent-9);
    font-weight: bold;
    font-size: var(--font-size-xl);
  }
  
  .parallel-timelines {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0;
  }
  
  .timeline-column {
    border-right: 1px solid var(--color-border-default);
  }
  
  .timeline-column:last-child {
    border-right: none;
  }
  
  .timeline-header {
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-2);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  .timeline-header h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  
  .timeline-content {
    padding: var(--space-3);
    /* No heavy background */
  }
</style>
```

### Step 6: Global Style Cleanup (`src/app.css` additions)

```css
/* Remove all Tailwind tint utilities */
.bg-blue-50,
.bg-green-50,
.bg-yellow-50,
.bg-red-50,
.bg-gray-50,
.bg-indigo-50,
.bg-purple-50,
.bg-pink-50 {
  background: var(--color-bg-subtle) !important;
}

/* Replace with subtle versions */
.bg-primary-subtle {
  background: var(--bg-subtle-primary);
}

.bg-success-subtle {
  background: var(--bg-subtle-success);
}

.bg-warning-subtle {
  background: var(--bg-subtle-warning);
}

.bg-error-subtle {
  background: var(--bg-subtle-error);
}

/* Ensure all drill links are crawlable */
a[href*="/drills/"] {
  /* Ensure proper link behavior */
  cursor: pointer;
  user-select: auto;
}

/* Prevent JavaScript-only navigation */
[role="button"][onclick*="drill"],
[data-drill-id]:not(a) {
  /* Convert to proper links */
  cursor: not-allowed !important;
  opacity: 0.5 !important;
}
```

### Step 7: Audit Script for Finding Issues (`scripts/audit-links.js`)

```javascript
// Script to find all drill references that need updating
import { glob } from 'glob';
import { readFile } from 'fs/promises';

async function auditDrillLinks() {
  const files = await glob('src/**/*.svelte');
  const issues = [];
  
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    
    // Check for button-based drill navigation
    if (content.includes('on:click') && content.includes('drill')) {
      const hasProperLink = content.includes('href="/drills/');
      if (!hasProperLink) {
        issues.push({
          file,
          issue: 'Drill navigation without proper anchor link'
        });
      }
    }
    
    // Check for heavy tints
    const tintPattern = /bg-(blue|green|yellow|red|gray|indigo|purple|pink)-50/g;
    const tints = content.match(tintPattern);
    if (tints) {
      issues.push({
        file,
        issue: `Heavy tints found: ${tints.join(', ')}`
      });
    }
    
    // Check for missing rel attributes
    if (content.includes('target="_blank"') && !content.includes('rel=')) {
      issues.push({
        file,
        issue: 'External link missing rel attribute'
      });
    }
  }
  
  // Output report
  console.log('Link Audit Report');
  console.log('=================');
  issues.forEach(({ file, issue }) => {
    console.log(`${file}: ${issue}`);
  });
  
  return issues;
}

// Run audit
auditDrillLinks();
```

## Testing Checklist

### Visual Changes
- [ ] No heavy tinted backgrounds remain
- [ ] Rails display on left side of sections
- [ ] Subtle backgrounds used sparingly
- [ ] Parallel groups have visual indicators
- [ ] Contrast meets WCAG standards

### Link Functionality
- [ ] All drill cards have anchor links
- [ ] Middle-click opens in new tab
- [ ] Right-click shows browser context menu
- [ ] Links work without JavaScript
- [ ] SEO crawlers can follow links
- [ ] Cmd/Ctrl+click opens new tab
- [ ] Cypress test asserts real `<a href="/drills/[id]">` presence and behavior across pages
- [ ] Audit script `scripts/audit-links.js` returns zero issues

### Accessibility
- [ ] Links have proper title attributes
- [ ] External links have rel attributes
- [ ] Focus states visible on all links
- [ ] Screen readers announce links properly

### Performance
- [ ] No layout shift from removed backgrounds
- [ ] Page weight reduced without heavy colors
- [ ] Print styles work correctly

## Migration Guide

### Before
```svelte
<div class="bg-blue-50 p-4">
  <button on:click={() => goto(`/drills/${drill.id}`)}>
    {drill.name}
  </button>
</div>
```

### After
```svelte
<div class="section-clean rail-left rail-left-primary">
  <DrillLink {drill}>
    {drill.name}
  </DrillLink>
</div>
```

## Visual Comparison

### Sections
- **Before**: Full blue-50 background
- **After**: White background with blue left rail

### Drill Cards
- **Before**: Click handler navigation
- **After**: Proper anchor tags with href

### Parallel Groups
- **Before**: Heavy tinted sections
- **After**: Clean borders with rail indicators

## Browser Compatibility
- Tested on Chrome, Firefox, Safari, Edge
- Mobile browsers handle tap/click properly
- SEO crawlers can index all drill pages

## Completion Checklist
- [ ] All heavy tints replaced
- [ ] All drill references use anchor tags
- [ ] Audit script run and issues fixed
- [ ] Visual regression tests pass
- [ ] SEO audit shows improvement
- [ ] Accessibility audit passes
- [ ] Cypress e2e coverage added for link semantics and middle-click behavior