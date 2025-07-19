# UX Improvement: Custom Error Pages and Enhanced Error Handling

## Priority: Medium-High

**Impact**: Medium-High (User experience during errors)  
**Effort**: Low-Medium  
**Status**: Open

## Progress Update (2024-08-17)
- Server-side API routes use a shared `handleApiError` helper with custom error classes (`src/routes/api/utils/handleApiError.js` and `src/lib/server/errors.js`).
- Client pages increasingly use `apiFetch` (`src/lib/utils/apiFetch.js`) for consistent error parsing.
- Custom error pages (`+error.svelte`) and an `ErrorBoundary` component have not been implemented yet.
- The whiteboard page still renders Excalidraw without retry logic or detailed errors.

## Problem

According to UX feedback:

1. 404 pages show generic Vercel error instead of custom branded pages
2. API failures result in blank pages with no user guidance
3. Whiteboard sometimes fails to load Excalidraw with no clear error message
4. Network errors don't provide helpful recovery suggestions

## Solution

Implement custom error pages and robust error handling throughout the application to provide helpful guidance when things go wrong.

## Files to Modify

### Primary Files

- `src/routes/+error.svelte` - Custom error page component
- `src/app.html` - Global error fallback
- `src/routes/api/utils/handleApiError.js` - API error helper (already implemented)
- `src/lib/utils/apiFetch.js` - Client error helper
- `src/routes/whiteboard/+page.svelte` - Enhanced Excalidraw error handling

### Supporting Files

- `src/lib/components/ErrorBoundary.svelte` - Reusable error boundary component
- `src/routes/+layout.svelte` - Global error handling
- Various API route files - Enhanced error responses

## Current Issues

### Missing Custom Error Pages

Currently, the application falls back to generic Vercel error pages instead of branded, helpful error experiences.

### Poor API Error Handling

```svelte
<!-- Current pattern in many components -->
{#if data.error}
	<div class="error">Error: {data.error}</div>
{:else if !data.data}
	<!-- Loading or empty state -->
{:else}
	<!-- Content -->
{/if}
```

This provides minimal user guidance and no recovery options.
API endpoints now return structured errors using `handleApiError`, but most pages still only check `data.error` and display generic messages.

## Implementation Details

### 1. Custom Error Page Component

