<script>
    import { useSession, signIn, signOut } from '$lib/auth-client'
    
    const session = useSession();
</script>

{#if $session.data}
    <button on:click={() => signOut()}>Sign out</button>
{:else}
    <button on:click={() => signIn.social({ provider: 'google' })}>Sign in with Google</button>
{/if}