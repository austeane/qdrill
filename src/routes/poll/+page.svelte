<script>
import { onMount } from 'svelte';
import { toast } from '@zerodevx/svelte-toast';
import { dev } from '$app/environment';
import { invalidate } from '$app/navigation';
import { apiFetch } from '$lib/utils/apiFetch.js';

	export let data;

	let pollOptions = data.pollOptions || [];
	let allDrillNames = data.allDrillNames || [];
	let drillOptions = [];
	let newDescription = '';
	let isSubmitting = false;
	let sortBy = 'votes'; // 'votes' or 'date'
	let editingId = null;
	let searchTerm = '';
	let selectedDrill = null;
	let isLoadingDrills = false;

	function searchDrills() {
		if (!searchTerm) {
			drillOptions = [];
			return;
		}

		isLoadingDrills = true;
		try {
			drillOptions = allDrillNames
				.filter((drill) => drill.name.toLowerCase().includes(searchTerm.toLowerCase()))
				.slice(0, 10); // Limit to 10 results
		} catch (error) {
			console.error('Error filtering drills:', error);
			toast.push('Error filtering drills', { theme: { '--toastBackground': '#F56565' } });
		} finally {
			isLoadingDrills = false;
		}
	}

	function sortOptions(by) {
		sortBy = by;
		pollOptions = [...pollOptions].sort((a, b) => {
			if (by === 'votes') {
				return b.votes - a.votes;
			} else {
				return new Date(b.created_at) - new Date(a.created_at);
			}
		});
	}

	function invalidatePollData() {
		invalidate('app:poll');
	}

	async function addOption(event) {
		event.preventDefault();
		if (isSubmitting) return;

               try {
                       isSubmitting = true;
                       await apiFetch('/api/poll/options', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ description: newDescription })
                       });

                       invalidatePollData();
                       newDescription = '';
                       toast.push('Successfully added suggestion!', { theme: { '--toastBackground': '#48BB78' } });
               } catch (error) {
                       console.error('Error:', error);
                       toast.push(error.message, { theme: { '--toastBackground': '#F56565' } });
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteOption(id) {
		if (!confirm('Are you sure you want to delete this suggestion?')) return;

               try {
                       await apiFetch('/api/poll/options', {
                               method: 'DELETE',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ id })
                       });

                       invalidatePollData();
                       toast.push('Suggestion deleted!', { theme: { '--toastBackground': '#48BB78' } });
               } catch (error) {
                       console.error('Error:', error);
                       toast.push('Failed to delete suggestion', { theme: { '--toastBackground': '#F56565' } });
               }
       }

	async function saveDrillLink(id) {
		if (!selectedDrill) {
			toast.push('Please select a drill first', { theme: { '--toastBackground': '#F56565' } });
			return;
		}

               try {
                       const drillLink = `/drills/${selectedDrill.id}`;
                       await apiFetch('/api/poll/options', {
                               method: 'PUT',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ id, drill_link: drillLink })
                       });

			invalidatePollData();
			editingId = null;
			searchTerm = '';
			selectedDrill = null;
			drillOptions = [];
			toast.push('Drill link updated!', { theme: { '--toastBackground': '#48BB78' } });
		} catch (error) {
			console.error('Error:', error);
			toast.push('Failed to update drill link', { theme: { '--toastBackground': '#F56565' } });
		}
	}

	const voteDebounce = new Map();
	async function vote(optionId) {
		if (voteDebounce.has(optionId)) {
			const lastVote = voteDebounce.get(optionId);
			if (Date.now() - lastVote < 30000) {
				toast.push('Please wait before voting again', {
					theme: { '--toastBackground': '#F56565' }
				});
				return;
			}
		}

               try {
                       await apiFetch('/api/poll', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ optionId })
                       });

                       invalidatePollData();
                       voteDebounce.set(optionId, Date.now());
                       toast.push('Vote recorded!', { theme: { '--toastBackground': '#48BB78' } });
               } catch (error) {
                       console.error('Error:', error);
                       toast.push('Failed to vote', { theme: { '--toastBackground': '#F56565' } });
               }
       }

	$: if (searchTerm) {
		searchDrills();
	}

	onMount(() => {
		sortOptions(sortBy);
	});
	$: sortOptions(sortBy);
	$: if (data.pollOptions) {
		pollOptions = data.pollOptions || [];
		sortOptions(sortBy);
	}
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-3xl font-bold mb-8 text-text">Community Drill Suggestions</h1>

	<div class="bg-bg-0 rounded-lg shadow-md p-6 mb-8">
		<h2 class="text-xl font-semibold mb-4 text-text">Suggest a New Drill</h2>
		<form on:submit={addOption} class="space-y-4">
			<div>
				<label for="description" class="block text-sm font-medium text-text mb-1">
					Description (2-100 characters)
				</label>
				<input
					type="text"
					id="description"
					bind:value={newDescription}
					class="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
					placeholder="Enter a brief description of the drill"
					minlength="2"
					maxlength="100"
					required
				/>
			</div>
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
			>
				{isSubmitting ? 'Submitting...' : 'Add Suggestion'}
			</button>
		</form>
	</div>

	<div class="bg-bg-0 rounded-lg shadow-md p-6">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold text-text">Current Suggestions</h2>
			<div class="flex gap-2">
				<button
					class="px-3 py-1 rounded-md text-sm {sortBy === 'votes'
						? 'bg-blue-500 text-white'
						: 'bg-white text-text hover:bg-gray-50'}"
					on:click={() => sortOptions('votes')}
				>
					Most Voted
				</button>
				<button
					class="px-3 py-1 rounded-md text-sm {sortBy === 'date'
						? 'bg-blue-500 text-white'
						: 'bg-white text-text hover:bg-gray-50'}"
					on:click={() => sortOptions('date')}
				>
					Newest
				</button>
			</div>
		</div>

		{#if pollOptions.length === 0}
			<div class="text-center py-8 text-gray-500">No suggestions yet. Be the first to add one!</div>
		{:else}
			<div class="space-y-4">
				{#each pollOptions as option (option.id)}
					<div class="border rounded-lg p-4 hover:bg-bg-1 bg-white transition-colors">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-lg text-text">{option.description}</p>
								{#if option.drill_link}
									<a
										href={option.drill_link}
										class="text-blue-500 hover:underline text-sm mt-1 inline-block"
									>
										View Drill →
									</a>
								{:else if dev && editingId === option.id}
									<div class="mt-2 space-y-2">
										<div class="relative">
											<input
												type="text"
												bind:value={searchTerm}
												placeholder="Search for a drill..."
												class="w-full px-3 py-2 text-sm border rounded-md"
												on:input={searchDrills}
											/>
											{#if isLoadingDrills}
												<div class="absolute right-2 top-2">
													<div
														class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"
													></div>
												</div>
											{/if}
											{#if drillOptions.length > 0}
												<div
													class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
												>
													{#each drillOptions as drill}
														<button
															class="w-full text-left px-3 py-2 hover:bg-gray-100 {selectedDrill?.id ===
															drill.id
																? 'bg-blue-50'
																: ''}"
															on:click={() => {
																selectedDrill = drill;
																searchTerm = drill.name;
																drillOptions = [];
															}}
														>
															{drill.name}
														</button>
													{/each}
												</div>
											{/if}
										</div>
										<div class="flex gap-2">
											<button
												on:click={() => saveDrillLink(option.id)}
												class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
												disabled={!selectedDrill}
											>
												Save
											</button>
											<button
												on:click={() => {
													editingId = null;
													searchTerm = '';
													selectedDrill = null;
													drillOptions = [];
												}}
												class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
											>
												Cancel
											</button>
										</div>
									</div>
								{:else if dev}
									<button
										on:click={() => {
											editingId = option.id;
											searchTerm = '';
											selectedDrill = null;
										}}
										class="text-blue-500 hover:underline text-sm mt-1"
									>
										Add Drill Link
									</button>
								{/if}
							</div>
							<div class="ml-4 flex flex-col items-center">
								<button
									on:click={() => vote(option.id)}
									class="text-gray-500 hover:text-blue-500 focus:outline-none transition-colors"
									aria-label="Upvote suggestion"
								>
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 15l7-7 7 7"
										/>
									</svg>
								</button>
								<span class="font-semibold text-text">{option.votes}</span>
								{#if dev}
									<button
										on:click={() => deleteOption(option.id)}
										class="mt-2 text-red-500 hover:text-red-600 focus:outline-none"
										title="Delete suggestion"
										aria-label="Delete suggestion"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								{/if}
							</div>
						</div>
						<div class="text-xs text-gray-500 mt-2">
							Added {new Date(option.created_at).toLocaleDateString()}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Add any additional styles here */
</style>
