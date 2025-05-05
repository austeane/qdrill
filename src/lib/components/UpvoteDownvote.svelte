<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { page } from '$app/stores';
    import { authClient } from '$lib/auth-client';
    import { ThumbsUpIcon, ThumbsDownIcon } from 'svelte-feather-icons';
    import { toast } from '@zerodevx/svelte-toast';

    export let drillId = null;
    export let practicePlanId = null;

    let upvotes = writable(0);
    let downvotes = writable(0);
    let userVote = writable(0); // 1 for upvote, -1 for downvote, 0 for no vote

    const session = authClient.useSession();
    const user = $session.data?.user;

    onMount(async () => {
        await loadVotes();
    });

    $: if (user !== undefined) {
        loadVotes();
    }

    async function loadVotes() {
        if (!drillId && !practicePlanId) return;

        try {
            // Fetch vote counts
            const countsRes = await fetch(`/api/votes?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`);
            if (countsRes.ok) {
                const counts = await countsRes.json();
                upvotes.set(counts.upvotes || 0);
                downvotes.set(counts.downvotes || 0);
            }

            // Fetch user's vote if logged in
            if (user) {
                const userVoteRes = await fetch(`/api/votes/user?${drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`}`);
                if (userVoteRes.ok) {
                    const vote = await userVoteRes.json();
                    userVote.set(vote?.vote || 0);
                }
            }
        } catch (error) {
            console.error('Error loading votes:', error);
            toast.push('Failed to load votes', { theme: { '--toastBackground': '#F56565' } });
        }
    }

    async function handleVote(voteType) {
        if (!user) {
            const confirmed = confirm('Please sign in to vote. Click OK to sign in with Google.');
            if (confirmed) {
                try {
                    await authClient.signIn.social({ provider: 'google' });
                } catch (error) {
                    console.error("Sign in error:", error);
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
                // Remove vote - Add the proper query parameter
                const queryParam = drillId ? `drillId=${drillId}` : `practicePlanId=${practicePlanId}`;
                const res = await fetch(`/api/votes?${queryParam}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // Add body with the ID to ensure server receives it
                    body: JSON.stringify({
                        drillId: drillId ? parseInt(drillId, 10) : undefined,
                        practicePlanId: practicePlanId ? parseInt(practicePlanId, 10) : undefined
                    })
                });

                if (res.ok) {
                    userVote.set(0);
                    if (newVote === 1) {
                        upvotes.update(n => n - 1);
                    } else {
                        downvotes.update(n => n - 1);
                    }
                    toast.push('Vote removed');
                } else {
                    const errorText = await res.text();
                    throw new Error(`Failed to remove vote: ${errorText}`);
                }
            } else {
                // Prepare the request body with proper ID parsing
                const requestBody = {
                    vote: newVote
                };

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

                const res = await fetch('/api/votes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!res.ok) {
                    // Add error response logging
                    const errorText = await res.text();
                    console.error('Vote API error:', {
                        status: res.status,
                        statusText: res.statusText,
                        response: errorText
                    });
                    throw new Error(`Vote API error: ${errorText}`);
                }

                // Update previous vote counts
                if (currentVote === 1) upvotes.update(n => n - 1);
                if (currentVote === -1) downvotes.update(n => n - 1);

                // Update new vote count
                if (newVote === 1) {
                    upvotes.update(n => n + 1);
                    toast.push('Upvoted!');
                } else {
                    downvotes.update(n => n + 1);
                    toast.push('Downvoted!');
                }

                userVote.set(newVote);
            }
        } catch (error) {
            console.error('Error casting vote:', error);
            toast.push('Failed to cast vote: ' + error.message, { theme: { '--toastBackground': '#F56565' } });
        }
    }
</script>

<div class="flex flex-col items-center space-y-1 text-sm">
    <button
        on:click={() => handleVote(1)}
        class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        class:text-blue-600={$userVote === 1}
        class:bg-blue-100={$userVote === 1}
        class:text-gray-400={$userVote !== 1}
        class:hover:bg-blue-50={$userVote !== 1}
        aria-label="Upvote"
    >
        <ThumbsUpIcon size="20"/>
        <span class="sr-only">Upvote</span>
    </button>
    
    <span class="font-medium" class:text-blue-600={$userVote === 1} class:text-red-600={$userVote === -1}>
        {$upvotes - $downvotes}
    </span>
    
    <button
        on:click={() => handleVote(-1)}
        class="p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        class:text-red-600={$userVote === -1}
        class:bg-red-100={$userVote === -1}
        class:text-gray-400={$userVote !== -1}
        class:hover:bg-red-50={$userVote !== -1}
        aria-label="Downvote"
    >
        <ThumbsDownIcon size="20"/>
        <span class="sr-only">Downvote</span>
    </button>
</div>