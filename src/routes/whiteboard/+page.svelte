<script>
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { browser } from '$app/environment';

	let excalidrawError = null;
	let isRetrying = false;
	let excalidrawId = 'whiteboard-main';

	function handleExcalidrawError(error) {
		console.error('Excalidraw error:', error);
		excalidrawError = error;
	}

	async function retryExcalidraw() {
		isRetrying = true;
		excalidrawError = null;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isRetrying = false;
	}
</script>

<svelte:head>
	<title>Whiteboard - QDrill</title>
	<meta name="description" content="A blank canvas for your quadball ideas." />
</svelte:head>

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
		<div class="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
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
				<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
					Whiteboard Loading Error
				</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-6">
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
						class="block w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
					>
						Go Home
					</a>
				</div>
				<div
					class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300"
				>
					<p class="font-medium mb-1">Troubleshooting tips:</p>
					<ul class="text-left space-y-1">
						<li>&bull; Try refreshing the page</li>
						<li>&bull; Check your internet connection</li>
						<li>&bull; Try a different browser</li>
						<li>&bull; Disable browser extensions</li>
					</ul>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500 dark:text-gray-400">Loading whiteboard...</p>
		</div>
	{/if}
</div>

<style>
	.h-screen-minus-header {
		height: calc(100vh - 4rem); /* Assuming header height is 4rem (h-16 in Tailwind) */
	}

	/* Ensure excalidraw wrapper takes full space within this container */
	:global(.whiteboard-container .excalidraw-wrapper) {
		width: 100% !important;
		height: 100% !important;
	}
	:global(.whiteboard-container .excalidraw) {
		min-height: 0 !important; /* Override min-height from global excalidraw styles if needed */
	}
</style>
