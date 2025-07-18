<!-- src/lib/components/EmptyState.svelte -->
<script>
	// Reusable component for displaying helpful empty states
	export let title = 'No results found';
	export let description = '';
	// icon type determines which illustration to show
	export let icon = 'search'; // search, drills, plans, formations
	// actions array items: { label, href?, onClick?, primary? }
	export let actions = [];
	export let showSearchSuggestion = false;
</script>

<div class="flex flex-col items-center justify-center py-12 px-4">
	<div class="w-16 h-16 mb-4 text-gray-400">
		{#if icon === 'search'}
			<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		{:else if icon === 'drills'}
			<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
		{:else if icon === 'plans'}
			<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M3 7h18M3 12h18M7 17h10"
				/>
			</svg>
		{:else if icon === 'formations'}
			<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M5 3v4m0 0v4m0-4h4m-4 0H1m14-4v4m0 0v4m0-4h4m-4 0h-4M9 15v4m0 0v4m0-4h4m-4 0H5"
				/>
			</svg>
		{/if}
	</div>

	<h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
	{#if description}
		<p class="text-gray-600 text-center max-w-md mb-6">{description}</p>
	{/if}

	{#if showSearchSuggestion}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
			<h4 class="font-medium text-blue-900 mb-2">Try adjusting your search:</h4>
			<ul class="text-sm text-blue-800 space-y-1">
				<li>• Remove some filters</li>
				<li>• Try different keywords</li>
				<li>• Check your spelling</li>
			</ul>
		</div>
	{/if}

	{#if actions.length > 0}
		<div class="flex flex-wrap gap-3 justify-center">
			{#each actions as action}
				{#if action.href}
					<a
						href={action.href}
						class="px-4 py-2 rounded-md font-medium transition-colors duration-200 {action.primary
							? 'bg-blue-600 text-white hover:bg-blue-700'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">{action.label}</a
					>
				{:else if action.onClick}
					<button
						on:click={action.onClick}
						class="px-4 py-2 rounded-md font-medium transition-colors duration-200 {action.primary
							? 'bg-blue-600 text-white hover:bg-blue-700'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						{action.label}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
