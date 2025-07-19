# UX Improvement: Implement Skeleton Loaders and Enhanced Loading States

## Priority: High

**Impact**: High (User experience and perceived performance)  
**Effort**: Medium  
**Status**: Open

## Problem

The application lacks proper loading states for data fetching operations. Users see blank screens or generic "Loading..." text during data loads, which creates a poor perceived performance experience.

## Solution

Implement skeleton loaders and enhanced loading states across key pages and components as outlined in the existing loading states best practices guide.

## Files to Modify

### Primary Files

- `src/routes/drills/+page.svelte` - Add skeleton loaders for drill cards
- `src/routes/practice-plans/+page.svelte` - Add skeleton loaders for practice plan cards
- `src/routes/formations/+page.svelte` - Add skeleton loaders for formation cards
- `src/lib/components/FilterPanel.svelte` - Add loading states for filter operations
- `src/lib/components/UpvoteDownvote.svelte` - Enhance voting loading states (already partially implemented)

### Supporting Files

- `src/lib/components/SkeletonLoader.svelte` - Already exists, may need enhancements
- `src/lib/components/ui/button/LoadingButton.svelte` - Already exists, needs wider adoption
- `src/lib/utils/loadingStates.js` - Already exists, expand usage

## Current State Analysis

### ✅ Already Implemented

- Global navigation loading indicator in `+layout.svelte`
- `Spinner.svelte` component
- `SkeletonLoader.svelte` component
- `LoadingButton.svelte` component
- `loadingStates.js` utility
- Basic loading states in `UpvoteDownvote.svelte`

### ❌ Missing Implementation

- Skeleton loaders for list pages
- Loading states for filter/search operations
- Form submission loading states
- Button loading states in critical actions

## Implementation Details

### 1. Drills Page Skeleton Loading

```svelte
<!-- src/routes/drills/+page.svelte -->
<script>
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { createLoadingState } from '$lib/utils/loadingStates.js';

	const filterLoading = createLoadingState();

	// Enhanced filter change handler
	function handleFilterChange() {
		filterLoading.start();
		applyFiltersAndNavigate({ resetPage: true }).finally(() => {
			filterLoading.stop();
		});
	}
</script>

<!-- Loading and Empty States -->
{#if $navigating && !data.items}
	<!-- Skeleton loaders for drill cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each Array(6) as _}
			<div class="border border-gray-200 bg-white rounded-lg shadow-md p-6">
				<SkeletonLoader lines={4} showAvatar={false} className="mb-4" />
				<div class="space-y-2">
					<div class="h-4 bg-gray-300 rounded w-1/2"></div>
					<div class="h-4 bg-gray-300 rounded w-3/4"></div>
					<div class="h-8 bg-gray-300 rounded w-full mt-4"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if !data.items || data.items.length === 0}
	<!-- Empty state (from previous ticket) -->
{:else}
	<!-- Actual drill cards -->
{/if}
```

### 2. Enhanced FilterPanel Loading

```svelte
<!-- src/lib/components/FilterPanel.svelte -->
<script>
	import { createLoadingState } from '$lib/utils/loadingStates.js';
	import Spinner from '$lib/components/Spinner.svelte';

	const filterApplying = createLoadingState();

	function handleFilterChangeWithLoading() {
		filterApplying.start();
		dispatch('filterChange');
		// Stop loading after navigation completes
		setTimeout(() => filterApplying.stop(), 1000);
	}
</script>

<!-- Add loading overlay for filter panel -->
{#if $filterApplying}
	<div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
		<div class="flex items-center space-x-2">
			<Spinner size="sm" color="blue" />
			<span class="text-sm text-gray-600">Applying filters...</span>
		</div>
	</div>
{/if}
```

### 3. Practice Plans Skeleton Loading

```svelte
<!-- src/routes/practice-plans/+page.svelte -->
{#if $navigating && !data.items}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each Array(6) as _}
			<div class="bg-white rounded-lg shadow-md p-6">
				<div class="flex items-center space-x-3 mb-4">
					<div class="w-8 h-8 bg-gray-300 rounded"></div>
					<SkeletonLoader lines={1} className="flex-1" />
				</div>
				<SkeletonLoader lines={3} className="mb-4" />
				<div class="flex justify-between items-center">
					<div class="h-4 bg-gray-300 rounded w-16"></div>
					<div class="h-8 bg-gray-300 rounded w-20"></div>
				</div>
			</div>
		{/each}
	</div>
{/if}
```

### 4. Enhanced Form Loading States

