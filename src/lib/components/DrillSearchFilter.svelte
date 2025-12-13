<script>
	let {
		open = false,
		searchTerm = $bindable(''),
		suggestions = [],
		selectedDrills = [],
		loading = false,
		error = null,
		onToggle = () => {},
		onInput = () => {},
		onSelect = (_drill) => {},
		onRemove = (_id) => {}
	} = $props();
</script>

<div class="relative">
	<button
		class={`inline-flex items-center border border-gray-300 rounded-full px-4 py-2 cursor-pointer transition-colors duration-300 ${open ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
		onclick={onToggle}
		aria-expanded={open}
		aria-controls="containsDrill-content"
	>
		Contains Drill
		{#if selectedDrills.length > 0}
			<span
				class="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1 transform translate-x-1/2 -translate-y-1/2"
				>({selectedDrills.length})</span
			>
		{/if}
	</button>

	{#if open}
		<div
			id="containsDrill-content"
			class="absolute top-full left-0 bg-white border border-gray-300 rounded-md p-4 mt-2 shadow-lg z-10 w-64"
			onclick={(e) => e.stopPropagation()}
			role="menu"
			tabindex="0"
		>
			<input
				type="text"
				placeholder="Search for drills..."
				class="w-full p-2 border border-gray-300 rounded-md mb-2"
				bind:value={searchTerm}
				oninput={onInput}
			/>
			{#if loading}
				<p class="text-gray-500">Loading...</p>
			{:else if error}
				<p class="text-red-500">{error}</p>
			{:else}
				{#if suggestions.length > 0}
					<ul class="max-h-48 overflow-y-auto">
						{#each suggestions as drill (drill.id)}
							<li
								class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100"
								onclick={() => onSelect(drill)}
							>
								<span class="font-normal block truncate">{drill.name}</span>
							</li>
						{/each}
					</ul>
				{/if}
				{#if suggestions.length === 0 && searchTerm.trim() !== ''}
					<p class="text-gray-500">No drills found.</p>
				{/if}
			{/if}
			{#if selectedDrills.length > 0}
				<div class="mt-2">
					<h4 class="font-semibold mb-1">Selected Drills:</h4>
					{#each selectedDrills as drill (drill.id)}
						<div class="flex items-center justify-between bg-blue-100 p-2 rounded mb-1">
							<span>{drill.name}</span>
							<button class="text-red-600 hover:text-red-800" onclick={() => onRemove(drill.id)}
								>&times;</button
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
