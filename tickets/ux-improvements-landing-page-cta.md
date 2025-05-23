# UX Improvement: Enhance Landing Page CTA Hierarchy

## Priority: High
**Impact**: High (First impression and conversion)  
**Effort**: Low  
**Status**: Open

## Problem
According to UX feedback, the "Sign in with Google" button is small and easy to miss. The call-to-action hierarchy needs improvement to guide users toward the primary action and make sign-in more prominent for first-time visitors.

## Solution
Redesign the landing page to feature a more prominent sign-in CTA and improve the overall call-to-action hierarchy to better guide user actions.

## Files to Modify

### Primary Files
- `src/routes/+page.svelte` - Main landing page with hero section
- `src/routes/Header.svelte` - Header sign-in button (if changes needed)

### Supporting Files
- `src/lib/components/ui/button/` - Potential new button variants

## Current Implementation Analysis

```svelte
<!-- Current CTA buttons in hero section -->
<button on:click={navigateToWizard} class="...">Create Practice Plan</button>
<a href="/drills" class="...">Browse Drills</a>

<!-- Current sign-in in header (small) -->
<button on:click={() => signIn.social({ provider: 'google' })}>
  Sign in with Google
</button>
```

**Issues:**
1. Sign-in button is small and hidden in navigation
2. Primary CTAs don't mention the value of signing in
3. No clear indication that an account provides additional benefits
4. Hero section doesn't emphasize the "free" aspect

## Implementation Details

### Enhanced Hero Section
```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import { signIn } from '$lib/auth-client';
  import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';
  
  $: isAuthenticated = !!$page.data.session?.user;
  let isSigningIn = false;
  
  async function handleSignIn() {
    isSigningIn = true;
    try {
      await signIn.social({ provider: 'google' });
    } finally {
      isSigningIn = false;
    }
  }
</script>

<!-- Enhanced hero section -->
<div class="lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
  <img src="/images/qdrill-pill.png" alt="QDrill Logo" class="mb-4 max-w-[150px] lg:max-w-[300px]" />
  
  <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
    Practice Planning Made Easy
  </h1>
  
  <p class="text-lg text-gray-600 mb-6">
    Easily find, create, and share quadball drills and practice plans. 
    Focus on coaching, QDrill makes planning easy.
  </p>
  
  {#if isAuthenticated}
    <!-- Authenticated user CTAs -->
    <div class="space-y-4">
      <button
        on:click={navigateToWizard}
        disabled={isNavigating}
        class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg w-full sm:w-auto text-center relative text-lg"
      >
        {#if isNavigating}
          <div class="absolute inset-0 flex items-center justify-center">
            <Spinner size="sm" color="white" />
          </div>
          <span class="opacity-0">Create Practice Plan</span>
        {:else}
          Create Practice Plan
        {/if}
      </button>
      
      <a
        href="/drills"
        class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg w-full sm:w-auto text-center ml-0 sm:ml-4"
      >
        Browse Drills
      </a>
    </div>
  {:else}
    <!-- Unauthenticated user CTAs -->
    <div class="space-y-4">
      <!-- Primary CTA: Sign Up -->
      <LoadingButton
        loading={isSigningIn}
        loadingText="Signing in..."
        on:click={handleSignIn}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg w-full sm:w-auto text-lg shadow-lg"
      >
        Get Started Free
      </LoadingButton>
      
      <p class="text-sm text-gray-500">
        Free Google sign-in • No credit card required
      </p>
      
      <!-- Secondary CTAs -->
      <div class="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="/drills"
          class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg text-center border"
        >
          Browse Drills
        </a>
        
        <button
          on:click={navigateToWizard}
          class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg text-center border"
        >
          Preview Builder
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Value proposition for unauthenticated users -->
  {#if !isAuthenticated}
    <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 class="font-semibold text-blue-900 mb-2">What you get:</h3>
      <ul class="text-sm text-blue-800 space-y-1">
        <li>✓ Save unlimited drills and practice plans</li>
        <li>✓ AI-powered practice plan generation</li>
        <li>✓ Share plans with your team</li>
        <li>✓ Access to community drills library</li>
      </ul>
    </div>
  {/if}
</div>
```

### Enhanced Header Sign-In (Alternative)
```svelte
<!-- Enhanced header sign-in for unauthenticated users -->
{#if !user}
  <div class="flex items-center space-x-3">
    <a href="/drills" class="text-gray-600 hover:text-gray-900 font-medium">
      Browse
    </a>
    <LoadingButton
      loading={isSigningIn}
      on:click={handleSignIn}
      variant="default"
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Sign In
    </LoadingButton>
  </div>
{/if}
```

### Mobile-Optimized CTAs
```svelte
<!-- Mobile-specific improvements -->
<style>
  @media (max-width: 640px) {
    .hero-cta-primary {
      font-size: 1.125rem; /* text-lg */
      padding: 1rem 2rem; /* py-4 px-8 */
      width: 100%;
    }
    
    .hero-cta-secondary {
      font-size: 1rem;
      padding: 0.75rem 1.5rem;
      width: 100%;
    }
  }
</style>
```

### Alternative: Prominent Header CTA Banner
```svelte
<!-- Optional: Add a promotional banner for unauthenticated users -->
{#if !isAuthenticated}
  <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-4">
    <div class="container mx-auto flex items-center justify-between">
      <span class="text-sm font-medium">
        🎯 Start building better practice plans today
      </span>
      <LoadingButton
        loading={isSigningIn}
        on:click={handleSignIn}
        size="sm"
        className="bg-white text-blue-600 hover:bg-gray-100"
      >
        Sign Up Free
      </LoadingButton>
    </div>
  </div>
{/if}
```

## Visual Hierarchy Guidelines

### Priority Order for Unauthenticated Users:
1. **Primary**: "Get Started Free" (large, prominent button)
2. **Secondary**: Value proposition callout
3. **Tertiary**: Browse/Preview options
4. **Quaternary**: Detailed feature descriptions

### Color and Size Guidelines:
- **Primary CTA**: Blue (#2563eb), large size, prominent placement
- **Secondary CTAs**: Gray outline, smaller size
- **Value props**: Light blue background (#eff6ff) with blue text
- **Trust signals**: Small gray text, subtle

## Acceptance Criteria
- [ ] Sign-in CTA is prominently displayed and easily discoverable
- [ ] Clear value proposition communicated before sign-in
- [ ] "Free" and "no credit card required" messaging included
- [ ] Different CTA experience for authenticated vs unauthenticated users
- [ ] Mobile-optimized button sizes and spacing
- [ ] Loading states for sign-in process
- [ ] Clear visual hierarchy guides user attention
- [ ] Trust signals (Google sign-in, free account) prominent

## Testing
- [ ] Test CTA visibility and click-through rates
- [ ] Test sign-in conversion from landing page
- [ ] Test mobile CTA usability
- [ ] Test loading states during sign-in process
- [ ] A/B test different CTA copy and positioning
- [ ] Test accessibility with screen readers
- [ ] Test different viewport sizes

## Success Metrics
- [ ] Increase in sign-in conversion rate from landing page
- [ ] Improved time-to-sign-in for new users
- [ ] Reduced bounce rate on landing page
- [ ] Higher engagement with primary CTAs

## Notes
- Consider A/B testing different CTA copy ("Get Started Free" vs "Sign Up Free" vs "Create Account")
- Monitor conversion rates and adjust based on data
- Ensure sign-in flow is smooth and returns users to appropriate page
- Consider adding social proof elements (user count, testimonials) 