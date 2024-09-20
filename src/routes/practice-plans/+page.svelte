<script>
  import { onMount } from 'svelte';
  import { cart } from '$lib/stores/cartStore';
  import { goto } from '$app/navigation';

  let isProcessing = false;

  onMount(async () => {
    if ($cart.length > 0) {
      isProcessing = true;
      await goto('/practice-plans/create');
    }
  });
</script>

{#if $cart.length === 0}
  <div class="flex flex-col items-center justify-center h-full">
    <p class="text-xl mb-4">Find drills to create a practice plan.</p>
    <a href="/drills" class="text-blue-500 underline">Go to Drills</a>
  </div>
{:else if isProcessing}
  <div class="flex items-center justify-center h-full">
    <p class="text-xl">Preparing to create your practice plan...</p>
  </div>
{/if}
