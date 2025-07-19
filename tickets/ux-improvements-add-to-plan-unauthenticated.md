# UX Improvement: Clarify Add to Plan Button for Unauthenticated Users

## Priority: Low
**Impact**: Low (current behavior already works)
**Effort**: N/A
**Status**: Resolved

## Problem
Early UX feedback suggested that logged-out visitors saw no effect when clicking "Add Drill to Plan."  The current implementation actually stores selected drills in `localStorage` via `cartStore.js`, so even unauthenticated users can build a practice plan.  Plans created without a user ID are automatically set to `public`.

## Solution
No change is required for basic functionality.  Optionally, we could surface a tooltip encouraging sign‑in so users can save private plans, but the button itself works for everyone.

## Files to Modify

### Primary Files
- `src/routes/drills/+page.svelte` - Main drill cards with Add to Plan buttons
- `src/lib/components/DrillCard.svelte` - If drill cards are componentized
- `src/routes/formations/+page.svelte` - Formation add buttons if applicable

### Supporting Files Reviewed
- `src/lib/stores/cartStore.js` - Handles cart persistence in `localStorage` without auth checks

## Current Implementation
```svelte
<!-- Current Add to Plan button in drills page -->
<button
  class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
  on:click|stopPropagation={() => toggleDrillInCart(drill)}
>
  Add to Plan
</button>
```

The button already works the same for authenticated and unauthenticated users.

## Implementation Details

### Option A: Disabled Button with Tooltip (Recommended)
```svelte
<script>
  import { page } from '$app/stores';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  
  $: isAuthenticated = !!$page.data.session?.user;
</script>

<!-- Enhanced Add to Plan button -->
<div class="relative">
  <button
    class="w-full py-2 px-4 rounded-md font-semibold transition-colors duration-300"
    class:bg-blue-500={isAuthenticated && !drillsInCart.has(drill.id)}
    class:hover:bg-blue-600={isAuthenticated && !drillsInCart.has(drill.id)}
    class:text-white={isAuthenticated}
    class:bg-gray-300={!isAuthenticated}
    class:text-gray-500={!isAuthenticated}
    class:cursor-not-allowed={!isAuthenticated}
    disabled={!isAuthenticated}
    on:click|stopPropagation={() => isAuthenticated && toggleDrillInCart(drill)}
    aria-label={isAuthenticated ? 'Add drill to plan' : 'Sign in required to add drills'}
  >
    {#if !isAuthenticated}
      Sign in to Add
    {:else if buttonStates[drill.id] === 'added'}
      Added
    {:else if buttonStates[drill.id] === 'removed'}
      Removed
    {:else if buttonStates[drill.id] === 'in-cart'}
      Remove from Plan
    {:else}
      Add to Plan
    {/if}
  </button>
  
  {#if !isAuthenticated}
    <Tooltip text="Create a free account to save drills and build practice plans" position="top">
      <div class="absolute inset-0 pointer-events-none"></div>
    </Tooltip>
  {/if}
</div>
```

### Option B: Modal Sign-In Prompt
```svelte
<script>
  import { signIn } from '$lib/auth-client';
  import Modal from '$lib/components/ui/Modal.svelte';
  
  let showSignInPrompt = false;
  
  function handleAddToPlan(drill) {
    if (!isAuthenticated) {
      showSignInPrompt = true;
      return;
    }
    toggleDrillInCart(drill);
  }
</script>

<button
  class="w-full py-2 px-4 rounded-md font-semibold text-white transition-colors duration-300"
  class:bg-blue-500={!drillsInCart.has(drill.id)}
  class:hover:bg-blue-600={!drillsInCart.has(drill.id)}
  on:click|stopPropagation={() => handleAddToPlan(drill)}
>
  {isAuthenticated ? 'Add to Plan' : 'Add to Plan (Sign In)'}
</button>

<!-- Sign-in modal -->
{#if showSignInPrompt}
  <Modal on:close={() => showSignInPrompt = false}>
    <div class="p-6 text-center">
      <div class="w-12 h-12 mx-auto mb-4 text-blue-600">
        <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Sign in to save drills</h3>
      <p class="text-gray-600 mb-6">Create a free account to build and save practice plans.</p>
      <div class="flex gap-3 justify-center">
        <button
          on:click={() => signIn.social({ provider: 'google' })}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sign in with Google
        </button>
        <button
          on:click={() => showSignInPrompt = false}
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
{/if}
```

