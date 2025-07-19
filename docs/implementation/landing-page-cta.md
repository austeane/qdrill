# Landing Page CTA Hierarchy

This document describes the updated call-to-action hierarchy on the landing page.

## Overview

Unauthenticated visitors now see a prominent **Get Started Free** button in the hero section. A short value proposition list reinforces the benefits of signing in. Authenticated users are presented with quick links to create practice plans or browse drills.

## Implementation Details

- `src/routes/+page.svelte` imports `page` and `signIn` to determine authentication state and start Google sign-in.
- `LoadingButton` components provide visual feedback during navigation and sign-in.
- The header sign-in button was replaced with `LoadingButton` for consistency.

```svelte
{#if isAuthenticated}
	<button on:click={navigateToWizard}>Create Practice Plan</button>
{:else}
	<LoadingButton on:click={handleSignIn} loading={isSigningIn}>Get Started Free</LoadingButton>
{/if}
```

These changes guide new users toward creating an account while keeping familiar actions for returning users.
