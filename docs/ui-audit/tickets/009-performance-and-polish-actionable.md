# Ticket 009: Performance and Polish - ACTIONABLE

## Overview
Optimize performance with content-visibility, lazy loading, proper logging, and smooth transitions.

## Prerequisites
- [x] Components from Tickets 001-008
- [x] Design tokens with transition values

## Implementation Steps

### Step 1: Create Logger Utility (`src/lib/utils/logger.ts`)

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? 'debug' : 'error',
      enabled: import.meta.env.DEV,
      prefix: '[QDrill]',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levels[level] >= this.levels[this.config.level];
  }

  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || '';
    return `${prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message), data || '');
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message), data || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message), data || '');
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message), error || '');
    }
  }

  // Group related logs
  group(label: string) {
    if (this.config.enabled) {
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd() {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  // Performance timing
  time(label: string) {
    if (this.config.enabled) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string) {
    if (this.config.enabled) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Create specialized loggers
export const apiLogger = new Logger({ prefix: '[API]' });
export const performanceLogger = new Logger({ prefix: '[PERF]', level: 'info' });
```

### Step 2: Create Lazy Image Component (`src/lib/components/ui/LazyImage.svelte`)

```svelte
<script>
  import { onMount } from 'svelte';
  
  export let src;
  export let alt = '';
  export let width = null;
  export let height = null;
  export let placeholder = '/placeholder-image.svg';
  export let className = '';
  
  let imageElement;
  let loaded = false;
  let error = false;
  let isIntersecting = false;
  
  onMount(() => {
    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !loaded) {
            isIntersecting = true;
            loadImage();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before visible
      }
    );
    
    if (imageElement) {
      observer.observe(imageElement);
    }
    
    return () => {
      if (imageElement) {
        observer.unobserve(imageElement);
      }
    };
  });
  
  function loadImage() {
    const img = new Image();
    
    img.onload = () => {
      loaded = true;
      error = false;
    };
    
    img.onerror = () => {
      error = true;
      loaded = true;
    };
    
    img.src = src;
  }
</script>

<div 
  class="lazy-image-wrapper {className}"
  style="aspect-ratio: {width && height ? `${width}/${height}` : 'auto'}"
>
  {#if !isIntersecting}
    <img
      bind:this={imageElement}
      src={placeholder}
      {alt}
      {width}
      {height}
      class="lazy-image placeholder"
      loading="lazy"
    />
  {:else if error}
    <div class="image-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="3" x2="21" y2="21"/>
      </svg>
      <span>Failed to load image</span>
    </div>
  {:else}
    <img
      src={loaded ? src : placeholder}
      {alt}
      {width}
      {height}
      class="lazy-image"
      class:loaded
      loading="lazy"
      decoding="async"
    />
    {#if !loaded}
      <div class="image-loader">
        <div class="spinner" />
      </div>
    {/if}
  {/if}
</div>

<style>
  .lazy-image-wrapper {
    position: relative;
    overflow: hidden;
    background: var(--color-bg-muted);
    border-radius: var(--radius-md);
  }
  
  .lazy-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity var(--transition-base);
  }
  
  .lazy-image.placeholder {
    filter: blur(5px);
    opacity: 0.5;
  }
  
  .lazy-image.loaded {
    opacity: 1;
  }
  
  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--space-4);
    color: var(--color-text-muted);
    text-align: center;
  }
  
  .image-error span {
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
  }
  
  .image-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-muted);
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border-default);
    border-top-color: var(--color-accent-9);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

### Step 3: Add Content Visibility Styles (`src/lib/styles/performance.css`)

```css
/* Content Visibility for long lists and sections */
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* Estimated height */
}

.content-auto-small {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}

.content-auto-large {
  content-visibility: auto;
  contain-intrinsic-size: auto 800px;
}

/* GPU acceleration for animations */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Smooth scrolling with reduced motion support */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* Performance optimizations for shadows and effects */
.shadow-optimized {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transform: translateZ(0);
}

.shadow-optimized:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.16);
}

