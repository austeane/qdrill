<script>
       import { createEventDispatcher } from 'svelte';
       // Actions are now handled by the parent component via events
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	export let show = false;
	export let selectedSectionId = null;

	const dispatch = createEventDispatcher();

	let searchQuery = '';
	let searchResults = [];
	let oneOffName = 'Quick Activity';

	function close() {
		show = false;
		searchQuery = '';
		searchResults = [];
		oneOffName = 'Quick Activity';
		dispatch('close');
	}

	async function searchDrills(query) {
		if (!query || query.trim() === '') {
			searchResults = [];
			return;
		}

		try {
			searchResults = await apiFetch(`/api/drills/search?query=${encodeURIComponent(query)}`);
		} catch (error) {
			console.error('Error searching drills:', error);
			searchResults = [];
			toast.push(`Search failed: ${error.message}`, { theme: { '--toastBackground': 'red' } });
		}
	}

       function handleAddDrill(drill) {
               if (!selectedSectionId) {
                       toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
                       return;
               }

               dispatch('addDrill', { drill, sectionId: selectedSectionId });
               close();
       }

       function handleAddBreak() {
               if (!selectedSectionId) {
                       toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
                       return;
               }

               dispatch('addBreak', { sectionId: selectedSectionId });
               close();
       }

       function handleAddOneOffDrill() {
               if (!selectedSectionId) {
                       toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
                       return;
               }

               if (!oneOffName.trim()) {
                       toast.push('Activity name cannot be empty', { theme: { '--toastBackground': 'red' } });
                       return;
               }

               dispatch('addOneOffDrill', { sectionId: selectedSectionId, name: oneOffName });
               close();
       }
</script>

{#if show}
        <div
                class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drill-search-title"
                tabindex="-1"
                on:keydown={(e) => e.key === 'Escape' && close()}
        >
                <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
                        <div class="mt-3">
                                <h3 id="drill-search-title" class="text-lg font-medium text-gray-900 mb-4">Add to Practice Plan</h3>

				<!-- Add Break option at the top -->
				<div
					class="mb-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
					on:click={handleAddBreak}
				>
					<div class="flex justify-between items-center">
						<div>
							<h4 class="font-medium">Add Break</h4>
							<p class="text-sm text-gray-500">Add a timed break or transition period</p>
						</div>
						<span class="text-blue-500">+</span>
					</div>
				</div>

				<!-- Add One-off Activity option -->
				<div class="mb-4 p-4 border rounded-lg hover:bg-gray-50">
					<div class="flex justify-between items-center mb-2">
						<div>
							<h4 class="font-medium">Add One-off Activity</h4>
							<p class="text-sm text-gray-500">Quick activity with just a name and duration</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={oneOffName}
							placeholder="Activity name"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
							on:click={handleAddOneOffDrill}
						>
							Add
						</button>
					</div>
				</div>

				<div class="border-t my-4"></div>

				<!-- Search input -->
				<div class="mb-4">
                                        <input
                                                type="text"
                                                bind:value={searchQuery}
                                                on:input={() => searchDrills(searchQuery)}
                                                placeholder="Search drills..."
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                autofocus
                                        />
                                </div>

				<!-- Search results -->
				<div class="max-h-[400px] overflow-y-auto">
					{#if searchResults.length === 0}
						<p class="text-gray-500 text-center py-4">
							{searchQuery ? 'No drills found' : 'Start typing to search drills'}
						</p>
					{:else}
						<ul class="divide-y divide-gray-200">
							{#each searchResults as drill}
								<li
									class="py-3 hover:bg-gray-50 cursor-pointer px-2 rounded"
									on:click={() => handleAddDrill(drill)}
								>
									<div class="flex justify-between items-center">
										<span>{drill.name}</span>
										<button class="text-blue-500 hover:text-blue-700"> Add </button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<!-- Close button -->
                                <div class="mt-4 flex justify-end">
                                        <button
                                                class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                                                on:click={close}
                                                aria-label="Close"
                                        >
                                                Close
                                        </button>
                                </div>
			</div>
		</div>
	</div>
{/if}