```svelte
<!-- Example for drill creation form -->
<script>
	import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';

	let isSubmitting = false;

	async function handleSubmit() {
		isSubmitting = true;
		try {
			await submitDrill();
			// Success handling
		} finally {
			isSubmitting = false;
		}
	}
</script>

<LoadingButton
	loading={isSubmitting}
	loadingText="Creating drill..."
	on:click={handleSubmit}
	className="w-full"
>
	Create Drill
</LoadingButton>
```

### 5. Enhanced Search Loading

```svelte
<!-- Enhanced search with loading states -->
<div class="relative flex-grow">
	<input
		type="text"
		placeholder="Search drills..."
		class="w-full p-3 pr-10 border border-gray-300 rounded-md"
		bind:value={$searchQuery}
		on:input={handleSearchInput}
	/>

	{#if $searchLoading}
		<div class="absolute right-3 top-1/2 transform -translate-y-1/2">
			<Spinner size="sm" color="gray" />
		</div>
	{/if}
</div>
```

### 6. Pagination Loading States

```svelte
<!-- Enhanced Pagination.svelte -->
<script>
	import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';
	import { navigating } from '$app/stores';
</script>

<div class="flex justify-center items-center mt-8 space-x-4">
	<LoadingButton
		loading={$navigating}
		disabled={currentPage === 1}
		on:click={prevPage}
		variant="outline"
		size="sm"
	>
		Previous
	</LoadingButton>

	<span class="text-gray-700">Page {currentPage} of {totalPages}</span>

	<LoadingButton
		loading={$navigating}
		disabled={currentPage === totalPages}
		on:click={nextPage}
		variant="outline"
		size="sm"
	>
		Next
	</LoadingButton>
</div>
```

## Skeleton Component Enhancements

### Enhanced SkeletonLoader Component

```svelte
<!-- src/lib/components/SkeletonLoader.svelte -->
<script>
	export let lines = 3;
	export let showAvatar = false;
	export let showButton = false;
	export let showCard = false;
	export let className = '';
	export let height = 'auto';
</script>

<div class="animate-pulse {className}" style="height: {height}">
	{#if showCard}
		<!-- Card-specific skeleton -->
		<div class="border border-gray-200 rounded-lg p-6 bg-white">
			{#if showAvatar}
				<div class="flex items-center space-x-4 mb-4">
					<div class="rounded-full bg-gray-300 h-10 w-10"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 bg-gray-300 rounded w-3/4"></div>
						<div class="h-4 bg-gray-300 rounded w-1/2"></div>
					</div>
				</div>
			{/if}

			{#each Array(lines) as _, i}
				<div class="h-4 bg-gray-300 rounded mb-2 {i === lines - 1 ? 'w-2/3' : 'w-full'}"></div>
			{/each}

			{#if showButton}
				<div class="h-10 bg-gray-300 rounded w-full mt-4"></div>
			{/if}
		</div>
	{:else}
		<!-- Regular skeleton -->
		{#if showAvatar}
			<div class="flex items-center space-x-4 mb-4">
				<div class="rounded-full bg-gray-300 h-10 w-10"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 bg-gray-300 rounded w-3/4"></div>
					<div class="h-4 bg-gray-300 rounded w-1/2"></div>
				</div>
			</div>
		{/if}

		{#each Array(lines) as _, i}
			<div class="h-4 bg-gray-300 rounded mb-2 {i === lines - 1 ? 'w-2/3' : 'w-full'}"></div>
		{/each}

		{#if showButton}
			<div class="h-10 bg-gray-300 rounded w-full mt-4"></div>
		{/if}
	{/if}
</div>
```

## Acceptance Criteria

- [ ] Skeleton loaders appear immediately when loading data
- [ ] Skeleton loaders match the layout of actual content
- [ ] Loading states provide immediate feedback for user actions
- [ ] Form submissions show clear loading states
- [ ] Filter/search operations show loading feedback
- [ ] Pagination buttons show loading states during navigation
- [ ] Loading states are accessible with proper ARIA labels
- [ ] Loading animations are smooth and professional
- [ ] No layout shift when transitioning from skeleton to real content

## Testing

- [ ] Test skeleton loaders on slow network connections
- [ ] Test loading states on form submissions
- [ ] Test filter loading states with complex queries
- [ ] Test pagination loading states
- [ ] Test loading states with screen readers
- [ ] Test mobile responsiveness of loading states
- [ ] Test error states that occur during loading
- [ ] Test loading state interruption (user navigates away)

## Performance Considerations

- [ ] Skeleton loaders should be lightweight and fast to render
- [ ] Loading states should not block the UI unnecessarily
- [ ] Consider minimum loading duration to prevent flashing
- [ ] Optimize loading state animations for performance

## Notes

- Follow the existing loading states best practices guide
- Maintain consistency in loading patterns across the application
- Consider progressive enhancement - ensure functionality works without JavaScript
- Monitor loading state performance with analytics