/* Optimized transitions */
.transition-optimized {
  transition: transform var(--transition-fast), 
              opacity var(--transition-fast),
              box-shadow var(--transition-fast);
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Virtual scrolling container */
.virtual-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Skeleton loading optimization */
.skeleton-optimized {
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-surface-3) 50%,
    var(--color-bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  animation-timing-function: ease-in-out;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Step 4: Update Practice Plan Viewer with Content Visibility

```svelte
<!-- Update src/routes/practice-plans/viewer/Section.svelte -->
<script>
  // ... existing imports
  import { logger } from '$lib/utils/logger';
</script>

<section 
  id="section-{section.id}" 
  class="plan-section content-auto"
  style="contain-intrinsic-size: auto {estimatedHeight}px"
>
  <!-- ... rest of component -->
</section>

<style>
  .plan-section {
    /* Add performance optimizations */
    content-visibility: auto;
    contain: layout style paint;
  }
</style>
```

### Step 5: Create Performance Monitor Component (`src/lib/components/PerformanceMonitor.svelte`)

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { performanceLogger } from '$lib/utils/logger';
  
  let metrics = {
    fps: 0,
    memory: 0,
    loadTime: 0
  };
  
  let rafId;
  let lastTime = performance.now();
  let frames = 0;
  
  onMount(() => {
    // Measure initial load time
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      performanceLogger.info('Page load time:', metrics.loadTime + 'ms');
    }
    
    // Monitor FPS
    function measureFPS() {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      // Monitor memory if available
      if (performance.memory) {
        metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
      }
      
      rafId = requestAnimationFrame(measureFPS);
    }
    
    if (import.meta.env.DEV) {
      measureFPS();
    }
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  });
  
  // Log performance marks
  export function mark(name) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
      performanceLogger.debug(`Performance mark: ${name}`);
    }
  }
  
  export function measure(name, startMark, endMark) {
    if (window.performance && window.performance.measure) {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name);
      if (measures.length > 0) {
        performanceLogger.info(`${name}: ${measures[0].duration.toFixed(2)}ms`);
      }
    }
  }
</script>

{#if import.meta.env.DEV}
  <div class="performance-monitor">
    <span>FPS: {metrics.fps}</span>
    <span>Memory: {metrics.memory}MB</span>
    <span>Load: {metrics.loadTime}ms</span>
  </div>
{/if}

<style>
  .performance-monitor {
    position: fixed;
    bottom: var(--space-4);
    right: var(--space-4);
    padding: var(--space-2) var(--space-3);
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    font-family: monospace;
    font-size: var(--font-size-xs);
    border-radius: var(--radius-md);
    display: flex;
    gap: var(--space-3);
    z-index: 9999;
    pointer-events: none;
  }
</style>
```

### Step 6: Add Transition Utilities (`src/lib/utils/transitions.ts`)

```typescript
import { cubicOut } from 'svelte/easing';

export function slideAndFade(node: HTMLElement, {
  delay = 0,
  duration = 300,
  easing = cubicOut,
  axis = 'y'
} = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const primary_dimension = axis === 'y' ? 'height' : 'width';
  const primary_dimension_value = parseFloat(style[primary_dimension]);
  const secondary_dimensions = axis === 'y' ? ['Top', 'Bottom'] : ['Left', 'Right'];
  const padding_start = parseFloat(style[`padding${secondary_dimensions[0]}`]);
  const padding_end = parseFloat(style[`padding${secondary_dimensions[1]}`]);
  const margin_start = parseFloat(style[`margin${secondary_dimensions[0]}`]);
  const margin_end = parseFloat(style[`margin${secondary_dimensions[1]}`]);
  const border_width_start = parseFloat(style[`border${secondary_dimensions[0]}Width`]);
  const border_width_end = parseFloat(style[`border${secondary_dimensions[1]}Width`]);
  
  return {
    delay,
    duration,
    easing,
    css: (t: number) => {
      const eased = easing(t);
      return `
        overflow: hidden;
        opacity: ${eased * opacity};
        ${primary_dimension}: ${eased * primary_dimension_value}px;
        padding-${secondary_dimensions[0].toLowerCase()}: ${eased * padding_start}px;
        padding-${secondary_dimensions[1].toLowerCase()}: ${eased * padding_end}px;
        margin-${secondary_dimensions[0].toLowerCase()}: ${eased * margin_start}px;
        margin-${secondary_dimensions[1].toLowerCase()}: ${eased * margin_end}px;
        border-${secondary_dimensions[0].toLowerCase()}-width: ${eased * border_width_start}px;
        border-${secondary_dimensions[1].toLowerCase()}-width: ${eased * border_width_end}px;
      `;
    }
  };
}

export function staggeredFade(node: HTMLElement, {
  delay = 0,
  duration = 300,
  easing = cubicOut,
  stagger = 50
} = {}) {
  const children = Array.from(node.children) as HTMLElement[];
  
  children.forEach((child, i) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(20px)';
  });
  
  return {
    delay,
    duration: duration + (stagger * children.length),
    easing,
    css: (t: number) => {
      children.forEach((child, i) => {
        const childDelay = (i * stagger) / (duration + (stagger * children.length));
        const childT = Math.max(0, Math.min(1, (t - childDelay) * (1 / (1 - childDelay))));
        const eased = easing(childT);
        
        child.style.opacity = `${eased}`;
        child.style.transform = `translateY(${(1 - eased) * 20}px)`;
      });
      
      return '';
    }
  };
}
```

### Step 7: Update Drills Grid with Virtual Scrolling

```svelte
<!-- src/routes/drills/+page.svelte enhancement -->
<script>
  import VirtualList from '@tanstack/svelte-virtual';
  import { performanceLogger } from '$lib/utils/logger';
  
  // ... existing code ...
  
  let virtualListRef;
  const itemHeight = 320; // Approximate height of drill card
  
  $: if (filteredDrills.length > 100) {
    performanceLogger.info(`Rendering ${filteredDrills.length} drills with virtual scrolling`);
  }
