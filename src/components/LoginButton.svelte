<script>
    import { signIn, signOut } from '@auth/sveltekit/client'
    import { page } from '$app/stores'
  </script>
  
  {#if $page.data.session}
    <button on:click={() => signOut()}>Sign out</button>
  {:else}
    <button on:click={() => signIn('google')}>Sign in with Google</button>
  {/if}