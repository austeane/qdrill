<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	export let fallback = null;
	export let onError = null;

	const dispatch = createEventDispatcher();

	let hasError = false;
	let error = null;

	// Error boundaries in Svelte are not yet fully supported like in React
	// This is a simplified version that can catch some errors
	onMount(() => {
		// Set up global error handler for this component tree
		const handleError = (event) => {
			hasError = true;
			error = event.error || event.reason || new Error('Unknown error');

			if (onError) {
				onError(error, { componentStack: 'ErrorBoundary' });
			}

			dispatch('error', { error, errorInfo: { componentStack: 'ErrorBoundary' } });

			// Log to monitoring service
			console.error('Error boundary caught error:', error);
			
			// Prevent default error handling
			event.preventDefault();
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleError);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleError);
		};
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