</script>

{#if filteredDrills.length > 100}
  <!-- Use virtual scrolling for large lists -->
  <div class="virtual-drills-container">
    <VirtualList
      bind:this={virtualListRef}
      items={filteredDrills}
      estimateSize={() => itemHeight}
      overscan={5}
      let:item
    >
      <div class="content-auto-small">
        <DrillCard 
          drill={item}
          view={$drillFilters.view}
          density={$drillFilters.density}
        />
      </div>
    </VirtualList>
  </div>
{:else}
  <!-- Regular grid for smaller lists -->
  <div class="drills-grid">
    {#each filteredDrills as drill (drill.id)}
      <div class="content-auto-small">
        <DrillCard 
          {drill}
          view={$drillFilters.view}
          density={$drillFilters.density}
        />
      </div>
    {/each}
  </div>
{/if}

<style>
  .virtual-drills-container {
    height: calc(100vh - 200px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  
  :global(.virtual-list-item) {
    padding: var(--space-2);
  }
</style>
```

## Testing Checklist

### Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds  
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Cumulative Layout Shift < 0.1
- [ ] FPS remains above 30 during scrolling

### Image Optimization
- [ ] Images lazy load on scroll
- [ ] Placeholder shown while loading
- [ ] Error state for failed images
- [ ] Width/height prevents layout shift
- [ ] Proper aspect ratios maintained

### Content Visibility
- [ ] Long sections use content-visibility
- [ ] Scroll performance smooth on long pages
- [ ] No janky scrolling on mobile
- [ ] Estimated sizes prevent jumping

### Logging
- [ ] No console logs in production
- [ ] Dev logs properly categorized
- [ ] Performance metrics logged
- [ ] Errors properly captured

### Transitions
- [ ] Smooth transitions on all interactions
- [ ] Reduced motion respected
- [ ] No janky animations
- [ ] GPU acceleration for complex animations

## Performance Budget

```javascript
// Add to vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['svelte', '@sveltejs/kit'],
          ui: ['bits-ui', 'lucide-svelte'],
          utils: ['lodash-es', 'zod']
        }
      }
    },
    // Performance budgets
    chunkSizeWarningLimit: 500, // 500kb warning
    cssCodeSplit: true,
    sourcemap: false, // Disable in production
    minify: 'esbuild'
  }
};
```

## Monitoring Setup

```javascript
// Add to app.html
<script>
  // Web Vitals monitoring
  if ('PerformanceObserver' in window) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log to analytics
        console.log('LCP:', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
</script>
```

## Next Steps
After completing this ticket, proceed to Ticket 010 (Command Palette enhancement).