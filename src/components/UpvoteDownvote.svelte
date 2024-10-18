<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    export let drillId = null;
    export let practicePlanId = null;

    let upvotes = writable(0);
    let downvotes = writable(0);
    let userVote = writable(0); // 1 for upvote, -1 for downvote, 0 for no vote
    let user = get(page).data.session?.user;

    onMount(async () => {
        if (!drillId && !practicePlanId) return;

        // Fetch vote counts
        let url = '/api/votes?';
        if (drillId) {
            url += `drillId=${drillId}`;
        } else {
            url += `practicePlanId=${practicePlanId}`;
        }

        const res = await fetch(url);
        if (res.ok) {
            const counts = await res.json();
            upvotes.set(counts.upvotes || 0);
            downvotes.set(counts.downvotes || 0);
        } else {
            console.error('Failed to load vote counts');
        }

        // Fetch user's vote
        if (user) {
            let voteUrl = '/api/votes?';
            if (drillId) {
                voteUrl += `drillId=${drillId}`;
            } else {
                voteUrl += `practicePlanId=${practicePlanId}`;
            }

            const voteRes = await fetch(voteUrl);
            if (voteRes.ok) {
                const existingVotes = await voteRes.json();
                if (drillId) {
                    const vote = existingVotes.find(v => v.user_id === user.id && v.drill_id === drillId);
                    if (vote) {
                        userVote.set(vote.vote);
                    }
                } else {
                    const vote = existingVotes.find(v => v.user_id === user.id && v.practice_plan_id === practicePlanId);
                    if (vote) {
                        userVote.set(vote.vote);
                    }
                }
            } else {
                console.error('Failed to load user vote');
            }
        }
    });

    async function castVote(value) {
        if (!user) {
            alert('You must be logged in to vote.');
            return;
        }

        if (get(userVote) === value) {
            // If the user is clicking the same vote, remove it
            let url = '';
            let method = 'DELETE';
            if (drillId) {
                url = `/api/votes?drillId=${drillId}`;
            } else {
                url = `/api/votes?practicePlanId=${practicePlanId}`;
            }

            const res = await fetch(url, { method });
            if (res.ok) {
                userVote.set(0);
                if (value === 1) {
                    upvotes.update(n => n - 1);
                } else {
                    downvotes.update(n => n - 1);
                }
            } else {
                console.error('Failed to remove vote');
            }
        } else {
            // Cast or update the vote
            let url = '/api/votes';
            let method = 'POST';

            const body = {
                drillId,
                practicePlanId,
                vote: value
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                if (get(userVote) === 1) {
                    upvotes.update(n => n - 1);
                } else if (get(userVote) === -1) {
                    downvotes.update(n => n - 1);
                }

                if (value === 1) {
                    upvotes.update(n => n + 1);
                } else {
                    downvotes.update(n => n + 1);
                }

                userVote.set(value);
            } else {
                console.error('Failed to cast vote');
            }
        }
    }
</script>

<div class="flex items-center space-x-4">
    <button
        on:click={() => castVote(1)}
        class={`flex items-center space-x-1 ${$userVote === 1 ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        <span>{$upvotes}</span>
    </button>
    <button
        on:click={() => castVote(-1)}
        class={`flex items-center space-x-1 ${$userVote === -1 ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        <span>{$downvotes}</span>
    </button>
</div>