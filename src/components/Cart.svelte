<script>
    import { cart } from '$lib/stores/cartStore';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    let isOpen = false;

    function toggleCart() {
        isOpen = !isOpen;
    }

    function removeDrill(drill) {
        cart.toggleDrill(drill);
    }

    // Close cart when navigating to a new page
    $: {
        $page;
        isOpen = false;
    }

    // Close cart when clicking outside
    onMount(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.cart-container')) {
                isOpen = false;
            }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div class="fixed bottom-4 right-4 z-50 cart-container">
    <button
        on:click={toggleCart}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
    >
        🛒 ({$cart.length})
    </button>

    {#if isOpen}
        <div class="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl p-4">
            <h3 class="text-lg font-semibold mb-2">Selected Drills</h3>
            {#if $cart.length === 0}
                <p>No drills selected</p>
            {:else}
                <ul>
                    {#each $cart as drill}
                        <li class="flex justify-between items-center mb-2">
                            <span>{drill.name}</span>
                            <button
                                on:click={() => removeDrill(drill)}
                                class="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </li>
                    {/each}
                </ul>
                <a
                    href="/practice-plans/create"
                    class="block w-full text-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                    Create Plan with {$cart.length} Drill{$cart.length !== 1 ? 's' : ''}
                </a>
            {/if}
        </div>
    {/if}
</div>