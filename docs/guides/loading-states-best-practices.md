# Loading States Best Practices Guide

This guide outlines the standardized approach to implementing loading states throughout the QDrill application.

## Overview

Good loading states provide immediate feedback to users and improve perceived performance. This application implements several types of loading indicators for different scenarios.

## 🔄 Types of Loading States

### 1. Global Navigation Loading

**When to use**: Page transitions between routes  
**Component**: Global indicator in `+layout.svelte`  
**Implementation**: Uses SvelteKit's `$navigating` store

```svelte
<!-- Already implemented in +layout.svelte -->
{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-50">
		<div class="bg-blue-500 h-1 animate-pulse"></div>
		<div
			class="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center justify-center"
		>
			<Spinner size="sm" color="blue" />
			<span class="ml-2 text-sm text-gray-600">Loading...</span>
		</div>
	</div>
{/if}
```

### 2. Button Loading States

**When to use**: Form submissions, async actions  
**Component**: `LoadingButton.svelte`

```svelte
<script>
	import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';

	let isSubmitting = false;

	async function handleSubmit() {
		isSubmitting = true;
		try {
			await submitForm();
		} finally {
			isSubmitting = false;
		}
	}
</script>

<LoadingButton loading={isSubmitting} loadingText="Saving..." on:click={handleSubmit}>
	Save Plan
</LoadingButton>
```

### 3. Data Loading Skeletons

**When to use**: Initial data load, list loading  
**Component**: `SkeletonLoader.svelte`

```svelte
<script>
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
</script>

{#if isLoading}
	<SkeletonLoader lines={5} showAvatar={true} />
{:else}
	<!-- Your data content -->
{/if}
```

### 4. Inline Component Loading

**When to use**: Specific component operations  
**Component**: `Spinner.svelte`

```svelte
<script>
	import Spinner from '$lib/components/Spinner.svelte';
</script>

{#if isLoadingVotes}
	<Spinner size="sm" />
{:else}
	<span>Votes: {voteCount}</span>
{/if}
```

## 🛠️ Implementation Patterns

### Using Loading State Utilities

```svelte
<script>
	import { createLoadingState } from '$lib/utils/loadingStates.js';

	// Basic loading state
	const loadingState = createLoadingState();

	// With automatic wrapping
	const submitForm = loadingState.wrap(async (formData) => {
		await apiFetch('/api/forms', {
			method: 'POST',
			body: JSON.stringify(formData)
		});
	});

	// Manual control
	async function manualSubmit() {
		loadingState.start();
		try {
			await someAsyncOperation();
		} finally {
			loadingState.stop();
		}
	}
</script>

{#if $loadingState}
	<Spinner />
{:else}
	<button on:click={submitForm}>Submit</button>
{/if}
```

### Server-Side Loading States

For server-side data loading, use the existing patterns:

```javascript
// +page.server.js
export async function load({ fetch, url }) {
	try {
		const data = await apiFetch('/api/data', {}, fetch);
		return { data };
	} catch (error) {
		return { error: error.message };
	}
}
```

```svelte
<!-- +page.svelte -->
<script>
	export let data;
</script>

{#if data.error}
	<div class="error">Error: {data.error}</div>
{:else if !data.data}
	<SkeletonLoader />
{:else}
	<!-- Render data -->
{/if}
```

## 📋 Implementation Checklist

### ✅ Global Navigation (Already Done)

- [x] Global navigation indicator in `+layout.svelte`
- [x] Uses `$navigating` store
- [x] Positioned at top of viewport

### 🔄 Forms and Buttons

- [ ] Replace static buttons with `LoadingButton` in critical forms
- [ ] Add loading states to:
  - [ ] Practice plan creation (`PracticePlanForm.svelte`)
  - [ ] Drill creation (`DrillForm.svelte`)
  - [ ] Vote buttons (`UpvoteDownvote.svelte`)
  - [ ] Comment submission (`Comments.svelte`)

### 🔄 Data Loading

- [ ] Add skeleton loaders to:
  - [ ] Practice plans list (`/practice-plans/+page.svelte`)
  - [ ] Drills list (`/drills/+page.svelte`)
  - [ ] Formation list (`/formations/+page.svelte`)
  - [ ] Individual item pages

### 🔄 API Operations

- [ ] Enhance `FilterPanel.svelte` drill search with loading states
- [ ] Add loading states to pagination interactions
- [ ] Show loading during filter operations

## 🎨 Design Guidelines

### Visual Hierarchy

1. **Global navigation**: Top-level blue progress bar
2. **Page content**: Skeleton loaders for main content
3. **Component actions**: Inline spinners
4. **Button actions**: Button-specific loading states

### Timing Guidelines

- **Immediate feedback**: <100ms operations don't need indicators
- **Short operations**: 100ms-1s use simple spinners
- **Medium operations**: 1-5s use skeleton loaders
- **Long operations**: >5s provide progress indication

### Animation Standards

- Use consistent easing (`transition-colors duration-300`)
- Spinner rotation: smooth and continuous
- Skeleton pulse: gentle breathing effect
- Progress bars: smooth progression

## 🧪 Testing Loading States

### Manual Testing

1. **Slow network**: Use browser dev tools to throttle network
2. **Slow API**: Add artificial delays to API endpoints in development
3. **Error scenarios**: Test loading states during error conditions

### Key Scenarios to Test

- [ ] Page navigation between routes
- [ ] Form submissions (success and error)
- [ ] Filter operations with large datasets
- [ ] Search functionality
- [ ] File uploads
- [ ] Voting/commenting actions

## 🔧 Future Enhancements

### Progressive Enhancement

- Add skeleton loaders that match actual content layout
- Implement optimistic updates for voting
- Add predictive loading for likely next actions

### Advanced Features

- Loading state persistence across navigation
- Smart preloading based on user behavior
- Loading analytics and performance monitoring

## 📁 File Organization

```
src/
├── lib/
│   ├── components/
│   │   ├── Spinner.svelte ✅
│   │   ├── SkeletonLoader.svelte ✅
│   │   └── ui/button/
│   │       └── LoadingButton.svelte ✅
│   └── utils/
│       └── loadingStates.js ✅
├── routes/
│   └── +layout.svelte ✅ (with global loading)
└── docs/
    └── guides/
        └── loading-states-best-practices.md ✅
```

## 🎯 Priority Implementation Order

1. **High Priority** (Immediate user impact)

   - Form submission loading states
   - Vote/comment action feedback
   - Search operation indicators

2. **Medium Priority** (User experience)

   - List loading skeletons
   - Filter operation feedback
   - Individual page loading states

3. **Low Priority** (Polish)
   - Advanced animations
   - Predictive loading
   - Loading analytics

---

_This guide should be updated as new patterns emerge and the application evolves._
