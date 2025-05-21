<script>
	import { useSession, signIn, signOut } from '$lib/auth-client';

	const session = useSession();
</script>

<div class="flex items-center">
	{#if $session.data}
		<p class="mr-4">Signed in as {$session.data.user.email}</p>
		<button type="button" on:click={() => signOut()}>Sign out</button>
	{:else}
		<button type="button" on:click={() => signIn.social({ provider: 'google' })}
			>Sign in with Google</button
		>
	{/if}
</div>