```svelte
<!-- src/routes/+error.svelte -->
<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Error information from SvelteKit
	$: error = $page.error;
	$: status = $page.status;

	// Determine error type and appropriate response
	$: errorType = getErrorType(status, error);
	$: errorConfig = getErrorConfig(errorType);

	function getErrorType(status, error) {
		if (status === 404) return '404';
		if (status === 403) return 'forbidden';
		if (status === 500) return 'server';
		if (status >= 400 && status < 500) return 'client';
		return 'unknown';
	}

	function getErrorConfig(type) {
		const configs = {
			'404': {
				title: 'Page Not Found',
				description: "The page you're looking for doesn't exist or has been moved.",
				icon: 'search',
				actions: [
					{ label: 'Go Home', href: '/', primary: true },
					{ label: 'Browse Drills', href: '/drills' },
					{ label: 'Create Practice Plan', href: '/practice-plans/create' }
				],
				showSearch: true
			},
			forbidden: {
				title: 'Access Denied',
				description: "You don't have permission to access this resource.",
				icon: 'lock',
				actions: [
					{ label: 'Sign In', onClick: () => signIn.social({ provider: 'google' }), primary: true },
					{ label: 'Go Home', href: '/' }
				]
			},
			server: {
				title: 'Something Went Wrong',
				description:
					"We're experiencing technical difficulties. Please try again in a few minutes.",
				icon: 'warning',
				actions: [
					{ label: 'Try Again', onClick: () => window.location.reload(), primary: true },
					{ label: 'Go Home', href: '/' },
					{ label: 'Report Issue', href: '/feedback' }
				]
			},
			client: {
				title: 'Request Error',
				description: 'There was a problem with your request. Please check and try again.',
				icon: 'warning',
				actions: [
					{ label: 'Go Back', onClick: () => history.back(), primary: true },
					{ label: 'Go Home', href: '/' }
				]
			},
			unknown: {
				title: 'Unexpected Error',
				description: 'An unexpected error occurred. Please try again or contact support.',
				icon: 'warning',
				actions: [
					{ label: 'Reload Page', onClick: () => window.location.reload(), primary: true },
					{ label: 'Go Home', href: '/' },
					{ label: 'Contact Support', href: '/feedback' }
				]
			}
		};

		return configs[type] || configs['unknown'];
	}

	onMount(() => {
		// Log error for monitoring
		console.error('Error page displayed:', { status, error, path: $page.url.pathname });
	});
</script>

<svelte:head>
	<title>{errorConfig.title} - QDrill</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-md w-full">
		<!-- Error Icon -->
		<div class="flex justify-center mb-6">
			<div class="w-16 h-16 text-gray-400">
				{#if errorConfig.icon === 'search'}
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				{:else if errorConfig.icon === 'lock'}
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				{:else}
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				{/if}
			</div>
		</div>

		<!-- Error Content -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">{errorConfig.title}</h1>
			<p class="text-gray-600 mb-8">{errorConfig.description}</p>

			{#if status}
				<p class="text-sm text-gray-500 mb-6">Error {status}</p>
			{/if}

			<!-- Actions -->
			<div class="space-y-3">
				{#each errorConfig.actions as action}
					{#if action.href}
						<a
							href={action.href}
							class="block w-full px-4 py-2 rounded-md font-medium transition-colors duration-200"
							class:bg-blue-600={action.primary}
							class:text-white={action.primary}
							class:hover:bg-blue-700={action.primary}
							class:bg-gray-100={!action.primary}
							class:text-gray-700={!action.primary}
							class:hover:bg-gray-200={!action.primary}
						>
							{action.label}
						</a>
					{:else if action.onClick}
						<button
							on:click={action.onClick}
							class="block w-full px-4 py-2 rounded-md font-medium transition-colors duration-200"
							class:bg-blue-600={action.primary}
							class:text-white={action.primary}
							class:hover:bg-blue-700={action.primary}
							class:bg-gray-100={!action.primary}
							class:text-gray-700={!action.primary}
							class:hover:bg-gray-200={!action.primary}
						>
							{action.label}
						</button>
					{/if}
				{/each}
			</div>

			<!-- Search (for 404s) -->
			{#if errorConfig.showSearch}
				<div class="mt-8 pt-6 border-t border-gray-200">
					<p class="text-sm text-gray-500 mb-3">Looking for something specific?</p>
					<div class="flex">
						<input
							type="text"
							placeholder="Search drills and plans..."
							class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							on:keydown={(e) => {
								if (e.key === 'Enter' && e.target.value.trim()) {
									goto(`/drills?q=${encodeURIComponent(e.target.value.trim())}`);
								}
							}}
						/>
						<button
							class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
							on:click={(e) => {
								const input = e.target.previousElementSibling;
								if (input.value.trim()) {
									goto(`/drills?q=${encodeURIComponent(input.value.trim())}`);
								}
							}}
						>
							Search
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
```

### 2. Error Boundary Component

```svelte
<!-- src/lib/components/ErrorBoundary.svelte -->
<script>
	import { onErrorCaptured } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let fallback = null;
	export let onError = null;

	const dispatch = createEventDispatcher();

	let hasError = false;
	let error = null;

	onErrorCaptured((err, errorInfo) => {
		hasError = true;
		error = err;

		if (onError) {
			onError(err, errorInfo);
		}

		dispatch('error', { error: err, errorInfo });

		// Log to monitoring service
		console.error('Error boundary caught error:', err, errorInfo);
	});

	function retry() {
		hasError = false;
		error = null;
	}
</script>

{#if hasError}
	{#if fallback}
		<svelte:component this={fallback} {error} {retry} />
	{:else}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<div class="ml-3 flex-1">
					<h3 class="text-sm font-medium text-red-800">Something went wrong</h3>
					<p class="text-sm text-red-700 mt-1">
						An error occurred while loading this component. Please try again.
					</p>
				</div>
			</div>
			<div class="mt-4">
				<button
					on:click={retry}
					class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
				>
					Try Again
				</button>
			</div>
		</div>
	{/if}
{:else}
	<slot />
{/if}
```

### 3. Enhanced API Error Handling

