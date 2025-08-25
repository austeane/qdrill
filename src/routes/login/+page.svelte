<script>
  import { signIn, useSession } from '$lib/auth-client';
  import { page } from '$app/stores';
  const session = useSession();

  function continueToNext() {
    const url = new URL($page.url);
    const next = url.searchParams.get('next') || '/';
    window.location.href = next;
  }
</script>

<div class="min-h-[60vh] flex items-center justify-center">
  <div class="w-full max-w-md border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
    <h1 class="text-2xl font-bold mb-2">Sign in</h1>
    <p class="text-gray-600 dark:text-gray-300 mb-6">Access your team and season planning tools.</p>

    {#if $session.data?.user}
      <div class="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-4">
        You are already signed in as {$session.data.user.name}.
      </div>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded" on:click={continueToNext}>
        Continue
      </button>
    {:else}
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded" on:click={() => signIn.social({ provider: 'google' })}>
        Sign in with Google
      </button>
    {/if}
  </div>
  
</div>


