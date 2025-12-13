<script>
	import { browser } from '$app/environment';
	import { on } from 'svelte/events';

	let { fallback: Fallback = null, onError = null, children } = $props();

	let globalError = $state(null);

	function reportError(error, context = {}) {
		onError?.(error, context);
		console.error('Error boundary caught error:', error);
	}

	function retryGlobal() {
		globalError = null;
	}

	$effect(() => {
		if (!browser) return;

		const handleError = (event) => {
			globalError = event.error || event.reason || new Error('Unknown error');
			reportError(globalError, { componentStack: 'ErrorBoundary' });
			event.preventDefault?.();
		};

		const offError = on(window, 'error', handleError);
		const offRejection = on(window, 'unhandledrejection', handleError);

		return () => {
			offError();
			offRejection();
		};
	});

	function handleBoundaryError(error, reset) {
		reportError(error, { componentStack: 'ErrorBoundary', reset });
	}
</script>

{#snippet fallbackUi(error, retry)}
	{#if Fallback}
		<Fallback {error} {retry} />
	{:else}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77-.833.192 2.5 1.732 2.5z"
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
					onclick={retry}
					class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
				>
					Try Again
				</button>
			</div>
		</div>
	{/if}
{/snippet}

{#if globalError}
	{@render fallbackUi(globalError, retryGlobal)}
{:else}
	<svelte:boundary onerror={handleBoundaryError}>
		{@render children?.()}

		{#snippet failed(error, reset)}
			{@render fallbackUi(error, reset)}
		{/snippet}
	</svelte:boundary>
{/if}
