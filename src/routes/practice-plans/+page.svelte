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

<style>
  .flex {
    display: flex;
  }
  .flex-col {
    flex-direction: column;
  }
  .items-center {
    align-items: center;
  }
  .justify-center {
    justify-content: center;
  }
  .h-full {
    height: 100%;
  }
  .text-xl {
    font-size: 1.25rem;
  }
  .mb-4 {
    margin-bottom: 1rem;
  }
  .text-blue-500 {
    color: #3b82f6;
  }
  .underline {
    text-decoration: underline;
  }
</style>