### Enhanced Cart Store with Authentication Check
```javascript
// src/lib/stores/cartStore.js
import { writable } from 'svelte/store';
import { page } from '$app/stores';
import { get } from 'svelte/store';

function createCartStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    addDrill: (drill) => {
      // Check authentication before adding
      const currentPage = get(page);
      if (!currentPage.data.session?.user) {
        console.warn('User must be authenticated to add drills to cart');
        return false;
      }
      
      update(items => {
        if (!items.find(item => item.id === drill.id)) {
          return [...items, drill];
        }
        return items;
      });
      return true;
    },
    removeDrill: (drillId) => {
      update(items => items.filter(item => item.id !== drillId));
    },
    clear: () => set([])
  };
}

export const cart = createCartStore();
```

### Create Tooltip Component
```svelte
<!-- src/lib/components/ui/Tooltip.svelte -->
<script>
  export let text = '';
  export let position = 'top'; // top, bottom, left, right
  
  let showTooltip = false;
  let timeout;
  
  function handleMouseEnter() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      showTooltip = true;
    }, 500); // 500ms delay
  }
  
  function handleMouseLeave() {
    clearTimeout(timeout);
    showTooltip = false;
  }
</script>

<div 
  class="relative inline-block"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  role="tooltip"
>
  <slot />
  
  {#if showTooltip}
    <div 
      class="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
      class:bottom-full={position === 'top'}
      class:top-full={position === 'bottom'}
      class:right-full={position === 'left'}
      class:left-full={position === 'right'}
      class:mb-2={position === 'top'}
      class:mt-2={position === 'bottom'}
      class:mr-2={position === 'left'}
      class:ml-2={position === 'right'}
      class:left-1/2={position === 'top' || position === 'bottom'}
      class:top-1/2={position === 'left' || position === 'right'}
      class:-translate-x-1/2={position === 'top' || position === 'bottom'}
      class:-translate-y-1/2={position === 'left' || position === 'right'}
    >
      {text}
      
      <!-- Arrow -->
      <div 
        class="absolute w-2 h-2 bg-gray-900 rotate-45"
        class:top-full={position === 'top'}
        class:bottom-full={position === 'bottom'}
        class:right-full={position === 'left'}
        class:left-full={position === 'right'}
        class:left-1/2={position === 'top' || position === 'bottom'}
        class:top-1/2={position === 'left' || position === 'right'}
        class:-translate-x-1/2={position === 'top' || position === 'bottom'}
        class:-translate-y-1/2={position === 'left' || position === 'right'}
        class:-mt-1={position === 'top'}
        class:-mb-1={position === 'bottom'}
        class:-mr-1={position === 'left'}
        class:-ml-1={position === 'right'}
      ></div>
    </div>
  {/if}
</div>
```

## Acceptance Criteria
- [x] Unauthenticated users can successfully add drills to their cart
- [ ] (Optional) Tooltip encourages creating an account for private plan features
- [ ] Consistent behavior across all "Add to Plan" buttons
- [ ] Accessibility: proper ARIA labels and screen reader support
- [ ] Mobile-friendly implementation

## Testing
- [ ] Verify cart persistence while signed out
- [ ] Verify cart functionality while signed in
- [ ] Test optional tooltip
- [ ] Test keyboard navigation and accessibility
- [ ] Test on mobile devices
- [ ] Test screen reader compatibility

## Notes
- The cart persists in `localStorage` even when not logged in.
- Anonymous plans are automatically set to `public` and editable by others.
- A tooltip inviting users to sign in could be explored as a future enhancement.