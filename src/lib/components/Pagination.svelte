<script>
	import { createEventDispatcher } from 'svelte';
	import { navigating } from '$app/stores'; // Import navigating store if needed for disabling
	import { onDestroy } from 'svelte';

	export let currentPage = 1;
	export let totalPages = 1;

	let isNavigating = false;
	const unsubNavigating = navigating.subscribe((v) => (isNavigating = !!v));
	onDestroy(unsubNavigating);

	const dispatch = createEventDispatcher();

	function goToPage(pageNumber) {
		if (pageNumber >= 1 && pageNumber <= totalPages) {
			dispatch('pageChange', { page: pageNumber });
		}
	}

	function prevPage() {
		goToPage(currentPage - 1);
	}

	function nextPage() {
		goToPage(currentPage + 1);
	}
</script>

{#if totalPages > 1}
	<div class="flex justify-center items-center mt-8 space-x-4" data-testid="pagination-controls">
		<button
			on:click={prevPage}
			disabled={currentPage === 1 || isNavigating}
			class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
			data-testid="pagination-prev-button"
		>
			Previous
		</button>
		<span class="text-gray-700" data-testid="pagination-current-page"
			>Page {currentPage} of {totalPages}</span
		>
		<button
			on:click={nextPage}
			disabled={currentPage === totalPages || isNavigating}
			class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
			data-testid="pagination-next-button"
		>
			Next
		</button>
	</div>
{/if}
