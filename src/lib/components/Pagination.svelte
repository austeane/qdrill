<script>
	import { navigating } from '$app/state';

	let { currentPage = 1, totalPages = 1, onPageChange } = $props();

	const isNavigating = $derived(navigating.type !== null);

	function goToPage(pageNumber) {
		if (pageNumber >= 1 && pageNumber <= totalPages) {
			onPageChange?.({ page: pageNumber });
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
			onclick={prevPage}
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
			onclick={nextPage}
			disabled={currentPage === totalPages || isNavigating}
			class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors duration-300"
			data-testid="pagination-next-button"
		>
			Next
		</button>
	</div>
{/if}
