<script>
	export let title = 'No results found';
	export let description = '';
	export let icon = 'search'; // search, drills, plans, formations
	export let actions = []; // Array of action objects: { label, href, onClick, primary }
	export let showSearchSuggestion = false;
</script>

<div class="flex flex-col items-center justify-center py-12 px-4">
	<!-- Icon -->
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
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3" />
				<circle cx="12" cy="12" r="9" stroke-width="1.5" />
			</svg>
		{:else if icon === 'formations'}
			<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M16 7V3M8 7V3M12 17v4m0-4v4m0-10V3M3 7h18M5 10h14M7 13h10"
				/>
			</svg>
		{/if}
	</div>

	<!-- Title and Description -->
	<h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
	{#if description}
		<p class="text-gray-600 text-center max-w-md mb-6">{description}</p>
	{/if}

	<!-- Search Suggestions -->
	{#if showSearchSuggestion}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
			<h4 class="font-medium text-blue-900 mb-2">Try adjusting your search:</h4>
			<ul class="text-sm text-blue-800 space-y-1">
				<li>&bull; Remove some filters</li>
				<li>&bull; Try different keywords</li>
				<li>&bull; Check your spelling</li>
			</ul>
		</div>
	{/if}

	<!-- Actions -->
	{#if actions.length > 0}
		<div class="flex flex-wrap gap-3 justify-center">
			{#each actions as action}
				{#if action.href}
					<a
						href={action.href}
						class="px-4 py-2 rounded-md font-medium transition-colors duration-200"
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
						class="px-4 py-2 rounded-md font-medium transition-colors duration-200"
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
	{/if}
</div>
