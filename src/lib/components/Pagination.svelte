<script>
        import { createEventDispatcher } from 'svelte';
        import { navigating } from '$app/stores';
        import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';

	export let currentPage = 1;
	export let totalPages = 1;

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
                <LoadingButton
                        loading={$navigating}
                        on:click={prevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        data-testid="pagination-prev-button"
                >
                        Previous
                </LoadingButton>
		<span class="text-gray-700" data-testid="pagination-current-page"
			>Page {currentPage} of {totalPages}</span
		>
                <LoadingButton
                        loading={$navigating}
                        on:click={nextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        data-testid="pagination-next-button"
                >
                        Next
                </LoadingButton>
	</div>
{/if}
