<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Search, Lock, AlertTriangle } from 'lucide-svelte';

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
				actions: [{ label: 'Go Home', href: '/' }]
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
					<Search size={64} />
				{:else if errorConfig.icon === 'lock'}
					<Lock size={64} />
				{:else}
					<AlertTriangle size={64} />
				{/if}
			</div>
		</div>

		<!-- Error Content -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">{errorConfig.title}</h1>
			<p class="text-gray-600 dark:text-gray-300 mb-8">{errorConfig.description}</p>

			{#if status}
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Error {status}</p>
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
					<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Looking for something specific?</p>
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
