<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { authClient } from '$lib/auth-client';
	import { ThumbsUp, ThumbsDown } from 'lucide-svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import Spinner from '$lib/components/Spinner.svelte';
	import { createLoadingState } from '$lib/utils/loadingStates.js';

	export let drillId = null;
	export let practicePlanId = null;

	console.log(
		'[UpvoteDownvote] Script executed. Initial props - drillId:',
		drillId,
		'practicePlanId:',
		practicePlanId
	);

	let upvotes = writable(0);
	let downvotes = writable(0);
	let userVote = writable(0); // 1 for upvote, -1 for downvote, 0 for no vote

	// Loading states
	const loadingVotes = createLoadingState();
	const votingInProgress = createLoadingState();

	const session = authClient.useSession();
	const user = $session.data?.user;

	onMount(async () => {
		console.log(
			'[UpvoteDownvote] onMount called. Current drillId:',
			drillId,
			'Current practicePlanId:',
			practicePlanId
		);
		await loadVotes();
	});

	$: if (user !== undefined) {
		loadVotes();
	}

	const loadVotes = loadingVotes.wrap(async () => {
		console.log(
			'[UpvoteDownvote] loadVotes called. drillId:',
			drillId,
			'practicePlanId:',
			practicePlanId
		);
		if (!drillId && !practicePlanId) {
			console.log('[UpvoteDownvote] No ID provided, returning.');
			return;
		}

		try {
			const endpoint = `/api/votes?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
			console.log('[UpvoteDownvote] Fetching counts from:', endpoint);
			const counts = await apiFetch(endpoint);
			console.log(
				'[UpvoteDownvote] Received counts:',
				counts,
				'for ID:',
				drillId || practicePlanId
			);
			upvotes.set(counts.upvotes || 0);
			downvotes.set(counts.downvotes || 0);

			if (user) {
				const userVoteEndpoint = `/api/votes/user?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`;
				console.log('[UpvoteDownvote] Fetching user vote from:', userVoteEndpoint);
				const vote = await apiFetch(userVoteEndpoint);
				console.log(
					'[UpvoteDownvote] Received user vote:',
					vote,
					'for ID:',
					drillId || practicePlanId
				);
				userVote.set(vote?.vote || 0);
			}
		} catch (error) {
			console.error('Error loading votes:', error);
			toast.push('Failed to load votes', { theme: { '--toastBackground': '#F56565' } });
		}
	});

	const handleVote = votingInProgress.wrap(async (voteType) => {
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

		const currentVote = $userVote;
		const newVote = currentVote === voteType ? 0 : voteType; // Toggle or set new vote

		if (!drillId && !practicePlanId) {
			console.error('No ID provided for voting');
			toast.push('Error: Missing ID for voting', { theme: { '--toastBackground': '#F56565' } });
			return;
		}

		try {
			if (currentVote === newVote) {
				const queryParam = drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`;
				await apiFetch(`/api/votes?${queryParam}`, {
					method: 'DELETE'
				});

				userVote.set(0);
				if (newVote === 1) {
					upvotes.update((n) => n - 1);
				} else {
					downvotes.update((n) => n - 1);
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

				if (currentVote === 1) upvotes.update((n) => n - 1);
				if (currentVote === -1) downvotes.update((n) => n - 1);

				if (newVote === 1) {
					upvotes.update((n) => n + 1);
					toast.push('Upvoted!');
				} else {
					downvotes.update((n) => n + 1);
					toast.push('Downvoted!');
				}

				userVote.set(newVote);
			}
		} catch (error) {
			console.error('Error casting vote:', error);
			toast.push('Failed to cast vote: ' + error.message, {
				theme: { '--toastBackground': '#F56565' }
			});
		}
	});
</script>

{#if $loadingVotes}
	<div class="flex flex-col items-center space-y-1 text-sm">
		<Spinner size="sm" color="gray" />
		<span class="text-xs text-gray-500">Loading...</span>
	</div>
{:else}
	<div class="flex flex-col items-center space-y-1 text-sm">
		<button
			on:click={() => handleVote(1)}
			disabled={$votingInProgress}
			class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
			class:text-blue-600={$userVote === 1}
			class:bg-blue-100={$userVote === 1}
			class:text-gray-400={$userVote !== 1}
			class:hover:bg-blue-50={$userVote !== 1 && !$votingInProgress}
			aria-label="Upvote"
		>
			{#if $votingInProgress}
				<Spinner size="sm" color="blue" />
			{:else}
				<ThumbsUp size={20} />
			{/if}
			<span class="sr-only">Upvote</span>
		</button>

		<span
			class="font-medium"
			class:text-blue-600={$userVote === 1}
			class:text-red-600={$userVote === -1}
		>
			{$upvotes - $downvotes}
		</span>

		<button
			on:click={() => handleVote(-1)}
			disabled={$votingInProgress}
			class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
			class:text-red-600={$userVote === -1}
			class:bg-red-100={$userVote === -1}
			class:text-gray-400={$userVote !== -1}
			class:hover:bg-red-50={$userVote !== -1 && !$votingInProgress}
			aria-label="Downvote"
		>
			{#if $votingInProgress}
				<Spinner size="sm" color="red" />
			{:else}
				<ThumbsDown size={20} />
			{/if}
			<span class="sr-only">Downvote</span>
		</button>
	</div>
{/if}