```javascript
// src/lib/utils/errorHandling.js
export class APIError extends Error {
	constructor(message, status, code) {
		super(message);
		this.name = 'APIError';
		this.status = status;
		this.code = code;
	}
}

export function handleAPIError(error, context = '') {
	console.error(`API Error ${context}:`, error);

	if (error instanceof APIError) {
		switch (error.status) {
			case 401:
				return 'Please sign in to continue';
			case 403:
				return "You don't have permission to perform this action";
			case 404:
				return 'The requested resource was not found';
			case 429:
				return 'Too many requests. Please wait and try again';
			case 500:
				return 'Server error. Please try again later';
			default:
				return error.message || 'An unexpected error occurred';
		}
	}

	if (error.name === 'NetworkError' || !navigator.onLine) {
		return 'Network connection error. Please check your internet connection';
	}

	return 'An unexpected error occurred. Please try again';
}

export function createErrorToast(error, context = '') {
	const message = handleAPIError(error, context);

	return {
		message,
		type: 'error',
		duration: 5000,
		action:
			error.status >= 500
				? {
						label: 'Retry',
						handler: () => window.location.reload()
					}
				: null
	};
}
```

### 4. Enhanced Whiteboard Error Handling

```svelte
<!-- src/routes/whiteboard/+page.svelte -->
<script>
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { browser } from '$app/environment';

	let excalidrawError = null;
	let isRetrying = false;

	function handleExcalidrawError(error) {
		console.error('Excalidraw error:', error);
		excalidrawError = error;
	}

	async function retryExcalidraw() {
		isRetrying = true;
		excalidrawError = null;

		// Force a fresh reload of Excalidraw
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isRetrying = false;
	}
</script>

<div class="whiteboard-container w-full h-screen-minus-header">
	{#if browser && !excalidrawError}
		<ErrorBoundary onError={handleExcalidrawError}>
			<ExcalidrawWrapper
				id="whiteboard-main"
				data={null}
				readonly={false}
				template="blank"
				startFullscreen={true}
			/>
		</ErrorBoundary>
	{:else if excalidrawError}
		<div class="flex items-center justify-center h-full bg-gray-50">
			<div class="text-center max-w-md">
				<div class="w-16 h-16 mx-auto mb-4 text-gray-400">
					<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Whiteboard Loading Error</h2>
				<p class="text-gray-600 mb-6">
					The whiteboard failed to load. This might be due to a browser compatibility issue or
					network problem.
				</p>
				<div class="space-y-3">
					<button
						on:click={retryExcalidraw}
						disabled={isRetrying}
						class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{isRetrying ? 'Retrying...' : 'Try Again'}
					</button>
					<a
						href="/"
						class="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
					>
						Go Home
					</a>
				</div>
				<div class="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
					<p class="font-medium mb-1">Troubleshooting tips:</p>
					<ul class="text-left space-y-1">
						<li>• Try refreshing the page</li>
						<li>• Check your internet connection</li>
						<li>• Try a different browser</li>
						<li>• Disable browser extensions</li>
					</ul>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500">Loading whiteboard...</p>
		</div>
	{/if}
</div>
```

## Acceptance Criteria

- [ ] Custom 404 page displays with helpful navigation options
- [ ] Server errors show branded error page with recovery suggestions
- [ ] API errors provide clear, actionable error messages
- [ ] Whiteboard loading errors have specific troubleshooting guidance
- [ ] All error pages maintain site navigation and branding
- [ ] Error reporting allows users to provide feedback
- [ ] Error pages are accessible and mobile-friendly
- [ ] Network errors are handled gracefully with retry options

## Testing

- [ ] Test 404 pages for various invalid URLs
- [ ] Test server error scenarios (500, 503)
- [ ] Test network timeout and offline scenarios
- [ ] Test Excalidraw loading failures
- [ ] Test API error responses
- [ ] Test error page accessibility
- [ ] Test error page mobile responsiveness
- [ ] Test error logging and monitoring

## Error Monitoring Integration

- [ ] Set up error logging to monitoring service
- [ ] Track error frequencies and patterns
- [ ] Monitor user actions from error pages
- [ ] Set up alerts for critical error spikes

## Notes

- Consider adding error IDs for easier support debugging
- Implement progressive enhancement for error pages
- Monitor error conversion rates to home page
- Consider adding "Was this helpful?" feedback on error pages
