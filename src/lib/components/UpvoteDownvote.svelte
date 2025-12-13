<script>
	import { authClient } from '$lib/auth-client';
	import { ThumbsUp, ThumbsDown } from 'lucide-svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import Spinner from '$lib/components/Spinner.svelte';

	let { drillId = null, practicePlanId = null } = $props();

	let upvotes = $state(0);
	let downvotes = $state(0);
	let userVote = $state(0); // 1 for upvote, -1 for downvote, 0 for no vote

	let loadingVotes = $state(false);
	let votingInProgress = $state(false);

	const session = authClient.useSession();
	const user = $derived($session.data?.user);

	$effect(() => {
		if (!drillId && !practicePlanId) return;
		void loadVotes();
	});

	async function loadVotes() {
		if (!drillId && !practicePlanId) {
			return;
		}

		loadingVotes = true;
		try {
			const endpoint = `/api/votes?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
			const counts = await apiFetch(endpoint);
			upvotes = counts.upvotes || 0;
			downvotes = counts.downvotes || 0;

			if (user) {
				const userVoteEndpoint = `/api/votes/user?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
				const vote = await apiFetch(userVoteEndpoint);
				userVote = vote?.vote || 0;
			}
		} catch (error) {
			console.error('Error loading votes:', error);
			toast.push('Failed to load votes', { theme: { '--toastBackground': '#F56565' } });
		} finally {
			loadingVotes = false;
		}
	}

	async function handleVote(voteType) {
		if (!user) {
			const confirmed = confirm('Please sign in to vote. Click OK to sign in with Google.');
			if (confirmed) {
				try {
					await authClient.signIn.social({ provider: 'google' });
				} catch (error) {
					console.error('Sign in error:', error);
					toast.push('Sign in failed.', { theme: { '--toastBackground': '#F56565' } });
				}
			}
			return;
		}

		const currentVote = userVote;
		const newVote = currentVote === voteType ? 0 : voteType; // Toggle or set new vote

		if (!drillId && !practicePlanId) {
			console.error('No ID provided for voting');
			toast.push('Error: Missing ID for voting', { theme: { '--toastBackground': '#F56565' } });
			return;
		}

		votingInProgress = true;
		try {
			if (currentVote === newVote) {
				const queryParam = drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`;
				await apiFetch(`/api/votes?${queryParam}`, {
					method: 'DELETE'
				});

				userVote = 0;
				if (newVote === 1) {
					upvotes -= 1;
				} else {
					downvotes -= 1;
				}
				toast.push('Vote removed');
			} else {
				const requestBody = { vote: newVote };

				if (drillId) {
					requestBody.drillId = parseInt(drillId, 10);
					if (isNaN(requestBody.drillId)) {
						throw new Error('Invalid drill ID');
					}
				} else if (practicePlanId) {
					requestBody.practicePlanId = parseInt(practicePlanId, 10);
					if (isNaN(requestBody.practicePlanId)) {
						throw new Error('Invalid practice plan ID');
					}
				}

				await apiFetch('/api/votes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestBody)
				});

				if (currentVote === 1) upvotes -= 1;
				if (currentVote === -1) downvotes -= 1;

				if (newVote === 1) {
					upvotes += 1;
					toast.push('Upvoted!');
				} else {
					downvotes += 1;
					toast.push('Downvoted!');
				}

				userVote = newVote;
			}
		} catch (error) {
			console.error('Error casting vote:', error);
			toast.push('Failed to cast vote: ' + error.message, {
				theme: { '--toastBackground': '#F56565' }
			});
		} finally {
			votingInProgress = false;
		}
	}
</script>

{#if loadingVotes}
	<div class="flex flex-col items-center space-y-1 text-sm">
		<Spinner size="sm" color="gray" />
		<span class="text-xs text-gray-500">Loading...</span>
	</div>
{:else}
	<div class="flex flex-col items-center space-y-1 text-sm">
		<button
			onclick={() => handleVote(1)}
			disabled={votingInProgress}
			class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			class:text-blue-600={userVote === 1}
			class:bg-blue-100={userVote === 1}
			class:text-gray-400={userVote !== 1}
			class:hover:bg-blue-50={userVote !== 1 && !votingInProgress}
			aria-label="Upvote"
		>
			{#if votingInProgress}
				<Spinner size="sm" color="blue" />
			{:else}
				<ThumbsUp size={20} />
			{/if}
			<span class="sr-only">Upvote</span>
		</button>

		<span
			class="font-medium"
			class:text-blue-600={userVote === 1}
			class:text-red-600={userVote === -1}
		>
			{upvotes - downvotes}
		</span>

		<button
			onclick={() => handleVote(-1)}
			disabled={votingInProgress}
			class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
			class:text-red-600={userVote === -1}
			class:bg-red-100={userVote === -1}
			class:text-gray-400={userVote !== -1}
			class:hover:bg-red-50={userVote !== -1 && !votingInProgress}
			aria-label="Downvote"
		>
			{#if votingInProgress}
				<Spinner size="sm" color="red" />
			{:else}
				<ThumbsDown size={20} />
			{/if}
			<span class="sr-only">Downvote</span>
		</button>
	</div>
{/if}
